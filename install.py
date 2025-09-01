#!/usr/bin/env python3
"""
Installation Script for Live Screen Translator

Handles dependency installation and setup
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check Python version compatibility"""
    print("🐍 Checking Python version...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print(f"❌ Python 3.7+ required, found {version.major}.{version.minor}")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} - Compatible")
    return True

def install_system_dependencies():
    """Install system-level dependencies"""
    system = platform.system().lower()
    
    if system == "linux":
        print("\\n🐧 Installing Linux system dependencies...")
        
        # Update package list
        run_command("sudo apt update", "Updating package list")
        
        # Install required packages
        packages = [
            "python3-tk",           # Tkinter
            "python3-dev",          # Python development headers
            "libgl1-mesa-glx",      # OpenGL
            "libglib2.0-0",         # GLib
            "libsm6",               # Session management
            "libxext6",             # X11 extensions
            "libxrender-dev",       # X11 render
            "libfontconfig1-dev",   # Font configuration
            "libgstreamer1.0-dev",  # GStreamer
            "tesseract-ocr",        # Tesseract OCR
            "tesseract-ocr-chi-sim" # Chinese language pack
        ]
        
        for package in packages:
            run_command(f"sudo apt install -y {package}", f"Installing {package}")
    
    elif system == "darwin":  # macOS
        print("\\n🍎 Installing macOS system dependencies...")
        
        # Check if Homebrew is installed
        try:
            subprocess.run(["brew", "--version"], check=True, capture_output=True)
        except:
            print("❌ Homebrew required for macOS installation")
            print("   Install from: https://brew.sh")
            return False
        
        # Install packages
        packages = ["tesseract", "tesseract-lang"]
        for package in packages:
            run_command(f"brew install {package}", f"Installing {package}")
    
    elif system == "windows":
        print("\\n🪟 Windows system setup...")
        print("   Please ensure you have:")
        print("   - Visual C++ Redistributable installed")
        print("   - Tesseract OCR installed (optional)")
        print("   - Windows 10/11 for best compatibility")

def install_python_dependencies():
    """Install Python package dependencies"""
    print("\\n📦 Installing Python dependencies...")
    
    # Upgrade pip first
    run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip")
    
    # Install requirements
    if os.path.exists("requirements.txt"):
        run_command(f"{sys.executable} -m pip install -r requirements.txt", 
                   "Installing requirements")
    else:
        print("❌ requirements.txt not found")
        return False
    
    return True

def setup_directories():
    """Create necessary directories"""
    print("\\n📁 Setting up directories...")
    
    directories = [
        "logs",
        "data/glossaries", 
        "data/profiles",
        "data/cache",
        "data/exports"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"   ✅ {directory}")

def test_installation():
    """Test if installation was successful"""
    print("\\n🧪 Testing installation...")
    
    try:
        # Test core imports
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
        
        from utils.config_manager import ConfigManager
        from ocr.ocr_engine import OCRManager
        from translation.translation_engine import TranslationManager
        
        print("✅ Core modules imported successfully")
        
        # Test configuration
        config_manager = ConfigManager()
        print("✅ Configuration loaded")
        
        # Test OCR
        ocr_manager = OCRManager(config_manager.config)
        if ocr_manager.primary_engine:
            print("✅ OCR engine available")
        else:
            print("⚠️  No OCR engine available - install PaddleOCR for best results")
        
        # Test translation
        translation_manager = TranslationManager(config_manager.config)
        if translation_manager.primary_engine:
            print("✅ Translation engine available")
        else:
            print("⚠️  No translation engine available - check internet connection")
        
        return True
        
    except Exception as e:
        print(f"❌ Installation test failed: {e}")
        return False

def main():
    """Main installation function"""
    print("🌟 Live Screen Translator Installation")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install system dependencies
    install_system_dependencies()
    
    # Install Python dependencies
    if not install_python_dependencies():
        print("❌ Failed to install Python dependencies")
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Test installation
    if test_installation():
        print("\\n🎉 Installation completed successfully!")
        print("\\nNext steps:")
        print("   1. Run: python demo.py (to test components)")
        print("   2. Run: python main.py (to start the application)")
        print("\\n📖 See README.md for detailed usage instructions")
    else:
        print("\\n❌ Installation completed with issues")
        print("   Check the error messages above and resolve any problems")
        print("   You may still be able to run the application with limited functionality")

if __name__ == '__main__':
    main()