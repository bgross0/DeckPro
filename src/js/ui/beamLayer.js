class BeamLayer extends Layer {
  constructor(options = {}) {
    super('beams', { zIndex: 2, ...options });
    this.beams = null;
    this.posts = null;
    this.footprint = null;
    this.beamColor = '#654321'; // Darker brown for beams
    this.postColor = '#444444'; // Dark gray for posts
  }
  
  setBeams(beams) {
    this.beams = beams;
    if (this.surface) {
      this.surface.draw();
    }
  }
  
  setPosts(posts) {
    this.posts = posts;
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
    // Only draw if we have beams data AND a footprint
    if (!this.beams || !this.footprint) {
      return;
    }
    
    console.log('Drawing beams:', this.beams);
    console.log('Drawing posts:', this.posts);
    
    const surface = this.surface;
    const { origin, width_ft, length_ft } = this.footprint;
    
    // Convert to pixels
    const x = surface.feetToPixels(origin.x);
    const y = surface.feetToPixels(origin.y);
    const width = surface.feetToPixels(width_ft);
    const length = surface.feetToPixels(length_ft);
    
    // Draw beams
    this.beams.forEach(beam => {
      if (beam.style === 'ledger') {
        this.drawLedger(ctx, x, y, length);
      } else {
        this.drawBeam(ctx, beam, x, y, width, length);
      }
    });
    
    // Draw posts
    if (this.posts) {
      this.drawPosts(ctx, x, y);
    }
  }
  
  drawBeam(ctx, beam, baseX, baseY, width, length) {
    const surface = this.surface;
    const beamThickness = surface.feetToPixels(0.5); // 6" thick beam
    
    // Position beam correctly based on its position property
    let beamX = baseX;
    let beamY = baseY;
    
    if (beam.position === 'outer') {
      // Outer beam is at the edge of the deck
      beamX = baseX + width;
    } else if (beam.position === 'inner' && beam.style !== 'ledger') {
      // Inner beam for freestanding deck
      beamX = baseX;
    }
    
    // Draw beam rectangle
    ctx.fillStyle = this.beamColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 / surface.zoom;
    
    // Beam runs horizontally (perpendicular to joists)
    ctx.fillRect(beamX - beamThickness / 2, beamY, beamThickness, length);
    ctx.strokeRect(beamX - beamThickness / 2, beamY, beamThickness, length);
  }
  
  drawLedger(ctx, x, y, length) {
    const surface = this.surface;
    const ledgerThickness = surface.feetToPixels(0.15); // 2" thick ledger
    
    // Draw ledger board
    ctx.fillStyle = '#8B7355'; // Lighter brown
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 / surface.zoom;
    
    ctx.fillRect(x - ledgerThickness, y, ledgerThickness, length);
    ctx.strokeRect(x - ledgerThickness, y, ledgerThickness, length);
    
    // Draw attachment pattern
    ctx.strokeStyle = '#666';
    ctx.setLineDash([5 / surface.zoom, 5 / surface.zoom]);
    
    const spacing = surface.feetToPixels(2); // 2 ft spacing
    for (let i = spacing; i < length; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(x - ledgerThickness / 2, y + i);
      ctx.lineTo(x - ledgerThickness * 2, y + i);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }
  
  drawPosts(ctx, baseX, baseY) {
    if (!this.posts) return;
    
    const surface = this.surface;
    const postSize = surface.feetToPixels(0.5); // 6" posts
    const { width_ft } = this.footprint;
    const width = surface.feetToPixels(width_ft);
    
    ctx.fillStyle = this.postColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 / surface.zoom;
    
    this.posts.forEach(post => {
      // post.x is position ALONG the beam (0 to span)
      // post.y is position ACROSS the deck (0 for inner, width for outer)
      
      // X position is based on whether this is inner or outer beam
      let postX;
      if (post.y === 0) {
        // Inner beam post
        postX = baseX;
      } else {
        // Outer beam post (post.y equals deck width)
        postX = baseX + width;
      }
      
      // Y position is along the beam length
      const postY = baseY + surface.feetToPixels(post.x);
      
      // Draw post square centered on the beam
      ctx.fillRect(
        postX - postSize / 2,
        postY - postSize / 2,
        postSize,
        postSize
      );
      ctx.strokeRect(
        postX - postSize / 2,
        postY - postSize / 2,
        postSize,
        postSize
      );
    });
  }
  
}