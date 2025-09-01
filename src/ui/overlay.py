"""
Overlay UI for Live Screen Translator

Provides floating translation overlays and tooltips
"""

import sys
import logging
from typing import List, Dict, Any, Tuple, Optional
from PyQt5.QtWidgets import (QWidget, QLabel, QVBoxLayout, QHBoxLayout, 
                             QApplication, QFrame, QTextEdit, QPushButton)
from PyQt5.QtCore import Qt, QTimer, QPoint, QRect, pyqtSignal
from PyQt5.QtGui import QFont, QPalette, QColor, QPainter, QBrush

from ocr.ocr_engine import OCRResult
from translation.translation_engine import TranslationResult

logger = logging.getLogger(__name__)

class TranslationTooltip(QWidget):
    """Individual translation tooltip widget"""
    
    def __init__(self, original_text: str, translated_text: str, 
                 position: Tuple[int, int], config: Dict[str, Any]):
        super().__init__()
        
        self.original_text = original_text
        self.translated_text = translated_text
        self.config = config.get('ui', {})
        
        self._setup_ui()
        self._position_tooltip(position)
        
        # Auto-hide timer
        timeout = self.config.get('overlay_timeout', 5000)
        self.hide_timer = QTimer()
        self.hide_timer.timeout.connect(self.hide)
        self.hide_timer.start(timeout)
    
    def _setup_ui(self):
        """Setup tooltip UI"""
        self.setWindowFlags(Qt.ToolTip | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Main layout
        layout = QVBoxLayout()
        layout.setContentsMargins(8, 6, 8, 6)
        layout.setSpacing(2)
        
        # Original text (smaller, dimmed)
        self.original_label = QLabel(self.original_text)
        self.original_label.setWordWrap(True)
        self.original_label.setStyleSheet(f"""
            QLabel {{
                color: #CCCCCC;
                font-size: {self.config.get('overlay_font_size', 12) - 2}px;
                font-weight: normal;
            }}
        """)
        
        # Translated text (main)
        self.translated_label = QLabel(self.translated_text)
        self.translated_label.setWordWrap(True)
        self.translated_label.setStyleSheet(f"""
            QLabel {{
                color: {self.config.get('overlay_text_color', '#FFFFFF')};
                font-size: {self.config.get('overlay_font_size', 12)}px;
                font-weight: bold;
            }}
        """)
        
        layout.addWidget(self.original_label)
        layout.addWidget(self.translated_label)
        
        # Container frame
        frame = QFrame()
        frame.setLayout(layout)
        frame.setStyleSheet(f"""
            QFrame {{
                background-color: {self.config.get('overlay_background', '#000000')};
                border: 1px solid #333333;
                border-radius: 6px;
                padding: 4px;
            }}
        """)
        
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.addWidget(frame)
        self.setLayout(main_layout)
        
        # Set opacity
        opacity = self.config.get('overlay_opacity', 0.9)
        self.setWindowOpacity(opacity)
    
    def _position_tooltip(self, position: Tuple[int, int]):
        """Position tooltip near the original text"""
        x, y = position
        
        # Adjust position to keep tooltip on screen
        screen_geometry = QApplication.desktop().screenGeometry()
        
        # Estimate tooltip size
        self.adjustSize()
        tooltip_width = self.width()
        tooltip_height = self.height()
        
        # Position to the right and slightly below the original text
        new_x = x + 20
        new_y = y + 10
        
        # Keep on screen
        if new_x + tooltip_width > screen_geometry.width():
            new_x = x - tooltip_width - 20
        
        if new_y + tooltip_height > screen_geometry.height():
            new_y = y - tooltip_height - 10
        
        self.move(new_x, new_y)

class OverlayManager(QWidget):
    """Manages multiple translation overlays"""
    
    # Signals
    region_selected = pyqtSignal(tuple)  # (x, y, width, height)
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__()
        
        self.config = config
        self.active_tooltips = []
        self.selection_mode = False
        self.selection_start = None
        self.selection_rect = None
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Setup overlay manager UI"""
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setGeometry(QApplication.desktop().screenGeometry())
    
    def show_translations(self, ocr_results: List[OCRResult], 
                         translation_results: List[TranslationResult]):
        """Display translation overlays for OCR results"""
        # Clear existing tooltips
        self.clear_tooltips()
        
        # Create new tooltips
        for ocr_result, translation_result in zip(ocr_results, translation_results):
            if translation_result.translated_text != translation_result.original_text:
                # Calculate position from OCR bbox
                x, y, width, height = ocr_result.bbox
                position = (x + width // 2, y + height // 2)
                
                tooltip = TranslationTooltip(
                    original_text=ocr_result.text,
                    translated_text=translation_result.translated_text,
                    position=position,
                    config=self.config
                )
                
                tooltip.show()
                self.active_tooltips.append(tooltip)
        
        logger.debug(f"Showing {len(self.active_tooltips)} translation tooltips")
    
    def clear_tooltips(self):
        """Clear all active tooltips"""
        for tooltip in self.active_tooltips:
            tooltip.hide()
            tooltip.deleteLater()
        
        self.active_tooltips.clear()
    
    def start_region_selection(self):
        """Start interactive region selection mode"""
        self.selection_mode = True
        self.show()
        self.setCursor(Qt.CrossCursor)
        logger.info("Region selection mode activated")
    
    def stop_region_selection(self):
        """Stop region selection mode"""
        self.selection_mode = False
        self.hide()
        self.setCursor(Qt.ArrowCursor)
        logger.info("Region selection mode deactivated")
    
    def mousePressEvent(self, event):
        """Handle mouse press for region selection"""
        if self.selection_mode and event.button() == Qt.LeftButton:
            self.selection_start = event.pos()
    
    def mouseMoveEvent(self, event):
        """Handle mouse move for region selection"""
        if self.selection_mode and self.selection_start:
            self.selection_rect = QRect(self.selection_start, event.pos()).normalized()
            self.update()
    
    def mouseReleaseEvent(self, event):
        """Handle mouse release for region selection"""
        if self.selection_mode and event.button() == Qt.LeftButton and self.selection_rect:
            # Emit selected region
            rect = self.selection_rect
            self.region_selected.emit((rect.x(), rect.y(), rect.width(), rect.height()))
            
            # Reset selection
            self.selection_rect = None
            self.selection_start = None
            self.stop_region_selection()
    
    def paintEvent(self, event):
        """Paint selection rectangle"""
        if self.selection_mode and self.selection_rect:
            painter = QPainter(self)
            painter.setPen(Qt.red)
            painter.setBrush(QBrush(QColor(255, 0, 0, 50)))
            painter.drawRect(self.selection_rect)

class StatusOverlay(QWidget):
    """Status overlay showing current translation mode and activity"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__()
        
        self.config = config
        self._setup_ui()
        
        # Auto-hide timer
        self.hide_timer = QTimer()
        self.hide_timer.timeout.connect(self.hide)
    
    def _setup_ui(self):
        """Setup status overlay UI"""
        self.setWindowFlags(Qt.ToolTip | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Main layout
        layout = QHBoxLayout()
        layout.setContentsMargins(12, 8, 12, 8)
        
        # Status text
        self.status_label = QLabel("Live Translation Active")
        self.status_label.setStyleSheet(f"""
            QLabel {{
                color: #00FF00;
                font-size: 14px;
                font-weight: bold;
                background-color: rgba(0, 0, 0, 180);
                padding: 6px 12px;
                border-radius: 4px;
            }}
        """)
        
        layout.addWidget(self.status_label)
        self.setLayout(layout)
        
        # Position at top-right of screen
        screen_geometry = QApplication.desktop().screenGeometry()
        self.move(screen_geometry.width() - 250, 20)
    
    def show_status(self, message: str, duration: int = 3000):
        """Show status message"""
        self.status_label.setText(message)
        self.show()
        
        self.hide_timer.stop()
        self.hide_timer.start(duration)
    
    def update_status(self, message: str):
        """Update status without hiding"""
        self.status_label.setText(message)
        if not self.isVisible():
            self.show()