class HeaderControls {
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

  setupHeaderControls() {
    logger.log('Setting up header controls');
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
      logger.log('New project button found');
      const handler = () => {
        logger.log('New project clicked');
        // Save current work first if auto-save is available
        if (window.autoSave) {
          window.autoSave.saveNow();
        }
        
        if (confirm('Start a new project? Current work has been auto-saved.')) {
          this.clearCanvas();
        }
      };
      this.addListener(newProjectBtn, 'click', handler);
      logger.log('New project button event listener added');
    } else {
      logger.error('New project button not found in DOM!');
    }
    
    const saveProjectBtn = document.getElementById('save-project-btn');
    if (saveProjectBtn) {
      const handler = () => {
        logger.log('Save project clicked');
        this.saveProject();
      };
      this.addListener(saveProjectBtn, 'click', handler);
    }
    
    const loadProjectBtn = document.getElementById('load-project-btn');
    if (loadProjectBtn) {
      const handler = () => {
        logger.log('Load project clicked');
        this.loadProject();
      };
      this.addListener(loadProjectBtn, 'click', handler);
    }
    
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      const handler = () => {
        logger.log('Help clicked');
        this.showHelpModal();
      };
      this.addListener(helpBtn, 'click', handler);
    }
    
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleSidebarBtn) {
      const handler = () => {
        logger.log('Toggle sidebar clicked');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) {
          sidebar.classList.toggle('visible');
          toggleSidebarBtn.classList.toggle('active');
          if (backdrop) {
            backdrop.classList.toggle('visible');
          }
        }
      };
      this.addListener(toggleSidebarBtn, 'click', handler);
    }
    
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      const handler = () => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar-btn');
        if (sidebar) {
          sidebar.classList.remove('visible');
          backdrop.classList.remove('visible');
          if (toggleBtn) toggleBtn.classList.remove('active');
        }
      };
      this.addListener(backdrop, 'click', handler);
    }
  }

  clearCanvas() {
    logger.log('HeaderControls: Clearing canvas');
    eventBus.emit('clear-canvas');
    this.store.setState({
      footprint: null,
      engineOut: null,
      history: [],
      future: []
    });
    if (this.commandStack) {
      this.commandStack.clear();
    }
    
    // Clear form inputs
    const widthInput = document.getElementById('width-ft');
    const lengthInput = document.getElementById('length-ft');
    if (widthInput) widthInput.value = '';
    if (lengthInput) lengthInput.value = '';
    
    // Update generate button state
    if (window.shadcnComponents && window.shadcnComponents.updateGenerateButton) {
      window.shadcnComponents.updateGenerateButton(false, 'Draw deck footprint first');
    }
    
    if (window.showToast) {
      showToast('New project started', 'success');
    }
  }

  showHelpModal() {
    // Create help modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transform: translateY(20px);
      transition: transform 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; color: #333;">DeckPro Designer Help</h2>
        <button id="help-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
      </div>
      <div style="line-height: 1.6; color: #555;">
        <h3 style="color: #333; margin-top: 0;">Getting Started</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Use the <strong>Rectangle tool</strong> to draw your deck outline on the canvas</li>
          <li>Enter dimensions directly in the <strong>Width</strong> and <strong>Length</strong> fields</li>
          <li>Configure your deck settings in the sidebar panels</li>
          <li>Click <strong>Generate Structure</strong> to create the framing plan</li>
          <li>View results in the <strong>Structure</strong>, <strong>Materials</strong>, and <strong>Estimate</strong> tabs</li>
        </ul>
        
        <h3 style="color: #333;">Tools & Controls</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Grid:</strong> Toggle visibility and snap-to-grid functionality</li>
          <li><strong>Zoom:</strong> Use zoom controls or mouse wheel to navigate</li>
          <li><strong>Export:</strong> Save your design as PNG or export materials as CSV</li>
          <li><strong>Undo/Redo:</strong> Use Ctrl+Z / Ctrl+Y or the toolbar buttons</li>
        </ul>

        <h3 style="color: #333;">Keyboard Shortcuts</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>R:</strong> Rectangle tool</li>
          <li><strong>Esc:</strong> Select tool</li>
          <li><strong>Ctrl+Z:</strong> Undo</li>
          <li><strong>Ctrl+Y:</strong> Redo</li>
        </ul>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'translateY(0)';
    });

    // Close handlers
    const closeModal = () => {
      overlay.style.opacity = '0';
      modal.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    };

    modal.querySelector('#help-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  saveProject() {
    try {
      const state = this.store.getState();
      const projectData = {
        ...state,
        projectName: 'Deck Project',
        savedAt: new Date().toISOString(),
        version: '1.0.0-beta'
      };

      if (typeof persistence !== 'undefined') {
        const success = persistence.save(projectData);
        if (success) {
          if (window.showToast) {
            showToast('Project saved successfully!', 'success');
          }
        } else {
          throw new Error('Failed to save to local storage');
        }
      } else {
        // Fallback: download as JSON file
        const json = JSON.stringify(projectData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `deck-project-${timestamp}.json`;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        if (window.showToast) {
          showToast('Project downloaded as JSON file!', 'success');
        }
      }
    } catch (error) {
      logger.error('Save failed:', error);
      if (window.showToast) {
        showToast(`Save failed: ${error.message}`, 'error');
      }
    }
  }

  loadProject() {
    try {
      if (typeof persistence !== 'undefined') {
        const savedData = persistence.load();
        if (savedData) {
          // Restore state
          this.store.setState(savedData);
          
          // Trigger UI updates
          if (savedData.footprint) {
            eventBus.emit('footprint:change', savedData.footprint);
          }
          if (savedData.context) {
            eventBus.emit('context:change', savedData.context);
          }
          
          if (window.showToast) {
            showToast('Project loaded successfully!', 'success');
          }
        } else {
          if (window.showToast) {
            showToast('No saved project found', 'info');
          }
        }
      } else {
        // Fallback: file input for JSON upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const projectData = JSON.parse(e.target.result);
                this.store.setState(projectData);
                
                // Trigger UI updates
                if (projectData.footprint) {
                  eventBus.emit('footprint:change', projectData.footprint);
                }
                if (projectData.context) {
                  eventBus.emit('context:change', projectData.context);
                }
                
                if (window.showToast) {
                  showToast('Project loaded from file!', 'success');
                }
              } catch (error) {
                if (window.showToast) {
                  showToast('Invalid project file', 'error');
                }
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      }
    } catch (error) {
      logger.error('Load failed:', error);
      if (window.showToast) {
        showToast(`Load failed: ${error.message}`, 'error');
      }
    }
  }
}

window.HeaderControls = HeaderControls;