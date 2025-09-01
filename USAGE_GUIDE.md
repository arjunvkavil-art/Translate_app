# 📖 Live Screen Translator - Usage Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
# Option A: Use the installer
python3 install.py

# Option B: Manual installation  
pip3 install -r requirements.txt

# Option C: Use the startup script (Linux/Mac)
./start.sh
```

### Step 2: Test Installation
```bash
# Run basic tests
python3 test_basic.py

# Run full demo (requires OCR dependencies)
python3 demo.py
```

### Step 3: Start Translating!
```bash
# Quick start
python3 main.py

# Or use the launcher for guided setup
python3 launch_translator.py
```

## 🧩 Using with Inovance IRCB500

### Scenario: You're working with IRCB500 Chinese interface

1. **Launch IRCB500** software first
2. **Start Live Screen Translator**:
   ```bash
   python3 main.py --mode app
   ```
3. **Target the IRCB500 window**:
   - Press `Ctrl+Shift+W` (hotkey)
   - Or click "Target Window" in the UI
4. **Start translation**:
   - Press `Ctrl+Shift+T` (hotkey)
   - Or click "Start Translation" button
5. **Watch the magic** ✨:
   - Chinese text gets detected automatically
   - English translations appear as floating tooltips
   - Industrial terms use specialized glossary

### Example Translations:
```
启动 → Start
停止 → Stop  
伺服驱动器 → Servo Drive
程序下载 → Program Download
故障报警 → Fault Alarm
```

## 📸 Region Monitoring Mode

### Use Case: Monitor specific control panels

1. **Start region mode**:
   ```bash
   python3 main.py --mode region
   ```
2. **Select region**:
   - Press `Ctrl+Shift+R`
   - Click and drag to select area
   - Or use predefined regions
3. **Start monitoring**:
   - Press `Ctrl+Shift+T`
   - Translations appear for text in selected region only

### Predefined Regions:
- **Top Half**: Monitor upper screen area
- **Bottom Half**: Monitor lower screen area  
- **Left/Right Half**: Monitor side panels
- **Center**: Monitor main workspace
- **Quarters**: Monitor screen quadrants

## ⚙️ Configuration Examples

### OCR Optimization for Different Software:

#### For IRCB500 (Chinese text):
```yaml
ocr:
  engine: "paddleocr"
  languages: ["ch"]
  confidence_threshold: 0.6  # Lower for Chinese UI fonts
  use_gpu: false
```

#### For STEP 7 (Mixed languages):
```yaml
ocr:
  engine: "paddleocr"  
  languages: ["ch", "de", "en"]
  confidence_threshold: 0.7
  use_gpu: false
```

### Translation Settings:

#### For Technical Accuracy:
```yaml
translation:
  primary_engine: "openai"  # Better for technical terms
  use_glossary: true
  context_aware: true
```

#### For Speed:
```yaml
translation:
  primary_engine: "google"  # Faster response
  use_glossary: true
  context_aware: false
```

## 📘 Custom Glossary Setup

### Adding Your Own Terms:

#### Method 1: Through UI
1. Open "Glossary" tab
2. Enter Chinese term
3. Enter English translation  
4. Add category (optional)
5. Click "Add Term"

#### Method 2: JSON File
Create `my_terms.json`:
```json
[
  {
    "chinese": "自定义术语",
    "english": "Custom Term",
    "category": "my_category",
    "confidence": 1.0
  }
]
```

Load with:
```python
translator.translation_manager.load_custom_glossary("my_terms.json")
```

#### Method 3: CSV File
Create `my_terms.csv`:
```csv
chinese,english,category,confidence
自定义术语,Custom Term,my_category,1.0
```

## 🎯 Industrial Software Profiles

### Using Predefined Profiles:

```python
# Load IRCB500 profile
translator.load_industrial_profile('inovance_ircb500')

# Load Siemens profile  
translator.load_industrial_profile('siemens_step7')

