# Fresh Installation Guide

## Step-by-Step Setup for Raspberry Pi Dual-Zone Video Player

### Step 1: Flash Raspberry Pi OS

1. **Download Raspberry Pi Imager:**
   - https://www.raspberrypi.com/software/

2. **Configure OS:**
   - **Operating System:** `Raspberry Pi OS (64-bit)` ← WITH Desktop (NOT Lite)
   - **Storage:** Your SD card or NVMe drive

3. **Click Settings (⚙️ icon) and configure:**
   - **Hostname:** `video-player` (or your choice)
   - **Username:** `pi` (or your choice)
   - **Password:** Your secure password
   - **WiFi:** Your network details (if using WiFi)
   - **Locale:** Your timezone and keyboard layout
   - **SSH:** ✅ Enable (Use password authentication)

4. **Write to SD/NVMe** - This will erase everything on the drive

5. **Insert into Pi and boot**

### Step 2: Connect via SSH

Wait 1-2 minutes for Pi to boot, then:

```bash
# Find your Pi's IP address
ping video-player.local

# Or scan your network
# (Use your router's admin page or a network scanner app)

# SSH into the Pi
ssh pi@video-player.local
# or
ssh pi@192.168.x.xxx
```

Enter your password when prompted.

### Step 3: Install Video Player (One Command!)

Copy and paste this entire command:

```bash
sudo apt update && sudo apt install -y git && git clone https://github.com/keep-on-walking/raspberry-pi-dual-zone-video-player.git && cd raspberry-pi-dual-zone-video-player && sudo bash install.sh
```

This will:
- Update package lists
- Install git
- Clone the repository
- Run the installer

**Installation takes 5-10 minutes** depending on internet speed.

When prompted "Start the service now? (y/N)", press **Y**

### Step 4: Access Web Dashboard

Open a web browser and go to:
```
http://video-player.local:5000
```

Or use the IP address:
```
http://192.168.x.xxx:5000
```

You should see the dual-zone video player dashboard!

### Step 5: Test Playback

1. **Upload a test video** using the "Upload Video" button
2. **Select it** from the Zone 1 dropdown
3. **Adjust geometry** (default is left half of screen)
4. **Click Play** ▶

The video should appear on your HDMI display!

### Step 6: Configure Dual-Zone

1. **Zone 1 (Left side):**
   - X: 0, Y: 0, Width: 960, Height: 1080

2. **Zone 2 (Right side):**
   - X: 960, Y: 0, Width: 960, Height: 1080

3. **Upload/select videos** for each zone
4. **Click Play** on both zones
5. **Save as preset** for quick recall!

---

## Desktop Hiding

The desktop is automatically hidden with:
- **Black background**
- **Hidden mouse cursor**
- **Minimized windows**

When videos stop, the screen goes black. When videos play, only the video is visible.

---

## Troubleshooting

### Video won't play

Check service status:
```bash
sudo systemctl status rpi-video-player
```

View logs:
```bash
sudo journalctl -u rpi-video-player -f
```

### Can't access dashboard

Verify service is running:
```bash
sudo systemctl restart rpi-video-player
sudo systemctl status rpi-video-player
```

Check your Pi's IP address:
```bash
hostname -I
```

### Desktop is visible

Reboot the Pi:
```bash
sudo reboot
```

The desktop hiding service starts automatically after boot.

---

## Next Steps

- Read **README.md** for full feature documentation
- Read **API.md** for HTTP API reference
- Check **examples/** folder for preset configurations
- Configure your LED wall layouts and save as presets!

---

**Happy video playing! 🎬**
