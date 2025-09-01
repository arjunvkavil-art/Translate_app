#!/usr/bin/env python3
"""
Live Screen Translator Launcher

Easy-to-use launcher with built-in setup and troubleshooting
"""

import sys
import os
import subprocess
import platform

def print_header():
    """Print application header"""
    print("""
🌟 Live Screen Translator 🌟
═══════════════════════════════════════════════════════════════
🎯 Real-time translation for Chinese industrial software
🧩 Supports: Inovance IRCB500, Siemens STEP 7, Mitsubishi GX
🔧 Advanced OCR + Translation + Industrial Glossary
═══════════════════════════════════════════════════════════════
""")

def check_environment():
    """Check if environment is ready"""
    print("🔍 Checking environment...")
    
    issues = []
    
    # Check Python version
    if sys.version_info < (3, 7):
        issues.append(f"Python 3.7+ required (found {sys.version_info.major}.{sys.version_info.minor})")
    
    # Check if virtual environment is recommended
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment recommended but not detected")
    
    # Check critical files
    critical_files = ['main.py', 'config.yaml', 'requirements.txt']
    for file in critical_files:
        if not os.path.exists(file):
            issues.append(f"Missing file: {file}")
    
    if issues:
        print("❌ Environment issues found:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    
    print("✅ Environment looks good")
    return True

def quick_install():
    """Quick installation of dependencies"""
    print("\\n🚀 Quick Installation")
    print("-" * 30)
    
    response = input("Install dependencies now? (y/n): ").lower()
    if response != 'y':
        return False
    
    try:
        # Install Python dependencies
        print("📦 Installing Python packages...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True)
        
        print("✅ Python packages installed")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Installation failed: {e}")
        return False

def show_menu():
    """Show main menu"""
    print("\\n📋 What would you like to do?")
    print("   1. 🚀 Start Live Screen Translator")
    print("   2. 🎮 Run Demo & Tests")
    print("   3. 🔧 Install Dependencies")
    print("   4. 🧪 Basic Tests Only")
    print("   5. 📖 Show Usage Examples")
    print("   6. ❌ Exit")
    
    return input("\\nEnter choice (1-6): ").strip()

def show_usage_examples():
    """Show usage examples"""
    print("""
📖 Usage Examples
═════════════════

🎯 Target Inovance IRCB500:
   1. Launch IRCB500 software
   2. Start Live Screen Translator
   3. Press Ctrl+Shift+W to target window
   4. Press Ctrl+Shift+T to start translation

📸 Monitor Specific Region:
   1. Press Ctrl+Shift+R to select region
   2. Click and drag to select area
   3. Press Ctrl+Shift+T to start translation

⌨️  Hotkeys:
   Ctrl+Shift+T - Toggle translation
   Ctrl+Shift+R - Select region  
   Ctrl+Shift+W - Target window
   Ctrl+Shift+O - Toggle overlay

🔧 Command Line Options:
   python main.py --mode app     # App targeting mode
   python main.py --mode region  # Region monitoring mode
   python main.py --debug        # Debug mode
   
📝 Configuration:
   Edit config.yaml to customize:
   - OCR settings (engine, confidence)
   - Translation settings (engine, languages)
   - UI settings (opacity, font size)
   - Hotkeys
""")

def run_application(mode="app", debug=False):
    """Run the main application"""
    cmd = [sys.executable, "main.py", "--mode", mode]
    
    if debug:
        cmd.append("--debug")
    
    print(f"\\n🚀 Starting Live Screen Translator in {mode} mode...")
    
    if debug:
        print("🐛 Debug mode enabled")
    
    print("\\n💡 Hotkeys:")
    print("   Ctrl+Shift+T - Toggle translation")
    print("   Ctrl+Shift+R - Select region")
    print("   Ctrl+Shift+W - Target window")
    print("   Ctrl+Shift+O - Toggle overlay")
    print("\\n" + "=" * 50)
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\\n\\n👋 Application stopped by user")
    except Exception as e:
        print(f"\\n❌ Error running application: {e}")

def main():
    """Main launcher function"""
    print_header()
    
    # Check environment
    if not check_environment():
        if input("\\nTry to fix issues automatically? (y/n): ").lower() == 'y':
            if not quick_install():
                print("\\n❌ Unable to fix issues automatically")
                print("   Please resolve the issues manually and try again")
                sys.exit(1)
    
    # Main menu loop
    while True:
        choice = show_menu()
        
        if choice == '1':
            # Ask for mode
            print("\\n🎯 Select Mode:")
            print("   1. App Target (for IRCB500, STEP 7, etc.)")
            print("   2. Region Monitor")
            print("   3. Full Screen")
            
            mode_choice = input("Mode (1-3): ").strip()
            mode_map = {'1': 'app', '2': 'region', '3': 'app'}
            mode = mode_map.get(mode_choice, 'app')
            
            debug = input("Enable debug mode? (y/n): ").lower() == 'y'
            run_application(mode, debug)
            break
            
        elif choice == '2':
            print("\\n🎮 Running demo...")
            os.system(f"{sys.executable} demo.py")
            
        elif choice == '3':
            print("\\n🔧 Installing dependencies...")
            os.system(f"{sys.executable} install.py")
            
        elif choice == '4':
            print("\\n🧪 Running basic tests...")
            os.system(f"{sys.executable} test_basic.py")
            
        elif choice == '5':
            show_usage_examples()
            input("\\nPress Enter to continue...")
            
        elif choice == '6':
            print("\\n👋 Goodbye!")
            break
            
        else:
            print("\\n❌ Invalid choice. Please enter 1-6.")

if __name__ == '__main__':
    main()