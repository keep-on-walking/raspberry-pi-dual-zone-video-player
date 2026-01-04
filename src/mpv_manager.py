#!/usr/bin/env python3
"""
MPV Manager - Controls individual MPV instances for dual-zone playback
Handles headless DRM/KMS video output on Raspberry Pi 5
"""

import subprocess
import os
import signal
import time
import json
import socket
from pathlib import Path


class MPVInstance:
    """Manages a single MPV instance with DRM/KMS output"""
    
    def __init__(self, zone_id, socket_path="/tmp/mpvsocket"):
        self.zone_id = zone_id
        self.socket_path = f"{socket_path}-zone{zone_id}"
        self.process = None
        self.current_source = None
        self.is_paused = False
        
        # Default geometry (will be overridden)
        self.geometry = {
            'x': 0,
            'y': 0,
            'width': 960,
            'height': 1080
        }
        
        # Playback settings
        self.volume = 50
        self.loop = True
        
    def start(self, source, geometry=None, volume=None, loop=None):
        """
        Start MPV with specified source (file path or RTSP URL)
        
        Args:
            source: Path to video file or RTSP URL
            geometry: Dict with x, y, width, height
            volume: Volume level 0-100
            loop: Boolean for loop playback
        """
        # Stop any existing instance
        self.stop()
        
        # Update settings if provided
        if geometry:
            self.geometry.update(geometry)
        if volume is not None:
            self.volume = volume
        if loop is not None:
            self.loop = loop
            
        # Build MPV command for headless DRM/KMS output
        cmd = self._build_command(source)
        
        try:
            print(f"[Zone {self.zone_id}] Starting MPV: {os.path.basename(source)}")
            print(f"[Zone {self.zone_id}] Geometry: {self.geometry['width']}x{self.geometry['height']}+{self.geometry['x']}+{self.geometry['y']}")
            
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL
            )
            
            self.current_source = source
            self.is_paused = False
            
            # Wait a moment to verify startup
            time.sleep(0.3)
            
            if self.process.poll() is None:
                print(f"[Zone {self.zone_id}] MPV started successfully (PID: {self.process.pid})")
                return True
            else:
                stderr_output = self.process.stderr.read().decode('utf-8', errors='ignore')
                print(f"[Zone {self.zone_id}] MPV failed to start: {stderr_output}")
                self.process = None
                return False
                
        except Exception as e:
            print(f"[Zone {self.zone_id}] Error starting MPV: {e}")
            self.process = None
            return False
    
    def _build_command(self, source):
        """Build MPV command with all necessary flags for X11 GPU output"""
        
        cmd = [
            'mpv',
            
            # Core playback settings
            '--no-border',
            '--no-osc',
            '--no-osd-bar',
            '--really-quiet',
            '--keep-open=yes',
            
            # X11 video output with GPU acceleration
            '--vo=gpu',
            '--gpu-context=x11egl',
            
            # Window geometry (position and size)
            f'--geometry={self.geometry["width"]}x{self.geometry["height"]}+{self.geometry["x"]}+{self.geometry["y"]}',
            '--autofit-larger=100%x100%',
            
            # IPC control socket
            f'--input-ipc-server={self.socket_path}',
            
            # Volume
            f'--volume={self.volume}',
            
            # Loop settings
            '--loop-playlist=inf' if self.loop else '--loop-playlist=no',
            
            # Window settings
            '--force-window=yes',
            '--idle=yes',
            '--ontop=yes',
            
            # Cursor hiding
            '--cursor-autohide=always',
            
            # Video scaling
            '--keepaspect=no',
            '--video-aspect-override=-1',
            '--panscan=1.0',
            
            # Hardware acceleration
            '--hwdec=auto',
            
            # Cache for streams
            '--cache=yes',
            '--demuxer-max-bytes=50M',
            '--demuxer-max-back-bytes=25M',
            
            # Network timeout for RTSP
            '--network-timeout=10',
            '--rtsp-transport=tcp',
            
            # The video source
            source
        ]
        
        return cmd
    
    def stop(self):
        """Stop the MPV instance"""
        if self.process and self.process.poll() is None:
            print(f"[Zone {self.zone_id}] Stopping MPV...")
            try:
                self.process.terminate()
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                print(f"[Zone {self.zone_id}] Force killing MPV...")
                self.process.kill()
                self.process.wait()
            
            # Clean up socket
            if os.path.exists(self.socket_path):
                os.remove(self.socket_path)
                
        self.process = None
        self.current_source = None
        self.is_paused = False
    
    def pause(self):
        """Pause playback"""
        if self.is_running():
            self._send_command('cycle pause')
            self.is_paused = not self.is_paused
            return self.is_paused
        return False
    
    def seek(self, seconds):
        """Seek forward or backward by seconds"""
        if self.is_running():
            self._send_command(f'seek {seconds}')
            return True
        return False
    
    def set_volume(self, volume):
        """Set volume (0-100)"""
        if self.is_running():
            self.volume = max(0, min(100, volume))
            self._send_command(f'set volume {self.volume}')
            return True
        return False
    
    def update_geometry(self, geometry):
        """
        Update geometry and restart playback with new position/size
        Note: DRM mode requires restart to change geometry
        """
        if self.is_running() and self.current_source:
            source = self.current_source
            self.geometry.update(geometry)
            # Restart with new geometry
            return self.start(source, geometry)
        elif not self.is_running():
            # Just update geometry for next start
            self.geometry.update(geometry)
            return True
        return False
    
    def is_running(self):
        """Check if MPV instance is running"""
        return self.process is not None and self.process.poll() is None
    
    def get_status(self):
        """Get current status of this zone"""
        return {
            'zone_id': self.zone_id,
            'running': self.is_running(),
            'source': self.current_source,
            'paused': self.is_paused,
            'volume': self.volume,
            'geometry': self.geometry.copy(),
            'loop': self.loop
        }
    
    def _send_command(self, command):
        """Send command to MPV via IPC socket"""
        if not os.path.exists(self.socket_path):
            print(f"[Zone {self.zone_id}] Socket not found: {self.socket_path}")
            return False
        
        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(1)
            sock.connect(self.socket_path)
            
            # MPV IPC expects JSON commands
            msg = json.dumps({"command": command.split()}) + '\n'
            sock.sendall(msg.encode('utf-8'))
            
            sock.close()
            return True
            
        except Exception as e:
            print(f"[Zone {self.zone_id}] IPC command failed: {e}")
            return False


