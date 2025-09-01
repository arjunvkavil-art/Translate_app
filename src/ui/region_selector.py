"""
Interactive Region Selector

Provides visual region selection tool for screen area monitoring
"""

import logging
from typing import Tuple, Optional, Callable
from PyQt5.QtWidgets import QWidget, QApplication, QLabel, QVBoxLayout
from PyQt5.QtCore import Qt, QRect, QPoint, pyqtSignal
from PyQt5.QtGui import QPainter, QPen, QBrush, QColor, QFont

logger = logging.getLogger(__name__)

class RegionSelectorOverlay(QWidget):
    """Full-screen overlay for interactive region selection"""
    
    # Signals
    region_selected = pyqtSignal(tuple)  # (x, y, width, height)
    selection_cancelled = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        
        self.selection_start = None
        self.selection_current = None
        self.selection_rect = None
        self.is_selecting = False
        
        self._setup_ui()
    
    def _setup_ui(self):
        """Setup the overlay UI"""
        # Make fullscreen transparent overlay
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setGeometry(QApplication.desktop().screenGeometry())
        
        # Set cursor
        self.setCursor(Qt.CrossCursor)
        
        # Instructions label
        self.instructions = QLabel("Click and drag to select region for translation monitoring\\nPress ESC to cancel")
        self.instructions.setStyleSheet("""
            QLabel {
                background-color: rgba(0, 0, 0, 180);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
            }
        """)
        self.instructions.setAlignment(Qt.AlignCenter)
        
        # Position instructions at top center
        screen_geometry = QApplication.desktop().screenGeometry()
        self.instructions.setParent(self)
        self.instructions.adjustSize()
        self.instructions.move(
            (screen_geometry.width() - self.instructions.width()) // 2,
            50
        )
    
    def start_selection(self):
        """Start region selection mode"""
        self.is_selecting = True
        self.selection_start = None
        self.selection_current = None
        self.selection_rect = None
        self.show()
        self.raise_()
        self.activateWindow()
        logger.info("Region selection started")
    
    def stop_selection(self):
        """Stop region selection mode"""
        self.is_selecting = False
        self.hide()
        logger.info("Region selection stopped")
    
    def mousePressEvent(self, event):
        """Handle mouse press to start selection"""
        if event.button() == Qt.LeftButton:
            self.selection_start = event.pos()
            self.selection_current = event.pos()
            logger.debug(f"Selection started at: {self.selection_start}")
    
    def mouseMoveEvent(self, event):
        """Handle mouse move to update selection"""
        if self.selection_start:
            self.selection_current = event.pos()
            self.selection_rect = QRect(self.selection_start, self.selection_current).normalized()
            self.update()  # Trigger repaint
    
    def mouseReleaseEvent(self, event):
        """Handle mouse release to complete selection"""
        if event.button() == Qt.LeftButton and self.selection_rect:
            # Validate selection size
            if self.selection_rect.width() >= 50 and self.selection_rect.height() >= 30:
                region_coords = (
                    self.selection_rect.x(),
                    self.selection_rect.y(),
                    self.selection_rect.width(),
                    self.selection_rect.height()
                )
                
                logger.info(f"Region selected: {region_coords}")
                self.region_selected.emit(region_coords)
                self.stop_selection()
            else:
                logger.warning("Selected region too small, minimum 50x30 pixels required")
                # Reset selection
                self.selection_start = None
                self.selection_current = None
                self.selection_rect = None
                self.update()
    
    def keyPressEvent(self, event):
        """Handle key press events"""
        if event.key() == Qt.Key_Escape:
            logger.info("Region selection cancelled by user")
            self.selection_cancelled.emit()
            self.stop_selection()
        
        super().keyPressEvent(event)
    
    def paintEvent(self, event):
        """Paint the selection rectangle and overlay"""
        painter = QPainter(self)
        
        # Draw semi-transparent overlay
        painter.fillRect(self.rect(), QColor(0, 0, 0, 100))
        
        # Draw selection rectangle if active
        if self.selection_rect:
            # Clear the selected area
            painter.setCompositionMode(QPainter.CompositionMode_Clear)
            painter.fillRect(self.selection_rect, QColor(0, 0, 0, 0))
            
            # Draw selection border
            painter.setCompositionMode(QPainter.CompositionMode_SourceOver)
            pen = QPen(QColor(255, 0, 0), 2, Qt.DashLine)
            painter.setPen(pen)
            painter.drawRect(self.selection_rect)
            
            # Draw selection info
            info_text = f"{self.selection_rect.width()} x {self.selection_rect.height()}"
            painter.setPen(QColor(255, 255, 255))
            painter.setFont(QFont("Arial", 12, QFont.Bold))
            
            # Position info text
            text_x = self.selection_rect.x() + 5
            text_y = self.selection_rect.y() - 10
            
            # Keep text on screen
            if text_y < 20:
                text_y = self.selection_rect.y() + self.selection_rect.height() + 20
            
            painter.drawText(text_x, text_y, info_text)

