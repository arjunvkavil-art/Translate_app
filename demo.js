const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

console.log('🚀 Live Screen Translator - Feature Demonstration');
console.log('================================================');

// Industrial software profiles
const INDUSTRIAL_PROFILES = {
  'inovance-ircb500': {
    name: 'Inovance IRCB500',
    description: 'Chinese HMI configuration software',
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

// Demo translation function
function demoTranslate(text, profileId = 'inovance-ircb500') {
  const profile = INDUSTRIAL_PROFILES[profileId];
  if (!profile) return text;
  
  let translatedText = text;
  for (const [chinese, english] of Object.entries(profile.customGlossary)) {
    const regex = new RegExp(chinese, 'g');
    translatedText = translatedText.replace(regex, english);
  }
  
  return translatedText;
}

// Demo OCR results
const demoOCRResults = [
  { text: '报警', bbox: { x0: 100, y0: 50, x1: 150, y1: 80 } },
  { text: '启动按钮', bbox: { x0: 200, y0: 100, x1: 280, y1: 130 } },
  { text: '速度设置', bbox: { x0: 300, y0: 150, x1: 380, y1: 180 } },
  { text: '伺服参数', bbox: { x0: 400, y0: 200, x1: 480, y1: 230 } }
];

// Express app setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ocr_request':
          // Simulate OCR processing
          setTimeout(() => {
            const translations = demoOCRResults.map(result => ({
              original: result.text,
              translated: demoTranslate(result.text, data.profileId),
              confidence: 85 + Math.random() * 10,
              bbox: result.bbox
            }));
            
            ws.send(JSON.stringify({
              type: 'ocr_result',
              results: translations
            }));
          }, 1000);
          break;
          
        case 'translate_text':
          const translated = demoTranslate(data.text, data.profileId);
          ws.send(JSON.stringify({
            type: 'translation_result',
            original: data.text,
            translated: translated,
            engine: 'custom_glossary'
          }));
          break;
          
        case 'set_profile':
          ws.send(JSON.stringify({
            type: 'profile_set',
            profile: INDUSTRIAL_PROFILES[data.profileId] || null
          }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

// API Routes
app.get('/api/profiles', (req, res) => {
  const profiles = Object.keys(INDUSTRIAL_PROFILES).map(id => ({
    id,
    ...INDUSTRIAL_PROFILES[id]
  }));
  res.json(profiles);
});

app.get('/api/demo/translate', (req, res) => {
  const { text, profileId } = req.query;
  const translated = demoTranslate(text || '报警启动停止', profileId || 'inovance-ircb500');
  res.json({
    original: text || '报警启动停止',
    translated: translated,
    profile: INDUSTRIAL_PROFILES[profileId || 'inovance-ircb500']
  });
});

app.get('/api/demo/ocr', (req, res) => {
  const translations = demoOCRResults.map(result => ({
    original: result.text,
    translated: demoTranslate(result.text),
    confidence: 85 + Math.random() * 10,
    bbox: result.bbox
  }));
  res.json({ results: translations });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalTranslations: 42,
    activeConnections: wss.clients.size,
    availableProfiles: Object.keys(INDUSTRIAL_PROFILES).length,
    uptime: process.uptime()
  });
});

// Demo HTML page
app.get('/demo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Live Screen Translator - Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
            .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
            .profile-card { background: #e9ecef; padding: 15px; border-radius: 6px; cursor: pointer; transition: background 0.3s; }
            .profile-card:hover { background: #dee2e6; }
            .demo-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .translation-result { background: #e7f3ff; padding: 10px; border-radius: 4px; margin: 10px 0; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            input, select { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Live Screen Translator</h1>
                <p>Powerful real-time screen translation for industrial software</p>
            </div>
            
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🎯 App Target Mode</h3>
                    <p>Target specific applications like Inovance IRCB500 for real-time translation</p>
                </div>
                <div class="feature-card">
                    <h3>🖱️ Region Mode</h3>
                    <p>Select screen regions to monitor and translate specific areas</p>
                </div>
                <div class="feature-card">
                    <h3>🎤 Voice Mode</h3>
                    <p>Speak Chinese terms and get instant English translations</p>
                </div>
                <div class="feature-card">
                    <h3>📚 Dictionary Mode</h3>
                    <p>Look up industrial terminology with context</p>
                </div>
            </div>
            
            <div class="demo-section">
                <h2>🏭 Industrial Software Profiles</h2>
                <div class="profile-grid" id="profile-grid"></div>
            </div>
            
            <div class="demo-section">
                <h2>🧪 Live Translation Demo</h2>
                <div>
                    <input type="text" id="demo-text" placeholder="Enter Chinese text..." value="报警启动停止">
                    <select id="demo-profile">
                        <option value="inovance-ircb500">Inovance IRCB500</option>
                        <option value="delta-screen-editor">Delta Screen Editor</option>
                        <option value="mitsubishi-gx-developer">Mitsubishi GX Developer</option>
                        <option value="siemens-step7">Siemens STEP 7</option>
                    </select>
                    <button onclick="demoTranslate()">Translate</button>
                </div>
                <div id="translation-result" class="translation-result"></div>
            </div>
            
            <div class="demo-section">
                <h2>📊 OCR Demo Results</h2>
                <button onclick="demoOCR()">Simulate OCR</button>
                <div id="ocr-results"></div>
            </div>
            
            <div class="demo-section">
                <h2>📈 Statistics</h2>
                <div id="stats"></div>
            </div>
        </div>
        
        <script>
            // Load profiles
            fetch('/api/profiles')
                .then(response => response.json())
                .then(profiles => {
                    const grid = document.getElementById('profile-grid');
                    profiles.forEach(profile => {
                        const card = document.createElement('div');
                        card.className = 'profile-card';
                        card.innerHTML = \`
                            <h4>\${profile.name}</h4>
                            <p>\${profile.description}</p>
                            <small>\${Object.keys(profile.customGlossary).length} custom terms</small>
                        \`;
                        grid.appendChild(card);
                    });
                });
            
            // Demo translation
            async function demoTranslate() {
                const text = document.getElementById('demo-text').value;
                const profile = document.getElementById('demo-profile').value;
                
                const response = await fetch(\`/api/demo/translate?text=\${encodeURIComponent(text)}&profileId=\${profile}\`);
                const result = await response.json();
                
                document.getElementById('translation-result').innerHTML = \`
                    <strong>Original:</strong> \${result.original}<br>
                    <strong>Translated:</strong> \${result.translated}<br>
                    <strong>Profile:</strong> \${result.profile.name}
                \`;
            }
            
            // Demo OCR
            async function demoOCR() {
                const response = await fetch('/api/demo/ocr');
                const result = await response.json();
                
                const resultsDiv = document.getElementById('ocr-results');
                resultsDiv.innerHTML = result.results.map(item => \`
                    <div class="translation-result">
                        <strong>\${item.original}</strong> → \${item.translated} (Confidence: \${Math.round(item.confidence)}%)
                    </div>
                \`).join('');
            }
            
            // Load stats
            async function loadStats() {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('stats').innerHTML = \`
                    <p><strong>Total Translations:</strong> \${stats.totalTranslations}</p>
                    <p><strong>Active Connections:</strong> \${stats.activeConnections}</p>
                    <p><strong>Available Profiles:</strong> \${stats.availableProfiles}</p>
                    <p><strong>Uptime:</strong> \${Math.round(stats.uptime)} seconds</p>
                \`;
            }
            
            // Initialize
            loadStats();
            setInterval(loadStats, 5000);
        </script>
    </body>
    </html>
  `);
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log('\n🎉 Live Screen Translator Demo Server Started!');
  console.log('==============================================');
  console.log(`🌐 Demo Interface: http://localhost:${PORT}/demo`);
  console.log(`📊 API Endpoints:`);
  console.log(`   - Profiles: http://localhost:${PORT}/api/profiles`);
  console.log(`   - Demo Translate: http://localhost:${PORT}/api/demo/translate`);
  console.log(`   - Demo OCR: http://localhost:${PORT}/api/demo/ocr`);
  console.log(`   - Stats: http://localhost:${PORT}/api/stats`);
  console.log('\n🔧 Features Demonstrated:');
  console.log('   ✅ Industrial software profiles (Inovance, Delta, Mitsubishi, Siemens)');
  console.log('   ✅ Custom terminology glossaries');
  console.log('   ✅ Real-time translation simulation');
  console.log('   ✅ OCR result processing');
  console.log('   ✅ WebSocket communication');
  console.log('   ✅ RESTful API endpoints');
  console.log('\n🚀 Ready for industrial software translation!');
});