class ViewControls {
  constructor(store, drawingSurface, commandStack) {
    this.store = store;
    this.drawingSurface = drawingSurface;
    this.commandStack = commandStack;
    this.listeners = [];
  }

  addListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    this.listeners.push({ element, eventType, handler });
  }

  cleanupEventListeners() {
    this.listeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    this.listeners = [];
  }

  setupViewControls() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    if (zoomInBtn) {
      const handler = () => {
        this.drawingSurface.zoom = Math.min(8, this.drawingSurface.zoom * 1.2);
        this.drawingSurface.draw();
      };
      this.addListener(zoomInBtn, 'click', handler);
    }
    
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomOutBtn) {
      const handler = () => {
        this.drawingSurface.zoom = Math.max(0.25, this.drawingSurface.zoom / 1.2);
        this.drawingSurface.draw();
      };
      this.addListener(zoomOutBtn, 'click', handler);
    }
    
    const exportMenuEl = document.getElementById('export-menu');
    if (exportMenuEl) {
      const handler = (e) => {
        if (e.target.value) {
          eventBus.emit('canvas:export', { format: e.target.value });
          e.target.value = '';
        }
      };
      this.addListener(exportMenuEl, 'change', handler);
    }
  }
}

window.ViewControls = ViewControls;