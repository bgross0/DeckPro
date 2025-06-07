// Generate structure geometry that respects polygon boundaries
import { getPolygonBounds } from '../models/deckProject';

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

// Check if a line segment intersects with a polygon edge
function lineIntersectsPolygon(start, end, polygon) {
  // Check if both endpoints are inside
  const startInside = isPointInPolygon(start, polygon);
  const endInside = isPointInPolygon(end, polygon);
  
  if (startInside && endInside) {
    return { intersects: true, clippedStart: start, clippedEnd: end };
  }
  
  // Find intersection points with polygon edges
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
  
  // Sort intersections by distance from start
  intersections.sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x - start.x, 2) + Math.pow(a.y - start.y, 2));
    const distB = Math.sqrt(Math.pow(b.x - start.x, 2) + Math.pow(b.y - start.y, 2));
    return distA - distB;
  });
  
  // Determine clipped segment
  let clippedStart = startInside ? start : intersections[0];
  let clippedEnd = endInside ? end : intersections[intersections.length - 1];
  
  // If we have exactly 2 intersections and neither endpoint is inside, use those
  if (!startInside && !endInside && intersections.length >= 2) {
    clippedStart = intersections[0];
    clippedEnd = intersections[1];
  }
  
  return { 
    intersects: true, 
    clippedStart, 
    clippedEnd 
  };
}

