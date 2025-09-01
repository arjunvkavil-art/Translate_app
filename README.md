# 🚀 Live Screen Translator

A powerful real-time screen translation application designed specifically for industrial software interfaces, with advanced OCR capabilities and specialized support for Chinese industrial software like Inovance IRCB500.

## ✨ Features

### 🎯 **Multiple Translation Modes**
- **App Target Mode**: Target specific applications (Inovance IRCB500, Delta, Mitsubishi, Siemens)
- **Region Mode**: Select screen regions for real-time translation
- **Voice Mode**: Speak Chinese terms for instant translation
- **Text Mode**: Paste Chinese text for translation
- **Dictionary Mode**: Industrial terminology lookup

### 🏭 **Industrial Software Support**
Pre-configured profiles for popular Chinese industrial software:
- **Inovance IRCB500** - HMI configuration software
- **Delta Screen Editor** - HMI screen configuration
- **Mitsubishi GX Developer** - PLC programming software
- **Siemens STEP 7** - PLC programming (Chinese version)

### 🧠 **Advanced Translation Engines**
- **Google Translate** - Fast, reliable translations
- **OpenAI GPT** - Context-aware translations with industrial expertise
- **Custom Glossary** - Domain-specific terminology support

### 🔧 **Technical Features**
- **Real-time OCR** with Tesseract.js
- **Screen capture** and overlay system
- **Custom terminology dictionaries**
- **Translation history** and statistics
- **Keyboard shortcuts** for quick access
- **Voice recognition** (Chrome/Edge only)

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser (Chrome/Edge recommended for voice features)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd live-screen-translator
```

2. **Install dependencies**
```bash
npm install
```

3. **Optional: Set up OpenAI API key**
```bash
export OPENAI_API_KEY="your-openai-api-key-here"
```

4. **Start the application**
```bash
npm start
```

The application will open in Electron with the translation interface.

## 📖 Usage Guide

### 🎯 App Target Mode
1. Select "App Target" mode
2. Choose an industrial software profile (e.g., Inovance IRCB500)
3. Click "Start Translation"
4. Select the application window to translate
5. View real-time translations as overlays

### 🖱️ Region Mode
1. Switch to "Region" mode
2. Draw regions on the screen using the canvas
3. Click "Add Region" to monitor specific areas
4. Start translation to watch those regions

### 🎤 Voice Mode
1. Select "Voice" mode
2. Click "Start Voice Recognition"
3. Speak Chinese terms clearly
4. View instant translations

### ⌨️ Text Mode
1. Choose "Text" mode
2. Paste Chinese text in the input field
3. Click "Translate"
4. View results with translation engine info

### 📚 Dictionary Mode
1. Select "Dictionary" mode
2. Enter Chinese or English terms
3. Search for industrial terminology
4. View context and definitions

## 🔧 Configuration

### Translation Engines

#### Google Translate (Default)
- Fast and reliable
- No API key required
- Good for general translations

#### OpenAI GPT
- Context-aware translations
- Better for technical terminology
- Requires OpenAI API key
- Set environment variable: `OPENAI_API_KEY`

#### Custom Glossary
- Uses pre-configured industrial terms
- Combines with Google Translate
- Optimized for specific software

### OCR Settings
- **Confidence Threshold**: Adjust OCR accuracy (0-100%)
- **Language Support**: Chinese Simplified + English
- **Page Segmentation**: Optimized for UI elements

## 🏭 Industrial Software Profiles

### Inovance IRCB500
**Custom Terms:**
- 报警 → Alarm
- 启动 → Start
- 停止 → Stop
- 速度设置 → Speed Setting
- 伺服 → Servo
- 变频器 → Frequency Converter
- PLC → PLC
- 触摸屏 → Touch Screen

### Delta Screen Editor
**Custom Terms:**
- 画面 → Screen
- 元件 → Component
- 标签 → Label
- 按钮 → Button
- 数值 → Value
- 字符串 → String

### Mitsubishi GX Developer
**Custom Terms:**
- 梯形图 → Ladder Diagram
- 指令 → Instruction
- 触点 → Contact
- 线圈 → Coil
- 定时器 → Timer
- 计数器 → Counter

### Siemens STEP 7
**Custom Terms:**
- 组织块 → Organization Block
- 功能块 → Function Block
- 数据块 → Data Block
- 系统块 → System Block
- 程序块 → Program Block

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Start/Stop translation |
| `Ctrl+Shift+C` | Clear overlay |
| `Ctrl+Shift+R` | Refresh applications |

## 🗄️ API Endpoints

### Profiles
- `GET /api/profiles` - Get available industrial software profiles

### Glossaries
- `GET /api/glossaries` - Get custom glossaries
- `POST /api/glossaries` - Create new glossary

### History & Stats
- `GET /api/history` - Get translation history
- `GET /api/stats` - Get application statistics

## 🏗️ Architecture

```
Live Screen Translator
├── Frontend (Electron + HTML/CSS/JS)
│   ├── Real-time UI
│   ├── Mode switching
│   ├── Profile management
│   └── Overlay system
├── Backend (Node.js + Express)
│   ├── WebSocket server
│   ├── OCR processing
│   ├── Translation engines
│   └── Database management
└── Database (SQLite)
    ├── Translation history
    ├── Custom glossaries
    └── User settings
```

## 🔧 Development

### Project Structure
```
├── electron.js          # Electron main process
├── server.js            # Backend server
├── package.json         # Dependencies
├── public/              # Frontend files
│   ├── index.html       # Main interface
│   └── main.js          # Frontend logic
└── README.md           # This file
```

### Building for Production
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## 🌟 Use Cases

### 🏭 Factory Engineers
- Translate Inovance IRCB500 Chinese interface to English
- Understand error messages and warnings
- Navigate configuration menus
- Debug system issues

### 🔧 System Integrators
- Work with multiple Chinese industrial software
- Translate technical documentation
- Understand parameter settings
- Configure HMI screens

### 📚 Training & Support
- Train non-Chinese speaking engineers
- Provide real-time assistance
- Create bilingual documentation
- Support remote troubleshooting

## 🚀 Performance Tips

1. **Optimize OCR Confidence**: Lower for speed, higher for accuracy
2. **Use App Target Mode**: More efficient than full-screen capture
3. **Selective Region Monitoring**: Monitor only necessary areas
4. **Custom Glossaries**: Improve translation accuracy for specific domains

## 🔒 Security & Privacy

- **Local Processing**: OCR and basic translations run locally
- **Optional Cloud**: OpenAI integration requires internet
- **No Data Storage**: Translations not stored permanently (configurable)
- **Secure APIs**: All external API calls use HTTPS

## 🐛 Troubleshooting

### Common Issues

**Screen Capture Not Working**
- Ensure browser permissions for screen sharing
- Check if another application is using screen capture
- Try refreshing the application

**OCR Not Detecting Text**
- Increase OCR confidence threshold
- Ensure good screen resolution
- Check if text is rendered as images

**Translation Quality Issues**
- Switch to OpenAI engine for better context
- Use custom glossary for domain-specific terms
- Adjust OCR settings for better text recognition

**Voice Recognition Problems**
- Use Chrome or Edge browser
- Ensure microphone permissions
- Speak clearly and slowly

## 📞 Support

For issues, feature requests, or contributions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Tesseract.js** for OCR capabilities
- **Google Translate** for translation services
- **OpenAI** for advanced language processing
- **Electron** for cross-platform desktop app framework

---

**Built with ❤️ for industrial automation professionals**