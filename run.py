#!/usr/bin/env python3
"""
Quick launcher for Live Screen Translator

Provides easy startup options and environment checking
"""

import sys
import os
import argparse
import logging

def check_dependencies():
    """Check if required dependencies are available"""
    missing_deps = []
    
    try:
        import cv2
    except ImportError:
        missing_deps.append("opencv-python")
    
    try:
        import numpy
    except ImportError:
        missing_deps.append("numpy")
    
    try:
        from PyQt5 import QtWidgets
    except ImportError:
        missing_deps.append("PyQt5")
    
    try:
        import pyautogui
    except ImportError:
        missing_deps.append("pyautogui")
    
    if missing_deps:
        print("❌ Missing required dependencies:")
        for dep in missing_deps:
            print(f"   - {dep}")
        print("\\nRun: pip install -r requirements.txt")
        return False
    
    return True

def main():
    """Main launcher function"""
    parser = argparse.ArgumentParser(description='Live Screen Translator Launcher')
    parser.add_argument('--mode', choices=['app', 'region', 'voice', 'text'], 
                       default='app', help='Translation mode')
    parser.add_argument('--profile', help='Load specific industrial profile')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--demo', action='store_true', help='Run demo instead')
    parser.add_argument('--install', action='store_true', help='Run installation')
    
    args = parser.parse_args()
    
    # Handle special modes
    if args.install:
        print("🔧 Running installation...")
        os.system(f"{sys.executable} install.py")
        return
    
    if args.demo:
        print("🎮 Running demo...")
        os.system(f"{sys.executable} demo.py")
        return
    
    # Check dependencies
    if not check_dependencies():
        print("\\n💡 Tip: Run 'python run.py --install' to install dependencies")
        sys.exit(1)
    
    # Prepare command
    cmd_parts = [sys.executable, "main.py"]
    
    if args.mode:
        cmd_parts.extend(["--mode", args.mode])
    
    if args.debug:
        cmd_parts.append("--debug")
    
    # Add profile if specified
    if args.profile:
        print(f"🎯 Loading profile: {args.profile}")
        # This would be handled by the main app
    
    # Run the application
    cmd = " ".join(cmd_parts)
    print(f"🚀 Starting Live Screen Translator...")
    print(f"   Mode: {args.mode}")
    if args.debug:
        print("   Debug: Enabled")
    
    os.system(cmd)

if __name__ == '__main__':
    main()