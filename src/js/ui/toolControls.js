class ToolControls {
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

  setupToolButtons() {
    const rectangleBtn = document.getElementById('rectangle-tool-btn');
    if (rectangleBtn) {
      const handler = () => {
        logger.log('Rectangle tool clicked');
        this.setActiveTool('rectangle');
      };
      this.addListener(rectangleBtn, 'click', handler);
    }
    
    const selectBtn = document.getElementById('select-tool-btn');
    if (selectBtn) {
      const handler = () => {
        logger.log('Select tool clicked');
        this.setActiveTool('select');
      };
      this.addListener(selectBtn, 'click', handler);
    }
    
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      const handler = () => {
        logger.log('Generate button clicked');
        this.generateStructure();
      };
      this.addListener(generateBtn, 'click', handler);
    } else {
      logger.error('Generate button not found!');
    }
  }

  setupGridControls() {
    const gridVisibleEl = document.getElementById('grid-visible');
    if (gridVisibleEl) {
      const handler = (e) => {
        const gridLayer = this.drawingSurface.layers.find(l => l.id === 'grid');
        if (gridLayer) {
          gridLayer.visible = e.target.checked;
          this.drawingSurface.draw();
          eventBus.emit('canvas:gridChange', {
            visible: gridLayer.visible,
            snap: gridLayer.snap,
            spacing_in: gridLayer.spacing_in
          });
        }
      };
      this.addListener(gridVisibleEl, 'change', handler);
    }
    
    const gridSnapEl = document.getElementById('grid-snap');
    if (gridSnapEl) {
      const handler = (e) => {
        const gridLayer = this.drawingSurface.layers.find(l => l.id === 'grid');
        if (gridLayer) {
          gridLayer.setSnap(e.target.checked);
          eventBus.emit('canvas:gridChange', {
            visible: gridLayer.visible,
            snap: gridLayer.snap,
            spacing_in: gridLayer.spacing_in
          });
        }
      };
      this.addListener(gridSnapEl, 'change', handler);
    }
    
    const gridSpacingEl = document.getElementById('grid-spacing');
    if (gridSpacingEl) {
      const handler = (e) => {
        const gridLayer = this.drawingSurface.layers.find(l => l.id === 'grid');
        if (gridLayer) {
          gridLayer.setSpacing(parseFloat(e.target.value));
          eventBus.emit('canvas:gridChange', {
            visible: gridLayer.visible,
            snap: gridLayer.snap,
            spacing_in: gridLayer.spacing_in
          });
        }
      };
      this.addListener(gridSpacingEl, 'change', handler);
    }
  }

  setActiveTool(toolName) {
    const tools = document.querySelectorAll('.tool-btn');
    tools.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.getElementById(`${toolName}-tool-btn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    const footprintLayer = this.drawingSurface.layers.find(l => l.id === 'footprint');
    if (footprintLayer) {
      footprintLayer.setTool(toolName);
    }
  }

  generateStructure() {
    const state = this.store.getState();
    
    logger.log('Generate structure called with state:', state);
    
    if (!state.footprint) {
      logger.log('No footprint in state, aborting generation');
      if (window.showToast) {
        showToast('Please draw a deck footprint first', 'warning');
      } else {
        alert('Please draw a deck footprint first');
      }
      return;
    }
    
    // Additional validation
    if (!state.footprint.width_ft || !state.footprint.length_ft) {
      logger.log('Invalid footprint dimensions:', state.footprint);
      if (window.showToast) {
        showToast('Invalid footprint dimensions. Please redraw.', 'warning');
      }
      return;
    }
    
    // Show loading state
    const generateBtn = document.getElementById('generate-btn');
    const originalText = generateBtn ? generateBtn.textContent : '';
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
      generateBtn.style.opacity = '0.7';
    }
    
    logger.log('Generating structure for footprint:', state.footprint);
    
    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
      try {
        // Combine footprint and context into single payload for engine
        // Make sure footprint dimensions take precedence over context nulls
        const payload = {
          ...state.context,
          ...state.footprint
        };
        
        logger.log('Debug payload being sent to engine:', payload);
        logger.log('Debug state.footprint:', state.footprint);
        logger.log('Debug state.context:', state.context);
        
        const engineOut = computeStructure(payload);
        logger.log('Structure generation complete:', engineOut);
        
        this.store.setState({ engineOut });
        
        eventBus.emit('structure:generated', engineOut);
        
        if (window.showToast) {
          showToast('Structure generated successfully!', 'success');
        }
        
      } catch (error) {
        logger.error('Structure generation failed:', error);
        if (window.showToast) {
          showToast(`Structure generation failed: ${error.message}`, 'error');
        } else {
          alert(`Structure generation failed: ${error.message}`);
        }
      } finally {
        // Restore button state
        if (generateBtn) {
          generateBtn.disabled = false;
          generateBtn.textContent = originalText;
          generateBtn.style.opacity = '1';
        }
      }
    }, 50);
  }
}

window.ToolControls = ToolControls;