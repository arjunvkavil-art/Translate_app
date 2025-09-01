"""
Translation Engine for Live Screen Translator

Supports multiple translation services with industrial terminology glossaries
"""

import logging
import json
import os
import sqlite3
import re
from typing import Dict, List, Optional, Any, Tuple
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class TranslationResult:
    """Container for translation results"""
    
    def __init__(self, original_text: str, translated_text: str, 
                 confidence: float = 1.0, source_lang: str = 'auto',
                 target_lang: str = 'en', glossary_matches: List[str] = None):
        self.original_text = original_text
        self.translated_text = translated_text
        self.confidence = confidence
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.glossary_matches = glossary_matches or []
    
    def __repr__(self):
        return f"TranslationResult('{self.original_text}' -> '{self.translated_text}')"

class TranslationEngine(ABC):
    """Abstract base class for translation engines"""
    
    @abstractmethod
    def translate(self, text: str, source_lang: str = 'auto', 
                 target_lang: str = 'en') -> TranslationResult:
        """Translate text"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if translation engine is available"""
        pass

class GoogleTranslateEngine(TranslationEngine):
    """Google Translate implementation"""
    
    def __init__(self):
        self.translator = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Google Translate"""
        try:
            from googletrans import Translator
            self.translator = Translator()
            logger.info("Google Translate engine initialized")
        except ImportError:
            logger.error("googletrans not available. Install with: pip install googletrans==4.0.0rc1")
        except Exception as e:
            logger.error(f"Error initializing Google Translate: {e}")
    
    def is_available(self) -> bool:
        """Check if Google Translate is available"""
        return self.translator is not None
    
    def translate(self, text: str, source_lang: str = 'auto', 
                 target_lang: str = 'en') -> TranslationResult:
        """Translate text using Google Translate"""
        if not self.is_available():
            return TranslationResult(text, text, 0.0)
        
        try:
            # Handle language codes
            if source_lang == 'zh':
                source_lang = 'zh-cn'
            
            result = self.translator.translate(text, src=source_lang, dest=target_lang)
            
            return TranslationResult(
                original_text=text,
                translated_text=result.text,
                confidence=0.9,  # Google Translate doesn't provide confidence
                source_lang=result.src,
                target_lang=target_lang
            )
            
        except Exception as e:
            logger.error(f"Error in Google Translate: {e}")
            return TranslationResult(text, text, 0.0)

class OpenAITranslationEngine(TranslationEngine):
    """OpenAI GPT-based translation with context awareness"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.client = None
        self._initialize()
    
    def _initialize(self):
        """Initialize OpenAI client"""
        if not self.api_key:
            logger.warning("OpenAI API key not provided")
            return
        
        try:
            import openai
            openai.api_key = self.api_key
            self.client = openai
            logger.info("OpenAI translation engine initialized")
        except ImportError:
            logger.error("openai not available. Install with: pip install openai")
        except Exception as e:
            logger.error(f"Error initializing OpenAI: {e}")
    
    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return self.client is not None and self.api_key is not None
    
    def translate(self, text: str, source_lang: str = 'auto', 
                 target_lang: str = 'en') -> TranslationResult:
        """Translate text using OpenAI with industrial context"""
        if not self.is_available():
            return TranslationResult(text, text, 0.0)
        
        try:
            # Create context-aware prompt for industrial translation
            prompt = f"""
Translate the following text from Chinese to English. This text is from an industrial software interface (like PLC programming software, HMI, or automation tools).

Please provide:
1. Direct translation
2. Brief explanation if it's a technical term

Text to translate: "{text}"

Format your response as:
Translation: [translated text]
Explanation: [brief explanation if technical term, otherwise "N/A"]
"""
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert translator specializing in industrial automation and PLC software terminology."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            translation_match = re.search(r'Translation:\s*(.+?)(?:\n|$)', content)
            translated_text = translation_match.group(1).strip() if translation_match else text
            
            return TranslationResult(
                original_text=text,
                translated_text=translated_text,
                confidence=0.95,
                source_lang='zh',
                target_lang=target_lang
            )
            
        except Exception as e:
            logger.error(f"Error in OpenAI translation: {e}")
            return TranslationResult(text, text, 0.0)

