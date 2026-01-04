# Quick Fix Guide - Desktop Hiding & Video Playback

This guide fixes three issues:
1. ✅ Desktop remains visible after boot
2. ✅ Videos won't play from web interface after reboot
3. ✅ Canvas resize handles too small to grab

## Apply All Fixes (One Command)

SSH into your Pi and run:

```bash
cd /opt/rpi-video-player
sudo bash fix-desktop-hiding.sh
```

This will:
- Configure LXDE to hide desktop UI on boot
- Enable X11 access for the video service
- Update the systemd service with proper settings
- Create manual hide scripts if needed

Then reboot:
```bash
sudo reboot
```

## After Reboot

Within 10 seconds:
- ✅ Desktop background turns black
- ✅ Taskbar hides automatically
- ✅ Mouse cursor disappears
- ✅ Video player service starts with X11 access
- ✅ Videos play from web interface

## Manual Commands (If Needed)

If desktop is still visible after boot:
```bash
# Run this from SSH
sudo /usr/local/bin/hide-desktop-now.sh
```

If video still won't play:
```bash
# Check service status
sudo systemctl status rpi-video-player

# Restart service
sudo systemctl restart rpi-video-player

# Check logs
tail -f /opt/rpi-video-player/logs/error.log
```

## Canvas Resize Handles

The resize handles are now larger (20px instead of 12px) for easier grabbing.

**How to resize zones:**
1. Move mouse to **corner** of a zone
2. Wait for cursor to change to resize arrows
3. Click and drag to resize
4. Release to apply

**Tips:**
- Handles appear at all 4 corners of each zone
- Hover slowly over corners if not appearing
- Zoom in browser if handles still hard to grab (Ctrl/Cmd + plus)

## Troubleshooting

### Desktop Still Visible
```bash
# Manually hide it
DISPLAY=:0 xhost +local:
DISPLAY=:0 lxpanelctl command hide
DISPLAY=:0 pcmanfm --desktop-bg=#000000 --wallpaper-mode=color
killall unclutter; unclutter -idle 0 -root &
```

### Video Won't Play
```bash
# Test MPV directly
DISPLAY=:0 mpv /opt/rpi-video-player/data/videos/Big_Buck_Bunny*.mp4
```

If that works but web interface doesn't:
```bash
# Restart with manual DISPLAY
sudo systemctl stop rpi-video-player
cd /opt/rpi-video-player/src
DISPLAY=:0 /opt/rpi-video-player/venv/bin/python3 video_controller.py
```

### Canvas Issues
- Refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Clear browser cache
- Try different browser

## Files Updated

- `web/static/js/canvas-controller.js` - Larger resize handles
- `fix-desktop-hiding.sh` - Comprehensive fix script
- `config/lxde-autostart` - Desktop hiding configuration

## Upload to GitHub

Replace these files on GitHub:
1. `web/static/js/canvas-controller.js`
2. Add new: `fix-desktop-hiding.sh`
3. Add new: `QUICKFIX.md` (this file)
4. Add new: `config/lxde-autostart`

Users can then run:
```bash
git pull
sudo bash fix-desktop-hiding.sh
sudo reboot
```

---

**Need Help?** Check the full logs:
```bash
# Application logs
tail -f /opt/rpi-video-player/logs/app.log

# Service logs  
sudo journalctl -u rpi-video-player -f

# X11 check
echo $DISPLAY
ps aux | grep Xorg
```
