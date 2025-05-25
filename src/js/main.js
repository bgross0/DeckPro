// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Detect mobile/touch devices and add class to body
  function isTouchDevice() {
    return ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0);
  }
  
  // Array to track event listeners that need manual cleanup
  const mainListeners = [];
  
  // Helper function to add and track event listeners
  function addGlobalListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    mainListeners.push({ element, eventType, handler });
  }
  
  // Setup cleanup for page unload
  window.addEventListener('beforeunload', () => {
    logger.log('Cleaning up global event listeners');
    mainListeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    
    // Also trigger cleanup in UIControls
    if (window.uiControls) {
      window.uiControls.cleanupEventListeners();
    }
  });
  
  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
    
    // Add event listener to close sidebar when clicking on canvas on mobile
    const canvas = document.getElementById('deck-canvas');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    if (canvas && sidebar) {
      const handler = () => {
        if (sidebar.classList.contains('visible')) {
          sidebar.classList.remove('visible');
          if (toggleBtn) toggleBtn.classList.remove('active');
          if (backdrop) backdrop.classList.remove('visible');
        }
      };
      addGlobalListener(canvas, 'click', handler);
    }
  }
  
  // Initialize store with default state
  const store = createStore({
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
    engineOut: null,
    gridCfg: {
      visible: true,
      snap: true,
      spacing_in: 6
    },
    history: [],
    future: []
  });
  
  // Initialize drawing surface
  const canvas = document.getElementById('deck-canvas');
  
  // Set an explicit size to ensure the canvas renders correctly
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  const drawingSurface = new DrawingSurface(canvas, {
    pixelsPerFoot: 20
  });
  
  // Set an initial zoom level that will show the grid
  drawingSurface.zoom = 1.2; // Higher zoom to ensure grid is visible
  
  // Create layers
  const gridLayer = new GridLayer({
    spacing_in: store.getState().gridCfg.spacing_in,
    snap: store.getState().gridCfg.snap,
    visible: store.getState().gridCfg.visible
  });
  
  const footprintLayer = new FootprintLayer();
  const joistLayer = new JoistLayer();
  const beamLayer = new BeamLayer();
  const dimensionLayer = new DimensionLayer();
  
  // Set initial tool on footprint layer
  footprintLayer.setTool('rectangle');
  
  // Add layers to drawing surface
  drawingSurface.addLayer(gridLayer);
  drawingSurface.addLayer(footprintLayer);
  drawingSurface.addLayer(joistLayer);
  drawingSurface.addLayer(beamLayer);
  drawingSurface.addLayer(dimensionLayer);
  
  // Initialize command stack
  const commandStack = new CommandStack(20);
  
  // Initialize structure renderer
  const structureRenderer = new StructureRenderer(store);
  
  // Initialize UI controls
  const uiControls = new UIControls(store, drawingSurface, commandStack);
  window.uiControls = uiControls; // Make available globally for cleanup
  
  // Set initial tool after UI is ready
  setTimeout(() => {
    uiControls.setActiveTool('rectangle');
    logger.log('Initial tool set to rectangle');
  }, 100);
  
  // Initialize export manager
  const exportManager = new ExportManager(drawingSurface);
  window.exportManager = exportManager; // Make available globally
  
  // Set up event handlers
  setupEventHandlers(store, drawingSurface, commandStack);
  
  // Initialize generate button state
  setTimeout(() => {
    if (window.shadcnComponents && window.shadcnComponents.updateGenerateButton) {
      window.shadcnComponents.updateGenerateButton(false, 'Draw deck footprint first');
    }
  }, 200);
  
  // Force grid visibility before initial render
  const gridLayerRef = drawingSurface.layers.find(l => l.id === 'grid');
  if (gridLayerRef) {
    gridLayerRef.visible = true;
    gridLayerRef.spacing_in = 6;
    logger.log('Grid layer forced visible:', gridLayerRef.visible, 'spacing:', gridLayerRef.spacing_in);
    
    // Sync the checkbox
    const gridCheckbox = document.getElementById('grid-visible');
    if (gridCheckbox) {
      gridCheckbox.checked = true;
    }
  }
  
  // Initial render
  drawingSurface.draw();
  
  // Additional forced redraws to ensure grid appears
  setTimeout(() => {
    logger.log('First delayed redraw');
    drawingSurface.draw();
    
    setTimeout(() => {
      logger.log('Second delayed redraw');
      drawingSurface.draw();
    }, 100);
  }, 50);
  
  logger.log('Application initialized successfully');
});

