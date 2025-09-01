#!/usr/bin/env python3
"""
Live Screen Translator Demo Script

Demonstrates the capabilities of the Live Screen Translator
"""

import sys
import os
import time
import logging

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from utils.logger import setup_logger
from utils.config_manager import ConfigManager
from ocr.ocr_engine import OCRManager
from translation.translation_engine import TranslationManager
from core.screen_capture import ScreenCapture, WindowDetector
from core.profile_manager import ProfileManager

def demo_ocr_engine():
    """Demo OCR capabilities"""
    print("\\n🔍 Testing OCR Engine...")
    
    config = ConfigManager().config
    ocr_manager = OCRManager(config)
    
    if not ocr_manager.primary_engine:
        print("❌ No OCR engine available. Please install PaddleOCR:")
        print("   pip install paddleocr")
        return
    
    print(f"✅ OCR Engine: {type(ocr_manager.primary_engine).__name__}")
    
    # Test with a sample image (would normally capture from screen)
    import numpy as np
    import cv2
    
    # Create a test image with Chinese text
    test_image = np.ones((100, 400, 3), dtype=np.uint8) * 255
    cv2.putText(test_image, "测试文本", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    print("📸 Testing OCR on sample image...")
    results = ocr_manager.detect_text(test_image)
    
    if results:
        for result in results:
            print(f"   Detected: '{result.text}' (confidence: {result.confidence:.2f})")
    else:
        print("   No text detected in test image")

def demo_translation_engine():
    """Demo translation capabilities"""
    print("\\n🌐 Testing Translation Engine...")
    
    config = ConfigManager().config
    translation_manager = TranslationManager(config)
    
    if not translation_manager.primary_engine:
        print("❌ No translation engine available. Please check internet connection.")
        return
    
    print(f"✅ Translation Engine: {type(translation_manager.primary_engine).__name__}")
    
    # Test translations
    test_texts = [
        "启动",
        "停止", 
        "报警",
        "配置参数",
        "伺服驱动器"
    ]
    
    print("🔄 Testing translations...")
    for text in test_texts:
        result = translation_manager.translate(text)
        glossary_info = " (from glossary)" if result.glossary_matches else ""
        print(f"   {text} -> {result.translated_text}{glossary_info}")

def demo_window_detection():
    """Demo window detection"""
    print("\\n🪟 Testing Window Detection...")
    
    detector = WindowDetector()
    windows = detector.get_all_windows()
    
    print(f"✅ Found {len(windows)} windows")
    
    # Show first few windows
    for i, window in enumerate(windows[:5]):
        print(f"   {i+1}. {window.title} ({window.executable})")
    
    # Look for target windows
    target_windows = detector.find_target_windows()
    if target_windows:
        print(f"\\n🎯 Found {len(target_windows)} target windows:")
        for window in target_windows:
            print(f"   - {window.title}")
    else:
        print("\\n🎯 No target industrial software windows found")

def demo_profiles():
    """Demo industrial profiles"""
    print("\\n📋 Testing Industrial Profiles...")
    
    profile_manager = ProfileManager()
    profiles = profile_manager.get_all_profiles()
    
    print(f"✅ Loaded {len(profiles)} profiles:")
    for key, profile in profiles.items():
        print(f"   - {profile.name} ({profile.manufacturer})")
        print(f"     Category: {profile.category}")
        print(f"     Terms: {len(profile.common_terms)} loaded")
        print()

def demo_glossary():
    """Demo glossary system"""
    print("\\n📘 Testing Glossary System...")
    
    from translation.translation_engine import IndustrialGlossary
    
    glossary = IndustrialGlossary()
    
    # Test lookups
    test_terms = ["启动", "伺服", "报警", "配置", "未知词汇"]
    
    for term in test_terms:
        results = glossary.lookup(term)
        if results:
            best_match = results[0]
            print(f"   {term} -> {best_match[0]} ({best_match[1]})")
        else:
            print(f"   {term} -> Not found in glossary")

def demo_full_pipeline():
    """Demo the complete translation pipeline"""
    print("\\n🚀 Testing Complete Pipeline...")
    
    try:
        from PyQt5.QtWidgets import QApplication
        
        # Create minimal Qt app for testing
        app = QApplication(sys.argv)
        
        # Initialize components
        config = ConfigManager().config
        screen_capture = ScreenCapture(config)
        
        print("📸 Capturing current screen...")
        screenshot = screen_capture.capture_full_screen()
        
        if screenshot.size > 0:
            print(f"✅ Screenshot captured: {screenshot.shape}")
            
            # Test OCR
            ocr_manager = OCRManager(config)
            if ocr_manager.primary_engine:
                print("🔍 Running OCR...")
                ocr_results = ocr_manager.detect_text(screenshot)
                print(f"   Found {len(ocr_results)} text regions")
                
                # Test translation on first few results
                if ocr_results:
                    translation_manager = TranslationManager(config)
                    if translation_manager.primary_engine:
                        print("🌐 Translating detected text...")
                        
                        for i, ocr_result in enumerate(ocr_results[:3]):  # First 3 results
                            trans_result = translation_manager.translate(ocr_result.text)
                            if trans_result.translated_text != trans_result.original_text:
                                print(f"   {i+1}. '{ocr_result.text}' -> '{trans_result.translated_text}'")
        
        app.quit()
        
    except Exception as e:
        print(f"❌ Error in pipeline demo: {e}")

def main():
    """Main demo function"""
    print("🌟 Live Screen Translator Demo")
    print("=" * 50)
    
    # Setup logging
    setup_logger(logging.INFO)
    
    # Run demos
    demo_ocr_engine()
    demo_translation_engine()
    demo_window_detection()
    demo_profiles()
    demo_glossary()
    demo_full_pipeline()
    
    print("\\n✅ Demo completed!")
    print("\\nTo run the full application:")
    print("   python main.py")
    print("\\nHotkeys when running:")
    print("   Ctrl+Shift+T - Toggle translation")
    print("   Ctrl+Shift+R - Select region")
    print("   Ctrl+Shift+W - Target window")
    print("   Ctrl+Shift+O - Toggle overlay")

if __name__ == '__main__':
    main()