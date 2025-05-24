// UI and Footprint utility functions  
window.FootprintUtils = {
  /**
   * Verifies that required UI elements exist in the DOM
   * @param {Object} elements - Object mapping element IDs to descriptive names
   */
  verifyElements(elements = {
    'undo-btn': 'Undo',
    'redo-btn': 'Redo', 
    'clear-canvas-btn': 'Clear Canvas',
    'rectangle-tool-btn': 'Rectangle Tool',
    'select-tool-btn': 'Select Tool',
    'generate-btn': 'Generate',
    'new-project-btn': 'New Project',
    'help-btn': 'Help',
    'toggle-sidebar-btn': 'Toggle Sidebar'
  }) {
    for (const [id, name] of Object.entries(elements)) {
      const el = document.getElementById(id);
      if (!el) {
        if (typeof logger !== 'undefined') {
          logger.error(`${name} button not found: #${id}`);
        } else {
          console.error(`${name} button not found: #${id}`);
        }
      } else {
        if (typeof logger !== 'undefined') {
          logger.log(`${name} button found: #${id}`);
        } else {
          console.log(`${name} button found: #${id}`);
        }
      }
    }
  },
  /**
   * Creates a footprint with default positioning centered in the visible canvas area
   * @param {number} width_ft - Width in feet
   * @param {number} length_ft - Length in feet
   * @param {Object} drawingSurface - Drawing surface instance for coordinate conversion
   * @returns {Object} Footprint object with origin and dimensions
   */
  createDefaultFootprint(width_ft, length_ft, drawingSurface) {
    // Set default dimensions if not provided
    width_ft = width_ft || 12;
    length_ft = length_ft || 12;
    
    // Get the canvas to calculate a good default position
    const canvas = document.getElementById('deck-canvas');
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Convert to world coordinates
    const worldPos = drawingSurface.toWorldCoords(centerX, centerY);
    const surface = drawingSurface;
    
    // Calculate origin to center the footprint
    const origin = {
      x: surface.pixelsToFeet(worldPos.x) - (width_ft / 2),
      y: surface.pixelsToFeet(worldPos.y) - (length_ft / 2)
    };
    
    return {
      origin: origin,
      width_ft: width_ft,
      length_ft: length_ft
    };
  }
};