class IndustrialGlossary:
    """Industrial terminology glossary with SQLite backend"""
    
    def __init__(self, db_path: str = "data/glossaries/industrial.db"):
        self.db_path = db_path
        self._initialize_db()
        self._load_default_terms()
    
    def _initialize_db(self):
        """Initialize SQLite database for glossary"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS glossary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chinese TEXT NOT NULL,
                    english TEXT NOT NULL,
                    category TEXT,
                    confidence REAL DEFAULT 1.0,
                    usage_count INTEGER DEFAULT 0,
                    UNIQUE(chinese, english)
                )
            ''')
            
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_chinese ON glossary(chinese)
            ''')
    
    def _load_default_terms(self):
        """Load default industrial terminology"""
        default_terms = [
            # Basic automation terms
            ("启动", "Start", "automation", 1.0),
            ("停止", "Stop", "automation", 1.0),
            ("暂停", "Pause", "automation", 1.0),
            ("复位", "Reset", "automation", 1.0),
            ("报警", "Alarm", "automation", 1.0),
            ("故障", "Fault", "automation", 1.0),
            ("运行", "Run", "automation", 1.0),
            ("手动", "Manual", "automation", 1.0),
            ("自动", "Auto", "automation", 1.0),
            
            # PLC terms
            ("程序", "Program", "plc", 1.0),
            ("下载", "Download", "plc", 1.0),
            ("上传", "Upload", "plc", 1.0),
            ("监控", "Monitor", "plc", 1.0),
            ("调试", "Debug", "plc", 1.0),
            ("仿真", "Simulation", "plc", 1.0),
            
            # Motor/Servo terms
            ("伺服", "Servo", "motor", 1.0),
            ("电机", "Motor", "motor", 1.0),
            ("速度", "Speed", "motor", 1.0),
            ("位置", "Position", "motor", 1.0),
            ("扭矩", "Torque", "motor", 1.0),
            ("编码器", "Encoder", "motor", 1.0),
            
            # HMI terms
            ("界面", "Interface", "hmi", 1.0),
            ("画面", "Screen", "hmi", 1.0),
            ("按钮", "Button", "hmi", 1.0),
            ("指示灯", "Indicator", "hmi", 1.0),
            ("数值", "Value", "hmi", 1.0),
            
            # Common UI terms
            ("确定", "OK", "ui", 1.0),
            ("取消", "Cancel", "ui", 1.0),
            ("设置", "Settings", "ui", 1.0),
            ("配置", "Configuration", "ui", 1.0),
            ("参数", "Parameter", "ui", 1.0),
            ("选项", "Option", "ui", 1.0),
            ("菜单", "Menu", "ui", 1.0),
            ("工具", "Tools", "ui", 1.0),
            ("帮助", "Help", "ui", 1.0),
            ("关于", "About", "ui", 1.0),
        ]
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.executemany('''
                    INSERT OR IGNORE INTO glossary (chinese, english, category, confidence)
                    VALUES (?, ?, ?, ?)
                ''', default_terms)
                
                logger.info(f"Loaded {len(default_terms)} default terms into glossary")
        except Exception as e:
            logger.error(f"Error loading default terms: {e}")
    
    def lookup(self, chinese_text: str) -> List[Tuple[str, str, float]]:
        """Lookup Chinese text in glossary"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute('''
                    SELECT english, category, confidence 
                    FROM glossary 
                    WHERE chinese = ? 
                    ORDER BY confidence DESC, usage_count DESC
                ''', (chinese_text,))
                
                results = cursor.fetchall()
                
                # Update usage count
                if results:
                    conn.execute('''
                        UPDATE glossary 
                        SET usage_count = usage_count + 1 
                        WHERE chinese = ?
                    ''', (chinese_text,))
                
                return [(english, category, confidence) for english, category, confidence in results]
                
        except Exception as e:
            logger.error(f"Error looking up term '{chinese_text}': {e}")
            return []
    
    def add_term(self, chinese: str, english: str, category: str = "custom", 
                confidence: float = 1.0):
        """Add new term to glossary"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO glossary (chinese, english, category, confidence)
                    VALUES (?, ?, ?, ?)
                ''', (chinese, english, category, confidence))
                
                logger.info(f"Added term: {chinese} -> {english}")
        except Exception as e:
            logger.error(f"Error adding term: {e}")

