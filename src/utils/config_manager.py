"""
Configuration management for Live Screen Translator
"""

import yaml
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages application configuration"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = config_path
        self.config = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from YAML file"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self.config = yaml.safe_load(f)
                logger.info(f"Configuration loaded from {self.config_path}")
            else:
                logger.warning(f"Configuration file {self.config_path} not found, using defaults")
                self.config = self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            self.config = self._get_default_config()
    
    def save_config(self) -> None:
        """Save current configuration to file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                yaml.dump(self.config, f, default_flow_style=False, ensure_ascii=False)
            logger.info(f"Configuration saved to {self.config_path}")
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation (e.g., 'ocr.engine')"""
        keys = key_path.split('.')
        value = self.config
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key_path: str, value: Any) -> None:
        """Set configuration value using dot notation"""
        keys = key_path.split('.')
        config = self.config
        
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        config[keys[-1]] = value
    
    def get_profile(self, profile_name: str) -> Optional[Dict[str, Any]]:
        """Get industrial software profile configuration"""
        profiles = self.get('profiles', {})
        return profiles.get(profile_name)
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration"""
        return {
            'ocr': {
                'engine': 'paddleocr',
                'languages': ['ch', 'en'],
                'confidence_threshold': 0.7,
                'use_gpu': False
            },
            'translation': {
                'primary_engine': 'google',
                'source_lang': 'zh',
                'target_lang': 'en',
                'use_glossary': True,
                'context_aware': True
            },
            'screen': {
                'capture_fps': 2,
                'region_padding': 10,
                'min_text_size': 12
            },
            'ui': {
                'overlay_opacity': 0.9,
                'overlay_background': '#000000',
                'overlay_text_color': '#FFFFFF',
                'overlay_font_size': 12,
                'overlay_timeout': 5000
            },
            'hotkeys': {
                'toggle_translation': 'ctrl+shift+t',
                'capture_region': 'ctrl+shift+r',
                'target_window': 'ctrl+shift+w',
                'toggle_overlay': 'ctrl+shift+o'
            }
        }