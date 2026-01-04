  # HTTP API Documentation

Complete reference for the Raspberry Pi Dual-Zone Video Player HTTP API.

**Base URL:** `http://[pi-ip]:5000`

**Content-Type:** `application/json` (for POST requests)

---

## Zone Control Endpoints

### Play Zone

Start playback in a specified zone.

**Endpoint:** `POST /api/zone/{zone_id}/play`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Request Body:**
```json
{
  "source": "video.mp4",  // Filename or full RTSP URL
  "geometry": {           // Optional
    "x": 0,
    "y": 0,
    "width": 960,
    "height": 1080
  },
  "volume": 50,           // Optional, 0-100
  "loop": true            // Optional, boolean
}
```

**Response:**
```json
{
  "success": true,
  "zone_id": 1,
  "source": "video.mp4",
  "status": {
    "zone_id": 1,
    "running": true,
    "source": "/opt/rpi-video-player/data/videos/video.mp4",
    "paused": false,
    "volume": 50,
    "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
    "loop": true
  }
}
```

**Examples:**

Local file:
```bash
curl -X POST http://localhost:5000/api/zone/1/play \
  -H "Content-Type: application/json" \
  -d '{
    "source": "video.mp4",
    "volume": 75
  }'
```

RTSP stream with custom geometry:
```bash
curl -X POST http://localhost:5000/api/zone/2/play \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rtsp://192.168.1.100:554/stream",
    "geometry": {"x": 960, "y": 0, "width": 960, "height": 1080},
    "volume": 60,
    "loop": false
  }'
```

---

### Stop Zone

Stop playback in a specified zone.

**Endpoint:** `POST /api/zone/{zone_id}/stop`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Response:**
```json
{
  "success": true,
  "zone_id": 1
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/zone/1/stop
```

---

### Stop All Zones

Stop playback in all zones (screen goes black).

**Endpoint:** `POST /api/stop-all`

**Response:**
```json
{
  "success": true,
  "message": "All zones stopped"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/stop-all
```

---

### Pause Zone

Toggle pause/unpause for a zone.

**Endpoint:** `POST /api/zone/{zone_id}/pause`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Response:**
```json
{
  "success": true,
  "zone_id": 1,
  "paused": true
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/zone/1/pause
```

---

### Seek Zone

Seek forward or backward in a zone.

**Endpoint:** `POST /api/zone/{zone_id}/seek`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Request Body:**
```json
{
  "seconds": 10  // Positive = forward, negative = backward
}
```

**Response:**
```json
{
  "success": true,
  "zone_id": 1,
  "seeked": 10
}
```

**Examples:**

Seek forward 10 seconds:
```bash
curl -X POST http://localhost:5000/api/zone/1/seek \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10}'
```

Seek backward 30 seconds:
```bash
curl -X POST http://localhost:5000/api/zone/1/seek \
  -H "Content-Type: application/json" \
  -d '{"seconds": -30}'
```

---

### Set Zone Volume

Set volume for a specific zone.

**Endpoint:** `POST /api/zone/{zone_id}/volume`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Request Body:**
```json
{
  "volume": 75  // 0-100
}
```

**Response:**
```json
{
  "success": true,
  "zone_id": 1,
  "volume": 75
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/zone/1/volume \
  -H "Content-Type: application/json" \
  -d '{"volume": 75}'
```

---

### Update Zone Geometry

Update position and size of a zone.

**Endpoint:** `POST /api/zone/{zone_id}/geometry`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Request Body:**
```json
{
  "x": 100,        // Optional
  "y": 200,        // Optional
  "width": 800,    // Optional
  "height": 600    // Optional
}
```

**Response:**
```json
{
  "success": true,
  "zone_id": 1,
  "geometry": {
    "x": 100,
    "y": 200,
    "width": 800,
    "height": 600
  }
}
```

**Note:** In DRM/KMS mode, changing geometry requires restarting playback. The system will automatically restart the zone with new geometry if content is currently playing.

