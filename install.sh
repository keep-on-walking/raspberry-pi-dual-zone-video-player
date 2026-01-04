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
# Create Systemd Service
# =============================================================================

echo "🔧 Creating systemd service..."

cat > /etc/systemd/system/rpi-video-player.service << EOF
[Unit]
Description=Raspberry Pi Dual-Zone Video Player
After=graphical.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$INSTALL_DIR/src
Environment="PATH=$INSTALL_DIR/venv/bin"
Environment="DISPLAY=:0"
Environment="XAUTHORITY=$ACTUAL_HOME/.Xauthority"
ExecStart=$INSTALL_DIR/venv/bin/python3 $INSTALL_DIR/src/video_controller.py
Restart=always
RestartSec=10
StandardOutput=append:$INSTALL_DIR/logs/app.log
StandardError=append:$INSTALL_DIR/logs/error.log

[Install]
WantedBy=graphical.target
EOF

# =============================================================================
# Configure Desktop Hiding (for Raspberry Pi OS with Desktop)
# =============================================================================

echo "🖥️ Configuring desktop hiding..."

# Install unclutter to hide mouse cursor
apt install -y unclutter

# Create desktop hiding script
cat > /usr/local/bin/hide-desktop.sh << 'HIDEEOF'
#!/bin/bash
# Wait for desktop to fully load
sleep 15

# Hide mouse cursor
unclutter -idle 0 -root &

# Disable screen blanking (we want black, not sleep mode)
export DISPLAY=:0
xset s off
xset -dpms
xset s noblank

# Set desktop background to pure black
pcmanfm --set-wallpaper=/usr/share/pixmaps/pi-logo.png --wallpaper-mode=center --desktop-bg=#000000 2>/dev/null || true

# Minimize all windows (keeps desktop clean)
wmctrl -k on 2>/dev/null || true
HIDEEOF

chmod +x /usr/local/bin/hide-desktop.sh

# Create systemd service for desktop hiding
cat > /etc/systemd/system/hide-desktop.service << 'EOF'
[Unit]
Description=Hide Desktop UI (black screen when idle)
After=graphical.target

[Service]
Type=oneshot
User=ACTUAL_USER_PLACEHOLDER
Environment="DISPLAY=:0"
ExecStart=/usr/local/bin/hide-desktop.sh
RemainAfterExit=yes

[Install]
WantedBy=graphical.target
EOF

# Replace placeholder with actual user
sed -i "s/ACTUAL_USER_PLACEHOLDER/$ACTUAL_USER/g" /etc/systemd/system/hide-desktop.service

# Enable desktop hiding service
systemctl daemon-reload
systemctl enable hide-desktop.service

echo "✅ Desktop hiding configured (desktop will be black when idle)"

# Configure autostart for the actual user (ensures X11 access)
mkdir -p "$ACTUAL_HOME/.config/autostart"
cat > "$ACTUAL_HOME/.config/autostart/hide-cursor.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Hide Cursor
Exec=unclutter -idle 0 -root
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

chown -R $ACTUAL_USER:$ACTUAL_USER "$ACTUAL_HOME/.config"

echo "✅ Desktop auto-hide configured"

# =============================================================================
# Enable and Start Service
# =============================================================================

echo "🚀 Enabling service..."
systemctl daemon-reload
systemctl enable rpi-video-player.service

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
echo "🔧 System Commands:"
echo "  Start:   sudo systemctl start rpi-video-player"
echo "  Stop:    sudo systemctl stop rpi-video-player"
echo "  Status:  sudo systemctl status rpi-video-player"
echo "  Logs:    sudo journalctl -u rpi-video-player -f"
echo ""
echo "📋 Next Steps:"
echo "  1. REBOOT to enable screen blanking: sudo reboot"
echo "  2. After reboot, access web interface: http://$IP_ADDRESS:5000"
echo "  3. Upload videos or enter RTSP URLs"
echo "  4. Configure dual-zone layout"
echo "  5. Save presets for quick switching"
echo ""
echo "💡 Screen will be black after reboot (hiding console text)"
echo "💡 For LED wall workflows, see README.md for best practices"
echo ""
echo "======================================================================="
echo ""

read -p "Start the service now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl start rpi-video-player.service
    sleep 2
    
    echo ""
    echo "🎬 Service started!"
    echo "🌐 Access dashboard at: http://$IP_ADDRESS:5000"
    echo ""
    
    # Show service status
    systemctl status rpi-video-player.service --no-pager
fi

echo ""
echo "Installation script complete. Enjoy your dual-zone video player! 🎉"
