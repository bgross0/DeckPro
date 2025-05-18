class JoistLayer extends Layer {
  constructor(options = {}) {
    super('joists', { zIndex: 1, ...options });
    this.joists = null;
    this.footprint = null;
    this.strokeColor = '#8B4513'; // Brown color for wood
  }
  
  setJoists(joists) {
    this.joists = joists;
    if (this.surface) {
      this.surface.draw();
    }
  }
  
  setFootprint(footprint) {
    this.footprint = footprint;
    if (this.surface) {
      this.surface.draw();
    }
  }
  
  draw(ctx) {
    // Only draw if we have both joists data AND a footprint
    if (!this.joists || !this.footprint) {
      return;
    }
    
    console.log('Drawing joists:', this.joists);
    
    const surface = this.surface;
    const { origin, width_ft, length_ft } = this.footprint;
    const { size, spacing_in, cantilever_ft } = this.joists;
    
    // Convert to pixels
    const x = surface.feetToPixels(origin.x);
    const y = surface.feetToPixels(origin.y);
    const width = surface.feetToPixels(width_ft);
    const length = surface.feetToPixels(length_ft);
    const spacing = surface.feetToPixels(spacing_in / 12);
    const cantilever = surface.feetToPixels(cantilever_ft);
    
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 3 / surface.zoom;
    
    // Calculate joist positions
    const joistCount = Math.ceil(length / spacing) + 1;
    
    for (let i = 0; i < joistCount; i++) {
      const joistY = y + i * spacing;
      
      // Don't draw beyond deck boundary
      if (joistY > y + length) break;
      
      // Draw joist line
      ctx.beginPath();
      ctx.moveTo(x, joistY);
      ctx.lineTo(x + width + cantilever, joistY);
      ctx.stroke();
    }
  }
  
}