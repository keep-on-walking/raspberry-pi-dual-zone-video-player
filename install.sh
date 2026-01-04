#!/bin/bash
# =============================================================================
# Raspberry Pi Dual-Zone Video Player - Installation Script
# =============================================================================
# Installs headless dual-zone video player with HTTP API control
# Optimized for Raspberry Pi 5 with NVMe storage
# Supports local files and RTSP streams
# 
# Usage: sudo bash install.sh
# =============================================================================

set -e

echo "======================================================================="
echo "  Raspberry Pi Dual-Zone Video Player - Installer"
echo "======================================================================="
echo ""
echo "This will install:"
echo "  • Dual-zone MPV video player (X11/GPU mode)"
echo "  • Flask HTTP API controller"
echo "  • Web dashboard with drag-and-drop interface"
echo "  • Systemd service for auto-start"
echo "  • Desktop hiding (blanks screen when idle)"
echo ""
echo "Requirements:"
echo "  • Raspberry Pi 5 (or Pi 4)"
echo "  • Raspberry Pi OS (64-bit) WITH Desktop"
echo "  • Internet connection"
echo ""
read -p "Continue with installation? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash install.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

echo ""
echo "📋 Installation Configuration:"
echo "  User: $ACTUAL_USER"
echo "  Home: $ACTUAL_HOME"
echo ""

# =============================================================================
# System Update
# =============================================================================

echo "🔄 Updating system packages..."
apt update
apt upgrade -y

# =============================================================================
# Install Dependencies
# =============================================================================

echo "📦 Installing required packages..."
apt install -y \
    mpv \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    jq

# =============================================================================
# Create Directory Structure
# =============================================================================

echo "📁 Creating directory structure..."
INSTALL_DIR="/opt/rpi-video-player"
mkdir -p "$INSTALL_DIR"/{src,web/{static/{css,js},templates},config,data/videos,logs}

# Set ownership
chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR"

# =============================================================================
# Install Python Application
# =============================================================================

echo "🐍 Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/venv"

echo "📥 Installing Python dependencies..."
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install Flask==3.0.0 Werkzeug==3.0.1

# =============================================================================
# Copy Application Files
# =============================================================================

echo "📋 Copying application files..."

