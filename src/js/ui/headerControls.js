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
}

window.HeaderControls = HeaderControls;