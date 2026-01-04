# Raspberry Pi Dual-Zone Video Player

A professional headless video player system designed to replace complex laptop-based setups (like Resolume) for LED wall control and multi-zone video applications.

## 🎯 Key Features

### Dual-Zone Control
- **Two independent video zones** with separate content sources
- Each zone fully controllable: position, size, volume, playback
- Support for local files (MP4, MKV, AVI, etc.) and RTSP streams
- Mix and match: play a local file in zone 1, RTSP stream in zone 2

### Professional Interface
- **Visual drag-and-drop layout editor** (Resolume-style)
- Precise numeric controls for pixel-perfect positioning
- Real-time canvas preview of zone layout
- Mobile-responsive web dashboard

### Advanced Features
- **Preset system** for quick layout switching
- Persistent geometry settings across reboots
- HTTP API for integration with other systems
- Native screen blanking (stop all = black screen)
- File upload via web interface
- Hardware-accelerated video decoding

### Optimized Performance
- **Headless operation** (no desktop environment needed)
- Direct DRM/KMS framebuffer output
- Minimal CPU overhead
- Designed for Raspberry Pi 5 with NVMe storage
- Also compatible with Raspberry Pi 4

## 📋 Requirements

### Hardware
- **Raspberry Pi 5** (recommended) or Raspberry Pi 4
- MicroSD card (8GB minimum) or NVMe storage (Pi 5 with HAT)
- HDMI display
- Network connection (WiFi or Ethernet)

### Software
- Raspberry Pi OS Lite (headless recommended)
- Fresh installation recommended

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/keep-on-walking/rpi-headless-video-player.git
cd rpi-headless-video-player
```

### 2. Run Installation

```bash
sudo bash install.sh
```

The installer will:
- Update system packages
- Install MPV and Python dependencies
- Create directory structure
- Set up systemd service
- Configure auto-start

### 3. Access Web Interface

After installation, access the dashboard at:
```
http://[your-pi-ip]:5000
```

Find your Pi's IP address:
```bash
hostname -I
```

## 📖 Usage Guide

### Basic Workflow

1. **Upload Videos** (optional)
   - Click "Upload Video" button
   - Select local video files
   - Files are stored in `/opt/rpi-video-player/data/videos`

2. **Configure Zone Layout**
   - Drag zones on the canvas to position
   - Drag corner handles to resize
   - Or use numeric inputs for precision
   - Click "Apply Geometry" to update

3. **Play Content**
   - **Zone 1**: Select source (file or RTSP URL)
   - Click "▶ Play" to start
   - **Zone 2**: Configure independently
   - Both zones can play simultaneously

4. **Save Presets**
   - Enter preset name and description
   - Click "Save Current Layout"
   - Load presets anytime with one click

### LED Wall Workflow

Perfect for LED panels and video walls:

1. **Set Display Resolution**
   - Enter your LED wall resolution (e.g., 3840×1080 for wide wall)
   - Click "Update" to recalculate layout

2. **Position Content**
   - Drag zones to match physical LED panel positions
   - Use presets for different show configurations
   - Example: "Left Panel", "Right Panel", "Full Wall"

3. **RTSP Streaming**
   - Input camera/stream URL: `rtsp://192.168.1.100:554/stream`
   - Perfect for live event feeds alongside playback content

4. **Quick Switching**
   - Save common layouts as presets
   - One-click switching between configurations
   - No laptop required!

## 🎮 API Reference

See [API.md](API.md) for complete HTTP API documentation.

### Quick Examples

**Start Zone 1 with local file:**
```bash
curl -X POST http://localhost:5000/api/zone/1/play \
  -H "Content-Type: application/json" \
  -d '{
    "source": "video.mp4",
    "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
    "volume": 75,
    "loop": true
  }'
```

**Start Zone 2 with RTSP stream:**
```bash
curl -X POST http://localhost:5000/api/zone/2/play \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rtsp://192.168.1.100:554/stream",
    "geometry": {"x": 960, "y": 0, "width": 960, "height": 1080},
    "volume": 50
  }'
```

**Stop all zones (black screen):**
```bash
curl -X POST http://localhost:5000/api/stop-all
```

## 🔧 System Management

### Service Commands

```bash
# Start service
sudo systemctl start rpi-video-player

# Stop service
sudo systemctl stop rpi-video-player

# Restart service
sudo systemctl restart rpi-video-player

# Check status
sudo systemctl status rpi-video-player

# View logs
sudo journalctl -u rpi-video-player -f
```

### File Locations

- **Installation**: `/opt/rpi-video-player`
- **Videos**: `/opt/rpi-video-player/data/videos`
- **Presets**: `/opt/rpi-video-player/data/presets.json`
- **Logs**: `/opt/rpi-video-player/logs`

## 💾 Default Presets

The system includes these built-in presets:

- **fullscreen-zone1**: Full screen on zone 1 only
- **fullscreen-zone2**: Full screen on zone 2 only
- **side-by-side**: 50/50 vertical split
- **top-bottom**: 50/50 horizontal split
- **pip-bottom-right**: Picture-in-picture
- **main-monitor**: 70/30 split for main content + monitor
- **quad-top**: Quad layout (top two zones)

## 🎨 Example Use Cases

### 1. LED Video Wall Controller
Replace Resolume/MadMapper with a $100 Pi:
- Configure zones to match physical LED panel layout
- Play synchronized content across panels
- RTSP feeds for live camera input
- Save presets for different show configurations

### 2. Dual-Screen Signage
Independent content on two displays:
- Zone 1: Promotional videos (looping)
- Zone 2: Live social media feed (RTSP)

### 3. Stage Backdrop + Monitor
Live production workflow:
- Zone 1: Main stage content (most of screen)
- Zone 2: Confidence monitor (small corner)

### 4. Multi-Camera Monitoring
Security/production monitoring:
- Zone 1: Camera 1 (RTSP)
- Zone 2: Camera 2 (RTSP)
- Quick preset switching between camera configurations

## 🐛 Troubleshooting

### Video won't play

Check MPV can access display:
```bash
# Test basic playback
mpv --vo=gpu --gpu-context=drm /path/to/video.mp4
```

### Service won't start

Check logs:
```bash
sudo journalctl -u rpi-video-player -n 50
```

Verify Python dependencies:
```bash
/opt/rpi-video-player/venv/bin/pip list
```

### RTSP stream fails

Test stream separately:
```bash
mpv rtsp://your-stream-url
```

Check network timeout settings in `src/mpv_manager.py`

### Permission errors

Fix ownership:
```bash
sudo chown -R $USER:$USER /opt/rpi-video-player
```

## 🔮 Future Enhancements

Potential features for future versions:
- Video warping/projection mapping (complex but possible)
- More than 2 zones
- Playlist support per zone
- Scheduled content switching
- Audio routing per zone
- Web-based video trimming

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/keep-on-walking/rpi-headless-video-player/issues

## 🙏 Acknowledgments

Built to replace expensive laptop-based video systems with affordable Raspberry Pi hardware. Perfect for LED walls, stage productions, digital signage, and creative installations.

---

**Made with ❤️ for the maker community**
