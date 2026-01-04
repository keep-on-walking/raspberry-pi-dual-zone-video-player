#!/usr/bin/env python3
"""
Video Controller - Flask HTTP API for dual-zone video player
Provides REST API for controlling two independent MPV instances
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
import os
import json
from pathlib import Path

from mpv_manager import DualZoneManager
from preset_manager import PresetManager

app = Flask(__name__, 
            template_folder='../web/templates',
            static_folder='../web/static')

# Configuration
UPLOAD_FOLDER = '/opt/rpi-video-player/data/videos'
ALLOWED_EXTENSIONS = {'mp4', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'webm', 'm4v', 'mpg', 'mpeg'}
MAX_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024  # 2GB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE

# Initialize managers
zone_manager = DualZoneManager()
preset_manager = PresetManager()

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def dashboard():
    """Main dashboard interface"""
    return render_template('dashboard.html')


# ========================================
# ZONE CONTROL ENDPOINTS
# ========================================

@app.route('/api/zone/<int:zone_id>/play', methods=['POST'])
def play_zone(zone_id):
    """
    Start playback in specified zone
    
    POST /api/zone/1/play
    {
        "source": "/path/to/video.mp4" or "rtsp://...",
        "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
        "volume": 50,
        "loop": true
    }
    """
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id. Must be 1 or 2'}), 400
    
    data = request.get_json()
    if not data or 'source' not in data:
        return jsonify({'error': 'Missing source parameter'}), 400
    
    source = data['source']
    
    # Handle file path vs RTSP URL
    if not source.startswith('rtsp://') and not source.startswith('http://'):
        # Local file - verify it exists
        if not os.path.isabs(source):
            source = os.path.join(UPLOAD_FOLDER, source)
        if not os.path.exists(source):
            return jsonify({'error': f'File not found: {source}'}), 404
    
    geometry = data.get('geometry')
    volume = data.get('volume')
    loop = data.get('loop')
    
    success = zone_manager.start_zone(zone_id, source, geometry, volume, loop)
    
    if success:
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'source': source,
            'status': zone_manager.get_zone_status(zone_id)
        })
    else:
        return jsonify({'error': 'Failed to start playback'}), 500


@app.route('/api/zone/<int:zone_id>/stop', methods=['POST'])
def stop_zone(zone_id):
    """Stop playback in specified zone"""
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    zone_manager.stop_zone(zone_id)
    return jsonify({'success': True, 'zone_id': zone_id})


@app.route('/api/stop-all', methods=['POST'])
def stop_all():
    """Stop all zones (black screen)"""
    zone_manager.stop_all()
    return jsonify({'success': True, 'message': 'All zones stopped'})


@app.route('/api/zone/<int:zone_id>/pause', methods=['POST'])
def pause_zone(zone_id):
    """Pause/unpause specified zone"""
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    is_paused = zone_manager.pause_zone(zone_id)
    return jsonify({
        'success': True,
        'zone_id': zone_id,
        'paused': is_paused
    })


@app.route('/api/zone/<int:zone_id>/seek', methods=['POST'])
def seek_zone(zone_id):
    """
    Seek in specified zone
    
    POST /api/zone/1/seek
    {"seconds": 10}  or  {"seconds": -10}
    """
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    data = request.get_json()
    if not data or 'seconds' not in data:
        return jsonify({'error': 'Missing seconds parameter'}), 400
    
    seconds = data['seconds']
    success = zone_manager.seek_zone(zone_id, seconds)
    
    return jsonify({
        'success': success,
        'zone_id': zone_id,
        'seeked': seconds
    })


@app.route('/api/zone/<int:zone_id>/volume', methods=['POST'])
def set_zone_volume(zone_id):
    """
    Set volume for specified zone
    
    POST /api/zone/1/volume
    {"volume": 75}
    """
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    data = request.get_json()
    if not data or 'volume' not in data:
        return jsonify({'error': 'Missing volume parameter'}), 400
    
    volume = int(data['volume'])
    success = zone_manager.set_zone_volume(zone_id, volume)
    
    return jsonify({
        'success': success,
        'zone_id': zone_id,
        'volume': volume
    })


@app.route('/api/zone/<int:zone_id>/geometry', methods=['POST'])
def update_zone_geometry(zone_id):
    """
    Update geometry for specified zone
    
    POST /api/zone/1/geometry
    {"x": 100, "y": 200, "width": 800, "height": 600}
    """
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing geometry data'}), 400
    
    # Extract geometry parameters
    geometry = {}
    if 'x' in data:
        geometry['x'] = int(data['x'])
    if 'y' in data:
        geometry['y'] = int(data['y'])
    if 'width' in data:
        geometry['width'] = int(data['width'])
    if 'height' in data:
        geometry['height'] = int(data['height'])
    
    if not geometry:
        return jsonify({'error': 'No valid geometry parameters provided'}), 400
    
    success = zone_manager.update_zone_geometry(zone_id, geometry)
    
    return jsonify({
        'success': success,
        'zone_id': zone_id,
        'geometry': geometry
    })


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get status of all zones"""
    return jsonify(zone_manager.get_all_status())


