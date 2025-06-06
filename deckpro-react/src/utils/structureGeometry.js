// Convert engine output to drawable geometry
export function generateStructureGeometry(engineOut, footprint) {
  if (!engineOut || !footprint || footprint.length < 4) return null;
  
  // Calculate deck bounds
  const minX = Math.min(...footprint.map(p => p.x));
  const maxX = Math.max(...footprint.map(p => p.x));
  const minY = Math.min(...footprint.map(p => p.y));
  const maxY = Math.max(...footprint.map(p => p.y));
  
  const width = maxX - minX;
  const length = maxY - minY;
  
  const geometry = {
    joists: [],
    beams: [],
    posts: [],
    decking_boards: []
  };
  
  // Generate joist geometry
  if (engineOut.joists) {
    const { count, spacing_in, orientation, cantilever_ft, span_ft } = engineOut.joists;
    const spacing_ft = spacing_in / 12;
    
    // Determine joist direction based on orientation
    const joistsRunHorizontal = orientation === 'width';
    
    if (joistsRunHorizontal) {
      // Joists run left-right (span width)
      const startY = engineOut.input.attachment === 'ledger' ? minY : minY - cantilever_ft;
      const endY = maxY + cantilever_ft;
      
      for (let i = 0; i < count; i++) {
        const x = minX + (i * spacing_ft);
        if (x <= maxX) {
          geometry.joists.push({
            start: { x, y: startY },
            end: { x, y: endY },
            is_double: i === 0 || i === count - 1 // Double end joists
          });
        }
      }
    } else {
      // Joists run top-bottom (span length)
      const startX = engineOut.input.attachment === 'ledger' ? minX : minX - cantilever_ft;
      const endX = maxX + cantilever_ft;
      
      for (let i = 0; i < count; i++) {
        const y = minY + (i * spacing_ft);
        if (y <= maxY) {
          geometry.joists.push({
            start: { x: startX, y },
            end: { x: endX, y },
            is_double: i === 0 || i === count - 1
          });
        }
      }
    }
  }
  
  // Generate beam geometry
  if (engineOut.beams) {
    const joistsRunHorizontal = engineOut.joists?.orientation === 'width';
    
    engineOut.beams.forEach((beam, index) => {
      if (beam.style === 'ledger') return; // Don't draw ledgers
      
      let beamGeometry;
      
      if (joistsRunHorizontal) {
        // Beams run vertically to support horizontal joists
        if (beam.position === 'outer') {
          beamGeometry = {
            start: { x: minX, y: maxY },
            end: { x: maxX, y: maxY },
            posts: []
          };
        } else {
          beamGeometry = {
            start: { x: minX, y: minY },
            end: { x: maxX, y: minY },
            posts: []
          };
        }
      } else {
        // Beams run horizontally to support vertical joists
        if (beam.position === 'outer') {
          beamGeometry = {
            start: { x: maxX, y: minY },
            end: { x: maxX, y: maxY },
            posts: []
          };
        } else {
          beamGeometry = {
            start: { x: minX, y: minY },
            end: { x: minX, y: maxY },
            posts: []
          };
        }
      }
      
      geometry.beams.push(beamGeometry);
    });
  }
  
  // Add posts from engine output
  if (engineOut.posts) {
    // Posts are already in the correct format { x, y }
    geometry.posts = engineOut.posts.map(post => ({
      x: minX + post.x,
      y: minY + post.y
    }));
    
    // Assign posts to beams
    geometry.posts.forEach(post => {
      // Find the closest beam
      let closestBeam = null;
      let minDistance = Infinity;
      
      geometry.beams.forEach(beam => {
        // Calculate distance from post to beam line
        const distance = pointToLineDistance(
          post,
          beam.start,
          beam.end
        );
        
        if (distance < minDistance && distance < 0.5) { // Within 6 inches
          minDistance = distance;
          closestBeam = beam;
        }
      });
      
      if (closestBeam) {
        closestBeam.posts.push(post);
      }
    });
  }
  
  // Generate decking board geometry (simplified)
  if (engineOut.input.decking_type) {
    const boardWidth = 5.5 / 12; // 5.5 inches in feet
    const numBoards = Math.ceil(width / boardWidth);
    
    for (let i = 0; i < numBoards; i++) {
      const x = minX + (i * boardWidth);
      if (x <= maxX) {
        geometry.decking_boards.push({
          start: { x, y: minY },
          end: { x, y: maxY }
        });
      }
    }
  }
  
  return geometry;
}

// Helper function to calculate distance from point to line
function pointToLineDistance(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}