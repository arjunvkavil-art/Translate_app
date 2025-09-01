#!/usr/bin/env python3
"""
Basic functionality test for Live Screen Translator

Tests core components without requiring external dependencies
"""

import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_config_manager():
    """Test configuration management"""
    print("🔧 Testing Configuration Manager...")
    
    try:
        from utils.config_manager import ConfigManager
        
        config_manager = ConfigManager()
        
        # Test getting values
        ocr_engine = config_manager.get('ocr.engine', 'default')
        print(f"   OCR Engine: {ocr_engine}")
        
        # Test setting values
        config_manager.set('test.value', 'test_data')
        retrieved = config_manager.get('test.value')
        
        if retrieved == 'test_data':
            print("   ✅ Configuration management working")
            return True
        else:
            print("   ❌ Configuration management failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_profile_manager():
    """Test profile management"""
    print("\\n📋 Testing Profile Manager...")
    
    try:
        from core.profile_manager import ProfileManager
        
        profile_manager = ProfileManager()
        profiles = profile_manager.get_all_profiles()
        
        print(f"   Loaded {len(profiles)} profiles:")
        for key, profile in profiles.items():
            print(f"     - {profile.name} ({profile.manufacturer})")
        
        # Test profile lookup
        ircb500_profile = profile_manager.get_profile('inovance_ircb500')
        if ircb500_profile:
            print(f"   ✅ IRCB500 profile loaded: {len(ircb500_profile.common_terms)} terms")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_glossary_system():
    """Test glossary system"""
    print("\\n📘 Testing Glossary System...")
    
    try:
        from utils.glossary_loader import GlossaryLoader
        
        loader = GlossaryLoader()
        glossaries = loader.load_all_glossaries()
        
        print(f"   Loaded {len(glossaries)} glossary files:")
        for name, terms in glossaries.items():
            print(f"     - {name}: {len(terms)} terms")
        
        # Test domain-specific glossary
        automation_terms = loader.create_domain_specific_glossary('automation')
        print(f"   ✅ Automation glossary: {len(automation_terms)} terms")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_imports():
    """Test all critical imports"""
    print("\\n📦 Testing Core Imports...")
    
    imports_to_test = [
        ('utils.logger', 'Logger utilities'),
        ('utils.config_manager', 'Configuration manager'),
        ('core.profile_manager', 'Profile manager'),
        ('utils.glossary_loader', 'Glossary loader'),
    ]
    
    success_count = 0
    
    for module_name, description in imports_to_test:
        try:
            __import__(module_name)
            print(f"   ✅ {description}")
            success_count += 1
        except Exception as e:
            print(f"   ❌ {description}: {e}")
    
    print(f"\\n   {success_count}/{len(imports_to_test)} core modules imported successfully")
    return success_count == len(imports_to_test)

def main():
    """Main test function"""
    print("🧪 Live Screen Translator - Basic Tests")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test imports
    if not test_imports():
        all_tests_passed = False
    
    # Test configuration
    if not test_config_manager():
        all_tests_passed = False
    
    # Test profiles
    if not test_profile_manager():
        all_tests_passed = False
    
    # Test glossary
    if not test_glossary_system():
        all_tests_passed = False
    
    print("\\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All basic tests passed!")
        print("\\nNext steps:")
        print("   1. Install OCR dependencies: pip install paddleocr")
        print("   2. Test with demo: python demo.py")
        print("   3. Run full app: python main.py")
    else:
        print("❌ Some tests failed")
        print("   Check error messages above and resolve issues")
        print("   You may need to install missing dependencies")

if __name__ == '__main__':
    main()