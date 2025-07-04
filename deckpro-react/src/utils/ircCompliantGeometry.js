// IRC-compliant structure geometry generation
// This module correctly implements IRC 2021 structural requirements

import { getPolygonBounds } from '../models/deckProject.js';

// Calculate distance from point to line segment
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

// Check if point is inside polygon
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Get line intersection with polygon
function lineIntersectsPolygon(start, end, polygon) {
  const startInside = isPointInPolygon(start, polygon);
  const endInside = isPointInPolygon(end, polygon);
  
  if (startInside && endInside) {
    return { intersects: true, clippedStart: start, clippedEnd: end };
  }
  
  // Find intersection points
  const intersections = [];
  
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    const intersection = getLineIntersection(start, end, p1, p2);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  if (intersections.length === 0) {
    return { intersects: false };
  }
  
  // Sort by distance from start
  intersections.sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x - start.x, 2) + Math.pow(a.y - start.y, 2));
    const distB = Math.sqrt(Math.pow(b.x - start.x, 2) + Math.pow(b.y - start.y, 2));
    return distA - distB;
  });
  
  let clippedStart = startInside ? start : intersections[0];
  let clippedEnd = endInside ? end : intersections[intersections.length - 1];
  
  if (!startInside && !endInside && intersections.length >= 2) {
    clippedStart = intersections[0];
    clippedEnd = intersections[1];
  }
  
  return { intersects: true, clippedStart, clippedEnd };
}

// Get intersection of two line segments
function getLineIntersection(p1, p2, p3, p4) {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}

