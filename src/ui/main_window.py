"""
Main Window UI for Live Screen Translator

Provides the main control interface for the application
"""

import logging
from typing import Dict, Any, List, Optional
from PyQt5.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
                             QLabel, QPushButton, QComboBox, QCheckBox, QSpinBox,
                             QTextEdit, QTabWidget, QListWidget, QListWidgetItem,
                             QGroupBox, QGridLayout, QLineEdit, QFileDialog,
                             QSystemTrayIcon, QMenu, QAction, QMessageBox,
                             QSplitter, QFrame)
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, QThread, pyqtSlot
from PyQt5.QtGui import QIcon, QFont, QPixmap

from core.screen_capture import WindowInfo, ScreenRegion

logger = logging.getLogger(__name__)

class MainWindow(QMainWindow):
    """Main application window"""
    
    # Signals
    start_translation = pyqtSignal()
    stop_translation = pyqtSignal()
    target_window_changed = pyqtSignal(object)  # WindowInfo
    region_changed = pyqtSignal(object)  # ScreenRegion
    settings_changed = pyqtSignal(dict)
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__()
        
        self.config = config
        self.is_translating = False
        self.target_window = None
        self.monitor_regions = []
        
        self._setup_ui()
        self._setup_system_tray()
        self._connect_signals()
    
    def _setup_ui(self):
        """Setup main window UI"""
        self.setWindowTitle("Live Screen Translator")
        self.setGeometry(100, 100, 800, 600)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        
        # Create tab widget
        self.tab_widget = QTabWidget()
        main_layout.addWidget(self.tab_widget)
        
        # Create tabs
        self._create_translation_tab()
        self._create_targeting_tab()
        self._create_settings_tab()
        self._create_glossary_tab()
        
        # Status bar
        self.statusBar().showMessage("Ready")
        
        # Apply styling
        self._apply_styling()
    
    def _create_translation_tab(self):
        """Create main translation control tab"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Control buttons
        control_group = QGroupBox("Translation Control")
        control_layout = QHBoxLayout(control_group)
        
        self.start_btn = QPushButton("🚀 Start Translation")
        self.start_btn.setStyleSheet("QPushButton { font-size: 14px; padding: 8px 16px; }")
        self.start_btn.clicked.connect(self._toggle_translation)
        
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["App Target Mode", "Region Mode", "Full Screen Mode"])
        self.mode_combo.currentTextChanged.connect(self._on_mode_changed)
        
        control_layout.addWidget(self.start_btn)
        control_layout.addWidget(QLabel("Mode:"))
        control_layout.addWidget(self.mode_combo)
        control_layout.addStretch()
        
        # Status display
        status_group = QGroupBox("Translation Status")
        status_layout = QVBoxLayout(status_group)
        
        self.status_label = QLabel("Inactive")
        self.status_label.setStyleSheet("QLabel { font-size: 16px; font-weight: bold; }")
        
        self.stats_label = QLabel("Texts detected: 0 | Translated: 0")
        self.stats_label.setStyleSheet("QLabel { color: #666666; }")
        
        status_layout.addWidget(self.status_label)
        status_layout.addWidget(self.stats_label)
        
        # Recent translations
        recent_group = QGroupBox("Recent Translations")
        recent_layout = QVBoxLayout(recent_group)
        
        self.recent_list = QListWidget()
        self.recent_list.setMaximumHeight(200)
        recent_layout.addWidget(self.recent_list)
        
        # Add to main layout
        layout.addWidget(control_group)
        layout.addWidget(status_group)
        layout.addWidget(recent_group)
        layout.addStretch()
        
        self.tab_widget.addTab(tab, "🎯 Translation")
    
    def _create_targeting_tab(self):
        """Create app targeting and region selection tab"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Window targeting
        window_group = QGroupBox("Window Targeting")
        window_layout = QVBoxLayout(window_group)
        
        self.refresh_windows_btn = QPushButton("🔄 Refresh Windows")
        self.refresh_windows_btn.clicked.connect(self._refresh_windows)
        
        self.windows_list = QListWidget()
        self.windows_list.itemClicked.connect(self._on_window_selected)
        
        window_layout.addWidget(self.refresh_windows_btn)
        window_layout.addWidget(self.windows_list)
        
        # Region selection
        region_group = QGroupBox("Region Selection")
        region_layout = QVBoxLayout(region_group)
        
        self.select_region_btn = QPushButton("📸 Select Region")
        self.select_region_btn.clicked.connect(self._select_region)
        
        self.regions_list = QListWidget()
        
        region_layout.addWidget(self.select_region_btn)
        region_layout.addWidget(self.regions_list)
        
        # Split layout
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(window_group)
        splitter.addWidget(region_group)
        splitter.setSizes([400, 400])
        
        layout.addWidget(splitter)
        
        self.tab_widget.addTab(tab, "🎯 Targeting")
    
    def _create_settings_tab(self):
        """Create settings configuration tab"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # OCR Settings
        ocr_group = QGroupBox("OCR Settings")
        ocr_layout = QGridLayout(ocr_group)
        
        ocr_layout.addWidget(QLabel("Engine:"), 0, 0)
        self.ocr_engine_combo = QComboBox()
        self.ocr_engine_combo.addItems(["PaddleOCR", "Tesseract"])
        ocr_layout.addWidget(self.ocr_engine_combo, 0, 1)
        
        ocr_layout.addWidget(QLabel("Confidence:"), 1, 0)
        self.confidence_spin = QSpinBox()
        self.confidence_spin.setRange(50, 100)
        self.confidence_spin.setValue(70)
        self.confidence_spin.setSuffix("%")
        ocr_layout.addWidget(self.confidence_spin, 1, 1)
        
        self.gpu_checkbox = QCheckBox("Use GPU acceleration")
        ocr_layout.addWidget(self.gpu_checkbox, 2, 0, 1, 2)
        
        # Translation Settings
        trans_group = QGroupBox("Translation Settings")
        trans_layout = QGridLayout(trans_group)
        
        trans_layout.addWidget(QLabel("Engine:"), 0, 0)
        self.trans_engine_combo = QComboBox()
        self.trans_engine_combo.addItems(["Google Translate", "OpenAI"])
        trans_layout.addWidget(self.trans_engine_combo, 0, 1)
        
        trans_layout.addWidget(QLabel("Source Language:"), 1, 0)
        self.source_lang_combo = QComboBox()
        self.source_lang_combo.addItems(["Auto", "Chinese", "Japanese", "Korean"])
        trans_layout.addWidget(self.source_lang_combo, 1, 1)
        
        trans_layout.addWidget(QLabel("Target Language:"), 2, 0)
        self.target_lang_combo = QComboBox()
        self.target_lang_combo.addItems(["English", "Chinese", "Japanese", "Spanish", "French"])
        trans_layout.addWidget(self.target_lang_combo, 2, 1)
        
        self.glossary_checkbox = QCheckBox("Use Industrial Glossary")
        self.glossary_checkbox.setChecked(True)
        trans_layout.addWidget(self.glossary_checkbox, 3, 0, 1, 2)
        
        # UI Settings
        ui_group = QGroupBox("Overlay Settings")
        ui_layout = QGridLayout(ui_group)
        
        ui_layout.addWidget(QLabel("Opacity:"), 0, 0)
        self.opacity_spin = QSpinBox()
        self.opacity_spin.setRange(10, 100)
        self.opacity_spin.setValue(90)
        self.opacity_spin.setSuffix("%")
        ui_layout.addWidget(self.opacity_spin, 0, 1)
        
        ui_layout.addWidget(QLabel("Font Size:"), 1, 0)
        self.font_size_spin = QSpinBox()
        self.font_size_spin.setRange(8, 24)
        self.font_size_spin.setValue(12)
        ui_layout.addWidget(self.font_size_spin, 1, 1)
        
        ui_layout.addWidget(QLabel("Timeout:"), 2, 0)
        self.timeout_spin = QSpinBox()
        self.timeout_spin.setRange(1000, 30000)
        self.timeout_spin.setValue(5000)
        self.timeout_spin.setSuffix(" ms")
        ui_layout.addWidget(self.timeout_spin, 2, 1)
        
        # Save settings button
        save_btn = QPushButton("💾 Save Settings")
        save_btn.clicked.connect(self._save_settings)
        
        layout.addWidget(ocr_group)
        layout.addWidget(trans_group)
        layout.addWidget(ui_group)
        layout.addWidget(save_btn)
        layout.addStretch()
        
        self.tab_widget.addTab(tab, "⚙️ Settings")
    
    def _create_glossary_tab(self):
        """Create glossary management tab"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Glossary controls
        controls_layout = QHBoxLayout()
        
        self.load_glossary_btn = QPushButton("📁 Load Glossary")
        self.load_glossary_btn.clicked.connect(self._load_glossary)
        
        self.export_glossary_btn = QPushButton("💾 Export Glossary")
        self.export_glossary_btn.clicked.connect(self._export_glossary)
        
        controls_layout.addWidget(self.load_glossary_btn)
        controls_layout.addWidget(self.export_glossary_btn)
        controls_layout.addStretch()
        
        # Add new term
        add_term_group = QGroupBox("Add New Term")
        add_term_layout = QGridLayout(add_term_group)
        
        add_term_layout.addWidget(QLabel("Chinese:"), 0, 0)
        self.chinese_input = QLineEdit()
        add_term_layout.addWidget(self.chinese_input, 0, 1)
        
        add_term_layout.addWidget(QLabel("English:"), 1, 0)
        self.english_input = QLineEdit()
        add_term_layout.addWidget(self.english_input, 1, 1)
        
        add_term_layout.addWidget(QLabel("Category:"), 2, 0)
        self.category_input = QLineEdit()
        self.category_input.setPlaceholderText("e.g., automation, plc, hmi")
        add_term_layout.addWidget(self.category_input, 2, 1)
        
        self.add_term_btn = QPushButton("➕ Add Term")
        self.add_term_btn.clicked.connect(self._add_term)
        add_term_layout.addWidget(self.add_term_btn, 3, 0, 1, 2)
        
        # Glossary display
        glossary_group = QGroupBox("Current Glossary")
        glossary_layout = QVBoxLayout(glossary_group)
        
        self.glossary_list = QListWidget()
        glossary_layout.addWidget(self.glossary_list)
        
        layout.addLayout(controls_layout)
        layout.addWidget(add_term_group)
        layout.addWidget(glossary_group)
        
        self.tab_widget.addTab(tab, "📘 Glossary")
    
    def _setup_system_tray(self):
        """Setup system tray icon and menu"""
        if not QSystemTrayIcon.isSystemTrayAvailable():
            logger.warning("System tray not available")
            return
        
        self.tray_icon = QSystemTrayIcon(self)
        
        # Create tray menu
        tray_menu = QMenu()
        
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.show)
        tray_menu.addAction(show_action)
        
        start_action = QAction("Start Translation", self)
        start_action.triggered.connect(self._toggle_translation)
        tray_menu.addAction(start_action)
        
        tray_menu.addSeparator()
        
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(QApplication.instance().quit)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        
        # Set icon (you would typically load a proper icon file)
        self.tray_icon.setToolTip("Live Screen Translator")
        self.tray_icon.show()
    
    def _connect_signals(self):
        """Connect internal signals"""
        pass
    
    def _apply_styling(self):
        """Apply modern styling to the UI"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            
            QTabWidget::pane {
                border: 1px solid #555555;
                background-color: #3c3c3c;
            }
            
            QTabBar::tab {
                background-color: #555555;
                color: #ffffff;
                padding: 8px 16px;
                margin-right: 2px;
            }
            
            QTabBar::tab:selected {
                background-color: #0078d4;
            }
            
            QGroupBox {
                font-weight: bold;
                border: 2px solid #555555;
                border-radius: 5px;
                margin-top: 10px;
                padding-top: 10px;
            }
            
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
            
            QPushButton {
                background-color: #0078d4;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: bold;
            }
            
            QPushButton:hover {
                background-color: #106ebe;
            }
            
            QPushButton:pressed {
                background-color: #005a9e;
            }
            
            QPushButton:disabled {
                background-color: #666666;
                color: #999999;
            }
            
            QComboBox, QLineEdit, QSpinBox {
                background-color: #555555;
                color: #ffffff;
                border: 1px solid #777777;
                padding: 4px;
                border-radius: 3px;
            }
            
            QListWidget {
                background-color: #3c3c3c;
                border: 1px solid #555555;
                border-radius: 3px;
            }
            
            QTextEdit {
                background-color: #3c3c3c;
                border: 1px solid #555555;
                border-radius: 3px;
            }
        """)
    
    def _toggle_translation(self):
        """Toggle translation on/off"""
        if self.is_translating:
            self.stop_translation.emit()
            self.start_btn.setText("🚀 Start Translation")
            self.status_label.setText("Inactive")
            self.statusBar().showMessage("Translation stopped")
            self.is_translating = False
        else:
            self.start_translation.emit()
            self.start_btn.setText("⏹️ Stop Translation")
            self.status_label.setText("Active - Monitoring screen...")
            self.statusBar().showMessage("Translation started")
            self.is_translating = True
    
    def _on_mode_changed(self, mode: str):
        """Handle translation mode change"""
        logger.info(f"Translation mode changed to: {mode}")
        
        if mode == "App Target Mode":
            self._refresh_windows()
        elif mode == "Region Mode":
            # Enable region selection
            pass
    
    def _refresh_windows(self):
        """Refresh the list of available windows"""
        # This would be connected to the window detector
        self.windows_list.clear()
        
        # Add placeholder items
        placeholder_windows = [
            "Inovance IRCB500 - Main Window",
            "Siemens STEP 7 - Project Manager",
            "Mitsubishi GX Developer",
            "Chrome - Google Translate"
        ]
        
        for window_title in placeholder_windows:
            item = QListWidgetItem(window_title)
            self.windows_list.addItem(item)
    
    def _on_window_selected(self, item):
        """Handle window selection"""
        window_title = item.text()
        logger.info(f"Selected target window: {window_title}")
        # This would emit the actual WindowInfo object
    
    def _select_region(self):
        """Start region selection process"""
        logger.info("Starting region selection")
        # This would trigger the overlay region selector
    
    def _save_settings(self):
        """Save current settings"""
        # Collect settings from UI
        new_config = {
            'ocr': {
                'engine': 'paddleocr' if self.ocr_engine_combo.currentText() == 'PaddleOCR' else 'tesseract',
                'confidence_threshold': self.confidence_spin.value() / 100.0,
                'use_gpu': self.gpu_checkbox.isChecked()
            },
            'translation': {
                'primary_engine': 'google' if self.trans_engine_combo.currentText() == 'Google Translate' else 'openai',
                'use_glossary': self.glossary_checkbox.isChecked()
            },
            'ui': {
                'overlay_opacity': self.opacity_spin.value() / 100.0,
                'overlay_font_size': self.font_size_spin.value(),
                'overlay_timeout': self.timeout_spin.value()
            }
        }
        
        self.settings_changed.emit(new_config)
        self.statusBar().showMessage("Settings saved", 2000)
    
    def _load_glossary(self):
        """Load custom glossary file"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Load Glossary", "", "JSON Files (*.json);;CSV Files (*.csv)"
        )
        
        if file_path:
            logger.info(f"Loading glossary from: {file_path}")
            # This would trigger the glossary loading
    
    def _export_glossary(self):
        """Export current glossary"""
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Glossary", "industrial_glossary.json", "JSON Files (*.json)"
        )
        
        if file_path:
            logger.info(f"Exporting glossary to: {file_path}")
            # This would trigger the glossary export
    
    def _add_term(self):
        """Add new term to glossary"""
        chinese = self.chinese_input.text().strip()
        english = self.english_input.text().strip()
        category = self.category_input.text().strip() or "custom"
        
        if chinese and english:
            logger.info(f"Adding term: {chinese} -> {english}")
            # This would add to the glossary
            
            # Clear inputs
            self.chinese_input.clear()
            self.english_input.clear()
            self.category_input.clear()
            
            self.statusBar().showMessage(f"Added term: {chinese} -> {english}", 2000)
    
    def update_translation_stats(self, detected: int, translated: int):
        """Update translation statistics"""
        self.stats_label.setText(f"Texts detected: {detected} | Translated: {translated}")
    
    def add_recent_translation(self, original: str, translated: str):
        """Add translation to recent list"""
        item_text = f"{original} → {translated}"
        item = QListWidgetItem(item_text)
        self.recent_list.insertItem(0, item)
        
        # Keep only last 20 items
        while self.recent_list.count() > 20:
            self.recent_list.takeItem(self.recent_list.count() - 1)
    
    def closeEvent(self, event):
        """Handle window close event"""
        if hasattr(self, 'tray_icon') and self.tray_icon.isVisible():
            self.hide()
            event.ignore()
        else:
            event.accept()