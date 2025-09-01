#!/usr/bin/env python3
"""
Example: Using Live Screen Translator with Inovance IRCB500

This example shows how to set up automated translation for IRCB500 software
"""

import sys
import os
import time

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from utils.config_manager import ConfigManager
from core.profile_manager import ProfileManager
from core.screen_capture import WindowDetector, ScreenCapture
from ocr.ocr_engine import OCRManager
from translation.translation_engine import TranslationManager

def setup_ircb500_translation():
    """Setup translation specifically for IRCB500"""
    print("🧩 Setting up IRCB500 Translation...")
    
    # Load configuration
    config_manager = ConfigManager()
    
    # Load IRCB500 profile
    profile_manager = ProfileManager()
    ircb500_profile = profile_manager.get_profile('inovance_ircb500')
    
    if not ircb500_profile:
        print("❌ IRCB500 profile not found")
        return None
    
    print(f"✅ Loaded profile: {ircb500_profile.name}")
    
    # Apply profile settings to configuration
    config_manager.set('ocr.confidence_threshold', 
                      ircb500_profile.ocr_settings['confidence_threshold'])
    config_manager.set('ocr.languages', 
                      ircb500_profile.ocr_settings['languages'])
    
    # Initialize components with profile settings
    ocr_manager = OCRManager(config_manager.config)
    translation_manager = TranslationManager(config_manager.config)
    
    # Add profile-specific terms to glossary
    for chinese, english in ircb500_profile.common_terms.items():
        translation_manager.add_custom_term(chinese, english, "ircb500")
    
    print(f"✅ Added {len(ircb500_profile.common_terms)} IRCB500-specific terms")
    
    return {
        'config': config_manager.config,
        'profile': ircb500_profile,
        'ocr': ocr_manager,
        'translation': translation_manager
    }

def find_ircb500_window():
    """Find IRCB500 application window"""
    print("\\n🔍 Looking for IRCB500 window...")
    
    detector = WindowDetector()
    
    # Look for IRCB500 specifically
    all_windows = detector.get_all_windows()
    ircb500_windows = []
    
    for window in all_windows:
        if 'ircb500' in window.title.lower() or 'ircb500' in window.executable.lower():
            ircb500_windows.append(window)
    
    if ircb500_windows:
        print(f"✅ Found {len(ircb500_windows)} IRCB500 window(s):")
        for i, window in enumerate(ircb500_windows):
            print(f"   {i+1}. {window.title}")
        return ircb500_windows[0]  # Return first match
    else:
        print("⚠️  IRCB500 window not found")
        print("   Make sure IRCB500 software is running")
        return None

def translate_ircb500_interface(components, target_window):
    """Translate IRCB500 interface elements"""
    print("\\n🌐 Translating IRCB500 Interface...")
    
    screen_capture = ScreenCapture(components['config'])
    
    # Capture IRCB500 window
    if target_window:
        image = screen_capture.capture_window(target_window)
    else:
        print("⚠️  No target window, capturing full screen")
        image = screen_capture.capture_full_screen()
    
    if image.size == 0:
        print("❌ Failed to capture screen")
        return
    
    print(f"📸 Captured image: {image.shape}")
    
    # Run OCR
    ocr_results = components['ocr'].detect_text(image)
    print(f"🔍 OCR detected {len(ocr_results)} text regions")
    
    if not ocr_results:
        print("   No text detected. Try adjusting OCR settings.")
        return
    
    # Translate detected text
    translations = []
    for ocr_result in ocr_results:
        trans_result = components['translation'].translate(ocr_result.text)
        translations.append(trans_result)
        
        if trans_result.translated_text != trans_result.original_text:
            glossary_info = " 📘" if trans_result.glossary_matches else ""
            print(f"   '{ocr_result.text}' -> '{trans_result.translated_text}'{glossary_info}")
    
    translated_count = sum(1 for t in translations 
                          if t.translated_text != t.original_text)
    
    print(f"\\n✅ Successfully translated {translated_count}/{len(translations)} text elements")

def main():
    """Main example function"""
    print("🧩 IRCB500 Translation Example")
    print("=" * 40)
    
    # Setup translation components
    components = setup_ircb500_translation()
    if not components:
        print("❌ Failed to setup translation components")
        sys.exit(1)
    
    # Find IRCB500 window
    target_window = find_ircb500_window()
    
    # Translate interface
    translate_ircb500_interface(components, target_window)
    
    print("\\n" + "=" * 40)
    print("🎉 Example completed!")
    print("\\nFor continuous real-time translation:")
    print("   python main.py --mode app")
    print("\\nThen use Ctrl+Shift+W to target IRCB500 window")

if __name__ == '__main__':
    main()