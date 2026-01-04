#!/bin/bash
# =============================================================================
# Example API Usage Script
# Demonstrates common operations with the dual-zone video player
# =============================================================================

# Configuration
API="http://localhost:5000"

echo "🎬 Raspberry Pi Dual-Zone Video Player - API Examples"
echo "======================================================"
echo ""

# =============================================================================
# Example 1: Check System Health
# =============================================================================
echo "1️⃣ Checking system health..."
curl -s "$API/api/health" | jq .
echo ""

# =============================================================================
# Example 2: Get System Status
# =============================================================================
echo "2️⃣ Getting system status..."
curl -s "$API/api/status" | jq .
echo ""

# =============================================================================
# Example 3: Play Local File in Zone 1
# =============================================================================
echo "3️⃣ Playing local file in Zone 1..."
curl -X POST "$API/api/zone/1/play" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "video.mp4",
    "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
    "volume": 75,
    "loop": true
  }' | jq .
echo ""

# =============================================================================
# Example 4: Play RTSP Stream in Zone 2
# =============================================================================
echo "4️⃣ Playing RTSP stream in Zone 2..."
curl -X POST "$API/api/zone/2/play" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rtsp://192.168.1.100:554/stream",
    "geometry": {"x": 960, "y": 0, "width": 960, "height": 1080},
    "volume": 60,
    "loop": false
  }' | jq .
echo ""

# =============================================================================
# Example 5: Update Zone Geometry
# =============================================================================
echo "5️⃣ Updating Zone 1 geometry..."
curl -X POST "$API/api/zone/1/geometry" \
  -H "Content-Type: application/json" \
  -d '{
    "x": 100,
    "y": 100,
    "width": 800,
    "height": 600
  }' | jq .
echo ""

# =============================================================================
# Example 6: Pause Zone
# =============================================================================
echo "6️⃣ Pausing Zone 1..."
curl -X POST "$API/api/zone/1/pause" | jq .
echo ""

# =============================================================================
# Example 7: Seek in Zone
# =============================================================================
echo "7️⃣ Seeking forward 10 seconds in Zone 1..."
curl -X POST "$API/api/zone/1/seek" \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10}' | jq .
echo ""

# =============================================================================
# Example 8: Set Volume
# =============================================================================
echo "8️⃣ Setting Zone 2 volume to 80..."
curl -X POST "$API/api/zone/2/volume" \
  -H "Content-Type: application/json" \
  -d '{"volume": 80}' | jq .
echo ""

# =============================================================================
# Example 9: Save Preset
# =============================================================================
echo "9️⃣ Saving current layout as preset..."
curl -X POST "$API/api/presets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-layout",
    "description": "Custom layout for LED wall",
    "zone1": {"x": 0, "y": 0, "width": 1280, "height": 1080},
    "zone2": {"x": 1280, "y": 0, "width": 640, "height": 1080}
  }' | jq .
echo ""

# =============================================================================
# Example 10: List Presets
# =============================================================================
echo "🔟 Listing all presets..."
curl -s "$API/api/presets" | jq .
echo ""

# =============================================================================
# Example 11: Load Preset
# =============================================================================
echo "1️⃣1️⃣ Loading 'side-by-side' preset..."
curl -X POST "$API/api/presets/side-by-side/load" | jq .
echo ""

# =============================================================================
# Example 12: List Files
# =============================================================================
echo "1️⃣2️⃣ Listing uploaded files..."
curl -s "$API/api/files" | jq .
echo ""

# =============================================================================
# Example 13: Set Display Resolution
# =============================================================================
echo "1️⃣3️⃣ Setting display resolution to 3840x1080..."
curl -X POST "$API/api/display/resolution" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 3840,
    "height": 1080
  }' | jq .
echo ""

# =============================================================================
# Example 14: Stop All Zones
# =============================================================================
echo "1️⃣4️⃣ Stopping all zones (black screen)..."
curl -X POST "$API/api/stop-all" | jq .
echo ""

echo "======================================================"
echo "✅ API examples complete!"
echo ""
echo "💡 Tip: Modify these examples for your use case"
echo "📖 See API.md for complete documentation"
