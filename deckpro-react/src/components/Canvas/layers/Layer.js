// Base Layer class for canvas drawing system
export class Layer {
  constructor(id, options = {}) {
    this.id = id;
    this.visible = options.visible !== false;
    this.zIndex = options.zIndex || 0;
    this.surface = null; // Set by DrawingSurface when layer is added
  }
  
  draw() {
    // Override in subclasses
  }
  
  // Optional methods that subclasses can implement
  handleMouseDown() {
    return false; // Return true if handled
  }
  
  handleMouseMove() {
    // Override in subclasses
  }
  
  handleMouseUp() {
    // Override in subclasses
  }
  
  clear() {
    // Override in subclasses if needed
    // Base implementation clears any stored data
    if (this.footprint) this.footprint = null;
    if (this.joists) this.joists = null;
    if (this.beams) this.beams = null;
    if (this.posts) this.posts = null;
  }
  
  setTool() {
    // Override in subclasses if needed
  }
}

// Make Layer available globally
