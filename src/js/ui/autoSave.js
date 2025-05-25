// Auto-save system for DeckPro
class AutoSave {
  constructor(store, persistence, interval = 30000) { // 30 seconds
    this.store = store;
    this.persistence = persistence;
    this.interval = interval;
    this.lastSaveState = null;
    this.saveTimer = null;
    this.isEnabled = true;
    
    this.init();
  }

  init() {
    // Load previous state on startup
    this.loadState();
    
    // Start auto-save timer
    this.startAutoSave();
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      this.saveNow();
    });
    
    // Save on visibility change (mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveNow();
      }
    });
  }

  startAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    
    this.saveTimer = setInterval(() => {
      if (this.isEnabled) {
        this.checkAndSave();
      }
    }, this.interval);
  }

  checkAndSave() {
    const currentState = this.store.getState();
    
    // Only save if state has changed
    if (this.hasStateChanged(currentState)) {
      this.saveState(currentState);
      this.lastSaveState = this.deepClone(currentState);
      
      // Show subtle save indicator
      this.showSaveIndicator();
    }
  }

  hasStateChanged(currentState) {
    if (!this.lastSaveState) return true;
    
    // Compare relevant state properties
    const current = {
      footprint: currentState.footprint,
      context: currentState.context,
      engineOut: currentState.engineOut
    };
    
    const last = {
      footprint: this.lastSaveState.footprint,
      context: this.lastSaveState.context,
      engineOut: this.lastSaveState.engineOut
    };
    
    return JSON.stringify(current) !== JSON.stringify(last);
  }

  saveState(state) {
    try {
      const success = this.persistence.save({
        ...state,
        lastModified: new Date().toISOString(),
        version: '1.0.0-beta'
      });
      
      if (success) {
        logger.log('Auto-save successful');
      }
    } catch (error) {
      logger.error('Auto-save failed:', error);
    }
  }

  saveNow() {
    const currentState = this.store.getState();
    this.saveState(currentState);
    this.lastSaveState = this.deepClone(currentState);
  }

  loadState() {
    try {
      const savedState = this.persistence.load();
      if (savedState && savedState.footprint) {
        // Restore state
        this.store.setState(savedState);
        this.lastSaveState = this.deepClone(savedState);
        
        // Trigger UI updates
        eventBus.emit('footprint:change', savedState.footprint);
        if (savedState.context) {
          eventBus.emit('context:change', savedState.context);
        }
        
        if (window.showToast) {
          showToast('Previous session restored', 'info');
        }
        
        logger.log('State restored from auto-save');
      }
    } catch (error) {
      logger.error('Failed to load saved state:', error);
    }
  }

  showSaveIndicator() {
    // Create temporary save indicator
    const indicator = document.createElement('div');
    indicator.textContent = '✓ Saved';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #10B981;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // Animate in
    requestAnimationFrame(() => {
      indicator.style.opacity = '1';
    });
    
    // Remove after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 2000);
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  enable() {
    this.isEnabled = true;
    if (!this.saveTimer) {
      this.startAutoSave();
    }
  }

  disable() {
    this.isEnabled = false;
  }

  destroy() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    this.isEnabled = false;
  }
}

window.AutoSave = AutoSave;