**Example:**
```bash
curl -X POST http://localhost:5000/api/zone/1/geometry \
  -H "Content-Type: application/json" \
  -d '{
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  }'
```

---

### Get System Status

Get status of all zones and display configuration.

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "zone1": {
    "zone_id": 1,
    "running": true,
    "source": "/opt/rpi-video-player/data/videos/video.mp4",
    "paused": false,
    "volume": 50,
    "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
    "loop": true
  },
  "zone2": {
    "zone_id": 2,
    "running": false,
    "source": null,
    "paused": false,
    "volume": 50,
    "geometry": {"x": 960, "y": 0, "width": 960, "height": 1080},
    "loop": true
  },
  "display": {
    "width": 1920,
    "height": 1080
  }
}
```

**Example:**
```bash
curl http://localhost:5000/api/status
```

---

### Get Zone Status

Get status of a specific zone.

**Endpoint:** `GET /api/zone/{zone_id}/status`

**Parameters:**
- `zone_id` (path): Zone number (1 or 2)

**Response:**
```json
{
  "zone_id": 1,
  "running": true,
  "source": "/opt/rpi-video-player/data/videos/video.mp4",
  "paused": false,
  "volume": 50,
  "geometry": {"x": 0, "y": 0, "width": 960, "height": 1080},
  "loop": true
}
```

**Example:**
```bash
curl http://localhost:5000/api/zone/1/status
```

---

## Preset Endpoints

### List Presets

Get list of all saved presets.

**Endpoint:** `GET /api/presets`

**Response:**
```json
{
  "presets": [
    {
      "name": "side-by-side",
      "description": "Side by side split (50/50)",
      "created": "2025-01-04T12:00:00"
    },
    {
      "name": "my-led-wall",
      "description": "Custom LED wall layout",
      "created": "2025-01-04T13:30:00"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/api/presets
```

---

### Get Preset Details

Get full details of a specific preset.

**Endpoint:** `GET /api/presets/{preset_name}`

**Parameters:**
- `preset_name` (path): Name of the preset

**Response:**
```json
{
  "name": "side-by-side",
  "description": "Side by side split (50/50)",
  "created": "2025-01-04T12:00:00",
  "zone1": {"x": 0, "y": 0, "width": 960, "height": 1080},
  "zone2": {"x": 960, "y": 0, "width": 960, "height": 1080}
}
```

**Example:**
```bash
curl http://localhost:5000/api/presets/side-by-side
```

---

### Save Preset

Save current zone geometry as a preset.

**Endpoint:** `POST /api/presets`

**Request Body:**
```json
{
  "name": "my-layout",
  "description": "My custom layout",  // Optional
  "zone1": {"x": 0, "y": 0, "width": 960, "height": 1080},
  "zone2": {"x": 960, "y": 0, "width": 960, "height": 1080}
}
```

**Response:**
```json
{
  "success": true,
  "name": "my-layout",
  "message": "Preset saved successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-layout",
    "description": "Custom LED wall configuration",
    "zone1": {"x": 0, "y": 0, "width": 1280, "height": 1080},
    "zone2": {"x": 1280, "y": 0, "width": 640, "height": 1080}
  }'
```

---

### Load Preset

Load and apply a saved preset.

**Endpoint:** `POST /api/presets/{preset_name}/load`

**Parameters:**
- `preset_name` (path): Name of the preset to load

**Response:**
```json
{
  "success": true,
  "preset": "side-by-side",
  "geometry": {
    "zone1": {"x": 0, "y": 0, "width": 960, "height": 1080},
    "zone2": {"x": 960, "y": 0, "width": 960, "height": 1080},
    "description": "Side by side split (50/50)"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/presets/side-by-side/load
```

---

### Delete Preset

Delete a saved preset.

**Endpoint:** `DELETE /api/presets/{preset_name}`

**Parameters:**
- `preset_name` (path): Name of the preset to delete

**Response:**
```json
{
  "success": true,
  "message": "Preset my-layout deleted"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/presets/my-layout
```

---

## File Management Endpoints

### List Files

Get list of all uploaded video files.

**Endpoint:** `GET /api/files`

**Response:**
```json
{
  "files": [
    {
      "name": "video1.mp4",
      "path": "/opt/rpi-video-player/data/videos/video1.mp4",
      "size": 52428800,
      "modified": 1704384000.0
    },
    {
      "name": "video2.mkv",
      "path": "/opt/rpi-video-player/data/videos/video2.mkv",
      "size": 104857600,
      "modified": 1704384100.0
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/api/files
```

---

### Upload File

Upload a video file.

**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request:** Form data with file field named "file"

**Response:**
```json
{
  "success": true,
  "filename": "video.mp4",
  "path": "/opt/rpi-video-player/data/videos/video.mp4"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@/path/to/video.mp4"
```

---

### Delete File

Delete an uploaded video file.

**Endpoint:** `DELETE /api/files/{filename}`

**Parameters:**
- `filename` (path): Name of the file to delete

**Response:**
```json
{
  "success": true,
  "message": "File video.mp4 deleted"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/files/video.mp4
```

---

## Display Configuration Endpoints

### Set Display Resolution

Configure the display resolution for geometry calculations.

**Endpoint:** `POST /api/display/resolution`

**Request Body:**
```json
{
  "width": 3840,
  "height": 1080
}
```

**Response:**
```json
{
  "success": true,
  "resolution": {
    "width": 3840,
    "height": 1080
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/display/resolution \
  -H "Content-Type: application/json" \
  -d '{"width": 3840, "height": 1080}'
```

---

### Get Display Resolution

Get current display resolution.

**Endpoint:** `GET /api/display/resolution`

**Response:**
```json
{
  "width": 1920,
  "height": 1080
}
```

**Example:**
```bash
curl http://localhost:5000/api/display/resolution
```

---

## System Endpoints

### Health Check

Check if the system is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "zones_active": {
    "zone1": true,
    "zone2": false
  }
}
```

**Example:**
```bash
curl http://localhost:5000/api/health
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Not found (file/preset doesn't exist)
- `500`: Server error

---

## Integration Examples

### Python Script

```python
import requests

API_BASE = "http://192.168.1.100:5000"

# Play video in zone 1
response = requests.post(f"{API_BASE}/api/zone/1/play", json={
    "source": "video.mp4",
    "geometry": {"x": 0, "y": 0, "width": 1920, "height": 1080},
    "volume": 75
})

print(response.json())

# Get status
status = requests.get(f"{API_BASE}/api/status").json()
print(f"Zone 1 running: {status['zone1']['running']}")
```

### Bash Script

```bash
#!/bin/bash
API="http://192.168.1.100:5000"

# Start zone 1 with RTSP stream
curl -X POST "$API/api/zone/1/play" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rtsp://camera1/stream",
    "geometry": {"x": 0, "y": 0, "width": 1920, "height": 540}
  }'

# Start zone 2 with different stream
curl -X POST "$API/api/zone/2/play" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rtsp://camera2/stream",
    "geometry": {"x": 0, "y": 540, "width": 1920, "height": 540}
  }'

# Check status
curl "$API/api/status" | jq .
```

### Node.js Script

```javascript
const axios = require('axios');

const API_BASE = 'http://192.168.1.100:5000';

async function playZone(zoneId, source, geometry) {
  const response = await axios.post(`${API_BASE}/api/zone/${zoneId}/play`, {
    source,
    geometry,
    volume: 75,
    loop: true
  });
  
  console.log(response.data);
}

async function getStatus() {
  const response = await axios.get(`${API_BASE}/api/status`);
  return response.data;
}

// Example usage
playZone(1, 'video.mp4', {x: 0, y: 0, width: 1920, height: 1080});
```

---

## Rate Limiting

Currently no rate limiting is implemented. Use responsibly.

## Authentication

Currently no authentication required. Ensure network security if exposing to untrusted networks.

---

**Version:** 1.0  
**Last Updated:** January 2025
