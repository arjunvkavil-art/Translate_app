const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const translate = require('translate-google');
const { parse } = require('csv-parse/sync');
const Jimp = require('jimp');
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Resources: profiles and glossaries
const resourcesDir = path.join(__dirname, 'resources');
const glossariesDir = path.join(resourcesDir, 'glossaries');
const profilesDir = path.join(resourcesDir, 'profiles');
let activeProfile = null;
let glossaryMap = new Map();

function loadGlossaryFile(filename) {
  try {
    const fullPath = path.join(glossariesDir, filename);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (filename.endsWith('.csv')) {
      const records = parse(content, { columns: false, skip_empty_lines: true });
      for (const row of records) {
        if (row.length >= 2) {
          const zh = String(row[0]).trim();
          const en = String(row[1]).trim();
          if (zh) glossaryMap.set(zh, en);
        }
      }
    } else if (filename.endsWith('.json')) {
      const arr = JSON.parse(content);
      for (const item of arr) {
        if (item && item.zh && item.en) glossaryMap.set(String(item.zh).trim(), String(item.en).trim());
      }
    }
  } catch (e) {
    console.error('Failed loading glossary', filename, e.message);
  }
}

function applyGlossary(text) {
  if (!text) return text;
  const entries = Array.from(glossaryMap.entries()).sort((a, b) => b[0].length - a[0].length);
  let out = text;
  for (const [zh, en] of entries) {
    out = out.split(zh).join(en);
  }
  return out;
}

function loadProfile(profileId) {
  const profilePath = path.join(profilesDir, `${profileId}.json`);
  if (!fs.existsSync(profilePath)) throw new Error('Profile not found');
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  activeProfile = profile;
  glossaryMap = new Map();
  if (profile.translation && Array.isArray(profile.translation.glossaries)) {
    for (const file of profile.translation.glossaries) loadGlossaryFile(file);
  }
  return profile;
}

async function preprocessImage(buffer) {
  if (!activeProfile || !activeProfile.ocr) return buffer;
  try {
    const img = await Jimp.read(buffer);
    if (activeProfile.ocr.contrast) {
      img.contrast(Math.max(-1, Math.min(1, activeProfile.ocr.contrast - 1)));
    }
    if (activeProfile.ocr.sharpen) {
      img.convolute([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ]);
    }
    return await img.getBufferAsync(Jimp.MIME_JPEG);
  } catch (e) {
    console.warn('Preprocess failed, using original image', e.message);
    return buffer;
  }
}

// Create and initialize the Tesseract worker
let worker;
(async () => {
  console.log('Creating Tesseract worker...');
  worker = await Tesseract.createWorker({
    // logger: m => console.log(m), // This can be very verbose
  });
  console.log('Loading languages (eng + chi_sim)...');
  await worker.loadLanguage('eng+chi_sim');
  console.log('Initializing languages...');
  await worker.initialize('eng+chi_sim');
  console.log('Tesseract worker initialized.');
})();


// Track current OCR language to avoid re-initializing unnecessarily
let currentOcrLang = 'eng+chi_sim';
async function ensureWorkerLang(lang) {
  if (!worker) return;
  if (!lang) lang = 'eng+chi_sim';
  if (currentOcrLang !== lang) {
    console.log(`Switching Tesseract language -> ${lang}`);
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    currentOcrLang = lang;
  }
}


wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      if (!worker || (await worker.getScheduler().getQueueLen()) > 0) {
        return; // Worker not ready or busy
      }
      const dataUrl = message.toString();
      const base64Data = dataUrl.replace(/^data:image\/(jpeg|png);base64,/, "");
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const preprocessed = await preprocessImage(imageBuffer);
      const ocrLang = (activeProfile && activeProfile.ocr && activeProfile.ocr.lang) || 'eng+chi_sim';
      await ensureWorkerLang(ocrLang);
      if (activeProfile && activeProfile.ocr && activeProfile.ocr.psm) {
        try {
          await worker.setParameters({ tessedit_pageseg_mode: String(activeProfile.ocr.psm) });
        } catch (e) {
          console.warn('Failed to set PSM', e.message);
        }
      }

      const { data } = await worker.recognize(preprocessed);

      if (data.paragraphs && data.paragraphs.length > 0) {
        const translations = [];
        for (const para of data.paragraphs) {
          if (para.text.trim()) {
            try {
              const from = (activeProfile && activeProfile.translation && activeProfile.translation.from) || 'zh-cn';
              const to = (activeProfile && activeProfile.translation && activeProfile.translation.to) || 'en';
              const engine = (activeProfile && activeProfile.translation && activeProfile.translation.engine) || 'google';
              const glossaryApplied = applyGlossary(para.text);
              let translatedText;
              if (engine === 'openai' && openai) {
                const sys = `You are a technical translator for industrial control HMIs. Translate from ${from} to ${to}. Use provided terminology strictly when applicable. Output only the translation.`;
                const glossaryArr = Array.from(glossaryMap.entries());
                const usr = `Terminology (pairs): ${JSON.stringify(glossaryArr)}\nText: ${glossaryApplied}`;
                const resp = await openai.chat.completions.create({
                  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                  messages: [
                    { role: 'system', content: sys },
                    { role: 'user', content: usr }
                  ],
                  temperature: 0.2
                });
                translatedText = (resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || glossaryApplied;
              } else {
                translatedText = await translate(glossaryApplied, { from, to });
              }
              translations.push({
                text: translatedText,
                bbox: para.bbox
              });
            } catch (translateError) {
              console.error('Translation Error:', translateError);
              // If translation fails, send original text with its bbox
              translations.push({
                text: applyGlossary(para.text),
                bbox: para.bbox
              });
            }
          }
        }
        if (translations.length > 0) {
          ws.send(JSON.stringify(translations));
        }
      } else {
        // If no paragraphs or translation not ready, send empty array
        ws.send(JSON.stringify([]));
      }
    } catch (ocrError) {
      console.error('OCR Error:', ocrError);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (worker) {
    await worker.terminate();
    console.log('Tesseract worker terminated.');
  }
  process.exit(0);
});

// REST: list and select profiles, and view glossary
app.get('/api/profiles', async (_req, res) => {
  try {
    const files = await fs.promises.readdir(path.join(__dirname, 'resources', 'profiles'));
    const profiles = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const p = JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'profiles', f), 'utf8'));
        profiles.push({ id: path.basename(f, '.json'), name: p.name || path.basename(f, '.json') });
      } catch {}
    }
    res.json({ profiles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const profile = loadProfile(id);
    await ensureWorkerLang((profile && profile.ocr && profile.ocr.lang) || 'eng+chi_sim');
    res.json({ ok: true, profile });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/glossary', (_req, res) => {
  const entries = Array.from(glossaryMap.entries()).map(([zh, en]) => ({ zh, en }));
  res.json({ entries });
});

// Translate adhoc text (Text Mode)
app.post('/api/translate-text', async (req, res) => {
  try {
    const { text, from = 'zh-cn', to = 'en', engine = (activeProfile && activeProfile.translation && activeProfile.translation.engine) || 'google' } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    const glossaryApplied = applyGlossary(String(text));
    if (engine === 'openai' && openai) {
      const sys = `You are a technical translator for industrial control HMIs. Translate from ${from} to ${to}. Use provided terminology strictly when applicable. Output only the translation.`;
      const glossaryArr = Array.from(glossaryMap.entries());
      const usr = `Terminology (pairs): ${JSON.stringify(glossaryArr)}\nText: ${glossaryApplied}`;
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: usr }
        ],
        temperature: 0.2
      });
      const out = (resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || glossaryApplied;
      return res.json({ translation: out });
    }
    const out = await translate(glossaryApplied, { from, to });
    res.json({ translation: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dictionary lookup
app.get('/api/dictionary', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const results = [];
  for (const [zh, en] of glossaryMap.entries()) {
    if (zh.includes(q) || en.toLowerCase().includes(q.toLowerCase())) results.push({ zh, en });
  }
  res.json({ results });
});

// Add glossary entries (persist to a user file)
app.post('/api/glossary', async (req, res) => {
  try {
    const { entries } = req.body || {};
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries array required' });
    for (const item of entries) {
      if (item && item.zh && item.en) glossaryMap.set(String(item.zh).trim(), String(item.en).trim());
    }
    const userFile = path.join(glossariesDir, 'user_custom.json');
    const list = Array.from(glossaryMap.entries()).map(([zh, en]) => ({ zh, en }));
    // Persist only user entries for simplicity; here we dump all
    await fs.promises.writeFile(userFile, JSON.stringify(list, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
