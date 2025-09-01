"""
Screen Capture and Window Management for Live Screen Translator

Handles real-time screen capture, window detection, and app-specific targeting
"""

import cv2
import numpy as np
import pyautogui
import pygetwindow as gw
import psutil
import logging
import time
import threading
from typing import List, Tuple, Optional, Dict, Any, Callable
from dataclasses import dataclass
from PIL import Image, ImageGrab

logger = logging.getLogger(__name__)

@dataclass
class WindowInfo:
    """Information about a detected window"""
    title: str
    executable: str
    pid: int
    bbox: Tuple[int, int, int, int]  # (x, y, width, height)
    hwnd: Optional[int] = None

@dataclass
class ScreenRegion:
    """Represents a screen region for monitoring"""
    x: int
    y: int
    width: int
    height: int
    name: str = ""
    
    @property
    def bbox(self) -> Tuple[int, int, int, int]:
        return (self.x, self.y, self.width, self.height)

class WindowDetector:
    """Detects and manages application windows"""
    
    def __init__(self):
        self.target_executables = [
            'ircb500.exe',
            's7prjmgr.exe',  # Siemens STEP 7
            'gppw.exe',      # Mitsubishi GX Developer
            'deltascreen.exe', # Delta Screen Editor
            'studio5000.exe'   # Rockwell Studio 5000
        ]
    
    def get_all_windows(self) -> List[WindowInfo]:
        """Get information about all visible windows"""
        windows = []
        
        try:
            # Get all visible windows
            all_windows = gw.getAllWindows()
            
            for window in all_windows:
                if window.title and window.visible and window.width > 100 and window.height > 100:
                    # Try to get process info
                    executable = self._get_window_executable(window)
                    pid = self._get_window_pid(window)
                    
                    window_info = WindowInfo(
                        title=window.title,
                        executable=executable,
                        pid=pid,
                        bbox=(window.left, window.top, window.width, window.height)
                    )
                    
                    windows.append(window_info)
                    
        except Exception as e:
            logger.error(f"Error getting windows: {e}")
        
        return windows
    
    def find_target_windows(self, patterns: List[str] = None) -> List[WindowInfo]:
        """Find windows matching target patterns (for industrial software)"""
        if patterns is None:
            patterns = ['*IRCB500*', '*STEP*', '*GX Developer*', '*Delta*']
        
        all_windows = self.get_all_windows()
        target_windows = []
        
        for window in all_windows:
            # Check executable name
            if any(exe.lower() in window.executable.lower() for exe in self.target_executables):
                target_windows.append(window)
                continue
            
            # Check window title patterns
            for pattern in patterns:
                pattern_clean = pattern.replace('*', '')
                if pattern_clean.lower() in window.title.lower():
                    target_windows.append(window)
                    break
        
        logger.info(f"Found {len(target_windows)} target windows")
        return target_windows
    
    def _get_window_executable(self, window) -> str:
        """Get executable name for a window"""
        try:
            # This is a simplified approach - in practice, you'd use platform-specific APIs
            return "unknown.exe"
        except:
            return "unknown.exe"
    
    def _get_window_pid(self, window) -> int:
        """Get process ID for a window"""
        try:
            # This would require platform-specific implementation
            return 0
        except:
            return 0

