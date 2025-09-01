#!/usr/bin/env python3
"""
Live Screen Translator - Main Application Entry Point

A powerful real-time screen translation tool for industrial software interfaces,
specifically designed for Chinese software like Inovance IRCB500.
"""

import sys
import os
import argparse
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer
import logging

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from core.translator_app import LiveScreenTranslator
from utils.logger import setup_logger

def main():
    """Main application entry point"""
    parser = argparse.ArgumentParser(description='Live Screen Translator')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--config', default='config.yaml', help='Configuration file path')
    parser.add_argument('--mode', choices=['app', 'region', 'voice', 'text'], 
                       default='app', help='Translation mode')
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    setup_logger(log_level)
    
    # Create Qt application
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # Keep running in system tray
    
    # Create main translator application
    translator = LiveScreenTranslator(config_path=args.config, mode=args.mode)
    
    # Show main window
    translator.show()
    
    # Start the application
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()