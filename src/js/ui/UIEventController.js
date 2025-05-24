// UI Event Management Controller
window.UIEventController = class UIEventController {
  constructor(store, drawingSurface, commandStack, stateController) {
    this.store = store;
    this.drawingSurface = drawingSurface;
    this.commandStack = commandStack;
    this.stateController = stateController;
    this.listeners = [];
  }

  // Helper method to add event listeners and track them for cleanup
  addListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    this.listeners.push({ element, eventType, handler });
  }

  // Cleanup all registered event listeners
  cleanupEventListeners() {
    logger.log(`UIEventController cleaning up ${this.listeners.length} event listeners`);
    this.listeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    this.listeners = [];
  }

  setupAllEventListeners() {
    this.verifyElements();
    this.setupHeaderControls();
    this.setupMainControls();
    this.setupToolButtons();
    this.setupGridControls();
    this.setupViewControls();
    this.setupFootprintInputs();
    this.setupContextInputs();
    this.setupKeyboardShortcuts();
    this.setupTabSwitching();
  }

  verifyElements() {
    // Verify elements exist
    const elements = {
      'undo-btn': 'Undo',
      'redo-btn': 'Redo',
      'clear-canvas-btn': 'Clear Canvas',
      'rectangle-tool-btn': 'Rectangle Tool',
      'select-tool-btn': 'Select Tool',
      'generate-btn': 'Generate',
      'new-project-btn': 'New Project',
      'help-btn': 'Help',
      'toggle-sidebar-btn': 'Toggle Sidebar'
    };
    
    for (const [id, name] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (!el) {
        logger.error(`${name} button not found: #${id}`);
      } else {
        logger.log(`${name} button found: #${id}`);
      }
    }
  }
  
  setupHeaderControls() {
    // Header buttons
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
      const handler = () => {
        logger.log('New project clicked');
        if (confirm('Start a new project? All unsaved changes will be lost.')) {
          this.clearCanvas();
        }
      };
      this.addListener(newProjectBtn, 'click', handler);
    }
    
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      const handler = () => {
        logger.log('Help clicked');
        // Simple help dialog
        alert('DeckPro Designer Help:\\n\\n' +
              '- Use the Rectangle tool to draw your deck outline\\n' +
              '- Enter dimensions directly in the Width and Length fields\\n' +
              '- Configure your deck in the sidebar panels\\n' +
              '- Click Generate Structure to create framing plan\\n' +
              '- View results in the Framing Details and Material Costs tabs');
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
    
    // Close sidebar when backdrop is clicked
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
  
  setupMainControls() {
    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      const handler = () => {
        logger.log('Undo clicked');
        this.commandStack.undo();
        this.stateController.updateUIFromState();
      };
      this.addListener(undoBtn, 'click', handler);
    }
    
    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
      const handler = () => {
        logger.log('Redo clicked');
        this.commandStack.redo();
        this.stateController.updateUIFromState();
      };
      this.addListener(redoBtn, 'click', handler);
    }
    
    // Clear canvas button
    const clearBtn = document.getElementById('clear-canvas-btn');
    if (clearBtn) {
      const handler = () => {
        logger.log('Clear canvas clicked');
        if (confirm('Clear all deck geometry? This cannot be undone.')) {
          this.clearCanvas();
        }
      };
      this.addListener(clearBtn, 'click', handler);
    }
  }
  
  setupToolButtons() {
    // Tool buttons
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
    
    // Generate button
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
    // Grid controls
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
  
  setupViewControls() {
    // Zoom controls
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
    
    // Export menu
    const exportMenuEl = document.getElementById('export-menu');
    if (exportMenuEl) {
      const handler = (e) => {
        if (e.target.value) {
          eventBus.emit('canvas:export', { format: e.target.value });
          e.target.value = ''; // Reset selection
        }
      };
      this.addListener(exportMenuEl, 'change', handler);
    }
  }
  
  setupFootprintInputs() {
    // Footprint dimension inputs
    const widthFtEl = document.getElementById('width-ft');
    if (widthFtEl) {
      const handler = (e) => {
        const width = parseFloat(e.target.value);
        if (width >= 0) {
          // If we have an existing footprint, update it
          const state = this.store.getState();
          if (state.footprint) {
            const updatedFootprint = { ...state.footprint, width_ft: width };
            this.stateController.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
            // Create a new footprint with default position
            const defaultPosition = this.stateController.createDefaultFootprint(width, 
              parseFloat(document.getElementById('length-ft').value) || 12);
            this.stateController.executeCommand('setFootprint', { footprint: defaultPosition });
          }
        }
      };
      this.addListener(widthFtEl, 'change', handler);
    }
    
    const lengthFtEl = document.getElementById('length-ft');
    if (lengthFtEl) {
      const handler = (e) => {
        const length = parseFloat(e.target.value);
        if (length >= 0) {
          // If we have an existing footprint, update it
          const state = this.store.getState();
          if (state.footprint) {
            const updatedFootprint = { ...state.footprint, length_ft: length };
            this.stateController.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
            // Create a new footprint with default position
            const defaultPosition = this.stateController.createDefaultFootprint(
              parseFloat(document.getElementById('width-ft').value) || 12, length);
            this.stateController.executeCommand('setFootprint', { footprint: defaultPosition });
          }
        }
      };
      this.addListener(lengthFtEl, 'change', handler);
    }
  }
  
  setupContextInputs() {
    // Context inputs
    const heightFtEl = document.getElementById('height-ft');
    if (heightFtEl) {
      const handler = (e) => {
        const height = parseFloat(e.target.value);
        if (height >= 0) {
          this.stateController.executeCommand('setContext', { height_ft: height });
        }
      };
      this.addListener(heightFtEl, 'change', handler);
    }
    
    const attachmentEl = document.getElementById('attachment');
    if (attachmentEl) {
      const handler = (e) => {
        this.stateController.executeCommand('setContext', { attachment: e.target.value });
        this.updateUIVisibility();
      };
      this.addListener(attachmentEl, 'change', handler);
    }

    // Add all other context inputs
    const contextInputs = [
      'beam-style-outer', 'beam-style-inner', 'footing-type', 
      'species-grade', 'joist-spacing', 'decking-type', 'optimization-goal'
    ];
    
    contextInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const handler = (e) => {
          let key = id.replace(/-/g, '_');
          // Fix joist spacing field name mapping
          if (key === 'joist_spacing') {
            key = 'forced_joist_spacing_in';
          }
          this.stateController.executeCommand('setContext', { 
            [key]: e.target.value 
          });
        };
        this.addListener(element, 'change', handler);
      }
    });
  }

  setupKeyboardShortcuts() {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.commandStack.redo();
            } else {
              this.commandStack.undo();
            }
            this.stateController.updateUIFromState();
            break;
          case 'y':
            e.preventDefault();
            this.commandStack.redo();
            this.stateController.updateUIFromState();
            break;
        }
      }
    };
    this.addListener(document, 'keydown', handler);
  }

  setupTabSwitching() {
    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      const handler = () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      };
      this.addListener(button, 'click', handler);
    });
  }

  // Helper methods that need to be accessible from this controller
  setActiveTool(tool) {
    // Update tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const toolBtn = document.getElementById(`${tool}-tool-btn`);
    if (toolBtn) {
      toolBtn.classList.add('active');
    }
    
    // Set the tool on the footprint layer
    const footprintLayer = this.drawingSurface.layers.find(l => l.id === 'footprint');
    if (footprintLayer) {
      footprintLayer.setTool(tool);
    }
  }

  clearCanvas() {
    // Clear the store
    this.store.setState({
      footprint: null,
      engineOut: null
    });
    
    this.stateController.updateUIFromState();
    
    // Reset generate button
    document.getElementById('generate-btn').disabled = true;
    document.querySelector('#generate-btn + .help-text').textContent = 'Draw a footprint first to enable generation';
    
    // Clear BOM table  
    if (window.updateBOMTable) {
      window.updateBOMTable(null);
    }
    
    eventBus.emit('canvas:clear');
  }

  generateStructure() {
    logger.log('Generate Structure clicked');
    const state = this.store.getState();
    logger.log('Current state:', state);
    
    if (!state.footprint || !state.footprint.width_ft || !state.footprint.length_ft) {
      alert('Please create a deck footprint first.');
      return;
    }
    
    // Build the payload for the engine
    const payload = {
      footprint: state.footprint,
      context: state.context
    };
    logger.log('Computing with payload:', payload);
    
    // Call the deck structure engine
    const result = computeDeckStructure(payload);
    
    // Update the store with results
    this.store.setState({
      engineOut: result
    });
    
    // Update UI
    this.stateController.updateUIFromState();
    
    // Update the BOM table
    if (window.updateBOMTable) {
      window.updateBOMTable(result.material_takeoff);
    }
    
    // Emit event for other components
    eventBus.emit('structure:generated', result);
  }

  updateUIVisibility() {
    // Handle UI visibility based on attachment type
    const state = this.store.getState();
    const attachment = state.context.attachment;
    
    // Show/hide beam style controls based on attachment
    const outerBeamRow = document.querySelector('[data-field="beam-style-outer"]')?.closest('.input-row');
    const innerBeamRow = document.querySelector('[data-field="beam-style-inner"]')?.closest('.input-row');
    
    if (outerBeamRow && innerBeamRow) {
      if (attachment === 'ledger') {
        outerBeamRow.style.display = 'none';
        innerBeamRow.style.display = 'flex';
      } else {
        outerBeamRow.style.display = 'flex';
        innerBeamRow.style.display = 'none';
      }
    }
  }
};