// Get intersection point of two line segments
function getLineIntersection(p1, p2, p3, p4) {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null; // Parallel lines
  
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


export function generatePolygonStructureGeometry(engineOut, polygon) {
  if (!engineOut || !polygon || polygon.length < 3) return null;
  
  const bounds = getPolygonBounds(polygon);
  const { minX, maxX, minY, maxY, width, height } = bounds;
  
  
  const geometry = {
    joists: [],
    beams: [],
    posts: [],
    decking_boards: []
  };
  
  // Generate joist geometry that respects polygon boundaries
  if (engineOut.joists) {
    const { count, spacing_in, orientation, cantilever_ft = 0 } = engineOut.joists;
    const spacing_ft = spacing_in / 12;
    
    // If orientation is 'width', joists SPAN the width (run north-south)
    // If orientation is 'length', joists SPAN the length (run east-west)
    const joistsRunVertical = orientation === 'width';
    
    if (joistsRunVertical) {
      // Joists span the width, so they run vertically (north-south)
      for (let i = 0; i < count; i++) {
        const x = minX + (i * spacing_ft);
        if (x <= maxX) {
          // Create a vertical line at this x position
          const lineStart = { x, y: minY - cantilever_ft };
          const lineEnd = { x, y: maxY + cantilever_ft };
          
          // Clip to polygon
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.joists.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd,
              is_double: i === 0 || i === count - 1
            });
          }
        }
      }
    } else {
      // Joists run top-bottom
      for (let i = 0; i < count; i++) {
        const y = minY + (i * spacing_ft);
        if (y <= maxY) {
          // Create a horizontal line at this y position
          const lineStart = { x: minX - cantilever_ft, y };
          const lineEnd = { x: maxX + cantilever_ft, y };
          
          // Clip to polygon
          const clipped = lineIntersectsPolygon(lineStart, lineEnd, polygon);
          if (clipped.intersects) {
            geometry.joists.push({
              start: clipped.clippedStart,
              end: clipped.clippedEnd,
              is_double: i === 0 || i === count - 1
            });
          }
        }
      }
    }
  }
  
  // Generate beam geometry based on engine output
  if (engineOut.beams && engineOut.beams.length > 0) {
    // The engine determines beam positions based on the structure
    // For a rectangular deck, we typically have 2 beams perpendicular to joists
    
    const joistsRunVertical = engineOut.joists?.orientation === 'width';
    
    // For simplified polygon support, place beams at the extremes of the joist runs
    if (joistsRunVertical) {
      // Joists run vertically (N-S), so beams run horizontally (E-W)
      // Place beams at top and bottom of the deck
      
      // Bottom beam (at minY)
      geometry.beams.push({
        start: { x: minX, y: minY },
        end: { x: maxX, y: minY },
        posts: [],
        position: 'outer'
      });
      
      // Top beam (at maxY) 
      geometry.beams.push({
        start: { x: minX, y: maxY },
        end: { x: maxX, y: maxY },
        posts: [],
        position: 'outer'
      });
      
      // If there's an inner beam, place it in the middle
      if (engineOut.beams.length > 2) {
        const midY = (minY + maxY) / 2;
        geometry.beams.push({
          start: { x: minX, y: midY },
          end: { x: maxX, y: midY },
          posts: [],
          position: 'inner'
        });
      }
    } else {
      // Joists run horizontally (E-W), so beams run vertically (N-S)
      // Place beams at left and right of the deck
      
      // Left beam (at minX)
      geometry.beams.push({
        start: { x: minX, y: minY },
        end: { x: minX, y: maxY },
        posts: [],
        position: 'outer'
      });
      
      // Right beam (at maxX)
      geometry.beams.push({
        start: { x: maxX, y: minY },
        end: { x: maxX, y: maxY },
        posts: [],
        position: 'outer'
      });
      
      // If there's an inner beam, place it in the middle
      if (engineOut.beams.length > 2) {
        const midX = (minX + maxX) / 2;
        geometry.beams.push({
          start: { x: midX, y: minY },
          end: { x: midX, y: maxY },
          posts: [],
          position: 'inner'
        });
      }
    }
  }
  
  // Generate posts based on engine output
  if (engineOut.posts && Array.isArray(engineOut.posts)) {
    // The engine provides post positions relative to the deck origin
    // We need to translate these to our coordinate system
    engineOut.posts.forEach(post => {
      const absolutePost = {
        x: minX + post.x,
        y: minY + post.y
      };
      
      geometry.posts.push(absolutePost);
      
      // Assign posts to the nearest beam
      let nearestBeam = null;
      let minDistance = Infinity;
      
      geometry.beams.forEach(beam => {
        // Calculate distance from post to beam line
        const dist = pointToLineDistance(absolutePost, beam.start, beam.end);
        if (dist < minDistance && dist < 1) { // Within 1 foot
          minDistance = dist;
          nearestBeam = beam;
        }
      });
      
      if (nearestBeam) {
        nearestBeam.posts.push(absolutePost);
      }
    });
  } else if (engineOut.beams && geometry.beams.length > 0) {
    // Fallback: generate posts based on beam post_spacing_ft
    engineOut.beams.forEach((engineBeam, index) => {
      if (index >= geometry.beams.length) return;
      
      const beam = geometry.beams[index];
      const beamLength = Math.sqrt(
        Math.pow(beam.end.x - beam.start.x, 2) + 
        Math.pow(beam.end.y - beam.start.y, 2)
      );
      
      const postSpacing = engineBeam.post_spacing_ft || 8;
      const numPosts = engineBeam.post_count || Math.max(2, Math.ceil(beamLength / postSpacing) + 1);
      
      for (let i = 0; i < numPosts; i++) {
        const t = i / (numPosts - 1);
        const post = {
          x: beam.start.x + t * (beam.end.x - beam.start.x),
          y: beam.start.y + t * (beam.end.y - beam.start.y)
        };
        
        beam.posts.push(post);
        geometry.posts.push(post);
      }
    });
  }
  
  // Generate decking boards (simplified - just show direction)
  if (engineOut.input.decking_type) {
    const boardWidth = 5.5 / 12; // 5.5 inches in feet
    const deckingRunsHorizontal = engineOut.joists?.orientation === 'length'; // Perpendicular to joists
    
    if (deckingRunsHorizontal) {
      // Horizontal decking boards
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
    } else {
      // Vertical decking boards
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
    }
  }
  
  return geometry;
}