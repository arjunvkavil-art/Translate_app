const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Tesseract = require('tesseract.js');
const translate = require('translate-google');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const OpenAI = require('openai');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
const db = new sqlite3.Database('./translator.db');
db.serialize(() => {
  // Create tables for profiles, glossaries, and settings
  db.run(`CREATE TABLE IF NOT EXISTS translation_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    ocr_settings TEXT,
    target_apps TEXT,
    custom_glossary_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS glossaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    terms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS translation_history (
    id TEXT PRIMARY KEY,
    original_text TEXT,
    translated_text TEXT,
    source_lang TEXT,
    target_lang TEXT,
    confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
});

// Initialize OpenAI (optional)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Industrial software profiles
const INDUSTRIAL_PROFILES = {
  'inovance-ircb500': {
    name: 'Inovance IRCB500',
    description: 'Chinese HMI configuration software',
    ocrSettings: {
      language: 'chi_sim+eng',
      psm: 6,
      confidence: 60
    },
    targetApps: ['ircb500.exe', 'IRCB500.exe'],
    customGlossary: {
      '报警': 'Alarm',
      '启动': 'Start',
      '停止': 'Stop',
      '速度设置': 'Speed Setting',
      '伺服': 'Servo',
      '变频器': 'Frequency Converter',
      'PLC': 'PLC',
      '触摸屏': 'Touch Screen',
      '通讯': 'Communication',
      '配置': 'Configuration',
      '参数': 'Parameters',
      '监控': 'Monitoring',
      '诊断': 'Diagnostics',
      '错误': 'Error',
      '警告': 'Warning',
      '确认': 'Confirm',
      '取消': 'Cancel',
      '保存': 'Save',
      '加载': 'Load',
      '下载': 'Download',
      '上传': 'Upload'
    }
  },
  'delta-screen-editor': {
    name: 'Delta Screen Editor',
    description: 'Delta HMI screen configuration tool',
    ocrSettings: {
      language: 'chi_sim+eng',
      psm: 6,
      confidence: 65
    },
    targetApps: ['ScreenEditor.exe', 'DeltaScreenEditor.exe'],
    customGlossary: {
      '画面': 'Screen',
      '元件': 'Component',
      '标签': 'Label',
      '按钮': 'Button',
      '数值': 'Value',
      '字符串': 'String',
      '位': 'Bit',
      '字': 'Word',
      '双字': 'Double Word',
      '浮点': 'Float',
      'BCD': 'BCD',
      '十六进制': 'Hexadecimal',
      '十进制': 'Decimal',
      '二进制': 'Binary'
    }
  },
  'mitsubishi-gx-developer': {
    name: 'Mitsubishi GX Developer',
    description: 'Mitsubishi PLC programming software',
    ocrSettings: {
      language: 'chi_sim+eng',
      psm: 6,
      confidence: 70
    },
    targetApps: ['GXDeveloper.exe', 'GXWorks.exe'],
    customGlossary: {
      '梯形图': 'Ladder Diagram',
      '指令': 'Instruction',
      '触点': 'Contact',
      '线圈': 'Coil',
      '定时器': 'Timer',
      '计数器': 'Counter',
      '数据寄存器': 'Data Register',
      '辅助继电器': 'Auxiliary Relay',
      '特殊继电器': 'Special Relay',
      '步进': 'Step',
      '功能块': 'Function Block',
      '模拟量': 'Analog',
      '数字量': 'Digital',
      '脉冲': 'Pulse',
      '通讯': 'Communication'
    }
  },
  'siemens-step7': {
    name: 'Siemens STEP 7',
    description: 'Siemens PLC programming software (Chinese version)',
    ocrSettings: {
      language: 'chi_sim+eng',
      psm: 6,
      confidence: 75
    },
    targetApps: ['SimaticManager.exe', 'STEP7.exe'],
    customGlossary: {
      '组织块': 'Organization Block',
      '功能块': 'Function Block',
      '数据块': 'Data Block',
      '系统块': 'System Block',
      '程序块': 'Program Block',
      '符号表': 'Symbol Table',
      '变量表': 'Variable Table',
      '交叉引用': 'Cross Reference',
      '硬件配置': 'Hardware Configuration',
      '网络配置': 'Network Configuration',
      '诊断': 'Diagnostics',
      '监控': 'Monitoring',
      '在线': 'Online',
      '离线': 'Offline',
      '编译': 'Compile',
      '下载': 'Download',
      '上传': 'Upload'
    }
  }
};

// Create and initialize the Tesseract worker
let worker;
let currentProfile = null;
let activeConnections = new Map();

(async () => {
  console.log('Creating Tesseract worker...');
  worker = await Tesseract.createWorker({
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  console.log('Loading languages (eng + chi_sim)...');
  await worker.loadLanguage('eng+chi_sim');
  console.log('Initializing languages...');
  await worker.initialize('eng+chi_sim');
  console.log('Tesseract worker initialized.');
})();

// Translation engines
const translationEngines = {
  google: async (text, from, to) => {
    try {
      return await translate(text, { from, to });
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  },
  
  openai: async (text, from, to, context = '') => {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    try {
      const prompt = `Translate the following ${from} text to ${to}. 
      ${context ? `Context: ${context}` : ''}
      Text: "${text}"
      
      Provide only the translation, no explanations.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      });
      
      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  },
  
  custom: async (text, from, to, glossary = {}) => {
    // Apply custom glossary first
    let translatedText = text;
    for (const [original, translation] of Object.entries(glossary)) {
      const regex = new RegExp(original, 'gi');
      translatedText = translatedText.replace(regex, translation);
    }
    
    // If there are still untranslated parts, use Google Translate
    if (translatedText !== text) {
      try {
        return await translationEngines.google(translatedText, from, to);
      } catch (error) {
        return translatedText; // Return glossary-translated text if Google fails
      }
    } else {
      return await translationEngines.google(text, from, to);
    }
  }
};