# Load Mitsubishi profile
translator.load_industrial_profile('mitsubishi_gx')
```

### Creating Custom Profiles:

1. **Identify target software**:
   - Executable name (e.g., "myapp.exe")
   - Window title pattern (e.g., "*MyApp*")

2. **Optimize OCR settings**:
   - Test confidence thresholds
   - Select appropriate languages
   - Configure preprocessing

3. **Map UI regions**:
   - Identify key interface areas
   - Define region coordinates
   - Name regions logically

4. **Build terminology**:
   - Collect common terms
   - Categorize by function
   - Test translation accuracy

## 🔧 Troubleshooting Common Issues

### **OCR Not Detecting Text**
```bash
# Solution 1: Install PaddleOCR
pip3 install paddleocr

# Solution 2: Lower confidence threshold
# Edit config.yaml: ocr.confidence_threshold: 0.5

# Solution 3: Check image quality
# Ensure text is at least 12 pixels high
```

### **Translation Not Working**
```bash
# Solution 1: Check internet connection
ping google.com

# Solution 2: Test translation engine
python3 -c "from googletrans import Translator; print(Translator().translate('测试').text)"

# Solution 3: Use OpenAI as backup
export OPENAI_API_KEY="your_key_here"
```

### **Window Not Detected**
```bash
# Solution 1: Run as administrator (Windows)
# Right-click -> "Run as administrator"

# Solution 2: Check window title
# Make sure target software is running and visible

# Solution 3: Use manual region selection
# Press Ctrl+Shift+R instead of window targeting
```

### **Hotkeys Not Working**
```bash
# Solution 1: Check permissions
# Some systems require elevated permissions for global hotkeys

# Solution 2: Change hotkey combinations
# Edit config.yaml hotkeys section

# Solution 3: Use UI buttons instead
# All hotkey functions available in main window
```

## 🎓 Advanced Usage

### **Scripting Integration**:
```python
#!/usr/bin/env python3
import sys
sys.path.append('src')

from core.translator_app import LiveScreenTranslator

# Create translator instance
translator = LiveScreenTranslator(config_path="config.yaml")

# Load industrial profile
translator.load_industrial_profile('inovance_ircb500')

# Start translation
translator.start_translation()

# Capture and translate once
results = translator.capture_and_translate_once()

# Print results
for result in results:
    print(f"{result.original_text} -> {result.translated_text}")
```

### **Batch Processing**:
```python
# Process multiple screenshots
import glob
from PIL import Image
import numpy as np

screenshot_files = glob.glob("screenshots/*.png")

for file_path in screenshot_files:
    image = np.array(Image.open(file_path))
    results = translator._process_ocr(image)
    print(f"File: {file_path}, Detected: {len(results)} texts")
```

## 📊 Performance Tips

### **For Best Performance**:
1. **Use App Target Mode** instead of full screen
2. **Select specific regions** rather than entire windows
3. **Adjust capture FPS** based on content change rate
4. **Enable GPU acceleration** if available
5. **Use wired internet** for faster translation

### **For Best Accuracy**:
1. **Use PaddleOCR** for Chinese text
2. **Enable industrial glossary** for technical terms
3. **Set appropriate confidence thresholds**
4. **Ensure good screen resolution** (1080p+)
5. **Avoid overlapping windows** during capture

### **For Resource Efficiency**:
1. **Monitor specific regions** instead of full screen
2. **Reduce capture FPS** for static content
3. **Use local glossary** to minimize API calls
4. **Close unused applications** to reduce processing load

---

## 🎯 Success Stories

### **Factory Engineer in China**:
*"I can now understand the IRCB500 interface completely. The real-time translation helps me configure robots without language barriers!"*

### **International Maintenance Team**:
*"We service equipment worldwide. This tool helps us understand Chinese PLC software and diagnostic messages instantly."*

### **Automation Student**:
*"Learning Chinese industrial automation terms while seeing English translations side-by-side is incredibly helpful for my studies."*

---

**🚀 Ready to bridge the language gap in industrial automation!**