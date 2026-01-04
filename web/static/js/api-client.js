/**
 * API Client - Handles all HTTP requests to the Flask backend
 */

const API_BASE = '';

class APIClient {
    
    // ========================================
    // Zone Control
    // ========================================
    
    async playZone(zoneId, source, geometry = null, volume = null, loop = null) {
        const data = { source };
        if (geometry) data.geometry = geometry;
        if (volume !== null) data.volume = volume;
        if (loop !== null) data.loop = loop;
        
        return await this._post(`/api/zone/${zoneId}/play`, data);
    }
    
    async stopZone(zoneId) {
        return await this._post(`/api/zone/${zoneId}/stop`);
    }
    
    async stopAll() {
        return await this._post('/api/stop-all');
    }
    
    async pauseZone(zoneId) {
        return await this._post(`/api/zone/${zoneId}/pause`);
    }
    
    async seekZone(zoneId, seconds) {
        return await this._post(`/api/zone/${zoneId}/seek`, { seconds });
    }
    
    async setZoneVolume(zoneId, volume) {
        return await this._post(`/api/zone/${zoneId}/volume`, { volume });
    }
    
    async updateZoneGeometry(zoneId, geometry) {
        return await this._post(`/api/zone/${zoneId}/geometry`, geometry);
    }
    
    async getStatus() {
        return await this._get('/api/status');
    }
    
    async getZoneStatus(zoneId) {
        return await this._get(`/api/zone/${zoneId}/status`);
    }
    
    // ========================================
    // Presets
    // ========================================
    
    async listPresets() {
        return await this._get('/api/presets');
    }
    
    async getPreset(name) {
        return await this._get(`/api/presets/${name}`);
    }
    
    async savePreset(name, zone1Geometry, zone2Geometry, description = '') {
        return await this._post('/api/presets', {
            name,
            description,
            zone1: zone1Geometry,
            zone2: zone2Geometry
        });
    }
    
    async loadPreset(name) {
        return await this._post(`/api/presets/${name}/load`);
    }
    
    async deletePreset(name) {
        return await this._delete(`/api/presets/${name}`);
    }
    
    // ========================================
    // File Management
    // ========================================
    
    async listFiles() {
        return await this._get('/api/files');
    }
    
    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            
            xhr.open('POST', `${API_BASE}/api/upload`);
            xhr.send(formData);
        });
    }
    
    async deleteFile(filename) {
        return await this._delete(`/api/files/${filename}`);
    }
    
    // ========================================
    // Display Configuration
    // ========================================
    
    async setDisplayResolution(width, height) {
        return await this._post('/api/display/resolution', { width, height });
    }
    
    async getDisplayResolution() {
        return await this._get('/api/display/resolution');
    }
    
    // ========================================
    // Helper Methods
    // ========================================
    
    async _get(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }
    
    async _post(endpoint, data = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    }
    
    async _delete(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }
}

// Create global API client instance
const api = new APIClient();

// ========================================
// UI Event Handlers
// ========================================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing dashboard...');
    
    // Load initial data
    await Promise.all([
        loadFiles(),
        loadPresets(),
        updateStatus()
    ]);
    
    // Set up event listeners
    setupEventListeners();
    
    // Start status polling
    setInterval(updateStatus, 2000);
    
    console.log('✅ Dashboard ready');
});

function setupEventListeners() {
    // Source type toggles
    document.getElementById('zone1-source-type').addEventListener('change', (e) => {
        toggleSourceType(1, e.target.value);
    });
    
    document.getElementById('zone2-source-type').addEventListener('change', (e) => {
        toggleSourceType(2, e.target.value);
    });
    
    // Play buttons
    document.getElementById('zone1-play-btn').addEventListener('click', () => playZone(1));
    document.getElementById('zone2-play-btn').addEventListener('click', () => playZone(2));
    
    // Stop buttons
    document.getElementById('zone1-stop-btn').addEventListener('click', () => stopZone(1));
    document.getElementById('zone2-stop-btn').addEventListener('click', () => stopZone(2));
    document.getElementById('stop-all-btn').addEventListener('click', stopAll);
    
    // Pause buttons
    document.getElementById('zone1-pause-btn').addEventListener('click', () => pauseZone(1));
    document.getElementById('zone2-pause-btn').addEventListener('click', () => pauseZone(2));
    
    // Seek buttons
    document.getElementById('zone1-seek-back-btn').addEventListener('click', () => seekZone(1, -10));
    document.getElementById('zone1-seek-forward-btn').addEventListener('click', () => seekZone(1, 10));
    document.getElementById('zone2-seek-back-btn').addEventListener('click', () => seekZone(2, -10));
    document.getElementById('zone2-seek-forward-btn').addEventListener('click', () => seekZone(2, 10));
    
    // Volume sliders
    document.getElementById('zone1-volume').addEventListener('input', (e) => {
        document.getElementById('zone1-volume-value').textContent = e.target.value;
    });
    
    document.getElementById('zone1-volume').addEventListener('change', async (e) => {
        await api.setZoneVolume(1, parseInt(e.target.value));
    });
    
    document.getElementById('zone2-volume').addEventListener('input', (e) => {
        document.getElementById('zone2-volume-value').textContent = e.target.value;
    });
    
    document.getElementById('zone2-volume').addEventListener('change', async (e) => {
        await api.setZoneVolume(2, parseInt(e.target.value));
    });
    
    // Geometry buttons
    document.getElementById('zone1-apply-geometry-btn').addEventListener('click', () => applyGeometry(1));
    document.getElementById('zone2-apply-geometry-btn').addEventListener('click', () => applyGeometry(2));
    
    // Geometry inputs - sync with canvas
    ['zone1', 'zone2'].forEach(zone => {
        ['x', 'y', 'width', 'height'].forEach(param => {
            document.getElementById(`${zone}-${param}`).addEventListener('change', () => {
                syncGeometryToCanvas();
            });
        });
    });
    
    // Display resolution
    document.getElementById('update-resolution-btn').addEventListener('click', updateDisplayResolution);
    
    // File upload
    document.getElementById('upload-btn').addEventListener('click', () => {
        document.getElementById('file-upload-input').click();
    });
    
    document.getElementById('file-upload-input').addEventListener('change', handleFileUpload);
    
    // Preset save
    document.getElementById('save-preset-btn').addEventListener('click', saveCurrentPreset);
}

