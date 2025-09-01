# 🌟 Live Screen Translator

A powerful real-time screen translation tool specifically designed for Chinese industrial software interfaces, including **Inovance IRCB500**, **Siemens STEP 7**, **Mitsubishi GX Developer**, and other PLC/HMI software.

## ✨ Key Features

### 🎯 **Real-Time Translation Modes**
- **App Target Mode**: Target specific industrial software windows
- **Region Mode**: Monitor selected screen areas
- **Full Screen Mode**: Translate entire screen content
- **Voice Mode**: Speak terms for instant translation
- **Text Mode**: Paste text for quick translation

### 🧩 **Industrial Software Support**
- **Inovance IRCB500** - Chinese robot controller software
- **Siemens STEP 7** - PLC programming environment  
- **Mitsubishi GX Developer** - PLC development tools
- **Delta Screen Editor** - HMI development software
- **Custom profiles** for other industrial software

### 🔧 **Advanced OCR Technology**
- **PaddleOCR** - Optimized for Chinese text recognition
- **Tesseract** - Fallback OCR engine
- **Preprocessing** - Image enhancement for better accuracy
- **Font Recognition** - Handles bitmap fonts and custom UI elements

### 📘 **Industrial Terminology Glossary**
- **Built-in Dictionary** - 500+ automation terms
- **Custom Glossaries** - Load your own terminology
- **Domain-Specific** - Automation, Robotics, PLC, HMI, Safety
- **Context-Aware** - Understands industrial context

### 🖥️ **Smart Overlay System**
- **Floating Tooltips** - Non-intrusive translation display
- **Real-time Updates** - Instant translation as text changes
- **Customizable UI** - Adjust opacity, font size, colors
- **System Tray** - Runs in background

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone <repository_url>
cd live-screen-translator

# Install dependencies
pip install -r requirements.txt

# For better Chinese OCR (recommended)
pip install paddlepaddle paddleocr
```

### 2. Basic Usage
```bash
# Start the application
python main.py

# Or run in debug mode
python main.py --debug

# Run demo to test components
python demo.py
```

### 3. Using with Inovance IRCB500
1. **Launch IRCB500** software
2. **Start Live Screen Translator**
3. **Select "App Target Mode"** 
4. **Click "Target Window"** and select IRCB500
5. **Click "Start Translation"**
6. **Watch real-time translations** appear as overlays!

## ⌨️ Hotkeys

| Hotkey | Function |
|--------|----------|
| `Ctrl+Shift+T` | Toggle translation on/off |
| `Ctrl+Shift+R` | Select screen region |
| `Ctrl+Shift+W` | Target specific window |
| `Ctrl+Shift+O` | Toggle overlay visibility |

## 🏗️ Architecture

```
src/
├── core/
│   ├── translator_app.py      # Main application coordinator
│   ├── screen_capture.py      # Screen capture & window detection
│   ├── hotkey_manager.py      # Global hotkey management
│   └── profile_manager.py     # Industrial software profiles
├── ocr/
│   └── ocr_engine.py          # OCR engines (PaddleOCR, Tesseract)
├── translation/
│   └── translation_engine.py  # Translation engines & glossary
├── ui/
│   ├── main_window.py         # Main control interface
│   ├── overlay.py             # Translation overlays
│   └── region_selector.py     # Interactive region selection
└── utils/
    ├── config_manager.py      # Configuration management
    ├── logger.py              # Logging utilities
    └── glossary_loader.py     # Glossary file handling