// Enhanced OCR with profile support
async function performOCR(imageBuffer, profile = null) {
  if (!worker) {
    throw new Error('OCR worker not initialized');
  }

  const settings = profile?.ocrSettings || {
    language: 'chi_sim+eng',
    psm: 6,
    confidence: 60
  };

  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz一二三四五六七八九十百千万亿年月日时分秒启动停止报警错误警告确认取消保存加载下载上传配置参数监控诊断通讯伺服变频器PLC触摸屏',
      tessedit_pageseg_mode: settings.psm,
      tessedit_ocr_engine_mode: 3
    });

    const { data } = await worker.recognize(imageBuffer);
    
    // Filter results by confidence
    const filteredResults = data.paragraphs.filter(para => 
      para.confidence >= settings.confidence && para.text.trim().length > 0
    );

    return filteredResults;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  activeConnections.set(connectionId, {
    ws,
    profile: null,
    regions: [],
    lastActivity: Date.now()
  });

  console.log(`Client connected: ${connectionId}`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const connection = activeConnections.get(connectionId);
      
      if (!connection) return;

      connection.lastActivity = Date.now();

      switch (data.type) {
        case 'ocr_request':
          await handleOCRRequest(connectionId, data);
          break;
        case 'set_profile':
          await handleSetProfile(connectionId, data);
          break;
        case 'add_region':
          await handleAddRegion(connectionId, data);
          break;
        case 'remove_region':
          await handleRemoveRegion(connectionId, data);
          break;
        case 'translate_text':
          await handleTranslateText(connectionId, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    }
  });

  ws.on('close', () => {
    activeConnections.delete(connectionId);
    console.log(`Client disconnected: ${connectionId}`);
  });
});

