# Live Screen Translator Pro 🚀

A powerful real-time screen translation application designed specifically for industrial software and Chinese UI translation. Perfect for engineers working with Chinese industrial software like Inovance IRCB500, Delta Screen Editor, Mitsubishi GX Developer, and more.

## 🌟 Features

### 🎯 Core Translation Capabilities
- **Real-time Screen Translation**: Capture and translate text from any screen in real-time
- **Multiple OCR Engines**: Support for Tesseract and PaddleOCR
- **Advanced Translation**: Google Translate and OpenAI GPT integration
- **Industrial Software Support**: Pre-configured profiles for Chinese industrial software

### 🏭 Industrial Software Profiles
- **Inovance IRCB500**: HMI configuration software
- **Delta Screen Editor**: Delta HMI screen editor
- **Mitsubishi GX Developer**: PLC programming software
- **Siemens STEP 7**: PLC programming (Chinese version)
- **Custom Profiles**: Create your own profiles for specific software

### 🎮 Translation Modes
- **Full Screen Mode**: Translate text from the entire screen
- **Region Mode**: Select specific areas to monitor and translate
- **App Target Mode**: Target specific application windows
- **Voice Mode**: Speak Chinese terms and get English translations

### 🛠️ Advanced Features
- **Custom Glossaries**: Upload domain-specific terminology
- **Translation History**: Track and review past translations
- **Confidence Scoring**: Filter results by OCR confidence
- **Real-time Statistics**: Monitor translation accuracy and performance
- **Global Shortcuts**: Quick access to key functions

### 🎨 Modern UI
- **Beautiful Interface**: Modern, responsive design with glassmorphism effects
- **Dark/Light Themes**: Adaptive theming based on system preferences
- **Floating Overlays**: Non-intrusive translation displays
- **Interactive Elements**: Click translations for detailed information

## 📋 System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Node.js**: Version 16 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free disk space
- **Display**: 1920x1080 minimum resolution

## 🚀 Installation

### Prerequisites

1. **Install Node.js** (v16 or higher):
   ```bash
   # Download from https://nodejs.org/
   # Or use package manager
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm
   
   # macOS (using Homebrew)
   brew install node
   
   # Windows
   # Download installer from https://nodejs.org/
   ```

2. **Install Git** (for cloning the repository):
   ```bash
   # Ubuntu/Debian
   sudo apt install git
   
   # macOS
   brew install git
   
   # Windows
   # Download from https://git-scm.com/
   ```

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/live-screen-translator.git
   cd live-screen-translator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install system dependencies** (Linux only):
   ```bash
   # Ubuntu/Debian
   sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev
   
   # For OCR support
   sudo apt install tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-chi-tra
   ```

4. **Optional: Install PaddleOCR** (for enhanced OCR):
   ```bash
   pip install paddlepaddle paddleocr
   ```

## 🎯 Usage

### Starting the Application

1. **Development Mode** (with DevTools):
   ```bash
   npm run dev
   ```

2. **Production Mode**:
   ```bash
   npm start
   ```

### Basic Usage

1. **Select Translation Mode**:
   - **Full Screen**: Translates text from the entire screen
   - **Region**: Select a specific area to monitor
   - **App Target**: Target a specific application window

2. **Choose Industrial Profile**:
   - Select the appropriate profile for your software
   - Profiles include optimized OCR settings and custom terminology

3. **Configure Settings**:
   - **OCR Engine**: Choose between Tesseract and PaddleOCR
   - **Translation Engine**: Google Translate or OpenAI GPT
   - **Confidence Threshold**: Filter low-confidence results
   - **Update Frequency**: Control capture frequency

4. **Start Translation**:
   - Click "Start" to begin screen capture
   - Translations will appear as floating overlays
   - Click on translations for detailed information

### Global Shortcuts

- **Ctrl+Shift+T**: Toggle translation overlay visibility
- **Ctrl+Shift+S**: Start/Stop capture
- **Ctrl+Shift+P**: Pause/Resume capture
- **Ctrl+Shift+R**: Quick region selection
- **Ctrl+Shift+H**: Hide/Show application window

### Advanced Features

#### Custom Glossaries

1. **Create Custom Terms**:
   ```json
   {
     "报警": "Alarm",
     "启动": "Start",
     "停止": "Stop",
     "速度设置": "Speed Setting"
   }
   ```

2. **Upload Glossary**:
   - Use the API endpoint: `POST /api/glossaries`
   - Or create through the web interface

#### Translation History

- View translation history at: `GET /api/history`
- Export translations for analysis
- Review accuracy and improve profiles

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

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

### Custom Profiles

Add custom profiles in `server.js`:

```javascript
const CUSTOM_PROFILES = {
  'your_software': {
    name: 'Your Software Name',
    description: 'Description of your software',
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

## 🏭 Industrial Software Support

### Inovance IRCB500
- **Purpose**: HMI configuration software
- **Features**: 
  - Optimized OCR for Chinese interface
  - Custom terminology for servo control
  - Region-specific translation for toolbar and menus

### Delta Screen Editor
- **Purpose**: Delta HMI screen editor
- **Features**:
  - Screen component translation
  - Button and label recognition
  - Numeric display translation

### Mitsubishi GX Developer
- **Purpose**: PLC programming software
- **Features**:
  - Ladder diagram terminology
  - Instruction translation
  - Soft element recognition

## 🔍 Troubleshooting

### Common Issues

1. **OCR Not Working**:
   - Ensure Tesseract is installed: `tesseract --version`
   - Check language packs: `tesseract --list-langs`
   - Verify image quality and contrast

2. **Translation Errors**:
   - Check internet connection for Google Translate
   - Verify OpenAI API key if using GPT
   - Review confidence threshold settings

3. **Performance Issues**:
   - Reduce update frequency
   - Lower image quality settings
   - Close unnecessary applications

4. **Screen Capture Issues**:
   - Grant screen recording permissions
   - Check display scaling settings
   - Verify Electron permissions

### Debug Mode

Run in debug mode for detailed logging:

```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js**: OCR engine
- **Google Translate**: Translation service
- **OpenAI**: GPT translation capabilities
- **Electron**: Desktop application framework
- **Font Awesome**: Icons

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/live-screen-translator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/live-screen-translator/discussions)
- **Email**: support@livescreentranslator.com

## 🔄 Changelog

### Version 2.0.0
- ✨ Complete UI redesign with modern interface
- 🏭 Added industrial software profiles
- 🎯 Multiple translation modes (Full Screen, Region, App Target)
- 📊 Real-time statistics and performance monitoring
- ⌨️ Global keyboard shortcuts
- 🗂️ Translation history and custom glossaries
- 🔧 Advanced configuration options
- 🎨 Glassmorphism UI effects

### Version 1.0.0
- 🚀 Initial release
- 📸 Basic screen capture and translation
- 🔤 Tesseract OCR integration
- 🌐 Google Translate support

---

**Made with ❤️ for industrial engineers worldwide**