```

## 📋 Industrial Software Profiles

### Inovance IRCB500
- **Target**: Chinese robot controller interface
- **Features**: Optimized OCR for Chinese UI, common robotics terms
- **Regions**: Toolbar, menu, status bar, properties panel

### Siemens STEP 7
- **Target**: PLC programming environment
- **Features**: Multi-language support (Chinese/German/English)
- **Regions**: Project tree, editor, properties, output window

### Mitsubishi GX Developer  
- **Target**: PLC development tools
- **Features**: Japanese/Chinese text support
- **Regions**: Project window, ladder editor, device monitor

## 📘 Glossary System

### Built-in Terms
- **Automation**: 启动→Start, 停止→Stop, 报警→Alarm
- **Robotics**: 关节→Joint, 示教→Teaching, 工作空间→Workspace  
- **PLC**: 程序块→Program Block, 梯形图→Ladder Logic
- **HMI**: 画面→Screen, 控件→Control, 按钮→Button
- **Safety**: 急停→Emergency Stop, 安全→Safety

### Custom Glossaries
Load your own terminology:
```json
[
  {
    "chinese": "自定义术语",
    "english": "Custom Term", 
    "category": "custom",
    "confidence": 1.0
  }
]
```

## ⚙️ Configuration

Edit `config.yaml` to customize:

```yaml
# OCR Settings
ocr:
  engine: "paddleocr"
  confidence_threshold: 0.7
  use_gpu: false

# Translation Settings  
translation:
  primary_engine: "google"
  use_glossary: true
  
# UI Settings
ui:
  overlay_opacity: 0.9
  overlay_font_size: 12
  overlay_timeout: 5000
```

## 🔧 Advanced Features

### 1. **App-Specific Targeting**
```python
# Target Inovance IRCB500
translator.load_industrial_profile('inovance_ircb500')
translator.start_translation()
```

### 2. **Custom Region Monitoring**
```python
# Monitor specific screen area
region = ScreenRegion(x=100, y=100, width=300, height=200, name="Control Panel")
translator.add_monitor_region(region)
```

### 3. **Custom Glossary Integration**
```python
# Add custom terms
translator.translation_manager.add_custom_term("自定义", "Custom", "user_defined")

# Load glossary file
translator.translation_manager.load_custom_glossary("my_terms.json")
```

## 🛠️ Technical Implementation

### OCR Pipeline
1. **Screen Capture** - Real-time window/region capture
2. **Preprocessing** - Image enhancement for better OCR
3. **Text Detection** - PaddleOCR for Chinese text recognition
4. **Filtering** - Remove low-confidence and irrelevant results

### Translation Pipeline  
1. **Glossary Lookup** - Check industrial terminology first
2. **Context Translation** - Use Google Translate or OpenAI
3. **Post-processing** - Apply industrial context rules
4. **Overlay Display** - Show translations as floating tooltips

### Performance Optimizations
- **Change Detection** - Only process when screen content changes
- **Caching** - Cache recent translations
- **Threaded Processing** - Non-blocking UI updates
- **Region Targeting** - Focus on relevant screen areas

## 🐛 Troubleshooting

### OCR Issues
```bash
# Install PaddleOCR for better Chinese support
pip install paddlepaddle paddleocr

# For GPU acceleration (optional)
pip install paddlepaddle-gpu
```

### Translation Issues
```bash
# Check internet connection for Google Translate
# Or set up OpenAI API key for offline-capable translation
export OPENAI_API_KEY="your_api_key_here"
```

### Window Detection Issues
```bash
# Run as administrator for better window access
sudo python main.py  # Linux
# Or "Run as Administrator" on Windows
```

## 📊 Use Cases

### 🏭 **Factory Engineering**
- Translate Chinese PLC software interfaces
- Understand error messages and alarms
- Navigate unfamiliar industrial software

### 🔧 **Equipment Maintenance**  
- Read Chinese equipment manuals and interfaces
- Understand diagnostic messages
- Follow maintenance procedures

### 🎓 **Training & Education**
- Learn industrial automation terminology
- Understand Chinese technical documentation
- Bridge language barriers in technical training

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional industrial software profiles
- Enhanced OCR for specific font types
- More translation engines
- Mobile/tablet support
- Voice recognition integration

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **PaddleOCR** - Excellent Chinese OCR capabilities
- **Google Translate** - Reliable translation service
- **PyQt5** - Cross-platform UI framework
- **OpenCV** - Computer vision processing

---

**🎯 Perfect for engineers working with Chinese industrial software who need real-time translation assistance!**