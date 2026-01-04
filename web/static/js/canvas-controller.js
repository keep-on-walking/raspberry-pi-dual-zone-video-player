/**
 * Canvas Controller - Interactive drag-and-drop zone positioning
 * Provides Resolume-style visual interface for LED wall configuration
 */

class CanvasController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Display resolution (actual output)
        this.displayWidth = 1920;
        this.displayHeight = 1080;
        
        // Canvas dimensions (UI representation)
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Scale factor between canvas and display
        this.scale = this.canvasWidth / this.displayWidth;
        
        // Zone data
        this.zones = {
            zone1: { x: 0, y: 0, width: 960, height: 1080, color: '#3b82f6' },
            zone2: { x: 960, y: 0, width: 960, height: 1080, color: '#f97316' }
        };
        
        // Interaction state
        this.dragging = null;
        this.resizing = null;
        this.dragStart = { x: 0, y: 0 };
        this.zoneStart = { x: 0, y: 0, width: 0, height: 0 };
        
        // Resize handle size
        this.handleSize = 12;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Update cursor based on hover
        this.canvas.addEventListener('mousemove', (e) => this.updateCursor(e));
    }
    
    setDisplayResolution(width, height) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.scale = this.canvasWidth / this.displayWidth;
        this.render();
    }
    
    updateZones(zone1Geometry, zone2Geometry) {
        this.zones.zone1 = { ...this.zones.zone1, ...zone1Geometry };
        this.zones.zone2 = { ...this.zones.zone2, ...zone2Geometry };
        this.render();
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.scale,
            y: (e.clientY - rect.top) / this.scale
        };
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        // Check if clicking on resize handle
        for (const [zoneName, zone] of Object.entries(this.zones)) {
            const handle = this.getResizeHandle(zone, pos);
            if (handle) {
                this.resizing = { zone: zoneName, handle };
                this.dragStart = pos;
                this.zoneStart = { ...zone };
                return;
            }
        }
        
        // Check if clicking inside a zone (for dragging)
        // Check zone2 first (top layer)
        for (const zoneName of ['zone2', 'zone1']) {
            const zone = this.zones[zoneName];
            if (this.isInsideZone(zone, pos)) {
                this.dragging = zoneName;
                this.dragStart = pos;
                this.zoneStart = { ...zone };
                return;
            }
        }
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.resizing) {
            this.handleResize(pos);
        } else if (this.dragging) {
            this.handleDrag(pos);
        }
    }
    
    handleMouseUp(e) {
        if (this.dragging) {
            // Update input fields
            this.syncZoneToInputs(this.dragging);
        }
        
        if (this.resizing) {
            // Update input fields
            this.syncZoneToInputs(this.resizing.zone);
        }
        
        this.dragging = null;
        this.resizing = null;
    }
    
    handleDrag(pos) {
        const zone = this.zones[this.dragging];
        
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        
        // Calculate new position
        let newX = Math.round(this.zoneStart.x + dx);
        let newY = Math.round(this.zoneStart.y + dy);
        
        // Constrain to display bounds
        newX = Math.max(0, Math.min(newX, this.displayWidth - zone.width));
        newY = Math.max(0, Math.min(newY, this.displayHeight - zone.height));
        
        zone.x = newX;
        zone.y = newY;
        
        this.render();
    }
    
    handleResize(pos) {
        const { zone: zoneName, handle } = this.resizing;
        const zone = this.zones[zoneName];
        
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        
        // Calculate new dimensions based on handle
        switch (handle) {
            case 'se': // Bottom-right
                zone.width = Math.max(100, Math.round(this.zoneStart.width + dx));
                zone.height = Math.max(100, Math.round(this.zoneStart.height + dy));
                break;
                
            case 'sw': // Bottom-left
                const newWidth = Math.max(100, Math.round(this.zoneStart.width - dx));
                const widthDiff = this.zoneStart.width - newWidth;
                zone.x = Math.round(this.zoneStart.x + widthDiff);
                zone.width = newWidth;
                zone.height = Math.max(100, Math.round(this.zoneStart.height + dy));
                break;
                
            case 'ne': // Top-right
                zone.width = Math.max(100, Math.round(this.zoneStart.width + dx));
                const newHeight = Math.max(100, Math.round(this.zoneStart.height - dy));
                const heightDiff = this.zoneStart.height - newHeight;
                zone.y = Math.round(this.zoneStart.y + heightDiff);
                zone.height = newHeight;
                break;
                
            case 'nw': // Top-left
                const newW = Math.max(100, Math.round(this.zoneStart.width - dx));
                const wDiff = this.zoneStart.width - newW;
                zone.x = Math.round(this.zoneStart.x + wDiff);
                zone.width = newW;
                
                const newH = Math.max(100, Math.round(this.zoneStart.height - dy));
                const hDiff = this.zoneStart.height - newH;
                zone.y = Math.round(this.zoneStart.y + hDiff);
                zone.height = newH;
                break;
        }
        
        // Constrain to display bounds
        if (zone.x + zone.width > this.displayWidth) {
            zone.width = this.displayWidth - zone.x;
        }
        if (zone.y + zone.height > this.displayHeight) {
            zone.height = this.displayHeight - zone.y;
        }
        
        this.render();
    }
    
    isInsideZone(zone, pos) {
        return pos.x >= zone.x &&
               pos.x <= zone.x + zone.width &&
               pos.y >= zone.y &&
               pos.y <= zone.y + zone.height;
    }
    
    getResizeHandle(zone, pos) {
        const handleRadius = this.handleSize / this.scale;
        
        const handles = {
            'nw': { x: zone.x, y: zone.y },
            'ne': { x: zone.x + zone.width, y: zone.y },
            'sw': { x: zone.x, y: zone.y + zone.height },
            'se': { x: zone.x + zone.width, y: zone.y + zone.height }
        };
        
        for (const [name, handle] of Object.entries(handles)) {
            const dist = Math.sqrt(
                Math.pow(pos.x - handle.x, 2) +
                Math.pow(pos.y - handle.y, 2)
            );
            
            if (dist <= handleRadius) {
                return name;
            }
        }
        
        return null;
    }
    
    updateCursor(e) {
        const pos = this.getMousePos(e);
        
        // Check for resize handles first
        for (const zone of Object.values(this.zones)) {
            const handle = this.getResizeHandle(zone, pos);
            if (handle) {
                const cursors = {
                    'nw': 'nw-resize',
                    'ne': 'ne-resize',
                    'sw': 'sw-resize',
                    'se': 'se-resize'
                };
                this.canvas.style.cursor = cursors[handle];
                return;
            }
        }
        
        // Check if inside a zone
        for (const zone of Object.values(this.zones)) {
            if (this.isInsideZone(zone, pos)) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        this.canvas.style.cursor = 'crosshair';
    }
    
    syncZoneToInputs(zoneName) {
        const zone = this.zones[zoneName];
        const zoneId = zoneName === 'zone1' ? 1 : 2;
        
        document.getElementById(`zone${zoneId}-x`).value = zone.x;
        document.getElementById(`zone${zoneId}-y`).value = zone.y;
        document.getElementById(`zone${zoneId}-width`).value = zone.width;
        document.getElementById(`zone${zoneId}-height`).value = zone.height;
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw grid
        this.drawGrid();
        
        // Draw zones (zone1 first, then zone2 on top)
        this.drawZone('zone1', this.zones.zone1);
        this.drawZone('zone2', this.zones.zone2);
        
        // Draw labels
        this.drawLabels();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 100; // 100px grid in display space
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.displayWidth; x += gridSize) {
            const canvasX = x * this.scale;
            ctx.beginPath();
            ctx.moveTo(canvasX, 0);
            ctx.lineTo(canvasX, this.canvasHeight);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.displayHeight; y += gridSize) {
            const canvasY = y * this.scale;
            ctx.beginPath();
            ctx.moveTo(0, canvasY);
            ctx.lineTo(this.canvasWidth, canvasY);
            ctx.stroke();
        }
    }
    
    drawZone(zoneName, zone) {
        const ctx = this.ctx;
        
        if (zone.width === 0 || zone.height === 0) {
            return; // Don't draw zero-size zones
        }
        
        const x = zone.x * this.scale;
        const y = zone.y * this.scale;
        const width = zone.width * this.scale;
        const height = zone.height * this.scale;
        
        // Draw filled rectangle with transparency
        ctx.fillStyle = zone.color + '40'; // 40 = 25% opacity
        ctx.fillRect(x, y, width, height);
        
        // Draw border
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw resize handles
        this.drawResizeHandles(zone);
        
        // Draw zone label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(zoneName.toUpperCase(), x + 10, y + 10);
        
        // Draw dimensions
        ctx.font = '12px sans-serif';
        ctx.fillText(`${zone.width}×${zone.height}`, x + 10, y + 30);
        ctx.fillText(`(${zone.x}, ${zone.y})`, x + 10, y + 45);
    }
    
    drawResizeHandles(zone) {
        const ctx = this.ctx;
        
        const handles = [
            { x: zone.x, y: zone.y }, // NW
            { x: zone.x + zone.width, y: zone.y }, // NE
            { x: zone.x, y: zone.y + zone.height }, // SW
            { x: zone.x + zone.width, y: zone.y + zone.height } // SE
        ];
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 2;
        
        handles.forEach(handle => {
            const cx = handle.x * this.scale;
            const cy = handle.y * this.scale;
            
            ctx.beginPath();
            ctx.arc(cx, cy, this.handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    drawLabels() {
        const ctx = this.ctx;
        
        // Draw display resolution in corner
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            `Display: ${this.displayWidth}×${this.displayHeight}`,
            this.canvasWidth - 10,
            this.canvasHeight - 10
        );
    }
}

// Initialize canvas controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.canvasController = new CanvasController('layout-canvas');
    
    // Sync initial geometry from inputs to canvas
    syncGeometryToCanvas();
});