class DualZoneManager:
    """Manages two MPV instances for dual-zone playback"""
    
    def __init__(self):
        self.zone1 = MPVInstance(zone_id=1, socket_path="/tmp/mpvsocket")
        self.zone2 = MPVInstance(zone_id=2, socket_path="/tmp/mpvsocket")
        
        # Default display resolution
        self.display_resolution = {
            'width': 1920,
            'height': 1080
        }
        
    def start_zone(self, zone_id, source, geometry=None, volume=None, loop=None):
        """Start playback in specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.start(source, geometry, volume, loop)
    
    def stop_zone(self, zone_id):
        """Stop playback in specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        zone.stop()
    
    def stop_all(self):
        """Stop all zones (screen goes black)"""
        self.zone1.stop()
        self.zone2.stop()
    
    def pause_zone(self, zone_id):
        """Pause/unpause specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.pause()
    
    def seek_zone(self, zone_id, seconds):
        """Seek in specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.seek(seconds)
    
    def set_zone_volume(self, zone_id, volume):
        """Set volume for specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.set_volume(volume)
    
    def update_zone_geometry(self, zone_id, geometry):
        """Update geometry for specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.update_geometry(geometry)
    
    def get_zone_status(self, zone_id):
        """Get status of specified zone"""
        zone = self.zone1 if zone_id == 1 else self.zone2
        return zone.get_status()
    
    def get_all_status(self):
        """Get status of all zones"""
        return {
            'zone1': self.zone1.get_status(),
            'zone2': self.zone2.get_status(),
            'display': self.display_resolution.copy()
        }
    
    def set_display_resolution(self, width, height):
        """Set display resolution for geometry calculations"""
        self.display_resolution = {
            'width': width,
            'height': height
        }
