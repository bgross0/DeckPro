// UI control handlers
window.UIControls = class UIControls {
  constructor(store, drawingSurface, commandStack) {
    this.store = store;
    this.drawingSurface = drawingSurface;
    this.commandStack = commandStack;
    
    logger.log('UIControls initialized');
    
    // Ensure DOM is ready before setting up listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEventListeners();
        this.updateUIFromState();
      });
    } else {
      this.setupEventListeners();
      this.updateUIFromState();
      // Delay material cost listeners to ensure DOM is ready
      setTimeout(() => this.setupMaterialCostListeners(), 100);
    }
  }
  
  // Property to store all event listeners for easy cleanup
  listeners = [];
  
  // Helper method to add event listeners and track them for cleanup
  addListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    this.listeners.push({ element, eventType, handler });
  }
  
  // Cleanup all registered event listeners
  cleanupEventListeners() {
    logger.log(`Cleaning up ${this.listeners.length} event listeners`);
    this.listeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    this.listeners = [];
  }
  
  setupEventListeners() {
    logger.log('Setting up event listeners');
    FootprintUtils.verifyElements();
    this.setupHeaderControls();
    this.setupMainControls();
    this.setupToolButtons();
    this.setupGridControls();
    this.setupViewControls();
    this.setupFootprintInputs();
    this.setupContextInputs();
    this.setupKeyboardShortcuts();
    this.setupTabSwitching();
    
    // Add window unload handler to clean up event listeners
    window.addEventListener('beforeunload', () => this.cleanupEventListeners());
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
        alert('DeckPro Designer Help:\n\n' +
              '- Use the Rectangle tool to draw your deck outline\n' +
              '- Enter dimensions directly in the Width and Length fields\n' +
              '- Configure your deck in the sidebar panels\n' +
              '- Click Generate Structure to create framing plan\n' +
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
        this.updateUIFromState();
      };
      this.addListener(undoBtn, 'click', handler);
    }
    
    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
      const handler = () => {
        logger.log('Redo clicked');
        this.commandStack.redo();
        this.updateUIFromState();
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
            this.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
            // Create a new footprint with default position
            const defaultPosition = FootprintUtils.createDefaultFootprint(width, 
              parseFloat(document.getElementById('length-ft').value) || 12, this.drawingSurface);
            this.executeCommand('setFootprint', { footprint: defaultPosition });
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
            this.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
            // Create a new footprint with default position
            const defaultPosition = FootprintUtils.createDefaultFootprint(
              parseFloat(document.getElementById('width-ft').value) || 12, length, this.drawingSurface);
            this.executeCommand('setFootprint', { footprint: defaultPosition });
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
          this.executeCommand('setContext', { height_ft: height });
        }
      };
      this.addListener(heightFtEl, 'change', handler);
    }
    
    const attachmentEl = document.getElementById('attachment');
    if (attachmentEl) {
      const handler = (e) => {
        this.executeCommand('setContext', { attachment: e.target.value });
        UIVisibilityUtils.updateUIVisibility(this.store.getState());
      };
      this.addListener(attachmentEl, 'change', handler);
    }
    
    // Other context inputs
    const contextInputs = [
      'beam-style-outer', 'beam-style-inner', 'footing-type',
      'species-grade', 'joist-spacing', 'decking-type', 'optimization-goal'
    ];
    
    contextInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const handler = (e) => {
          const key = id.replace(/-/g, '_');
          const value = e.target.value || null;
          this.executeCommand('setContext', { [key]: value });
        };
        this.addListener(element, 'change', handler);
      }
    });
  }
  
  setupKeyboardShortcuts() {
    // Keyboard shortcuts
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          this.commandStack.undo();
          this.updateUIFromState();
        } else if (e.key === 'y') {
          e.preventDefault();
          this.commandStack.redo();
          this.updateUIFromState();
        }
      } else {
        switch(e.key) {
          case 'r':
          case 'R':
            this.setActiveTool('rectangle');
            break;
          case 's':
          case 'S':
            this.setActiveTool('select');
            break;
          case 'Escape':
            // Cancel current drawing
            const footprintLayer = this.drawingSurface.layers.find(l => l.id === 'footprint');
            if (footprintLayer && footprintLayer.isDrawing) {
              footprintLayer.isDrawing = false;
              footprintLayer.drawStart = null;
              footprintLayer.footprint = null;
              eventBus.emit('footprint:change', null);
            }
            break;
        }
      }
    };
    this.addListener(document, 'keydown', handler);
  }
  
  setupTabSwitching() {
    TabSwitchingUtils.setupTabSwitching((element, eventType, handler) => {
      this.addListener(element, eventType, handler);
    });
    
    // Pricing modal controls
    ModalUtils.setupModal(
      'pricing-modal',
      'pricing-settings-btn', 
      'pricing-modal-close',
      (element, eventType, handler) => {
        this.addListener(element, eventType, handler);
      }
    );
  }
  
  executeCommand(type, data) {
    logger.log('Executing command:', type, data);
    const command = this.createCommand(type, data);
    this.commandStack.execute(command);
    this.updateUIFromState();
  }
  
  createCommand(type, data) {
    const store = this.store;
    
    switch (type) {
      case 'setWidth':
        return {
          tag: 'setWidth',
          apply: () => {
            const oldState = store.getState();
            const oldWidth = oldState.footprint.width_ft;
            
            store.setState({
              footprint: { ...oldState.footprint, width_ft: data.width_ft },
              context: { ...oldState.context, width_ft: data.width_ft }
            });
            
            return {
              tag: 'setWidth',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: { ...state.footprint, width_ft: oldWidth },
                  context: { ...state.context, width_ft: oldWidth }
                });
                return this.createCommand('setWidth', { width_ft: data.width_ft });
              }
            };
          }
        };
        
      case 'setLength':
        return {
          tag: 'setLength',
          apply: () => {
            const oldState = store.getState();
            const oldLength = oldState.footprint.length_ft;
            
            store.setState({
              footprint: { ...oldState.footprint, length_ft: data.length_ft },
              context: { ...oldState.context, length_ft: data.length_ft }
            });
            
            return {
              tag: 'setLength',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: { ...state.footprint, length_ft: oldLength },
                  context: { ...state.context, length_ft: oldLength }
                });
                return this.createCommand('setLength', { length_ft: data.length_ft });
              }
            };
          }
        };
        
      case 'setContext':
        return {
          tag: 'setContext',
          apply: () => {
            const oldState = store.getState();
            const oldContext = { ...oldState.context };
            
            store.setState({
              context: { ...oldState.context, ...data }
            });
            
            return {
              tag: 'setContext',
              apply: () => {
                const state = store.getState();
                store.setState({
                  context: oldContext
                });
                return this.createCommand('setContext', data);
              }
            };
          }
        };
        
      case 'setFootprint':
        const self = this;  // Preserve context
        return {
          tag: 'setFootprint',
          apply: () => {
            const oldState = store.getState();
            const oldFootprint = oldState.footprint;
            const oldWidthContext = oldState.context.width_ft;
            const oldLengthContext = oldState.context.length_ft;
            const { footprint } = data;
            
            store.setState({
              footprint: footprint,
              context: {
                ...oldState.context,
                width_ft: footprint.width_ft,
                length_ft: footprint.length_ft
              },
              engineOut: null // Clear any existing structure
            });
            
            // Update UI
            self.updateUIFromState();
            
            return {
              tag: 'setFootprint',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: oldFootprint,
                  context: {
                    ...state.context,
                    width_ft: oldWidthContext,
                    length_ft: oldLengthContext
                  },
                  engineOut: null
                });
                self.updateUIFromState();
                return self.createCommand('setFootprint', { footprint });
              }
            };
          }
        };
        
      case 'clearFootprint':
        const clearSelf = this;  // Preserve context
        return {
          tag: 'clearFootprint',
          apply: () => {
            const oldState = store.getState();
            const oldFootprint = oldState.footprint;
            const oldWidthContext = oldState.context.width_ft;
            const oldLengthContext = oldState.context.length_ft;
            
            store.setState({
              footprint: null,
              context: {
                ...oldState.context,
                width_ft: null,
                length_ft: null
              },
              engineOut: null
            });
            
            // Update UI
            clearSelf.updateUIFromState();
            
            return {
              tag: 'setFootprint',
              apply: () => {
                const state = store.getState();
                store.setState({
                  footprint: oldFootprint,
                  context: {
                    ...state.context,
                    width_ft: oldWidthContext,
                    length_ft: oldLengthContext
                  },
                  engineOut: null
                });
                clearSelf.updateUIFromState();
                return clearSelf.createCommand('clearFootprint', {});
              }
            };
          }
        };
        
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
  
  updateUIFromState() {
    logger.log('Updating UI from state');
    const state = this.store.getState();
    
    // Update footprint inputs
    const widthInput = document.getElementById('width-ft');
    const lengthInput = document.getElementById('length-ft');
    
    if (widthInput && lengthInput) {
      if (state.footprint) {
        widthInput.value = state.footprint.width_ft || '';
        lengthInput.value = state.footprint.length_ft || '';
      } else {
        widthInput.value = '';
        lengthInput.value = '';
      }
    }
    
    // Update context inputs
    const heightInput = document.getElementById('height-ft');
    if (heightInput) {
      heightInput.value = state.context.height_ft;
    }
    document.getElementById('attachment').value = state.context.attachment;
    document.getElementById('beam-style-outer').value = state.context.beam_style_outer || '';
    document.getElementById('beam-style-inner').value = state.context.beam_style_inner || '';
    document.getElementById('footing-type').value = state.context.footing_type;
    document.getElementById('species-grade').value = state.context.species_grade;
    document.getElementById('joist-spacing').value = state.context.forced_joist_spacing_in || '';
    document.getElementById('decking-type').value = state.context.decking_type;
    document.getElementById('optimization-goal').value = state.context.optimization_goal;
    
    // Update grid controls
    document.getElementById('grid-visible').checked = state.gridCfg.visible;
    document.getElementById('grid-snap').checked = state.gridCfg.snap;
    document.getElementById('grid-spacing').value = state.gridCfg.spacing_in;
    
    // Update generate button
    const generateBtn = document.getElementById('generate-btn');
    const generateHelpText = document.querySelector('#generate-btn + .help-text');
    if (generateBtn) {
      if (state.footprint && state.footprint.width_ft > 0 && state.footprint.length_ft > 0) {
        generateBtn.disabled = false;
        if (generateHelpText) {
          generateHelpText.textContent = 'Click to generate code-compliant structure';
        }
      } else {
        generateBtn.disabled = true;
        if (generateHelpText) {
          generateHelpText.textContent = 'Draw a footprint first to enable generation';
        }
      }
    }
    
    UIVisibilityUtils.updateUIVisibility(this.store.getState());
  }
  
  setActiveTool(tool) {
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool-btn`).classList.add('active');
    
    // Update canvas cursor
    const canvas = document.getElementById('deck-canvas');
    canvas.classList.remove('rectangle-tool', 'select-tool');
    canvas.classList.add(`${tool}-tool`);
    
    // Update footprint layer
    const footprintLayer = this.drawingSurface.layers.find(l => l.id === 'footprint');
    if (footprintLayer) {
      footprintLayer.setTool(tool);
    }
  }
  
  generateStructure() {
    logger.log('Generate Structure clicked');
    const state = this.store.getState();
    logger.log('Current state:', state);
    
    if (!state.footprint || state.footprint.width_ft < 1 || state.footprint.length_ft < 1) {
      alert('Please draw a footprint first');
      return;
    }
    
    const payload = {
      ...state.context,
      width_ft: state.footprint.width_ft,
      length_ft: state.footprint.length_ft
    };
    
    logger.log('Computing with payload:', payload);
    eventBus.emit('canvas:compute', { payload });
  }
  
  clearCanvas() {
    this.commandStack.clear();
    
    // Reset to initial state
    const initialState = {
      footprint: null,
      context: {
        width_ft: null,
        length_ft: null,
        height_ft: 3,
        attachment: 'ledger',
        beam_style_outer: null,
        beam_style_inner: null,
        footing_type: 'helical',
        species_grade: 'SPF #2',
        forced_joist_spacing_in: null,
        decking_type: 'composite_1in',
        optimization_goal: 'cost'
      },
      engineOut: null, // Clear any generated structure
      gridCfg: {
        visible: true,
        snap: true,
        spacing_in: 6
      }
    };
    
    this.store.setState(initialState);
    this.updateUIFromState();
    
    // Reset generate button
    document.getElementById('generate-btn').disabled = true;
    document.querySelector('#generate-btn + .help-text').textContent = 'Draw a footprint first to enable generation';
    
    // Clear BOM table  
    window.updateBOMTable(null);
    
    eventBus.emit('canvas:clear');
  }

  setupMaterialCostListeners() {
    if (document.readyState === 'loading') {
      this.addListener(document, 'DOMContentLoaded', () => this.setupMaterialCostListeners());
      return;
    }

    // Lumber costs
    const lumberCosts = ['2x6', '2x8', '2x10', '2x12', '6x6'];
    lumberCosts.forEach(size => {
      const input = document.getElementById(`cost-${size}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.lumber[size].costPerFoot = value;
          MaterialCostUtils.updateCostSummary(this.store);
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Simpson ZMAX Hardware costs
    const zmaxHardware = {
      'lus-hanger': { type: 'joistHangers', subtype: 'regular', keys: ['LUS26', 'LUS28', 'LUS210', 'LUS212'] },
      'lssu-hanger': { type: 'joistHangers', subtype: 'concealed', keys: ['LSSU26', 'LSSU28', 'LSSU210', 'LSSU212'] },
      'h1-tie': { type: 'structuralTies', subtype: 'H1', keys: ['H1'] },
      'h25a-tie': { type: 'structuralTies', subtype: 'H2.5A', keys: ['H2.5A'] },
      'dtt1z-tie': { type: 'structuralTies', subtype: 'DTT1Z', keys: ['DTT1Z'] },
      'bc6-cap': { type: 'postConnections', subtype: 'BC6', keys: ['BC6'] }
    };
    
    Object.entries(zmaxHardware).forEach(([id, config]) => {
      const input = document.getElementById(`cost-${id}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          config.keys.forEach(key => {
            if (materials.simpsonZmax[config.type][key]) {
              materials.simpsonZmax[config.type][key].cost = value;
            }
          });
          MaterialCostUtils.updateCostSummary(this.store);
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Fastener costs
    const fastenerCosts = {
      'hanger-nails': { type: 'joistHangerNails', key: '1.5x0.148', property: 'costPer100' },
      'sds25-screws': { type: 'structuralScrews', key: 'SDS25', property: 'costPer50' },
      'sds6-screws': { type: 'structuralScrews', key: 'SDS6', property: 'costPer25' }
    };
    
    Object.entries(fastenerCosts).forEach(([id, config]) => {
      const input = document.getElementById(`cost-${id}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.simpsonZmax.fasteners[config.type][config.key][config.property] = value;
          MaterialCostUtils.updateCostSummary(this.store);
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Footing costs
    const footingTypes = ['helical', 'concrete', 'surface'];
    footingTypes.forEach(type => {
      const input = document.getElementById(`cost-${type}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.footingCosts[type] = value;
          MaterialCostUtils.updateCostSummary(this.store);
        };
        this.addListener(input, 'change', handler);
      }
    });
  }

}