# Determine source directory (script location)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy source files
if [ -d "$SCRIPT_DIR/src" ]; then
    cp -r "$SCRIPT_DIR/src"/* "$INSTALL_DIR/src/"
    cp -r "$SCRIPT_DIR/web"/* "$INSTALL_DIR/web/"
    echo "✅ Copied application files from $SCRIPT_DIR"
else
    echo "⚠️ Source files not found in $SCRIPT_DIR"
    echo "Please ensure you're running this script from the repository root"
    exit 1
fi

# Set permissions
chmod +x "$INSTALL_DIR/src"/*.py
chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR"

# =============================================================================
# Configure MPV
# =============================================================================

echo "⚙️ Configuring MPV..."

# MPV doesn't need much config for DRM mode
# Most settings are in the Python controller

# =============================================================================
# Configure Application Autostart (using desktop autostart)
# =============================================================================

echo "🚀 Configuring application autostart..."

# Note: We use desktop autostart instead of systemd service because
# systemd services have difficulty accessing X11/Wayland display on modern Pi OS

# Create autostart directory
mkdir -p "$ACTUAL_HOME/.config/autostart"

# Create autostart entry for video player
cat > "$ACTUAL_HOME/.config/autostart/rpi-video-player.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Raspberry Pi Video Player
Comment=Dual-zone video player with HTTP API
Exec=/bin/bash -c "sleep 20 && cd /opt/rpi-video-player/src && DISPLAY=:0 /opt/rpi-video-player/venv/bin/python3 /opt/rpi-video-player/src/video_controller.py"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
EOF

chown -R $ACTUAL_USER:$ACTUAL_USER "$ACTUAL_HOME/.config/autostart"

echo "✅ Application will start automatically on boot (via desktop autostart)"
echo "ℹ️  Note: Service starts 20 seconds after desktop loads to ensure X11 is ready"

# =============================================================================
# Configure Desktop Hiding (for Raspberry Pi OS with Desktop)
# =============================================================================

echo "🖥️ Configuring desktop hiding..."

# Install unclutter to hide mouse cursor
apt install -y unclutter

# Configure LXDE Autostart
echo "📝 Configuring LXDE autostart..."
mkdir -p "$ACTUAL_HOME/.config/lxsession/LXDE-pi"

cat > "$ACTUAL_HOME/.config/lxsession/LXDE-pi/autostart" << 'EOF'
# LXDE Autostart - Video Player Configuration
# Hides desktop UI and enables X11 access

# Disable screen blanking
@xset s off
@xset -dpms
@xset s noblank

# Allow X11 connections for video service
@xhost +local:

# Hide mouse cursor
@unclutter -idle 0 -root

# Set black desktop background
@pcmanfm --desktop-bg=#000000 --wallpaper-mode=color

# Hide taskbar after boot
@bash -c "sleep 5 && lxpanelctl command hide"
EOF

chown -R $ACTUAL_USER:$ACTUAL_USER "$ACTUAL_HOME/.config/lxsession"

# Configure PCManFM desktop appearance
echo "🎨 Configuring desktop appearance..."
mkdir -p "$ACTUAL_HOME/.config/pcmanfm/LXDE-pi"

cat > "$ACTUAL_HOME/.config/pcmanfm/LXDE-pi/desktop-items-0.conf" << 'EOF'
[*]
wallpaper_mode=color
wallpaper_common=1
wallpaper=/usr/share/pixmaps/pi-logo.png
desktop_bg=#000000
desktop_fg=#ffffff
desktop_shadow=#000000
show_wm_menu=0
show_documents=0
show_trash=0
show_mounts=0
EOF

chown -R $ACTUAL_USER:$ACTUAL_USER "$ACTUAL_HOME/.config/pcmanfm"

echo "✅ Desktop hiding configured (desktop will be black after reboot)"

# =============================================================================
# Network Information
# =============================================================================

echo ""
echo "📡 Detecting network information..."
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# =============================================================================
# Installation Complete
# =============================================================================

echo ""
echo "======================================================================="
echo "✅ Installation Complete!"
echo "======================================================================="
echo ""
echo "📂 Installation Directory: $INSTALL_DIR"
echo "📁 Video Upload Directory: $INSTALL_DIR/data/videos"
echo "📝 Logs Directory: $INSTALL_DIR/logs"
echo ""
echo "🌐 Web Interface: http://$IP_ADDRESS:5000"
echo ""
echo "🎮 Control the system via:"
echo "  • Web dashboard at the URL above"
echo "  • HTTP API (see API.md for documentation)"
echo ""
echo "📋 Next Steps:"
echo "  1. REBOOT to start the system: sudo reboot"
echo "  2. Wait ~30 seconds after boot for services to start"
echo "  3. Access web interface: http://$IP_ADDRESS:5000"
echo "  4. Upload videos or enter RTSP URLs"
echo "  5. Configure dual-zone layout and save presets"
echo ""
echo "💡 Desktop will turn black automatically after reboot"
echo "💡 Video player starts 20 seconds after desktop loads"
echo "💡 For LED wall workflows, see README.md for best practices"
echo ""
echo "🔧 Troubleshooting:"
echo "  Check if running: ps aux | grep video_controller"
echo "  View logs: tail -f $INSTALL_DIR/logs/app.log"
echo "  Manual start: cd $INSTALL_DIR/src && DISPLAY=:0 python3 video_controller.py"
echo ""
echo "======================================================================="
echo ""

echo "Installation complete! Please reboot to start the system."
echo ""
read -p "Reboot now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rebooting..."
    reboot
fi

echo ""
echo "Installation script complete. Enjoy your dual-zone video player! 🎉"