@app.route('/api/zone/<int:zone_id>/status', methods=['GET'])
def get_zone_status(zone_id):
    """Get status of specific zone"""
    if zone_id not in [1, 2]:
        return jsonify({'error': 'Invalid zone_id'}), 400
    
    return jsonify(zone_manager.get_zone_status(zone_id))


# ========================================
# PRESET ENDPOINTS
# ========================================

@app.route('/api/presets', methods=['GET'])
def list_presets():
    """Get list of all presets"""
    return jsonify({
        'presets': preset_manager.list_presets()
    })


@app.route('/api/presets/<preset_name>', methods=['GET'])
def get_preset(preset_name):
    """Get details of specific preset"""
    preset = preset_manager.get_preset_details(preset_name)
    if preset:
        return jsonify(preset)
    else:
        return jsonify({'error': 'Preset not found'}), 404


@app.route('/api/presets', methods=['POST'])
def save_preset():
    """
    Save a new preset
    
    POST /api/presets
    {
        "name": "my-config",
        "description": "My LED wall configuration",
        "zone1": {"x": 0, "y": 0, "width": 960, "height": 1080},
        "zone2": {"x": 960, "y": 0, "width": 960, "height": 1080}
    }
    """
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Missing preset name'}), 400
    
    name = data['name']
    description = data.get('description', '')
    zone1_geometry = data.get('zone1', {})
    zone2_geometry = data.get('zone2', {})
    
    success = preset_manager.save_preset(name, zone1_geometry, zone2_geometry, description)
    
    if success:
        return jsonify({
            'success': True,
            'name': name,
            'message': 'Preset saved successfully'
        })
    else:
        return jsonify({'error': 'Failed to save preset'}), 500


@app.route('/api/presets/<preset_name>/load', methods=['POST'])
def load_preset(preset_name):
    """Load and apply a preset configuration"""
    preset = preset_manager.load_preset(preset_name)
    
    if not preset:
        return jsonify({'error': 'Preset not found'}), 404
    
    # Apply geometries to both zones
    zone_manager.update_zone_geometry(1, preset['zone1'])
    zone_manager.update_zone_geometry(2, preset['zone2'])
    
    return jsonify({
        'success': True,
        'preset': preset_name,
        'geometry': preset
    })


@app.route('/api/presets/<preset_name>', methods=['DELETE'])
def delete_preset(preset_name):
    """Delete a preset"""
    success = preset_manager.delete_preset(preset_name)
    
    if success:
        return jsonify({
            'success': True,
            'message': f'Preset {preset_name} deleted'
        })
    else:
        return jsonify({'error': 'Preset not found'}), 404


# ========================================
# FILE MANAGEMENT ENDPOINTS
# ========================================

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all uploaded video files"""
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(filepath) and allowed_file(filename):
                stat = os.stat(filepath)
                files.append({
                    'name': filename,
                    'path': filepath,
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
        
        # Sort by name
        files.sort(key=lambda x: x['name'])
        
        return jsonify({'files': files})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a video file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(filepath)
            return jsonify({
                'success': True,
                'filename': filename,
                'path': filepath
            })
        except Exception as e:
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400


@app.route('/api/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a video file"""
    filename = secure_filename(filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({
                'success': True,
                'message': f'File {filename} deleted'
            })
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================================
# DISPLAY CONFIGURATION
# ========================================

@app.route('/api/display/resolution', methods=['POST'])
def set_display_resolution():
    """
    Set display resolution for geometry calculations
    
    POST /api/display/resolution
    {"width": 1920, "height": 1080}
    """
    data = request.get_json()
    if not data or 'width' not in data or 'height' not in data:
        return jsonify({'error': 'Missing width or height'}), 400
    
    width = int(data['width'])
    height = int(data['height'])
    
    zone_manager.set_display_resolution(width, height)
    
    return jsonify({
        'success': True,
        'resolution': {'width': width, 'height': height}
    })


@app.route('/api/display/resolution', methods=['GET'])
def get_display_resolution():
    """Get current display resolution"""
    return jsonify(zone_manager.display_resolution)


# ========================================
# SYSTEM ENDPOINTS
# ========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'zones_active': {
            'zone1': zone_manager.zone1.is_running(),
            'zone2': zone_manager.zone2.is_running()
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🎬 Raspberry Pi Dual-Zone Video Player")
    print("=" * 60)
    print(f"📂 Upload folder: {UPLOAD_FOLDER}")
    print(f"🌐 Starting Flask server on port 5000...")
    print("=" * 60)
    
    # Create default presets if none exist
    if not preset_manager.presets:
        print("Creating default presets...")
        preset_manager.create_default_presets()
    
    app.run(host='0.0.0.0', port=5000, debug=False)
