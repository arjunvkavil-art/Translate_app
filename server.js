const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Tesseract = require('tesseract.js');
const translate = require('translate-google');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./translator.db');
db.serialize(() => {
  // Translation profiles table
  db.run(`CREATE TABLE IF NOT EXISTS translation_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    ocr_settings TEXT,
    screen_regions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Custom glossaries table
  db.run(`CREATE TABLE IF NOT EXISTS glossaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    category TEXT,
    terms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Translation history table
  db.run(`CREATE TABLE IF NOT EXISTS translation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_text TEXT,
    translated_text TEXT,
    source_lang TEXT,
    target_lang TEXT,
    confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Initialize OCR workers
let tesseractWorker;
let isPaddleOCRAvailable = false;

// Initialize Tesseract
(async () => {
  console.log('Initializing Tesseract OCR...');
  tesseractWorker = await Tesseract.createWorker();
  await tesseractWorker.loadLanguage('eng+chi_sim+chi_tra');
  await tesseractWorker.initialize('eng+chi_sim+chi_tra');
  console.log('Tesseract OCR initialized successfully');
})();

// Check PaddleOCR availability
try {
  const PaddleOCR = require('paddleocr');
  isPaddleOCRAvailable = true;
  console.log('PaddleOCR is available');
} catch (error) {
  console.log('PaddleOCR not available, using Tesseract only');
}

// Import industrial software profiles
const { INDUSTRIAL_PROFILES } = require('./config/profiles');

// Translation engines
const TRANSLATION_ENGINES = {
  google: async (text, from, to) => {
    try {
      return await translate(text, { from, to });
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  },
  openai: async (text, from, to, context = '') => {
    // OpenAI API integration for better context-aware translation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const prompt = `Translate the following ${from} text to ${to}. 
    Context: ${context}
    Text: "${text}"
    Provide only the translation without explanations.`;
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }
};

// Enhanced OCR function with multiple engines
async function performOCR(imageBuffer, settings = {}) {
  const { engine = 'tesseract', language = 'chi_sim+eng', confidence_threshold = 0.5 } = settings;
  
  try {
    if (engine === 'paddleocr' && isPaddleOCRAvailable) {
      // PaddleOCR implementation would go here
      // For now, fallback to Tesseract
      console.log('PaddleOCR not fully implemented, using Tesseract');
    }
    
    // Use Tesseract
    if (!tesseractWorker) {
      throw new Error('Tesseract worker not initialized');
    }
    
    const { data } = await tesseractWorker.recognize(imageBuffer, {
      lang: language
    });
    
    // Filter results by confidence
    const filteredResults = data.paragraphs.filter(para => 
      para.confidence > confidence_threshold * 100
    );
    
    return filteredResults;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// Enhanced translation function with custom glossaries
async function translateText(text, from, to, profile = null, engine = 'google') {
  try {
    // Apply custom glossary if profile exists
    let processedText = text;
    if (profile && INDUSTRIAL_PROFILES[profile]?.custom_terms) {
      const terms = INDUSTRIAL_PROFILES[profile].custom_terms;
      for (const [chinese, english] of Object.entries(terms)) {
        processedText = processedText.replace(new RegExp(chinese, 'g'), english);
      }
    }
    
    // Use specified translation engine
    const translatedText = await TRANSLATION_ENGINES[engine](processedText, from, to);
    
    // Save to history
    db.run(
      'INSERT INTO translation_history (original_text, translated_text, source_lang, target_lang, confidence) VALUES (?, ?, ?, ?, ?)',
      [text, translatedText, from, to, 0.8]
    );
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let currentProfile = null;
  let currentMode = 'full_screen'; // full_screen, region, app_target
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'config') {
        // Handle configuration updates
        currentProfile = data.profile;
        currentMode = data.mode;
        ws.send(JSON.stringify({ type: 'config_updated', profile: currentProfile, mode: currentMode }));
        return;
      }
      
      if (data.type === 'ocr_request') {
        const { imageData, region, settings } = data;
        
        // Decode base64 image
        const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Get OCR settings from profile
        const ocrSettings = currentProfile && INDUSTRIAL_PROFILES[currentProfile]?.ocr_settings 
          ? INDUSTRIAL_PROFILES[currentProfile].ocr_settings 
          : { language: 'chi_sim+eng', confidence_threshold: 0.5 };
        
        // Perform OCR
        const ocrResults = await performOCR(imageBuffer, ocrSettings);
        
        // Translate results
        const translations = [];
        for (const result of ocrResults) {
          if (result.text.trim()) {
            const translatedText = await translateText(
              result.text, 
              'zh-cn', 
              'en', 
              currentProfile,
              'google'
            );
            
            translations.push({
              original: result.text,
              translated: translatedText,
              bbox: result.bbox,
              confidence: result.confidence
            });
          }
        }
        
        ws.send(JSON.stringify({
          type: 'translation_result',
          translations,
          profile: currentProfile,
          mode: currentMode
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// API Routes
app.get('/api/profiles', (req, res) => {
  res.json(INDUSTRIAL_PROFILES);
});

app.get('/api/glossaries', (req, res) => {
  db.all('SELECT * FROM glossaries ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/glossaries', (req, res) => {
  const { name, category, terms } = req.body;
  db.run(
    'INSERT INTO glossaries (name, category, terms) VALUES (?, ?, ?)',
    [name, category, JSON.stringify(terms)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, category, terms });
    }
  );
});

app.get('/api/history', (req, res) => {
  const limit = req.query.limit || 100;
  db.all('SELECT * FROM translation_history ORDER BY timestamp DESC LIMIT ?', [limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Live Screen Translator Server running on port ${PORT}`);
  console.log('Available industrial profiles:', Object.keys(INDUSTRIAL_PROFILES));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    console.log('Tesseract worker terminated.');
  }
  db.close();
  process.exit(0);
});
