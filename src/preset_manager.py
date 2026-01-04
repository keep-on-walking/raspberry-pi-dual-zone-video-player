#!/usr/bin/env python3
"""
Preset Manager - Save and load geometry configurations for dual-zone setup
Useful for quickly switching between LED wall configurations
"""

import json
import os
from pathlib import Path
from datetime import datetime


class PresetManager:
    """Manages geometry presets for dual-zone configurations"""
    
    def __init__(self, presets_file="/opt/rpi-video-player/data/presets.json"):
        self.presets_file = presets_file
        self.presets = {}
        self._ensure_directory()
        self.load_presets()
    
    def _ensure_directory(self):
        """Ensure the presets directory exists"""
        os.makedirs(os.path.dirname(self.presets_file), exist_ok=True)
    
    def load_presets(self):
        """Load presets from file"""
        if os.path.exists(self.presets_file):
            try:
                with open(self.presets_file, 'r') as f:
                    self.presets = json.load(f)
                print(f"✅ Loaded {len(self.presets)} presets")
            except Exception as e:
                print(f"⚠️ Error loading presets: {e}")
                self.presets = {}
        else:
            print("No presets file found, starting fresh")
            self.presets = {}
    
    def save_presets(self):
        """Save presets to file"""
        try:
            with open(self.presets_file, 'w') as f:
                json.dump(self.presets, f, indent=2)
            print(f"✅ Saved {len(self.presets)} presets")
            return True
        except Exception as e:
            print(f"❌ Error saving presets: {e}")
            return False
    
    def save_preset(self, name, zone1_geometry, zone2_geometry, description=""):
        """
        Save a new preset configuration
        
        Args:
            name: Unique name for the preset
            zone1_geometry: Dict with x, y, width, height for zone 1
            zone2_geometry: Dict with x, y, width, height for zone 2
            description: Optional description of the preset
        """
        preset = {
            'name': name,
            'description': description,
            'created': datetime.now().isoformat(),
            'zone1': zone1_geometry.copy(),
            'zone2': zone2_geometry.copy()
        }
        
        self.presets[name] = preset
        self.save_presets()
        return True
    
    def load_preset(self, name):
        """
        Load a preset by name
        
        Returns:
            Dict with zone1 and zone2 geometry, or None if not found
        """
        if name in self.presets:
            preset = self.presets[name]
            return {
                'zone1': preset['zone1'].copy(),
                'zone2': preset['zone2'].copy(),
                'description': preset.get('description', '')
            }
        return None
    
    def delete_preset(self, name):
        """Delete a preset by name"""
        if name in self.presets:
            del self.presets[name]
            self.save_presets()
            return True
        return False
    
    def list_presets(self):
        """Get list of all preset names and descriptions"""
        return [
            {
                'name': name,
                'description': preset.get('description', ''),
                'created': preset.get('created', '')
            }
            for name, preset in self.presets.items()
        ]
    
    def get_preset_details(self, name):
        """Get full details of a preset"""
        return self.presets.get(name)
    
    def create_default_presets(self):
        """Create some useful default presets for common configurations"""
        
        # Full screen zone 1 only
        self.save_preset(
            "fullscreen-zone1",
            zone1_geometry={'x': 0, 'y': 0, 'width': 1920, 'height': 1080},
            zone2_geometry={'x': 0, 'y': 0, 'width': 0, 'height': 0},
            description="Full screen on zone 1 only"
        )
        
        # Full screen zone 2 only
        self.save_preset(
            "fullscreen-zone2",
            zone1_geometry={'x': 0, 'y': 0, 'width': 0, 'height': 0},
            zone2_geometry={'x': 0, 'y': 0, 'width': 1920, 'height': 1080},
            description="Full screen on zone 2 only"
        )
        
        # Side by side (50/50 split)
        self.save_preset(
            "side-by-side",
            zone1_geometry={'x': 0, 'y': 0, 'width': 960, 'height': 1080},
            zone2_geometry={'x': 960, 'y': 0, 'width': 960, 'height': 1080},
            description="Side by side split (50/50)"
        )
        
        # Top and bottom (50/50 split)
        self.save_preset(
            "top-bottom",
            zone1_geometry={'x': 0, 'y': 0, 'width': 1920, 'height': 540},
            zone2_geometry={'x': 0, 'y': 540, 'width': 1920, 'height': 540},
            description="Top and bottom split (50/50)"
        )
        
        # Picture in picture (zone 2 in corner)
        self.save_preset(
            "pip-bottom-right",
            zone1_geometry={'x': 0, 'y': 0, 'width': 1920, 'height': 1080},
            zone2_geometry={'x': 1440, 'y': 810, 'width': 480, 'height': 270},
            description="Picture-in-picture (zone 2 in bottom right)"
        )
        
        # 70/30 split for main content + monitor
        self.save_preset(
            "main-monitor",
            zone1_geometry={'x': 0, 'y': 0, 'width': 1344, 'height': 1080},
            zone2_geometry={'x': 1344, 'y': 0, 'width': 576, 'height': 1080},
            description="Main content (70%) + monitor feed (30%)"
        )
        
        # Quad split (4 equal zones, but we only have 2)
        # Zone 1 = top left, Zone 2 = top right
        self.save_preset(
            "quad-top",
            zone1_geometry={'x': 0, 'y': 0, 'width': 960, 'height': 540},
            zone2_geometry={'x': 960, 'y': 0, 'width': 960, 'height': 540},
            description="Quad layout - top two zones"
        )
        
        print("✅ Created 7 default presets")
