"""
Main Live Screen Translator Application

Coordinates all components: OCR, Translation, UI, Screen Capture
"""

import logging
import os
import sys
from typing import Dict, Any, List, Optional
from PyQt5.QtWidgets import QApplication, QMessageBox
from PyQt5.QtCore import QObject, pyqtSignal, QTimer, pyqtSlot

# Import core components
from utils.config_manager import ConfigManager
from ocr.ocr_engine import OCRManager, OCRResult
from translation.translation_engine import TranslationManager, TranslationResult
from core.screen_capture import (ScreenCapture, WindowDetector, RealTimeMonitor, 
                                WindowInfo, ScreenRegion)
from ui.region_selector import RegionSelectorOverlay
from ui.main_window import MainWindow
from ui.overlay import OverlayManager, StatusOverlay
from core.hotkey_manager import HotkeyManager
from core.profile_manager import ProfileManager

logger = logging.getLogger(__name__)

class LiveScreenTranslator(QObject):
    """Main application coordinator"""
    
    # Signals
    translation_completed = pyqtSignal(list, list)  # OCR results, Translation results
    
    def __init__(self, config_path: str = "config.yaml", mode: str = "app"):
        super().__init__()
        
        # Load configuration
        self.config_manager = ConfigManager(config_path)
        self.config = self.config_manager.config
        
        # Initialize core components
        self.ocr_manager = OCRManager(self.config)
        self.translation_manager = TranslationManager(self.config)
        self.screen_capture = ScreenCapture(self.config)
        self.window_detector = WindowDetector()
        
        # Initialize UI components
        self.main_window = MainWindow(self.config)
        self.overlay_manager = OverlayManager(self.config)
        self.status_overlay = StatusOverlay(self.config)
        
        # Initialize monitoring
        self.monitor = RealTimeMonitor(
            config=self.config,
            ocr_callback=self._process_ocr,
            translation_callback=self._process_translations
        )
        
        # Initialize hotkey manager
        self.hotkey_manager = HotkeyManager(self.config)
        
        # Initialize profile manager
        self.profile_manager = ProfileManager()
        
        # Application state
        self.current_mode = mode
        self.target_window = None
        self.monitor_regions = []
        self.translation_active = False
        
        # Statistics
        self.stats = {
            'texts_detected': 0,
            'texts_translated': 0,
            'sessions_count': 0
        }
        
        self._connect_signals()
        self._setup_hotkeys()
        
        logger.info("Live Screen Translator initialized")
    
    def _connect_signals(self):
        """Connect signals between components"""
        
        # Main window signals
        self.main_window.start_translation.connect(self.start_translation)
        self.main_window.stop_translation.connect(self.stop_translation)
        self.main_window.target_window_changed.connect(self.set_target_window)
        self.main_window.region_changed.connect(self.add_monitor_region)
        self.main_window.settings_changed.connect(self.update_settings)
        
        # Overlay signals
        self.overlay_manager.region_selected.connect(self._on_region_selected)
        
        # Translation completion signal
        self.translation_completed.connect(self._on_translation_completed)
    
    def _setup_hotkeys(self):
        """Setup global hotkeys"""
        hotkey_config = self.config.get('hotkeys', {})
        
        # Register hotkeys
        self.hotkey_manager.register_hotkey(
            hotkey_config.get('toggle_translation', 'ctrl+shift+t'),
            self.toggle_translation
        )
        
        self.hotkey_manager.register_hotkey(
            hotkey_config.get('capture_region', 'ctrl+shift+r'),
            self.start_region_selection
        )
        
        self.hotkey_manager.register_hotkey(
            hotkey_config.get('target_window', 'ctrl+shift+w'),
            self.show_window_selector
        )
        
        self.hotkey_manager.register_hotkey(
            hotkey_config.get('toggle_overlay', 'ctrl+shift+o'),
            self.toggle_overlay
        )
        
        logger.info("Hotkeys registered")
    
    def show(self):
        """Show main window"""
        self.main_window.show()
        self.main_window.raise_()
        self.main_window.activateWindow()
    
    def start_translation(self):
        """Start live translation"""
        if self.translation_active:
            logger.warning("Translation already active")
            return
        
        if not self.ocr_manager.primary_engine:
            self._show_error("No OCR engine available. Please check installation.")
            return
        
        if not self.translation_manager.primary_engine:
            self._show_error("No translation engine available. Please check internet connection.")
            return
        
        # Start monitoring based on current mode
        if self.current_mode == "app" and self.target_window:
            self.monitor.start_monitoring(target_window=self.target_window)
        elif self.current_mode == "region" and self.monitor_regions:
            self.monitor.start_monitoring(regions=self.monitor_regions)
        else:
            self.monitor.start_monitoring()  # Full screen mode
        
        self.translation_active = True
        self.stats['sessions_count'] += 1
        
        self.status_overlay.show_status("🌐 Live Translation Active", 0)  # Persistent
        logger.info(f"Translation started in {self.current_mode} mode")
    
    def stop_translation(self):
        """Stop live translation"""
        if not self.translation_active:
            return
        
        self.monitor.stop_monitoring()
        self.overlay_manager.clear_tooltips()
        self.status_overlay.hide()
        
        self.translation_active = False
        logger.info("Translation stopped")
    
    def toggle_translation(self):
        """Toggle translation on/off"""
        if self.translation_active:
            self.stop_translation()
        else:
            self.start_translation()
    
    def set_target_window(self, window_info: WindowInfo):
        """Set target window for app mode"""
        self.target_window = window_info
        self.current_mode = "app"
        logger.info(f"Target window set: {window_info.title}")
    
    def add_monitor_region(self, region: ScreenRegion):
        """Add region for monitoring"""
        self.monitor_regions.append(region)
        self.current_mode = "region"
        logger.info(f"Monitor region added: {region.name}")
    
    def start_region_selection(self):
        """Start interactive region selection"""
        self.overlay_manager.start_region_selection()
    
    def show_window_selector(self):
        """Show window selector for targeting"""
        target_windows = self.window_detector.find_target_windows()
        
        if target_windows:
            # For now, automatically select the first target window
            self.set_target_window(target_windows[0])
            self.status_overlay.show_status(f"🎯 Targeting: {target_windows[0].title}")
        else:
            self.status_overlay.show_status("❌ No target windows found")
    
    def toggle_overlay(self):
        """Toggle overlay visibility"""
        if self.overlay_manager.isVisible():
            self.overlay_manager.hide()
        else:
            self.overlay_manager.show()
    
    def update_settings(self, new_settings: Dict[str, Any]):
        """Update application settings"""
        # Update configuration
        for key, value in new_settings.items():
            self.config_manager.set(key, value)
        
        self.config_manager.save_config()
        logger.info("Settings updated")
    
    @pyqtSlot(tuple)
    def _on_region_selected(self, region_coords: Tuple[int, int, int, int]):
        """Handle region selection from overlay"""
        x, y, width, height = region_coords
        region = ScreenRegion(x=x, y=y, width=width, height=height, name=f"Region_{len(self.monitor_regions)+1}")
        self.add_monitor_region(region)
        
        self.status_overlay.show_status(f"📍 Region selected: {width}x{height}")
    
    def _process_ocr(self, image) -> List[OCRResult]:
        """Process image with OCR"""
        try:
            # Preprocess image
            processed_image = self.ocr_manager.preprocess_image(image)
            
            # Run OCR
            ocr_results = self.ocr_manager.detect_text(processed_image)
            
            # Filter results
            min_text_size = self.config.get('screen', {}).get('min_text_size', 12)
            filtered_results = [
                result for result in ocr_results 
                if result.bbox[3] >= min_text_size and len(result.text.strip()) > 1
            ]
            
            self.stats['texts_detected'] += len(filtered_results)
            
            if filtered_results:
                logger.debug(f"OCR detected {len(filtered_results)} text regions")
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error in OCR processing: {e}")
            return []
    
    def _process_translations(self, ocr_results: List[OCRResult]):
        """Process OCR results with translation"""
        try:
            if not ocr_results:
                return
            
            # Extract texts for translation
            texts_to_translate = [result.text for result in ocr_results]
            
            # Translate texts
            translation_results = self.translation_manager.translate_batch(texts_to_translate)
            
            # Filter out non-translated results
            valid_translations = []
            valid_ocr = []
            
            for ocr_result, translation_result in zip(ocr_results, translation_results):
                if (translation_result.translated_text != translation_result.original_text and
                    translation_result.confidence > 0.5):
                    valid_translations.append(translation_result)
                    valid_ocr.append(ocr_result)
                    
                    # Add to recent translations
                    self.main_window.add_recent_translation(
                        translation_result.original_text,
                        translation_result.translated_text
                    )
            
            self.stats['texts_translated'] += len(valid_translations)
            
            # Update UI stats
            self.main_window.update_translation_stats(
                self.stats['texts_detected'],
                self.stats['texts_translated']
            )
            
            # Emit signal for UI updates
            self.translation_completed.emit(valid_ocr, valid_translations)
            
            if valid_translations:
                logger.debug(f"Translated {len(valid_translations)} texts")
            
        except Exception as e:
            logger.error(f"Error in translation processing: {e}")
    
    @pyqtSlot(list, list)
    def _on_translation_completed(self, ocr_results: List[OCRResult], 
                                 translation_results: List[TranslationResult]):
        """Handle completed translations"""
        # Show overlays
        self.overlay_manager.show_translations(ocr_results, translation_results)
    
    def capture_and_translate_once(self) -> List[TranslationResult]:
        """Capture screen once and translate (for manual mode)"""
        try:
            # Capture based on current mode
            if self.target_window:
                image = self.screen_capture.capture_window(self.target_window)
            elif self.monitor_regions:
                image = self.screen_capture.capture_region(self.monitor_regions[0])
            else:
                image = self.screen_capture.capture_full_screen()
            
            if image.size == 0:
                return []
            
            # Process with OCR
            ocr_results = self._process_ocr(image)
            
            if not ocr_results:
                return []
            
            # Translate
            texts = [result.text for result in ocr_results]
            translation_results = self.translation_manager.translate_batch(texts)
            
            # Show results
            self._on_translation_completed(ocr_results, translation_results)
            
            return translation_results
            
        except Exception as e:
            logger.error(f"Error in manual capture and translate: {e}")
            return []
    
    def load_industrial_profile(self, profile_name: str):
        """Load predefined industrial software profile"""
        profile = self.config_manager.get_profile(profile_name)
        
        if not profile:
            logger.warning(f"Profile '{profile_name}' not found")
            return
        
        # Apply profile settings
        if 'ocr_settings' in profile:
            ocr_settings = profile['ocr_settings']
            self.config_manager.set('ocr.confidence_threshold', 
                                  ocr_settings.get('confidence_threshold', 0.7))
            self.config_manager.set('ocr.languages', 
                                  ocr_settings.get('languages', ['ch', 'en']))
        
        # Set up window targeting if executable is specified
        if 'executable' in profile:
            target_windows = self.window_detector.find_target_windows([profile['window_title_pattern']])
            if target_windows:
                self.set_target_window(target_windows[0])
        
        # Set up predefined regions
        if 'ui_regions' in profile:
            self.monitor_regions.clear()
            for region_name, coords in profile['ui_regions'].items():
                if len(coords) == 4:
                    region = ScreenRegion(
                        x=coords[0], y=coords[1], 
                        width=coords[2], height=coords[3],
                        name=f"{profile['name']} - {region_name}"
                    )
                    self.monitor_regions.append(region)
        
        logger.info(f"Loaded profile: {profile['name']}")
        self.status_overlay.show_status(f"📋 Profile loaded: {profile['name']}")
    
    def _show_error(self, message: str):
        """Show error message to user"""
        QMessageBox.critical(self.main_window, "Error", message)
        logger.error(message)
    
    def _show_info(self, message: str):
        """Show info message to user"""
        QMessageBox.information(self.main_window, "Information", message)
        logger.info(message)
    
    def shutdown(self):
        """Cleanup and shutdown application"""
        logger.info("Shutting down Live Screen Translator")
        
        # Stop monitoring
        self.stop_translation()
        
        # Cleanup hotkeys
        self.hotkey_manager.cleanup()
        
        # Save configuration
        self.config_manager.save_config()
        
        logger.info("Shutdown complete")