export function generateIRCCompliantGeometry(engineOut, polygon) {
  if (!engineOut || !polygon || polygon.length < 3) return null;
  
  const bounds = getPolygonBounds(polygon);
  const { minX, maxX, minY, maxY, width, height } = bounds;
  
  
  const geometry = {
    joists: [],
    beams: [],
    posts: [],
    decking_boards: []
  };
  
  // 1. JOISTS - IRC compliant placement
  if (engineOut.joists) {
    const { spacing_in, orientation, cantilever_ft = 0 } = engineOut.joists;
    const spacing_ft = spacing_in / 12;
    
    // Critical: Understand joist orientation
    // orientation = 'width' means joists SPAN the width dimension (run E-W across the width)
    // orientation = 'length' means joists SPAN the length dimension (run N-S across the length)
    const joistsSpanWidth = orientation === 'width';
    const isLedgerAttached = engineOut.beams?.some(b => b.style === 'ledger');
    
    // Joists should always span the SHORTER dimension
    // If width < length, joists run E-W (spanning width)
    // If length < width, joists run N-S (spanning length)
    
    if (joistsSpanWidth) {
      // Width is the shorter dimension - joists run E-W
      // They are placed at intervals along the N-S (length) dimension
      const joistCount = engineOut.joists.count;
      
      for (let i = 0; i < joistCount; i++) {
        const y = minY + (i * spacing_ft);
        if (y <= maxY + 0.1) {
          // Joist runs E-W (across width) at this Y position
          let lineStart = { x: minX, y: y };
          let lineEnd = { x: maxX, y: y };
          
          // Adjust for cantilever
          if (isLedgerAttached) {
            // Ledger at minX, cantilever extends past maxX
            lineEnd.x = maxX + cantilever_ft;
          } else {
            // Freestanding - cantilever on both sides
            lineStart.x = minX - cantilever_ft;
            lineEnd.x = maxX + cantilever_ft;
          }
          
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.joists.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd,
              is_double: i === 0 || i === joistCount - 1
            });
          }
        }
      }
    } else {
      // Length is the shorter dimension - joists run N-S
      // They are placed at intervals along the E-W (width) dimension
      const joistCount = engineOut.joists.count;
      
      for (let i = 0; i < joistCount; i++) {
        const x = minX + (i * spacing_ft);
        if (x <= maxX + 0.1) {
          // Joist runs N-S (across length) at this X position
          let lineStart = { x: x, y: minY };
          let lineEnd = { x: x, y: maxY };
          
          // Adjust for cantilever
          if (isLedgerAttached) {
            // Ledger at minY, cantilever extends past maxY
            lineEnd.y = maxY + cantilever_ft;
          } else {
            // Freestanding - cantilever on both sides
            lineStart.y = minY - cantilever_ft;
            lineEnd.y = maxY + cantilever_ft;
          }
          
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.joists.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd,
              is_double: i === 0 || i === joistCount - 1
            });
          }
        }
      }
    }
  }
  
  // 2. BEAMS - IRC compliant placement
  if (engineOut.beams && engineOut.beams.length > 0) {
    const cantilever = engineOut.joists?.cantilever_ft || 0;
    const joistsSpanWidth = engineOut.joists?.orientation === 'width';
    
    engineOut.beams.forEach((engineBeam) => {
      if (engineBeam.style === 'ledger') return; // Don't draw ledger
      
      let beamStart, beamEnd;
      
      // Beams run perpendicular to joists
      if (joistsSpanWidth) {
        // Joists span width (run E-W), so beams run N-S
        
        if (engineBeam.position === 'outer') {
          // Outer beam is at the far edge minus cantilever
          const beamX = minX + (width - cantilever);
          beamStart = { x: beamX, y: minY };
          beamEnd = { x: beamX, y: maxY };
        } else {
          // Inner beam at deck origin
          const beamX = minX;
          beamStart = { x: beamX, y: minY };
          beamEnd = { x: beamX, y: maxY };
        }
      } else {
        // Joists span length (run N-S), so beams run E-W
        
        if (engineBeam.position === 'outer') {
          // Outer beam is at the far edge minus cantilever
          const beamY = minY + (height - cantilever);
          beamStart = { x: minX, y: beamY };
          beamEnd = { x: maxX, y: beamY };
        } else {
          // Inner beam at deck origin
          const beamY = minY;
          beamStart = { x: minX, y: beamY };
          beamEnd = { x: maxX, y: beamY };
        }
      }
      
      
      geometry.beams.push({
        start: beamStart,
        end: beamEnd,
        posts: [],
        position: engineBeam.position,
        size: engineBeam.size,
        post_spacing_ft: engineBeam.post_spacing_ft,
        post_count: engineBeam.post_count
      });
    });
  }
  
  // 3. POSTS - IRC compliant placement based on beam positions
  if (engineOut.posts && Array.isArray(engineOut.posts)) {
    // Engine provides posts in a coordinate system where:
    // - X is along the beam direction
    // - Y is across the deck (position on joist span)
    
    const joistsSpanWidth = engineOut.joists?.orientation === 'width';
    
    
    engineOut.posts.forEach((enginePost, idx) => {
      let absolutePost;
      
      if (joistsSpanWidth) {
        // Joists span width (run E-W), beams run N-S
        // Engine X is position along beam (N-S direction)
        // Engine Y is position across deck (E-W direction, where beams are placed)
        absolutePost = {
          x: minX + enginePost.y,  // Engine Y is beam position (E-W)
          y: minY + enginePost.x   // Engine X is position along beam (N-S)
        };
      } else {
        // Joists span length (run N-S), beams run E-W
        // Engine X is position along beam (E-W direction)
        // Engine Y is position across deck (N-S direction, where beams are placed)
        absolutePost = {
          x: minX + enginePost.x,  // Engine X is position along beam (E-W)
          y: minY + enginePost.y   // Engine Y is beam position (N-S)
        };
      }
      
      
      // Check if post is inside polygon or on the edge
      const isInside = isPointInPolygon(absolutePost, polygon);
      
      // Check if post is on a vertex
      const isOnVertex = polygon.some(p => Math.abs(p.x - absolutePost.x) < 0.1 && Math.abs(p.y - absolutePost.y) < 0.1);
      
      // Check if post is on an edge
      let isOnEdge = false;
      for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        const dist = pointToLineDistance(absolutePost, p1, p2);
        if (dist < 0.1) {
          isOnEdge = true;
          break;
        }
      }
      
      
      // Only add posts that are inside or on the polygon
      if (isInside || isOnVertex || isOnEdge) {
        geometry.posts.push(absolutePost);
        
        // Assign to nearest beam
        let nearestBeam = null;
        let minDistance = Infinity;
        let nearestBeamIdx = -1;
        
        geometry.beams.forEach((beam, beamIdx) => {
          const dist = pointToLineDistance(absolutePost, beam.start, beam.end);
          if (dist < minDistance && dist < 0.5) { // Within 6 inches
            minDistance = dist;
            nearestBeam = beam;
            nearestBeamIdx = beamIdx;
          }
        });
        
        if (nearestBeam) {
          nearestBeam.posts.push(absolutePost);
        } else {
        }
      } else {
      }
    });
    
  } else if (geometry.beams.length > 0) {
    // Generate posts based on beam specifications
    geometry.beams.forEach(beam => {
      const beamLength = Math.sqrt(
        Math.pow(beam.end.x - beam.start.x, 2) + 
        Math.pow(beam.end.y - beam.start.y, 2)
      );
      
      const postCount = beam.post_count || Math.max(2, Math.ceil(beamLength / (beam.post_spacing_ft || 8)) + 1);
      
      for (let i = 0; i < postCount; i++) {
        const t = i / (postCount - 1);
        const post = {
          x: beam.start.x + t * (beam.end.x - beam.start.x),
          y: beam.start.y + t * (beam.end.y - beam.start.y)
        };
        
        if (isPointInPolygon(post, polygon) || 
            polygon.some(p => Math.abs(p.x - post.x) < 0.1 && Math.abs(p.y - post.y) < 0.1)) {
          beam.posts.push(post);
          geometry.posts.push(post);
        }
      }
    });
  }
  
  // 4. DECKING - Runs perpendicular to joists
  if (engineOut.input?.decking_type) {
    const boardWidth = 5.5 / 12; // 5.5 inches in feet
    const joistsSpanWidth = engineOut.joists?.orientation === 'width';
    
    if (joistsSpanWidth) {
      // Joists run E-W, decking runs N-S (perpendicular)
      const numBoards = Math.ceil(width / boardWidth);
      for (let i = 0; i < numBoards; i++) {
        const x = minX + (i * boardWidth);
        if (x <= maxX) {
          const lineStart = { x, y: minY };
          const lineEnd = { x, y: maxY };
          
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.decking_boards.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd
            });
          }
        }
      }
    } else {
      // Joists run N-S, decking runs E-W (perpendicular)
      const numBoards = Math.ceil(height / boardWidth);
      for (let i = 0; i < numBoards; i++) {
        const y = minY + (i * boardWidth);
        if (y <= maxY) {
          const lineStart = { x: minX, y };
          const lineEnd = { x: maxX, y };
          
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.decking_boards.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd
            });
          }
        }
      }
    }
  }
  
  
  return geometry;
}