function toggleSourceType(zoneId, type) {
    const fileSelect = document.getElementById(`zone${zoneId}-file-select`);
    const rtspInput = document.getElementById(`zone${zoneId}-rtsp-input`);
    
    if (type === 'file') {
        fileSelect.style.display = 'block';
        rtspInput.style.display = 'none';
    } else {
        fileSelect.style.display = 'none';
        rtspInput.style.display = 'block';
    }
}

async function playZone(zoneId) {
    const sourceType = document.getElementById(`zone${zoneId}-source-type`).value;
    let source;
    
    if (sourceType === 'file') {
        source = document.getElementById(`zone${zoneId}-file-select`).value;
        if (!source) {
            alert('Please select a file');
            return;
        }
    } else {
        source = document.getElementById(`zone${zoneId}-rtsp-input`).value;
        if (!source) {
            alert('Please enter RTSP URL');
            return;
        }
    }
    
    const geometry = getGeometry(zoneId);
    const volume = parseInt(document.getElementById(`zone${zoneId}-volume`).value);
    const loop = document.getElementById(`zone${zoneId}-loop`).checked;
    
    try {
        await api.playZone(zoneId, source, geometry, volume, loop);
        console.log(`✅ Zone ${zoneId} started`);
    } catch (error) {
        alert(`Failed to start zone ${zoneId}: ${error.message}`);
    }
}

async function stopZone(zoneId) {
    await api.stopZone(zoneId);
    console.log(`⏹ Zone ${zoneId} stopped`);
}

async function stopAll() {
    await api.stopAll();
    console.log('⏹ All zones stopped');
}

async function pauseZone(zoneId) {
    await api.pauseZone(zoneId);
}

async function seekZone(zoneId, seconds) {
    await api.seekZone(zoneId, seconds);
}

async function applyGeometry(zoneId) {
    const geometry = getGeometry(zoneId);
    try {
        await api.updateZoneGeometry(zoneId, geometry);
        console.log(`✅ Zone ${zoneId} geometry updated`);
    } catch (error) {
        alert(`Failed to update geometry: ${error.message}`);
    }
}

function getGeometry(zoneId) {
    return {
        x: parseInt(document.getElementById(`zone${zoneId}-x`).value),
        y: parseInt(document.getElementById(`zone${zoneId}-y`).value),
        width: parseInt(document.getElementById(`zone${zoneId}-width`).value),
        height: parseInt(document.getElementById(`zone${zoneId}-height`).value)
    };
}

function setGeometry(zoneId, geometry) {
    document.getElementById(`zone${zoneId}-x`).value = geometry.x;
    document.getElementById(`zone${zoneId}-y`).value = geometry.y;
    document.getElementById(`zone${zoneId}-width`).value = geometry.width;
    document.getElementById(`zone${zoneId}-height`).value = geometry.height;
}

async function updateStatus() {
    try {
        const status = await api.getStatus();
        
        // Update zone status indicators
        updateZoneStatusIndicator(1, status.zone1.running);
        updateZoneStatusIndicator(2, status.zone2.running);
        
    } catch (error) {
        console.error('Status update failed:', error);
    }
}

function updateZoneStatusIndicator(zoneId, isRunning) {
    const statusDot = document.getElementById(`zone${zoneId}-status`);
    if (isRunning) {
        statusDot.classList.add('active');
    } else {
        statusDot.classList.remove('active');
    }
}

async function loadFiles() {
    try {
        const response = await api.listFiles();
        const fileList = document.getElementById('file-list');
        
        fileList.innerHTML = '';
        
        response.files.forEach(file => {
            const fileItem = createFileItem(file);
            fileList.appendChild(fileItem);
        });
        
        // Update file selects
        updateFileSelects(response.files);
        
    } catch (error) {
        console.error('Failed to load files:', error);
    }
}

