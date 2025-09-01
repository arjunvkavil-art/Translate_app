"""
Profile Manager for Industrial Software

Manages preconfigured profiles for different industrial software applications
"""

import json
import os
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class IndustrialProfile:
    """Represents an industrial software profile"""
    name: str
    description: str
    executable: str
    window_title_pattern: str
    manufacturer: str
    category: str
    ocr_settings: Dict[str, Any]
    ui_regions: Dict[str, List[int]]
    common_terms: Dict[str, str]
    ui_elements: Optional[Dict[str, Dict[str, str]]] = None
    error_codes: Optional[Dict[str, str]] = None

class ProfileManager:
    """Manages industrial software profiles"""
    
    def __init__(self, profiles_dir: str = "data/profiles"):
        self.profiles_dir = profiles_dir
        self.profiles = {}
        self.load_all_profiles()
    
    def load_all_profiles(self):
        """Load all available profiles from the profiles directory"""
        if not os.path.exists(self.profiles_dir):
            os.makedirs(self.profiles_dir, exist_ok=True)
            logger.warning(f"Profiles directory created: {self.profiles_dir}")
            return
        
        profile_files = [f for f in os.listdir(self.profiles_dir) if f.endswith('.json')]
        
        for profile_file in profile_files:
            profile_path = os.path.join(self.profiles_dir, profile_file)
            self.load_profile(profile_path)
        
        logger.info(f"Loaded {len(self.profiles)} industrial profiles")
    
    def load_profile(self, profile_path: str) -> Optional[IndustrialProfile]:
        """Load a single profile from JSON file"""
        try:
            with open(profile_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            profile = IndustrialProfile(
                name=data['name'],
                description=data['description'],
                executable=data['executable'],
                window_title_pattern=data['window_title_pattern'],
                manufacturer=data['manufacturer'],
                category=data['category'],
                ocr_settings=data['ocr_settings'],
                ui_regions=data['ui_regions'],
                common_terms=data['common_terms'],
                ui_elements=data.get('ui_elements'),
                error_codes=data.get('error_codes')
            )
            
            profile_key = os.path.splitext(os.path.basename(profile_path))[0]
            self.profiles[profile_key] = profile
            
            logger.info(f"Loaded profile: {profile.name}")
            return profile
            
        except Exception as e:
            logger.error(f"Error loading profile from {profile_path}: {e}")
            return None
    
    def get_profile(self, profile_key: str) -> Optional[IndustrialProfile]:
        """Get profile by key"""
        return self.profiles.get(profile_key)
    
    def get_all_profiles(self) -> Dict[str, IndustrialProfile]:
        """Get all loaded profiles"""
        return self.profiles.copy()
    
    def get_profiles_by_category(self, category: str) -> List[IndustrialProfile]:
        """Get profiles by category"""
        return [profile for profile in self.profiles.values() 
                if profile.category == category]
    
    def get_profiles_by_manufacturer(self, manufacturer: str) -> List[IndustrialProfile]:
        """Get profiles by manufacturer"""
        return [profile for profile in self.profiles.values() 
                if profile.manufacturer.lower() == manufacturer.lower()]
    
    def find_profile_by_executable(self, executable: str) -> Optional[IndustrialProfile]:
        """Find profile by executable name"""
        for profile in self.profiles.values():
            if profile.executable.lower() == executable.lower():
                return profile
        return None
    
    def find_profile_by_window_title(self, window_title: str) -> Optional[IndustrialProfile]:
        """Find profile by window title pattern"""
        for profile in self.profiles.values():
            pattern = profile.window_title_pattern.replace('*', '')
            if pattern.lower() in window_title.lower():
                return profile
        return None
    
    def create_profile(self, profile_data: Dict[str, Any], save_path: str = None) -> IndustrialProfile:
        """Create a new profile"""
        try:
            profile = IndustrialProfile(**profile_data)
            
            # Generate key from name
            profile_key = profile.name.lower().replace(' ', '_').replace('-', '_')
            self.profiles[profile_key] = profile
            
            # Save to file if path provided
            if save_path:
                self.save_profile(profile, save_path)
            
            logger.info(f"Created new profile: {profile.name}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating profile: {e}")
            raise
    
    def save_profile(self, profile: IndustrialProfile, file_path: str):
        """Save profile to JSON file"""
        try:
            profile_data = {
                'name': profile.name,
                'description': profile.description,
                'executable': profile.executable,
                'window_title_pattern': profile.window_title_pattern,
                'manufacturer': profile.manufacturer,
                'category': profile.category,
                'ocr_settings': profile.ocr_settings,
                'ui_regions': profile.ui_regions,
                'common_terms': profile.common_terms
            }
            
            if profile.ui_elements:
                profile_data['ui_elements'] = profile.ui_elements
            
            if profile.error_codes:
                profile_data['error_codes'] = profile.error_codes
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(profile_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Profile saved to: {file_path}")
            
        except Exception as e:
            logger.error(f"Error saving profile: {e}")
    
    def get_profile_glossary(self, profile_key: str) -> Dict[str, str]:
        """Get glossary terms from a profile"""
        profile = self.get_profile(profile_key)
        if not profile:
            return {}
        
        glossary = profile.common_terms.copy()
        
        # Add UI elements if available
        if profile.ui_elements:
            for category, terms in profile.ui_elements.items():
                glossary.update(terms)
        
        return glossary
    
    def export_profiles_list(self) -> List[Dict[str, str]]:
        """Export list of available profiles for UI"""
        return [
            {
                'key': key,
                'name': profile.name,
                'manufacturer': profile.manufacturer,
                'category': profile.category,
                'description': profile.description
            }
            for key, profile in self.profiles.items()
        ]