function setupEventHandlers(store, drawingSurface, commandStack) {
  // Handle footprint changes  
  eventBus.subscribe('footprint:change', (footprint) => {
    logger.log('Footprint changed:', footprint);
    
    // **CRITICAL**: Update the store state so generateStructure can access it
    store.setState({ footprint: footprint });
    logger.log('Store updated with footprint:', store.getState().footprint);
    
    // Update form inputs to reflect drawn footprint
    if (footprint) {
      const widthInput = document.getElementById('width-ft');
      const lengthInput = document.getElementById('length-ft');
      if (widthInput) widthInput.value = footprint.width_ft.toFixed(1);
      if (lengthInput) lengthInput.value = footprint.length_ft.toFixed(1);
    }
    
    // Update footprint layer
    const footprintLayer = drawingSurface.layers.find(l => l.id === 'footprint');
    if (footprintLayer) {
      footprintLayer.setFootprint(footprint);
    }
    
    // Update dimension layer
    const dimensionLayer = drawingSurface.layers.find(l => l.id === 'dimensions');
    if (dimensionLayer) {
      dimensionLayer.setFootprint(footprint);
    }
    
    // Update generate button state
    const hasValidFootprint = footprint && footprint.width_ft >= 1 && footprint.length_ft >= 1;
    if (window.shadcnComponents && window.shadcnComponents.updateGenerateButton) {
      window.shadcnComponents.updateGenerateButton(
        hasValidFootprint, 
        hasValidFootprint ? 'Generate Structure' : 'Draw deck footprint first'
      );
    }
    
    drawingSurface.draw();
  });
  
  // Handle footprint preview during drawing
  eventBus.subscribe('footprint:preview', (footprint) => {
    logger.log('Footprint preview:', footprint);
    
    // Update dimension layer for real-time display
    const dimensionLayer = drawingSurface.layers.find(l => l.id === 'dimensions');
    if (dimensionLayer) {
      dimensionLayer.setFootprint(footprint);
    }
    
    // Don't update store state or form inputs during preview - only visual feedback
    drawingSurface.draw();
  });
  
  // Handle context changes
  eventBus.subscribe('context:change', (context) => {
    logger.log('Context changed:', context);
    UIVisibilityUtils.updateUIVisibility(store.getState());
  });
  
  // Handle clear canvas
  eventBus.subscribe('clear-canvas', () => {
    logger.log('Clearing all layers');
    drawingSurface.layers.forEach(layer => {
      if (layer.clear) {
        layer.clear();
      }
    });
    drawingSurface.draw();
  });
  
  // Handle canvas export
  eventBus.subscribe('canvas:export', (data) => {
    logger.log('Exporting canvas as:', data.format);
    const exportManager = window.exportManager;
    if (exportManager) {
      if (data.format === 'png') {
        exportManager.exportPNG();
      } else if (data.format === 'csv') {
        exportManager.exportCSV(store.getState());
      }
    }
  });
  
  // Handle structure generation results
  eventBus.subscribe('structure:generated', (engineOut) => {
    logger.log('Structure generated, updating layers');
    
    // Update joist layer
    const joistLayer = drawingSurface.layers.find(l => l.id === 'joists');
    if (joistLayer && engineOut.joists) {
      joistLayer.setJoists(engineOut.joists);
    }
    
    // Update beam layer  
    const beamLayer = drawingSurface.layers.find(l => l.id === 'beams');
    if (beamLayer && engineOut.beams) {
      beamLayer.setBeams(engineOut.beams);
    }
    
    // Update dimension layer
    const dimensionLayer = drawingSurface.layers.find(l => l.id === 'dimensions');
    if (dimensionLayer) {
      dimensionLayer.setDimensions(engineOut);
    }
    
    // Redraw canvas
    drawingSurface.draw();
  });
  
  // Handle grid configuration changes
  eventBus.subscribe('canvas:gridChange', (gridConfig) => {
    logger.log('Grid configuration changed:', gridConfig);
    store.setState({ gridCfg: gridConfig });
  });
}