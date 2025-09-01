# 🚀 Quick Start Guide - Live Screen Translator Pro

Get up and running with Live Screen Translator Pro in minutes!

## ⚡ Quick Installation

### Option 1: Automated Installation (Recommended)

**Linux/macOS:**
```bash
# Clone the repository
git clone https://github.com/your-username/live-screen-translator.git
cd live-screen-translator

# Run the installation script
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
# Clone the repository
git clone https://github.com/your-username/live-screen-translator.git
cd live-screen-translator

# Run the installation script
install.bat
```

### Option 2: Manual Installation

1. **Install Node.js** (v16 or higher):
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Tesseract OCR:**
   - **Ubuntu/Debian:** `sudo apt install tesseract-ocr tesseract-ocr-chi-sim`
   - **macOS:** `brew install tesseract tesseract-lang`
   - **Windows:** Download from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)

## 🎯 Quick Start

### 1. Start the Application

**Development Mode (with DevTools):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

### 2. Basic Usage

1. **Select Translation Mode:**
   - **Full Screen**: Translates entire screen
   - **Region**: Select specific area
   - **App Target**: Target specific application

2. **Choose Industrial Profile:**
   - Select the appropriate profile for your software
   - Profiles include optimized settings and terminology

3. **Configure Settings:**
   - OCR Engine: Tesseract or PaddleOCR
   - Translation Engine: Google Translate or OpenAI GPT
   - Confidence Threshold: Filter low-confidence results

4. **Start Translation:**
   - Click "Start" to begin screen capture
   - Translations appear as floating overlays
   - Click translations for detailed information

### 3. Global Shortcuts

- **Ctrl+Shift+T**: Toggle translation overlay
- **Ctrl+Shift+S**: Start/Stop capture
- **Ctrl+Shift+P**: Pause/Resume capture
- **Ctrl+Shift+R**: Quick region selection
- **Ctrl+Shift+H**: Hide/Show application

## 🏭 Industrial Software Support

### Pre-configured Profiles

| Software | Category | Description |
|----------|----------|-------------|
| **Inovance IRCB500** | HMI | Servo control configuration |
| **Delta Screen Editor** | HMI | HMI screen editor |
| **Mitsubishi GX Developer** | PLC | PLC programming software |
| **Siemens STEP 7** | PLC | PLC programming (Chinese) |
| **Omron CX-Programmer** | PLC | PLC programming software |
| **Schneider Unity Pro** | PLC | PLC programming software |

### Custom Profiles

Create custom profiles for your specific software:

```javascript
// Add to config/profiles.js
const CUSTOM_PROFILE = {
  'your_software': {
    name: 'Your Software Name',
    description: 'Description of your software',
    category: 'HMI', // or 'PLC'
    ocr_settings: {
      language: 'chi_sim',
      confidence_threshold: 0.7
    },
    custom_terms: {
      '中文术语': 'English Term',
      '另一个术语': 'Another Term'
    }
  }
};
```

## 🎮 Demo Mode

Test the application with sample data:

```bash
# Run demo with sample translations
npm run demo

# Start demo server
npm run demo-server
```

Then open `http://localhost:3001` to see the demo in action.

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# OpenAI API Key (for GPT translation)
OPENAI_API_KEY=your_openai_api_key_here

# Google Translate API Key (optional)
GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here

# Server Port
PORT=3000

# Development Mode
NODE_ENV=development
```

### Custom Glossaries

Add domain-specific terminology:

```bash
# Via API
curl -X POST http://localhost:3000/api/glossaries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Glossary",
    "category": "Automation",
    "terms": {
      "报警": "Alarm",
      "启动": "Start",
      "停止": "Stop"
    }
  }'
```

## 🎯 Use Cases

### 1. Inovance IRCB500 Translation

**Scenario:** Engineer using Chinese IRCB500 software

1. Select "Inovance IRCB500" profile
2. Choose "Full Screen" or "Region" mode
3. Start translation
4. Chinese UI elements are translated to English in real-time

**Example Translations:**
- `伺服参数设置` → `Servo Parameter Settings`
- `报警信息显示` → `Alarm Information Display`
- `系统状态监控` → `System Status Monitor`

### 2. PLC Programming Software

**Scenario:** Working with Chinese PLC software

1. Select appropriate PLC profile (Mitsubishi, Siemens, etc.)
2. Use "App Target" mode to focus on specific window
3. Translate ladder diagram instructions and parameters

### 3. Custom Industrial Software

**Scenario:** Proprietary Chinese industrial software

1. Create custom profile with specific terminology
2. Upload custom glossary
3. Optimize OCR settings for your software's font and layout

## 🚨 Troubleshooting

### Common Issues

**OCR Not Working:**
```bash
# Check Tesseract installation
tesseract --version
tesseract --list-langs

# Install Chinese language packs
sudo apt install tesseract-ocr-chi-sim tesseract-ocr-chi-tra
```

**Translation Errors:**
- Check internet connection
- Verify API keys in `.env` file
- Review confidence threshold settings

**Performance Issues:**
- Reduce update frequency
- Lower image quality settings
- Close unnecessary applications

**Screen Capture Issues:**
- Grant screen recording permissions
- Check display scaling settings
- Verify Electron permissions

### Debug Mode

```bash
# Run with detailed logging
DEBUG=* npm run dev

# Check system requirements
node --version
npm --version
tesseract --version
```

## 📞 Support

- **Documentation:** [README.md](README.md)
- **Issues:** [GitHub Issues](https://github.com/your-username/live-screen-translator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/live-screen-translator/discussions)

## 🎉 What's Next?

1. **Explore Advanced Features:**
   - Custom glossaries and terminology
   - Translation history and analytics
   - Multiple translation engines

2. **Optimize for Your Use Case:**
   - Create custom profiles
   - Fine-tune OCR settings
   - Add domain-specific terminology

3. **Integrate with Workflow:**
   - Set up global shortcuts
   - Configure auto-start
   - Create custom scripts

---

**Ready to translate? Start with `npm start` and begin translating your Chinese industrial software! 🚀**