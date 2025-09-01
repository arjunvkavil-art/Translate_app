"""
Glossary Loader and Manager

Handles loading and managing industrial terminology glossaries
"""

import json
import csv
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class GlossaryLoader:
    """Loads glossaries from various file formats"""
    
    def __init__(self, glossaries_dir: str = "data/glossaries"):
        self.glossaries_dir = glossaries_dir
        self.loaded_glossaries = {}
    
    def load_json_glossary(self, file_path: str) -> Dict[str, str]:
        """Load glossary from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            glossary = {}
            
            if isinstance(data, list):
                # List format: [{"chinese": "...", "english": "...", ...}, ...]
                for item in data:
                    chinese = item.get('chinese', '').strip()
                    english = item.get('english', '').strip()
                    if chinese and english:
                        glossary[chinese] = english
            
            elif isinstance(data, dict):
                # Direct dictionary format: {"chinese_term": "english_term", ...}
                glossary = {k: v for k, v in data.items() if k.strip() and v.strip()}
            
            logger.info(f"Loaded {len(glossary)} terms from JSON: {file_path}")
            return glossary
            
        except Exception as e:
            logger.error(f"Error loading JSON glossary from {file_path}: {e}")
            return {}
    
    def load_csv_glossary(self, file_path: str) -> Dict[str, str]:
        """Load glossary from CSV file"""
        try:
            glossary = {}
            
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    chinese = row.get('chinese', '').strip()
                    english = row.get('english', '').strip()
                    
                    if chinese and english:
                        glossary[chinese] = english
            
            logger.info(f"Loaded {len(glossary)} terms from CSV: {file_path}")
            return glossary
            
        except Exception as e:
            logger.error(f"Error loading CSV glossary from {file_path}: {e}")
            return {}
    
    def load_all_glossaries(self) -> Dict[str, Dict[str, str]]:
        """Load all glossaries from the glossaries directory"""
        all_glossaries = {}
        
        if not os.path.exists(self.glossaries_dir):
            os.makedirs(self.glossaries_dir, exist_ok=True)
            logger.warning(f"Glossaries directory created: {self.glossaries_dir}")
            return all_glossaries
        
        for filename in os.listdir(self.glossaries_dir):
            file_path = os.path.join(self.glossaries_dir, filename)
            
            if filename.endswith('.json'):
                glossary_name = os.path.splitext(filename)[0]
                glossary = self.load_json_glossary(file_path)
                if glossary:
                    all_glossaries[glossary_name] = glossary
            
            elif filename.endswith('.csv'):
                glossary_name = os.path.splitext(filename)[0]
                glossary = self.load_csv_glossary(file_path)
                if glossary:
                    all_glossaries[glossary_name] = glossary
        
        logger.info(f"Loaded {len(all_glossaries)} glossary files")
        return all_glossaries
    
    def export_glossary_to_json(self, glossary: Dict[str, str], file_path: str):
        """Export glossary to JSON format"""
        try:
            # Convert to list format for better structure
            glossary_list = [
                {
                    "chinese": chinese,
                    "english": english,
                    "category": "exported",
                    "confidence": 1.0
                }
                for chinese, english in glossary.items()
            ]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(glossary_list, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Exported {len(glossary)} terms to: {file_path}")
            
        except Exception as e:
            logger.error(f"Error exporting glossary to JSON: {e}")
    
    def export_glossary_to_csv(self, glossary: Dict[str, str], file_path: str):
        """Export glossary to CSV format"""
        try:
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['chinese', 'english', 'category', 'confidence'])
                
                for chinese, english in glossary.items():
                    writer.writerow([chinese, english, 'exported', 1.0])
            
            logger.info(f"Exported {len(glossary)} terms to: {file_path}")
            
        except Exception as e:
            logger.error(f"Error exporting glossary to CSV: {e}")
    
    def merge_glossaries(self, glossaries: List[Dict[str, str]]) -> Dict[str, str]:
        """Merge multiple glossaries, handling conflicts"""
        merged = {}
        
        for glossary in glossaries:
            for chinese, english in glossary.items():
                if chinese in merged and merged[chinese] != english:
                    # Handle conflict - keep the longer/more detailed translation
                    if len(english) > len(merged[chinese]):
                        merged[chinese] = english
                        logger.debug(f"Glossary conflict resolved: {chinese} -> {english}")
                else:
                    merged[chinese] = english
        
        return merged
    
    def create_domain_specific_glossary(self, domain: str) -> Dict[str, str]:
        """Create glossary for specific domain (automation, robotics, etc.)"""
        domain_glossaries = {
            'automation': {
                '自动化': 'Automation',
                '控制系统': 'Control System',
                '传感器': 'Sensor',
                '执行器': 'Actuator',
                '反馈': 'Feedback',
                '设定值': 'Setpoint',
                '过程变量': 'Process Variable',
                '控制器': 'Controller',
                '调节器': 'Regulator',
                '开环控制': 'Open Loop Control',
                '闭环控制': 'Closed Loop Control'
            },
            
            'robotics': {
                '机器人': 'Robot',
                '机械臂': 'Robotic Arm',
                '关节': 'Joint',
                '连杆': 'Link',
                '末端执行器': 'End Effector',
                '工作空间': 'Workspace',
                '自由度': 'Degrees of Freedom',
                '运动学': 'Kinematics',
                '动力学': 'Dynamics',
                '轨迹规划': 'Trajectory Planning',
                '路径规划': 'Path Planning',
                '示教': 'Teaching',
                '再现': 'Playback'
            },
            
            'plc': {
                '可编程控制器': 'Programmable Logic Controller',
                '梯形图': 'Ladder Logic',
                '指令表': 'Instruction List',
                '功能块': 'Function Block',
                '结构化文本': 'Structured Text',
                '顺序功能图': 'Sequential Function Chart',
                '输入模块': 'Input Module',
                '输出模块': 'Output Module',
                '模拟量': 'Analog',
                '数字量': 'Digital',
                '扫描周期': 'Scan Cycle',
                '看门狗': 'Watchdog'
            },
            
            'hmi': {
                '人机界面': 'Human Machine Interface',
                '触摸屏': 'Touch Screen',
                '画面': 'Screen',
                '控件': 'Control',
                '按钮': 'Button',
                '指示灯': 'Indicator',
                '文本框': 'Text Box',
                '数值输入': 'Numeric Input',
                '趋势图': 'Trend Chart',
                '报警显示': 'Alarm Display',
                '历史数据': 'Historical Data',
                '配方': 'Recipe'
            }
        }
        
        return domain_glossaries.get(domain, {})
    
    def validate_glossary(self, glossary: Dict[str, str]) -> Dict[str, List[str]]:
        """Validate glossary and return issues"""
        issues = {
            'empty_keys': [],
            'empty_values': [],
            'duplicate_values': [],
            'suspicious_entries': []
        }
        
        seen_values = {}
        
        for chinese, english in glossary.items():
            # Check for empty keys/values
            if not chinese.strip():
                issues['empty_keys'].append(chinese)
            
            if not english.strip():
                issues['empty_values'].append(f"{chinese} -> {english}")
            
            # Check for duplicate English translations
            if english in seen_values:
                issues['duplicate_values'].append(f"'{english}' used for both '{seen_values[english]}' and '{chinese}'")
            else:
                seen_values[english] = chinese
            
            # Check for suspicious entries (very long, contains numbers, etc.)
            if len(chinese) > 50 or len(english) > 100:
                issues['suspicious_entries'].append(f"{chinese} -> {english}")
        
        return issues