class TranslationManager:
    """Manages translation engines and glossary integration"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.engines = {}
        self.primary_engine = None
        self.glossary = IndustrialGlossary()
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize available translation engines"""
        translation_config = self.config.get('translation', {})
        
        # Initialize Google Translate
        google_engine = GoogleTranslateEngine()
        if google_engine.is_available():
            self.engines['google'] = google_engine
            logger.info("Google Translate engine available")
        
        # Initialize OpenAI (if API key available)
        openai_engine = OpenAITranslationEngine()
        if openai_engine.is_available():
            self.engines['openai'] = openai_engine
            logger.info("OpenAI translation engine available")
        
        # Set primary engine
        preferred_engine = translation_config.get('primary_engine', 'google')
        if preferred_engine in self.engines:
            self.primary_engine = self.engines[preferred_engine]
            logger.info(f"Primary translation engine: {preferred_engine}")
        elif self.engines:
            self.primary_engine = list(self.engines.values())[0]
            logger.info(f"Fallback translation engine: {list(self.engines.keys())[0]}")
        else:
            logger.error("No translation engines available!")
    
    def translate(self, text: str, source_lang: str = 'auto', 
                 target_lang: str = 'en', use_glossary: bool = True) -> TranslationResult:
        """Translate text with glossary enhancement"""
        
        # First check glossary for exact matches
        glossary_matches = []
        enhanced_translation = None
        
        if use_glossary and self.config.get('translation', {}).get('use_glossary', True):
            glossary_results = self.glossary.lookup(text)
            if glossary_results:
                # Use the best glossary match
                best_match = glossary_results[0]
                enhanced_translation = best_match[0]  # English translation
                glossary_matches = [f"{text} -> {best_match[0]} ({best_match[1]})"]
                
                logger.debug(f"Glossary match found: {text} -> {enhanced_translation}")
        
        # If no glossary match, use translation engine
        if not enhanced_translation and self.primary_engine:
            engine_result = self.primary_engine.translate(text, source_lang, target_lang)
            enhanced_translation = engine_result.translated_text
        elif not enhanced_translation:
            enhanced_translation = text  # Fallback to original text
        
        # Apply post-processing for industrial terms
        enhanced_translation = self._post_process_translation(enhanced_translation, text)
        
        return TranslationResult(
            original_text=text,
            translated_text=enhanced_translation,
            confidence=0.95 if glossary_matches else 0.8,
            source_lang=source_lang,
            target_lang=target_lang,
            glossary_matches=glossary_matches
        )
    
    def _post_process_translation(self, translation: str, original: str) -> str:
        """Post-process translation for better industrial context"""
        
        # Common industrial term replacements
        replacements = {
            'Servo motor': 'Servo',
            'Motor drive': 'Drive',
            'Programmable logic controller': 'PLC',
            'Human machine interface': 'HMI',
            'Variable frequency drive': 'VFD',
            'Input/Output': 'I/O',
        }
        
        processed = translation
        for old, new in replacements.items():
            processed = processed.replace(old, new)
        
        return processed
    
    def translate_batch(self, texts: List[str], source_lang: str = 'auto', 
                       target_lang: str = 'en') -> List[TranslationResult]:
        """Translate multiple texts efficiently"""
        results = []
        
        for text in texts:
            if text.strip():
                result = self.translate(text, source_lang, target_lang)
                results.append(result)
        
        return results
    
    def add_custom_term(self, chinese: str, english: str, category: str = "custom"):
        """Add custom term to glossary"""
        self.glossary.add_term(chinese, english, category)
    
    def load_custom_glossary(self, file_path: str):
        """Load custom glossary from JSON or CSV file"""
        try:
            if file_path.endswith('.json'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                for item in data:
                    self.glossary.add_term(
                        item.get('chinese', ''),
                        item.get('english', ''),
                        item.get('category', 'custom'),
                        item.get('confidence', 1.0)
                    )
                    
            elif file_path.endswith('.csv'):
                import pandas as pd
                df = pd.read_csv(file_path)
                
                for _, row in df.iterrows():
                    self.glossary.add_term(
                        row.get('chinese', ''),
                        row.get('english', ''),
                        row.get('category', 'custom'),
                        row.get('confidence', 1.0)
                    )
            
            logger.info(f"Custom glossary loaded from {file_path}")
            
        except Exception as e:
            logger.error(f"Error loading custom glossary: {e}")