function createFileItem(file) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const sizeKB = (file.size / 1024).toFixed(1);
    
    div.innerHTML = `
        <div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${sizeKB} KB</div>
        </div>
        <div class="file-actions">
            <button class="file-delete" onclick="deleteFile('${file.name}')">Delete</button>
        </div>
    `;
    
    return div;
}

function updateFileSelects(files) {
    ['zone1-file-select', 'zone2-file-select'].forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">-- Select File --</option>';
        
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = file.name;
            select.appendChild(option);
        });
        
        // Restore selection if still exists
        if (currentValue && files.find(f => f.name === currentValue)) {
            select.value = currentValue;
        }
    });
}

async function deleteFile(filename) {
    if (!confirm(`Delete ${filename}?`)) return;
    
    try {
        await api.deleteFile(filename);
        await loadFiles();
        console.log(`🗑️ Deleted ${filename}`);
    } catch (error) {
        alert(`Failed to delete file: ${error.message}`);
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const progressDiv = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('upload-status');
    
    progressDiv.style.display = 'block';
    
    try {
        await api.uploadFile(file, (percent) => {
            progressFill.style.width = `${percent}%`;
            statusText.textContent = `Uploading... ${Math.round(percent)}%`;
        });
        
        statusText.textContent = 'Upload complete!';
        setTimeout(() => {
            progressDiv.style.display = 'none';
            progressFill.style.width = '0%';
        }, 1000);
        
        await loadFiles();
        
    } catch (error) {
        alert(`Upload failed: ${error.message}`);
        progressDiv.style.display = 'none';
    }
    
    // Reset file input
    event.target.value = '';
}

async function loadPresets() {
    try {
        const response = await api.listPresets();
        const presetList = document.getElementById('preset-list');
        
        presetList.innerHTML = '';
        
        response.presets.forEach(preset => {
            const presetItem = createPresetItem(preset);
            presetList.appendChild(presetItem);
        });
        
    } catch (error) {
        console.error('Failed to load presets:', error);
    }
}

function createPresetItem(preset) {
    const div = document.createElement('div');
    div.className = 'preset-item';
    
    div.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-desc">${preset.description || 'No description'}</div>
        <div class="preset-actions">
            <button class="btn btn-primary btn-small" onclick="applyPreset('${preset.name}')">Load</button>
            <button class="btn btn-danger btn-small" onclick="deletePresetConfirm('${preset.name}')">Delete</button>
        </div>
    `;
    
    return div;
}

async function applyPreset(name) {
    try {
        const result = await api.loadPreset(name);
        
        // Update UI with loaded geometry
        setGeometry(1, result.geometry.zone1);
        setGeometry(2, result.geometry.zone2);
        
        // Update canvas
        syncGeometryToCanvas();
        
        console.log(`✅ Loaded preset: ${name}`);
    } catch (error) {
        alert(`Failed to load preset: ${error.message}`);
    }
}

async function applyPresetLayout(presetName) {
    await applyPreset(presetName);
}

async function deletePresetConfirm(name) {
    if (!confirm(`Delete preset "${name}"?`)) return;
    
    try {
        await api.deletePreset(name);
        await loadPresets();
        console.log(`🗑️ Deleted preset: ${name}`);
    } catch (error) {
        alert(`Failed to delete preset: ${error.message}`);
    }
}

async function saveCurrentPreset() {
    const name = document.getElementById('preset-name-input').value.trim();
    const description = document.getElementById('preset-desc-input').value.trim();
    
    if (!name) {
        alert('Please enter a preset name');
        return;
    }
    
    const zone1Geometry = getGeometry(1);
    const zone2Geometry = getGeometry(2);
    
    try {
        await api.savePreset(name, zone1Geometry, zone2Geometry, description);
        
        // Clear inputs
        document.getElementById('preset-name-input').value = '';
        document.getElementById('preset-desc-input').value = '';
        
        await loadPresets();
        
        console.log(`✅ Saved preset: ${name}`);
    } catch (error) {
        alert(`Failed to save preset: ${error.message}`);
    }
}

async function updateDisplayResolution() {
    const width = parseInt(document.getElementById('display-width').value);
    const height = parseInt(document.getElementById('display-height').value);
    
    try {
        await api.setDisplayResolution(width, height);
        
        // Update canvas display
        if (window.canvasController) {
            window.canvasController.setDisplayResolution(width, height);
        }
        
        console.log(`✅ Display resolution: ${width}x${height}`);
    } catch (error) {
        alert(`Failed to update resolution: ${error.message}`);
    }
}

// Helper function to sync geometry from inputs to canvas
function syncGeometryToCanvas() {
    if (window.canvasController) {
        const zone1 = getGeometry(1);
        const zone2 = getGeometry(2);
        window.canvasController.updateZones(zone1, zone2);
    }
}