class ScreenCapture:
    """Handles screen capture operations"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.screen_config = config.get('screen', {})
        
        # Disable pyautogui failsafe for automated capture
        pyautogui.FAILSAFE = False
    
    def capture_full_screen(self) -> np.ndarray:
        """Capture the entire screen"""
        try:
            screenshot = pyautogui.screenshot()
            # Convert PIL to OpenCV format
            image = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            return image
        except Exception as e:
            logger.error(f"Error capturing full screen: {e}")
            return np.array([])
    
    def capture_window(self, window_info: WindowInfo) -> np.ndarray:
        """Capture a specific window"""
        try:
            x, y, width, height = window_info.bbox
            
            # Capture the window region
            screenshot = pyautogui.screenshot(region=(x, y, width, height))
            image = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            
            return image
        except Exception as e:
            logger.error(f"Error capturing window '{window_info.title}': {e}")
            return np.array([])
    
    def capture_region(self, region: ScreenRegion) -> np.ndarray:
        """Capture a specific screen region"""
        try:
            screenshot = pyautogui.screenshot(region=region.bbox)
            image = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            return image
        except Exception as e:
            logger.error(f"Error capturing region {region.name}: {e}")
            return np.array([])
    
    def get_screen_dimensions(self) -> Tuple[int, int]:
        """Get screen dimensions"""
        try:
            size = pyautogui.size()
            return size.width, size.height
        except Exception as e:
            logger.error(f"Error getting screen dimensions: {e}")
            return (1920, 1080)  # Default fallback

class RealTimeMonitor:
    """Real-time screen monitoring for continuous translation"""
    
    def __init__(self, config: Dict[str, Any], 
                 ocr_callback: Callable[[np.ndarray], Any],
                 translation_callback: Callable[[List], Any]):
        self.config = config
        self.ocr_callback = ocr_callback
        self.translation_callback = translation_callback
        
        self.screen_capture = ScreenCapture(config)
        self.window_detector = WindowDetector()
        
        self.is_monitoring = False
        self.monitor_thread = None
        self.target_window = None
        self.monitor_regions = []
        
        # Monitoring settings
        self.fps = config.get('screen', {}).get('capture_fps', 2)
        self.frame_interval = 1.0 / self.fps
    
    def start_monitoring(self, target_window: Optional[WindowInfo] = None,
                        regions: List[ScreenRegion] = None):
        """Start real-time monitoring"""
        if self.is_monitoring:
            logger.warning("Monitoring already active")
            return
        
        self.target_window = target_window
        self.monitor_regions = regions or []
        self.is_monitoring = True
        
        # Start monitoring thread
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        logger.info("Real-time monitoring started")
    
    def stop_monitoring(self):
        """Stop real-time monitoring"""
        self.is_monitoring = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2.0)
        
        logger.info("Real-time monitoring stopped")
    
    def add_monitor_region(self, region: ScreenRegion):
        """Add a region to monitor"""
        self.monitor_regions.append(region)
        logger.info(f"Added monitor region: {region.name}")
    
    def remove_monitor_region(self, region_name: str):
        """Remove a monitor region"""
        self.monitor_regions = [r for r in self.monitor_regions if r.name != region_name]
        logger.info(f"Removed monitor region: {region_name}")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        last_capture_time = 0
        previous_hash = None
        
        while self.is_monitoring:
            try:
                current_time = time.time()
                
                # Check if it's time for next capture
                if current_time - last_capture_time < self.frame_interval:
                    time.sleep(0.1)
                    continue
                
                # Capture screen or window
                if self.target_window:
                    image = self.screen_capture.capture_window(self.target_window)
                elif self.monitor_regions:
                    # Capture first region (can be extended for multiple regions)
                    image = self.screen_capture.capture_region(self.monitor_regions[0])
                else:
                    image = self.screen_capture.capture_full_screen()
                
                if image.size == 0:
                    continue
                
                # Check if image changed significantly (to avoid unnecessary processing)
                current_hash = self._calculate_image_hash(image)
                if current_hash == previous_hash:
                    continue
                
                previous_hash = current_hash
                last_capture_time = current_time
                
                # Process with OCR
                if self.ocr_callback:
                    ocr_results = self.ocr_callback(image)
                    
                    # Process with translation
                    if ocr_results and self.translation_callback:
                        self.translation_callback(ocr_results)
                
            except Exception as e:
                logger.error(f"Error in monitor loop: {e}")
                time.sleep(1.0)  # Wait before retrying
    
    def _calculate_image_hash(self, image: np.ndarray) -> int:
        """Calculate simple hash of image for change detection"""
        try:
            # Resize to small size for quick comparison
            small = cv2.resize(image, (32, 32))
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY) if len(small.shape) == 3 else small
            return hash(gray.tobytes())
        except:
            return 0

class RegionSelector:
    """Interactive region selection tool"""
    
    def __init__(self, screen_capture: ScreenCapture):
        self.screen_capture = screen_capture
        self.selection_active = False
        self.selected_region = None
    
    def select_region_interactive(self) -> Optional[ScreenRegion]:
        """Interactive region selection using mouse"""
        try:
            # Take screenshot for selection overlay
            screenshot = self.screen_capture.capture_full_screen()
            
            # This would typically show an overlay for selection
            # For now, return a default region
            screen_width, screen_height = self.screen_capture.get_screen_dimensions()
            
            # Default to center region
            default_region = ScreenRegion(
                x=screen_width // 4,
                y=screen_height // 4,
                width=screen_width // 2,
                height=screen_height // 2,
                name="Selected Region"
            )
            
            logger.info(f"Selected region: {default_region}")
            return default_region
            
        except Exception as e:
            logger.error(f"Error in region selection: {e}")
            return None
    
    def select_region_coordinates(self, x: int, y: int, width: int, height: int, 
                                name: str = "Custom Region") -> ScreenRegion:
        """Create region from coordinates"""
        return ScreenRegion(x=x, y=y, width=width, height=height, name=name)