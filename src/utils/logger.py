"""
Logging utilities for Live Screen Translator
"""

import logging
import os
from datetime import datetime

def setup_logger(level=logging.INFO):
    """Setup application logging"""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Create log filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"translator_{timestamp}.log")
    
    # Configure logging
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger('LiveScreenTranslator')
    logger.info(f"Logging initialized. Log file: {log_file}")
    
    return logger