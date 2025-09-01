"""
OCR Engine for Live Screen Translator

Supports multiple OCR backends with focus on Chinese text recognition
"""

import cv2
import numpy as np
from PIL import Image
import logging
from typing import List, Tuple, Dict, Any, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class OCRResult:
    """Container for OCR detection results"""
    
    def __init__(self, text: str, bbox: Tuple[int, int, int, int], confidence: float):
        self.text = text.strip()
        self.bbox = bbox  # (x, y, width, height)
        self.confidence = confidence
        
    def __repr__(self):
        return f"OCRResult(text='{self.text}', bbox={self.bbox}, confidence={self.confidence:.2f})"

class OCREngine(ABC):
    """Abstract base class for OCR engines"""
    
    @abstractmethod
    def detect_text(self, image: np.ndarray) -> List[OCRResult]:
        """Detect text in image and return results"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if OCR engine is available"""
        pass

class PaddleOCREngine(OCREngine):
    """PaddleOCR implementation - excellent for Chinese text"""
    
    def __init__(self, languages: List[str] = ['ch', 'en'], use_gpu: bool = False, 
                 confidence_threshold: float = 0.7):
        self.languages = languages
        self.use_gpu = use_gpu
        self.confidence_threshold = confidence_threshold
        self.ocr = None
        self._initialize()
    
    def _initialize(self):
        """Initialize PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            
            # Determine language for PaddleOCR
            lang = 'ch' if 'ch' in self.languages else 'en'
            
            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang=lang,
                use_gpu=self.use_gpu,
                show_log=False
            )
            logger.info(f"PaddleOCR initialized with language: {lang}")
            
        except ImportError:
            logger.error("PaddleOCR not available. Install with: pip install paddleocr")
            self.ocr = None
        except Exception as e:
            logger.error(f"Error initializing PaddleOCR: {e}")
            self.ocr = None
    
    def is_available(self) -> bool:
        """Check if PaddleOCR is available"""
        return self.ocr is not None
    
    def detect_text(self, image: np.ndarray) -> List[OCRResult]:
        """Detect text using PaddleOCR"""
        if not self.is_available():
            return []
        
        try:
            # Convert BGR to RGB if needed
            if len(image.shape) == 3 and image.shape[2] == 3:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                image_rgb = image
            
            # Run OCR
            results = self.ocr.ocr(image_rgb, cls=True)
            
            ocr_results = []
            if results and results[0]:
                for line in results[0]:
                    if line:
                        bbox_points = line[0]  # 4 corner points
                        text_info = line[1]
                        
                        text = text_info[0]
                        confidence = text_info[1]
                        
                        if confidence >= self.confidence_threshold and text.strip():
                            # Convert bbox points to rectangle
                            x_coords = [point[0] for point in bbox_points]
                            y_coords = [point[1] for point in bbox_points]
                            
                            x = int(min(x_coords))
                            y = int(min(y_coords))
                            width = int(max(x_coords) - x)
                            height = int(max(y_coords) - y)
                            
                            bbox = (x, y, width, height)
                            ocr_results.append(OCRResult(text, bbox, confidence))
            
            logger.debug(f"PaddleOCR detected {len(ocr_results)} text regions")
            return ocr_results
            
        except Exception as e:
            logger.error(f"Error in PaddleOCR detection: {e}")
            return []

class TesseractOCREngine(OCREngine):
    """Tesseract OCR implementation - fallback option"""
    
    def __init__(self, languages: List[str] = ['chi_sim', 'eng'], 
                 confidence_threshold: float = 0.7):
        self.languages = languages
        self.confidence_threshold = confidence_threshold
        self._initialize()
    
    def _initialize(self):
        """Initialize Tesseract"""
        try:
            import pytesseract
            # Test if tesseract is available
            pytesseract.get_tesseract_version()
            self.available = True
            logger.info("Tesseract OCR initialized")
        except Exception as e:
            logger.error(f"Tesseract not available: {e}")
            self.available = False
    
    def is_available(self) -> bool:
        """Check if Tesseract is available"""
        return self.available
    
    def detect_text(self, image: np.ndarray) -> List[OCRResult]:
        """Detect text using Tesseract"""
        if not self.is_available():
            return []
        
        try:
            import pytesseract
            
            # Convert to PIL Image
            if len(image.shape) == 3:
                image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                image_pil = Image.fromarray(image)
            
            # Configure language
            lang = '+'.join(self.languages)
            
            # Get detailed data with bounding boxes
            data = pytesseract.image_to_data(
                image_pil, 
                lang=lang, 
                output_type=pytesseract.Output.DICT
            )
            
            ocr_results = []
            n_boxes = len(data['text'])
            
            for i in range(n_boxes):
                text = data['text'][i].strip()
                confidence = float(data['conf'][i]) / 100.0  # Convert to 0-1 range
                
                if confidence >= self.confidence_threshold and text:
                    x = data['left'][i]
                    y = data['top'][i]
                    width = data['width'][i]
                    height = data['height'][i]
                    
                    bbox = (x, y, width, height)
                    ocr_results.append(OCRResult(text, bbox, confidence))
            
            logger.debug(f"Tesseract detected {len(ocr_results)} text regions")
            return ocr_results
            
        except Exception as e:
            logger.error(f"Error in Tesseract detection: {e}")
            return []

class OCRManager:
    """Manages multiple OCR engines with fallback support"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.engines = {}
        self.primary_engine = None
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize available OCR engines"""
        ocr_config = self.config.get('ocr', {})
        
        # Initialize PaddleOCR
        paddle_engine = PaddleOCREngine(
            languages=ocr_config.get('languages', ['ch', 'en']),
            use_gpu=ocr_config.get('use_gpu', False),
            confidence_threshold=ocr_config.get('confidence_threshold', 0.7)
        )
        
        if paddle_engine.is_available():
            self.engines['paddleocr'] = paddle_engine
            logger.info("PaddleOCR engine available")
        
        # Initialize Tesseract
        tesseract_engine = TesseractOCREngine(
            languages=['chi_sim', 'eng'],
            confidence_threshold=ocr_config.get('confidence_threshold', 0.7)
        )
        
        if tesseract_engine.is_available():
            self.engines['tesseract'] = tesseract_engine
            logger.info("Tesseract engine available")
        
        # Set primary engine
        preferred_engine = ocr_config.get('engine', 'paddleocr')
        if preferred_engine in self.engines:
            self.primary_engine = self.engines[preferred_engine]
            logger.info(f"Primary OCR engine: {preferred_engine}")
        elif self.engines:
            self.primary_engine = list(self.engines.values())[0]
            logger.info(f"Fallback OCR engine: {list(self.engines.keys())[0]}")
        else:
            logger.error("No OCR engines available!")
    
    def detect_text(self, image: np.ndarray, engine_name: Optional[str] = None) -> List[OCRResult]:
        """Detect text using specified or primary OCR engine"""
        if engine_name and engine_name in self.engines:
            engine = self.engines[engine_name]
        elif self.primary_engine:
            engine = self.primary_engine
        else:
            logger.error("No OCR engine available")
            return []
        
        return engine.detect_text(image)
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        try:
            # Convert to grayscale if needed
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Apply adaptive thresholding for better text contrast
            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Denoise
            denoised = cv2.medianBlur(binary, 3)
            
            # Scale up for better OCR (if image is small)
            height, width = denoised.shape
            if height < 100 or width < 100:
                scale_factor = max(2, 100 // min(height, width))
                new_width = width * scale_factor
                new_height = height * scale_factor
                denoised = cv2.resize(denoised, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            return denoised
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image