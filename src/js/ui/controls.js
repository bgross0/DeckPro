// UI control handlers - orchestrates all UI modules
window.UIControls = class UIControls {
  constructor(store, drawingSurface, commandStack) {
    this.store = store;
    this.drawingSurface = drawingSurface;
    this.commandStack = commandStack;
    
    // Initialize controller modules
    this.headerControls = new HeaderControls(store, drawingSurface, commandStack);
    this.toolControls = new ToolControls(store, drawingSurface, commandStack);
    this.formControls = new FormControls(store, drawingSurface, commandStack);
    this.viewControls = new ViewControls(store, drawingSurface, commandStack);
    
    logger.log('UIControls initialized with modular controllers');
    
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
    logger.log(`Cleaning up event listeners from all modules`);
    
    // Cleanup main listeners
    this.listeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    this.listeners = [];
    
    // Cleanup module listeners
    this.headerControls.cleanupEventListeners();
    this.toolControls.cleanupEventListeners();
    this.formControls.cleanupEventListeners();
    this.viewControls.cleanupEventListeners();
  }
  
  setupEventListeners() {
    logger.log('Setting up event listeners across all modules');
    FootprintUtils.verifyElements();
    
    // Delegate to specialized modules
    this.headerControls.setupHeaderControls();
    this.toolControls.setupToolButtons();
    this.toolControls.setupGridControls();
    this.formControls.setupFootprintInputs();
    this.formControls.setupContextInputs();
    this.viewControls.setupViewControls();
    
    // Keep main controls, shortcuts, etc. in this class
    this.setupMainControls();
    this.setupKeyboardShortcuts();
    this.setupTabSwitching();
    
    // Add window unload handler to clean up event listeners
    window.addEventListener('beforeunload', () => this.cleanupEventListeners());
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
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    if (clearCanvasBtn) {
      const handler = () => {
        logger.log('Clear canvas clicked');
        if (confirm('Clear the entire canvas? This cannot be undone.')) {
          this.clearCanvas();
        }
      };
      this.addListener(clearCanvasBtn, 'click', handler);
    }
  }

  setupKeyboardShortcuts() {
    const handler = (e) => {
      // Only handle if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.commandStack.redo();
            } else {
              this.commandStack.undo();
            }
            this.updateUIFromState();
            break;
          case 'y':
            e.preventDefault();
            this.commandStack.redo();
            this.updateUIFromState();
            break;
        }
      }
      
      // Tool shortcuts
      switch(e.key) {
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            this.setActiveTool('rectangle');
          }
          break;
        case 'Escape':
          this.setActiveTool('select');
          break;
      }
    };
    this.addListener(document, 'keydown', handler);
  }

  setupTabSwitching() {
    TabSwitchingUtils.setupTabSwitching(this.addListener.bind(this));
  }

  setupMaterialCostListeners() {
    MaterialCostUtils.setupMaterialCostListeners(this.addListener.bind(this), this.store);
  }

  clearCanvas() {
    logger.log('Clearing canvas');
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

  updateUIFromState() {
    const state = this.store.getState();
    
    // Update form inputs
    const widthFtEl = document.getElementById('width-ft');
    const lengthFtEl = document.getElementById('length-ft');
    
    if (state.footprint) {
      if (widthFtEl) widthFtEl.value = state.footprint.width_ft || '';
      if (lengthFtEl) lengthFtEl.value = state.footprint.length_ft || '';
    }
    
    // Update context inputs
    Object.keys(state.context).forEach(key => {
      const element = document.getElementById(key.replace(/_/g, '-'));
      if (element && state.context[key] !== null) {
        element.value = state.context[key];
      }
    });
    
    // Update undo/redo button states
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn && this.commandStack) {
      undoBtn.disabled = !this.commandStack.canUndo();
    }
    if (redoBtn && this.commandStack) {
      redoBtn.disabled = !this.commandStack.canRedo();
    }
    
    // Update UI visibility based on context
    UIVisibilityUtils.updateUIVisibility(state);
  }

  executeCommand(type, data) {
    const command = {
      type,
      data,
      apply: () => {
        if (type === 'setFootprint') {
          const oldFootprint = this.store.getState().footprint;
          this.store.setState({ footprint: data.footprint });
          eventBus.emit('footprint:changed', data.footprint);
          return { type, data: { footprint: oldFootprint } };
        } else if (type === 'setContext') {
          const oldContext = this.store.getState().context;
          const newContext = { ...oldContext, ...data };
          this.store.setState({ context: newContext });
          eventBus.emit('context:changed', newContext);
          return { type, data: oldContext };
        }
      }
    };
    
    if (this.commandStack) {
      this.commandStack.execute(command);
    } else {
      command.apply();
    }
  }
};