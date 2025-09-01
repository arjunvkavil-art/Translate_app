"""
Hotkey Manager for Live Screen Translator

Handles global hotkey registration and management
"""

import logging
import keyboard
import threading
from typing import Dict, Any, Callable, Optional

logger = logging.getLogger(__name__)

class HotkeyManager:
    """Manages global hotkeys for the application"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.hotkey_config = config.get('hotkeys', {})
        self.registered_hotkeys = {}
        self.active = True
        
        # Start hotkey listener thread
        self.listener_thread = threading.Thread(target=self._start_listener, daemon=True)
        self.listener_thread.start()
        
        logger.info("Hotkey manager initialized")
    
    def _start_listener(self):
        """Start keyboard listener in separate thread"""
        try:
            # Keep the listener running
            while self.active:
                keyboard.wait()  # This blocks until a hotkey is pressed
        except Exception as e:
            logger.error(f"Error in hotkey listener: {e}")
    
    def register_hotkey(self, hotkey_combination: str, callback: Callable):
        """Register a global hotkey"""
        try:
            # Remove existing hotkey if it exists
            if hotkey_combination in self.registered_hotkeys:
                self.unregister_hotkey(hotkey_combination)
            
            # Register new hotkey
            keyboard.add_hotkey(hotkey_combination, callback)
            self.registered_hotkeys[hotkey_combination] = callback
            
            logger.info(f"Registered hotkey: {hotkey_combination}")
            
        except Exception as e:
            logger.error(f"Error registering hotkey '{hotkey_combination}': {e}")
    
    def unregister_hotkey(self, hotkey_combination: str):
        """Unregister a hotkey"""
        try:
            if hotkey_combination in self.registered_hotkeys:
                keyboard.remove_hotkey(hotkey_combination)
                del self.registered_hotkeys[hotkey_combination]
                logger.info(f"Unregistered hotkey: {hotkey_combination}")
        except Exception as e:
            logger.error(f"Error unregistering hotkey '{hotkey_combination}': {e}")
    
    def unregister_all(self):
        """Unregister all hotkeys"""
        for hotkey in list(self.registered_hotkeys.keys()):
            self.unregister_hotkey(hotkey)
    
    def cleanup(self):
        """Cleanup hotkey manager"""
        self.active = False
        self.unregister_all()
        
        try:
            keyboard.unhook_all()
        except Exception as e:
            logger.error(f"Error during hotkey cleanup: {e}")
        
        logger.info("Hotkey manager cleaned up")
    
    def is_hotkey_available(self, hotkey_combination: str) -> bool:
        """Check if a hotkey combination is available"""
        try:
            # This is a simplified check - in practice you'd want more sophisticated validation
            return hotkey_combination not in self.registered_hotkeys
        except:
            return False
    
    def get_registered_hotkeys(self) -> Dict[str, str]:
        """Get list of currently registered hotkeys"""
        return {
            hotkey: callback.__name__ if hasattr(callback, '__name__') else str(callback)
            for hotkey, callback in self.registered_hotkeys.items()
        }