async function handleOCRRequest(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  try {
    const { imageData, region, engine = 'google' } = data;
    
    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Perform OCR
    const ocrResults = await performOCR(imageBuffer, connection.profile);
    
    if (ocrResults.length === 0) {
      connection.ws.send(JSON.stringify({
        type: 'ocr_result',
        results: [],
        region
      }));
      return;
    }

    // Translate results
    const translations = [];
    const glossary = connection.profile?.customGlossary || {};

    for (const result of ocrResults) {
      try {
        let translatedText;
        
        switch (engine) {
          case 'openai':
            translatedText = await translationEngines.openai(
              result.text, 
              'zh-cn', 
              'en',
              `This is text from ${connection.profile?.name || 'an industrial software interface'}`
            );
            break;
          case 'custom':
            translatedText = await translationEngines.custom(
              result.text, 
              'zh-cn', 
              'en', 
              glossary
            );
            break;
          default:
            translatedText = await translationEngines.google(result.text, 'zh-cn', 'en');
        }

        translations.push({
          original: result.text,
          translated: translatedText,
          confidence: result.confidence,
          bbox: result.bbox,
          region
        });

        // Save to history
        db.run(
          'INSERT INTO translation_history (id, original_text, translated_text, source_lang, target_lang, confidence) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), result.text, translatedText, 'zh-cn', 'en', result.confidence]
        );

      } catch (translateError) {
        console.error('Translation error:', translateError);
        translations.push({
          original: result.text,
          translated: result.text, // Keep original if translation fails
          confidence: result.confidence,
          bbox: result.bbox,
          region,
          error: translateError.message
        });
      }
    }

    connection.ws.send(JSON.stringify({
      type: 'ocr_result',
      results: translations,
      region
    }));

  } catch (error) {
    console.error('OCR request error:', error);
    connection.ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

async function handleSetProfile(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  const { profileId } = data;
  connection.profile = INDUSTRIAL_PROFILES[profileId] || null;

  connection.ws.send(JSON.stringify({
    type: 'profile_set',
    profile: connection.profile
  }));
}

async function handleAddRegion(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  const { region } = data;
  connection.regions.push({
    id: uuidv4(),
    ...region,
    createdAt: Date.now()
  });

  connection.ws.send(JSON.stringify({
    type: 'region_added',
    regions: connection.regions
  }));
}

async function handleRemoveRegion(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  const { regionId } = data;
  connection.regions = connection.regions.filter(r => r.id !== regionId);

  connection.ws.send(JSON.stringify({
    type: 'region_removed',
    regions: connection.regions
  }));
}

async function handleTranslateText(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  try {
    const { text, from = 'zh-cn', to = 'en', engine = 'google' } = data;
    const glossary = connection.profile?.customGlossary || {};

    let translatedText;
    switch (engine) {
      case 'openai':
        translatedText = await translationEngines.openai(text, from, to);
        break;
      case 'custom':
        translatedText = await translationEngines.custom(text, from, to, glossary);
        break;
      default:
        translatedText = await translationEngines.google(text, from, to);
    }

    connection.ws.send(JSON.stringify({
      type: 'translation_result',
      original: text,
      translated: translatedText,
      engine
    }));

  } catch (error) {
    console.error('Text translation error:', error);
    connection.ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// API Routes
app.get('/api/profiles', (req, res) => {
  res.json(Object.keys(INDUSTRIAL_PROFILES).map(id => ({
    id,
    ...INDUSTRIAL_PROFILES[id]
  })));
});

app.get('/api/glossaries', (req, res) => {
  db.all('SELECT * FROM glossaries ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/glossaries', (req, res) => {
  const { name, category, terms } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO glossaries (id, name, category, terms) VALUES (?, ?, ?, ?)',
    [id, name, category, JSON.stringify(terms)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, name, category, terms });
    }
  );
});

app.get('/api/history', (req, res) => {
  const limit = req.query.limit || 100;
  db.all(
    'SELECT * FROM translation_history ORDER BY timestamp DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total_translations FROM translation_history', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const stats = {
      totalTranslations: row.total_translations,
      activeConnections: activeConnections.size,
      availableProfiles: Object.keys(INDUSTRIAL_PROFILES).length,
      uptime: process.uptime()
    };
    
    res.json(stats);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Live Screen Translator Server running on port ${PORT}`);
  console.log(`📊 Available profiles: ${Object.keys(INDUSTRIAL_PROFILES).length}`);
  console.log(`🔧 Industrial software support: Inovance IRCB500, Delta, Mitsubishi, Siemens`);
  console.log(`🌐 Translation engines: Google Translate, OpenAI GPT, Custom Glossary`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Live Screen Translator...');
  
  // Close all WebSocket connections
  for (const [id, connection] of activeConnections) {
    connection.ws.close();
  }
  activeConnections.clear();
  
  // Terminate OCR worker
  if (worker) {
    await worker.terminate();
    console.log('✅ Tesseract worker terminated.');
  }
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('❌ Database close error:', err);
    } else {
      console.log('✅ Database closed.');
    }
    process.exit(0);
  });
});
