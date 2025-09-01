#!/usr/bin/env node

/**
 * Live Screen Translator Pro - Demo Script
 * This script demonstrates the translation capabilities with sample data
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Tesseract = require('tesseract.js');
const translate = require('translate-google');
const { INDUSTRIAL_PROFILES } = require('./config/profiles');

// Sample Chinese text for demonstration
const SAMPLE_TEXTS = {
  inovance_ircb500: [
    '伺服参数设置',
    '报警信息显示',
    '系统状态监控',
    '通信设置配置',
    '启动伺服电机',
    '停止运行程序',
    '速度设置调整',
    '位置设置修改'
  ],
  delta_screen_editor: [
    '画面编辑模式',
    '元件库选择',
    '标签属性设置',
    '按钮功能配置',
    '数值显示格式',
    '数据绑定设置',
    '动画效果配置',
    '图形元素编辑'
  ],
  mitsubishi_gx: [
    '梯形图编程',
    '指令表编辑',
    '软元件配置',
    '程序监控模式',
    '强制输出设置',
    '通信参数配置',
    '调试模式启动',
    '系统诊断信息'
  ]
};

// Demo server setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Tesseract worker
let tesseractWorker;

async function initializeOCR() {
  console.log('🚀 Initializing Tesseract OCR for demo...');
  tesseractWorker = await Tesseract.createWorker();
  await tesseractWorker.loadLanguage('eng+chi_sim+chi_tra');
  await tesseractWorker.initialize('eng+chi_sim+chi_tra');
  console.log('✅ Tesseract OCR initialized successfully');
}

// Translation function
async function translateText(text, from = 'zh-cn', to = 'en') {
  try {
    return await translate(text, { from, to });
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// Enhanced translation with custom glossaries
async function translateWithGlossary(text, profile = null) {
  try {
    let processedText = text;
    
    // Apply custom glossary if profile exists
    if (profile && INDUSTRIAL_PROFILES[profile]?.custom_terms) {
      const terms = INDUSTRIAL_PROFILES[profile].custom_terms;
      for (const [chinese, english] of Object.entries(terms)) {
        processedText = processedText.replace(new RegExp(chinese, 'g'), english);
      }
    }
    
    // Use Google Translate for remaining text
    const translatedText = await translateText(processedText, 'zh-cn', 'en');
    return translatedText;
  } catch (error) {
    console.error('Enhanced translation error:', error);
    return text;
  }
}

// Demo function to simulate OCR and translation
async function runDemo() {
  console.log('\n🎯 Live Screen Translator Pro - Demo Mode');
  console.log('==========================================\n');
  
  // Test each industrial profile
  for (const [profileKey, profile] of Object.entries(INDUSTRIAL_PROFILES)) {
    console.log(`\n🏭 Testing Profile: ${profile.name}`);
    console.log(`📝 Description: ${profile.description}`);
    console.log(`📊 Category: ${profile.category}`);
    console.log('─'.repeat(50));
    
    const sampleTexts = SAMPLE_TEXTS[profileKey] || [
      '系统设置',
      '参数配置',
      '监控模式',
      '调试功能'
    ];
    
    for (const text of sampleTexts) {
      console.log(`\n原文: ${text}`);
      
      // Simulate OCR confidence
      const confidence = Math.random() * 30 + 70; // 70-100%
      
      // Translate with custom glossary
      const translated = await translateWithGlossary(text, profileKey);
      
      console.log(`翻译: ${translated}`);
      console.log(`置信度: ${confidence.toFixed(1)}%`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '─'.repeat(50));
  }
  
  console.log('\n✅ Demo completed successfully!');
  console.log('\n🎉 Key Features Demonstrated:');
  console.log('• Industrial software profiles with custom terminology');
  console.log('• Enhanced OCR with confidence scoring');
  console.log('• Multi-engine translation support');
  console.log('• Real-time translation capabilities');
  console.log('• Custom glossary integration');
}

// WebSocket connection handling for demo
wss.on('connection', (ws) => {
  console.log('🔌 Demo client connected');
  
  let demoInterval;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'demo_request') {
        const { profile, mode } = data;
        
        console.log(`\n🎮 Demo requested for profile: ${profile}, mode: ${mode}`);
        
        // Start demo loop
        demoInterval = setInterval(async () => {
          const profileData = INDUSTRIAL_PROFILES[profile];
          if (!profileData) return;
          
          const sampleTexts = SAMPLE_TEXTS[profile] || ['系统设置', '参数配置'];
          const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
          
          // Simulate OCR result
          const confidence = Math.random() * 30 + 70;
          const translated = await translateWithGlossary(randomText, profile);
          
          // Send demo translation result
          ws.send(JSON.stringify({
            type: 'translation_result',
            translations: [{
              original: randomText,
              translated: translated,
              bbox: {
                x0: Math.random() * 100,
                y0: Math.random() * 100,
                x1: Math.random() * 100 + 200,
                y1: Math.random() * 100 + 50
              },
              confidence: confidence
            }],
            profile: profile,
            mode: mode
          }));
        }, 2000); // Send demo data every 2 seconds
      }
      
      if (data.type === 'stop_demo') {
        if (demoInterval) {
          clearInterval(demoInterval);
          console.log('⏹️ Demo stopped');
        }
      }
      
    } catch (error) {
      console.error('Demo WebSocket error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Demo client disconnected');
    if (demoInterval) {
      clearInterval(demoInterval);
    }
  });
});

// API routes for demo
app.get('/api/demo/profiles', (req, res) => {
  res.json(INDUSTRIAL_PROFILES);
});

app.get('/api/demo/sample-texts', (req, res) => {
  res.json(SAMPLE_TEXTS);
});

app.post('/api/demo/translate', async (req, res) => {
  try {
    const { text, profile } = req.body;
    const translated = await translateWithGlossary(text, profile);
    res.json({ original: text, translated, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🎮 Demo server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to view the demo`);
  
  // Initialize OCR
  await initializeOCR();
  
  // Run demo if requested
  if (process.argv.includes('--run-demo')) {
    await runDemo();
  }
  
  console.log('\n📋 Available demo endpoints:');
  console.log(`• GET  /api/demo/profiles - List all industrial profiles`);
  console.log(`• GET  /api/demo/sample-texts - Get sample texts for each profile`);
  console.log(`• POST /api/demo/translate - Translate text with profile-specific glossary`);
  console.log(`• WebSocket - Real-time demo translation`);
  
  console.log('\n🎯 Demo Features:');
  console.log('• Real-time translation simulation');
  console.log('• Industrial software profiles');
  console.log('• Custom terminology glossaries');
  console.log('• Confidence scoring');
  console.log('• Multiple translation modes');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down demo server...');
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    console.log('✅ Tesseract worker terminated');
  }
  process.exit(0);
});

// Export for testing
module.exports = {
  translateWithGlossary,
  runDemo,
  SAMPLE_TEXTS,
  INDUSTRIAL_PROFILES
};