class QuickRegionSelector:
    """Quick region selection using predefined areas"""
    
    def __init__(self):
        self.predefined_regions = self._get_predefined_regions()
    
    def _get_predefined_regions(self) -> Dict[str, Tuple[int, int, int, int]]:
        """Get predefined screen regions"""
        screen = QApplication.desktop().screenGeometry()
        width = screen.width()
        height = screen.height()
        
        return {
            "Top Left Quarter": (0, 0, width // 2, height // 2),
            "Top Right Quarter": (width // 2, 0, width // 2, height // 2),
            "Bottom Left Quarter": (0, height // 2, width // 2, height // 2),
            "Bottom Right Quarter": (width // 2, height // 2, width // 2, height // 2),
            "Top Half": (0, 0, width, height // 2),
            "Bottom Half": (0, height // 2, width, height // 2),
            "Left Half": (0, 0, width // 2, height),
            "Right Half": (width // 2, 0, width // 2, height),
            "Center": (width // 4, height // 4, width // 2, height // 2),
            "Full Screen": (0, 0, width, height)
        }
    
    def get_region(self, region_name: str) -> Optional[Tuple[int, int, int, int]]:
        """Get predefined region coordinates"""
        return self.predefined_regions.get(region_name)
    
    def get_all_regions(self) -> Dict[str, Tuple[int, int, int, int]]:
        """Get all predefined regions"""
        return self.predefined_regions.copy()

class RegionManager:
    """Manages multiple screen regions for monitoring"""
    
    def __init__(self):
        self.regions = {}
        self.active_regions = set()
    
    def add_region(self, name: str, x: int, y: int, width: int, height: int):
        """Add a new region"""
        self.regions[name] = (x, y, width, height)
        logger.info(f"Added region '{name}': ({x}, {y}, {width}, {height})")
    
    def remove_region(self, name: str):
        """Remove a region"""
        if name in self.regions:
            del self.regions[name]
            self.active_regions.discard(name)
            logger.info(f"Removed region: {name}")
    
    def activate_region(self, name: str):
        """Activate a region for monitoring"""
        if name in self.regions:
            self.active_regions.add(name)
            logger.info(f"Activated region: {name}")
    
    def deactivate_region(self, name: str):
        """Deactivate a region"""
        self.active_regions.discard(name)
        logger.info(f"Deactivated region: {name}")
    
    def get_active_regions(self) -> Dict[str, Tuple[int, int, int, int]]:
        """Get all active regions"""
        return {name: coords for name, coords in self.regions.items() 
                if name in self.active_regions}
    
    def get_all_regions(self) -> Dict[str, Tuple[int, int, int, int]]:
        """Get all regions"""
        return self.regions.copy()
    
    def clear_all_regions(self):
        """Clear all regions"""
        self.regions.clear()
        self.active_regions.clear()
        logger.info("All regions cleared")
    
    def save_regions_to_file(self, file_path: str):
        """Save regions configuration to file"""
        try:
            import json
            
            data = {
                'regions': self.regions,
                'active_regions': list(self.active_regions)
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Regions saved to: {file_path}")
            
        except Exception as e:
            logger.error(f"Error saving regions: {e}")
    
    def load_regions_from_file(self, file_path: str):
        """Load regions configuration from file"""
        try:
            import json
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.regions = data.get('regions', {})
            self.active_regions = set(data.get('active_regions', []))
            
            logger.info(f"Regions loaded from: {file_path}")
            
        except Exception as e:
            logger.error(f"Error loading regions: {e}")