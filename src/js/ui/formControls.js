class FormControls {
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

  setupFootprintInputs() {
    const widthFtEl = document.getElementById('width-ft');
    if (widthFtEl) {
      const handler = (e) => {
        const width = parseFloat(e.target.value);
        if (width >= 0) {
          const state = this.store.getState();
          if (state.footprint) {
            const updatedFootprint = { ...state.footprint, width_ft: width };
            this.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
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
          const state = this.store.getState();
          if (state.footprint) {
            const updatedFootprint = { ...state.footprint, length_ft: length };
            this.executeCommand('setFootprint', { footprint: updatedFootprint });
          } else {
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

  executeCommand(type, data) {
    const command = {
      type,
      data,
      apply: () => {
        if (type === 'setFootprint') {
          const oldFootprint = this.store.getState().footprint;
          this.store.setState({ footprint: data.footprint });
          eventBus.emit('footprint:change', data.footprint);
          return { type, data: { footprint: oldFootprint } };
        } else if (type === 'setContext') {
          const oldContext = this.store.getState().context;
          const newContext = { ...oldContext, ...data };
          this.store.setState({ context: newContext });
          eventBus.emit('context:change', newContext);
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
}

window.FormControls = FormControls;