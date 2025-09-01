## Live Screen Translator (Industrial)

A cross-platform toolkit for live on-screen OCR and translation, with special support for Chinese industrial/HMI software (e.g., Inovance IRCB500, Delta, Mitsubishi, Siemens, Omron).

### Key Features
- App-target and region-based screen capture via `mss`
- OCR wrapper supporting Tesseract by default; optional PaddleOCR
- Translation engine with glossary-first replacements and pluggable backends (OpenAI, DeepL, LibreTranslate)
- Preconfigured profiles for common HMI/PLC tools (OCR hints, saved regions, custom terminology)
- Real-time region watcher with change detection
- Optional overlay rendering (Tkinter-based stub; advanced Qt overlay can be added)

### Quick Start (Electron + Node)
1. Install Node dependencies:
```bash
npm install
```
2. (Optional) Export API keys:
```bash
export OPENAI_API_KEY=...               # for OpenAI-powered translation
export OPENAI_MODEL=gpt-4o-mini         # optional; defaults to gpt-4o-mini
```
3. Start the app:
```bash
npm start
```

### Modes
- `region` — Translate a selected or specified screen region continuously.
- `text` — Translate an input string with glossary-first logic.
- `dictionary` — Lookup a term in loaded glossaries.
- `app-target` — Stub for per-application targeting (Windows-specific hooks to be added).
- `voice` — Stub for voice input.

### Requirements
- Node 18+
- Tesseract runtime for OCR (tesseract.js downloads traineddata at first run)

### Overlay UI
This repo includes a minimal Tkinter overlay stub that can display translated text near detected regions. For production-grade overlays with window pinning and better rendering, consider PySide6 or Qt bindings. The overlay imports are optional and will not load unless needed.

### Profiles & Glossaries
- Profiles live under `resources/profiles/*.json` and contain OCR/translation hints, and optional saved regions.
- Glossaries live under `resources/glossaries/*.csv|json`. You can add your own domain-specific dictionaries.

### Usage
- Use the Profile selector to load presets like `ircb500`.
- Click Start Capture to begin screen capture.
- Use Toggle Region Select or hotkey Ctrl/Cmd+Shift+T to select a region.
- Paste text into the bottom panel for Text Mode, or use Dictionary lookup.

### Roadmap
- Windows-specific app hooks (Win32 API) to target `ircb500.exe` and similar
- Qt-based persistent overlay with per-word bounding box labels
- PaddleOCR integration toggled by profile and availability
- Model fine-tuning for industrial UI fonts

### License
MIT

# Translate_app