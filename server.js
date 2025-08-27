const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Tesseract = require('tesseract.js');
let translate;
import('@vitalets/google-translate-api').then((module) => {
  translate = module.translate;
  console.log('Translation module loaded.');
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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


wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      if (!worker || (await worker.getScheduler().getQueueLen()) > 0) {
        return; // Worker not ready or busy
      }
      const dataUrl = message.toString();
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const { data } = await worker.recognize(imageBuffer);

      if (translate && data.paragraphs && data.paragraphs.length > 0) {
        const translations = [];
        for (const para of data.paragraphs) {
          if (para.text.trim()) {
            try {
              const { text: translatedText } = await translate(para.text, { from: 'zh-cn', to: 'en' });
              translations.push({
                text: translatedText,
                bbox: para.bbox
              });
            } catch (translateError) {
              console.error('Translation Error:', translateError.name);
              // If translation fails, send original text with its bbox
              translations.push({
                text: para.text,
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
