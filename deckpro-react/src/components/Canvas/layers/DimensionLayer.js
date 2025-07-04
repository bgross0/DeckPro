import { Layer } from './Layer.js'

export class DimensionLayer extends Layer {
  constructor(options = {}) {
    super('dimensions', { zIndex: 10, ...options });
    this.footprint = null;
    this.textColor = '#000';
    this.lineColor = '#666';
    this.offset = 20; // Pixels offset from footprint
  }
  
  setFootprint(footprint) {
    this.footprint = footprint;
    if (this.surface) {
      this.surface.draw();
    }
  }
  
  setEngineOutput(engineOut) {
    // For future use - could show joist spacing dimensions, etc
    this.engineOut = engineOut;
  }
  
  draw(ctx) {
    if (!this.footprint) return;
    
    const surface = this.surface;
    const { origin, width_ft, length_ft } = this.footprint;
    
    // Don't draw if dimensions are too small
    if (width_ft < 0.1 || length_ft < 0.1) return;
    
    // Convert to pixels
    const x = surface.feetToPixels(origin.x);
    const y = surface.feetToPixels(origin.y);
    const width = surface.feetToPixels(width_ft);
    const height = surface.feetToPixels(length_ft);
    
    const offset = this.offset / surface.zoom;
    
    // Draw width dimension (top)
    this.drawDimension(ctx, x, y - offset, x + width, y - offset, width_ft, 'horizontal');
    
    // Draw length dimension (left)
    this.drawDimension(ctx, x - offset, y, x - offset, y + height, length_ft, 'vertical');
  }
  
  drawDimension(ctx, x1, y1, x2, y2, measurement, orientation) {
    const surface = this.surface;
    
    ctx.strokeStyle = this.lineColor;
    ctx.fillStyle = this.textColor;
    ctx.lineWidth = 1 / surface.zoom;
    ctx.font = `${14 / surface.zoom}px Arial`;
    
    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw end marks
    const markSize = 8 / surface.zoom;
    
    if (orientation === 'horizontal') {
      // Left mark
      ctx.beginPath();
      ctx.moveTo(x1, y1 - markSize / 2);
      ctx.lineTo(x1, y1 + markSize / 2);
      ctx.stroke();
      
      // Right mark
      ctx.beginPath();
      ctx.moveTo(x2, y2 - markSize / 2);
      ctx.lineTo(x2, y2 + markSize / 2);
      ctx.stroke();
    } else {
      // Top mark
      ctx.beginPath();
      ctx.moveTo(x1 - markSize / 2, y1);
      ctx.lineTo(x1 + markSize / 2, y1);
      ctx.stroke();
      
      // Bottom mark
      ctx.beginPath();
      ctx.moveTo(x2 - markSize / 2, y2);
      ctx.lineTo(x2 + markSize / 2, y2);
      ctx.stroke();
    }
    
    // Draw measurement text
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = this.formatMeasurement(measurement);
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (orientation === 'vertical') {
      ctx.translate(midX, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, midX, midY);
    }
    
    ctx.restore();
  }
  
  formatMeasurement(feet) {
    const wholeFeet = Math.floor(feet);
    const inches = Math.round((feet - wholeFeet) * 12);
    
    if (inches === 0) {
      return `${wholeFeet}'`;
    } else if (inches === 12) {
      return `${wholeFeet + 1}'`;
    } else {
      return `${wholeFeet}'-${inches}"`;
    }
  }
}

