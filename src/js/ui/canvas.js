class DrawingSurface {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.pixelsPerFoot = options.pixelsPerFoot || 20;
    this.pan = { x: 0, y: 0 };
    this.zoom = 1;
    this.layers = [];
    
    // Initialize drawing surface
    this.setupCanvas();
    this.setupEventListeners();
    
    // Make sure we're properly zoomed to see the grid
    logger.log('Initial drawing surface setup with zoom:', this.zoom);
  }
  
  setupCanvas() {
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Ensure we have valid dimensions
    if (rect.width === 0 || rect.height === 0) {
      logger.warn('Canvas has zero dimensions, using fallback values');
      this.canvas.width = 800 * dpr;
      this.canvas.height = 600 * dpr;
      this.canvas.style.width = '800px';
      this.canvas.style.height = '600px';
    } else {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      
      // Set canvas size in CSS
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
    }
    
    // Center the view
    this.pan.x = this.canvas.width / (2 * dpr);
    this.pan.y = this.canvas.height / (2 * dpr);
    
    logger.log('Canvas setup complete:', {
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: dpr,
      pan: this.pan
    });
  }
  
  addLayer(layer) {
    this.layers.push(layer);
    layer.surface = this;
    this.layers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    return this;
  }
  
  removeLayer(layer) {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
    }
    return this;
  }
  
  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }
  
  draw() {
    // Throttle redraws for performance
    if (this._drawPending) return this;
    this._drawPending = true;
    
    requestAnimationFrame(() => {
      this._drawPending = false;
      this._performDraw();
    });
    
    return this;
  }
  
  _performDraw() {
    this.clear();
    
    this.ctx.save();
    this.ctx.translate(this.pan.x, this.pan.y);
    this.ctx.scale(this.zoom, this.zoom);
    
    // Only draw visible layers
    this.layers.forEach(layer => {
      if (layer.visible && this._isLayerInView(layer)) {
        this.ctx.save();
        layer.draw(this.ctx);
        this.ctx.restore();
      }
    });
    
    this.ctx.restore();
  }
  
  _isLayerInView(layer) {
    // Simple viewport culling - always draw for now
    // Could be optimized for large drawings
    return true;
  }
  
  setupEventListeners() {
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;
    
    // Detect if using a touch device
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isTouchDevice) {
      document.body.classList.add('touch-device');
    }
    
    // Mobile drawing state tracking
    this.isDrawingMode = false;
    this.drawingTouchId = null;
    
    // Mouse events for drawing and panning
    this.canvas.addEventListener('mousedown', (e) => {
      // Handle drawing with left mouse button
      if (e.button === 0) {
        // Find the footprint layer and delegate drawing
        const footprintLayer = this.layers.find(l => l.id === 'footprint');
        if (footprintLayer && footprintLayer.handleMouseDown) {
          const handled = footprintLayer.handleMouseDown(e);
          if (handled) {
            e.preventDefault();
            return;
          }
        }
      }
      
      // Only pan with middle mouse button or right-click + shift
      if (e.button === 1 || (e.button === 2 && e.shiftKey)) {
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        e.preventDefault();
      }
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      // Handle drawing mouse move
      const footprintLayer = this.layers.find(l => l.id === 'footprint');
      if (footprintLayer && footprintLayer.handleMouseMove) {
        footprintLayer.handleMouseMove(e);
      }
      
      // Handle panning
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        
        this.pan.x += dx;
        this.pan.y += dy;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        this.draw();
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      // Handle drawing mouse up
      const footprintLayer = this.layers.find(l => l.id === 'footprint');
      if (footprintLayer && footprintLayer.handleMouseUp) {
        footprintLayer.handleMouseUp(e);
      }
      
      isPanning = false;
    });
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const zoomSpeed = 0.1;
      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      
      const newZoom = Math.max(0.25, Math.min(8, this.zoom + delta));
      
      // Zoom towards mouse position
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - this.pan.x) / this.zoom;
      const worldY = (mouseY - this.pan.y) / this.zoom;
      
      this.zoom = newZoom;
      
      this.pan.x = mouseX - worldX * this.zoom;
      this.pan.y = mouseY - worldY * this.zoom;
      
      this.draw();
    });
    
    // Touch events for panning (one finger) - only when not drawing
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !this.isDrawingMode) {
        isPanning = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (isPanning && e.touches.length === 1 && !this.isDrawingMode) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        
        this.pan.x += dx;
        this.pan.y += dy;
        
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        
        this.draw();
        e.preventDefault(); // Prevent scrolling while panning
      }
    });
    
    this.canvas.addEventListener('touchend', () => {
      isPanning = false;
    });
    
    // Pinch-to-zoom (two fingers)
    let initialPinchDistance = 0;
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialPinchDistance = this.getPinchDistance(e);
      }
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const currentDistance = this.getPinchDistance(e);
        const pinchRatio = currentDistance / initialPinchDistance;
        
        if (Math.abs(pinchRatio - 1) > 0.05) {
          const zoomSpeed = 0.05;
          const delta = pinchRatio > 1 ? zoomSpeed : -zoomSpeed;
          const newZoom = Math.max(0.25, Math.min(8, this.zoom + delta));
          
          // Zoom towards center of pinch
          const rect = this.canvas.getBoundingClientRect();
          const touchX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const touchY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          
          const worldX = (touchX - this.pan.x) / this.zoom;
          const worldY = (touchY - this.pan.y) / this.zoom;
          
          this.zoom = newZoom;
          
          this.pan.x = touchX - worldX * this.zoom;
          this.pan.y = touchY - worldY * this.zoom;
          
          initialPinchDistance = currentDistance;
          this.draw();
          e.preventDefault();
        }
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.draw();
    });
  }
  
  /**
   * Helper function to calculate distance between two touch points
   */
  getPinchDistance(e) {
    return Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
  
  toWorldCoords(screenX, screenY) {
    return {
      x: (screenX - this.pan.x) / this.zoom,
      y: (screenY - this.pan.y) / this.zoom
    };
  }
  
  toScreenCoords(worldX, worldY) {
    return {
      x: worldX * this.zoom + this.pan.x,
      y: worldY * this.zoom + this.pan.y
    };
  }
  
  feetToPixels(feet) {
    return feet * this.pixelsPerFoot;
  }
  
  pixelsToFeet(pixels) {
    return pixels / this.pixelsPerFoot;
  }
  
  setDrawingMode(enabled) {
    this.isDrawingMode = enabled;
    logger.log('Drawing mode set to:', enabled);
    
    // Add visual feedback for drawing mode
    if (enabled) {
      document.body.classList.add('drawing-active');
    } else {
      document.body.classList.remove('drawing-active');
    }
  }
}

// Make DrawingSurface available globally
window.DrawingSurface = DrawingSurface;