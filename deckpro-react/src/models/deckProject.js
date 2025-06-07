// Deck Project Data Model
// This represents the complete deck design with all sections, stairs, and features

export const DeckSectionTypes = {
  MAIN_DECK: 'main_deck',
  LANDING: 'landing',
  BUMP_OUT: 'bump_out'
}

export const ConnectionTypes = {
  LEDGER: 'ledger',
  RIM_JOIST: 'rim_joist',
  BEAM: 'beam',
  FREESTANDING: 'freestanding'
}

export const StairTypes = {
  STRAIGHT: 'straight',
  L_SHAPED: 'l_shaped',
  U_SHAPED: 'u_shaped'
}

// Create a new deck section
export function createDeckSection(type = DeckSectionTypes.MAIN_DECK) {
  return {
    id: `section-${Date.now()}`,
    type,
    name: type === DeckSectionTypes.MAIN_DECK ? 'Main Deck' : 
          type === DeckSectionTypes.LANDING ? 'Landing' : 'Bump-out',
    polygon: [], // Array of {x, y} points in feet
    elevation: 36, // Height in inches from grade
    connection: {
      type: ConnectionTypes.FREESTANDING,
      side: null,
      parentId: null // ID of connected section
    },
    config: {
      joistDirection: 'auto', // 'auto', 'horizontal', 'vertical'
      deckingDirection: 'perpendicular', // 'perpendicular', 'parallel', 'diagonal'
      cantilevered: true
    },
    structure: null // Generated structure for this section
  }
}

// Create a new stair
export function createStair() {
  return {
    id: `stair-${Date.now()}`,
    type: StairTypes.STRAIGHT,
    topConnection: {
      sectionId: null,
      edge: null, // Which edge of the section
      position: { x: 0, y: 0 } // Position along edge
    },
    bottomConnection: {
      sectionId: null, // null if going to ground
      edge: null,
      position: { x: 0, y: 0 }
    },
    dimensions: {
      width: 36, // inches
      riserHeight: 7.5, // inches
      treadDepth: 11, // inches
      totalRise: null, // Calculated
      numberOfSteps: null // Calculated
    },
    handrail: {
      left: true,
      right: true,
      height: 36 // inches
    },
    structure: null
  }
}

// Create a new deck project
export function createDeckProject() {
  return {
    id: `project-${Date.now()}`,
    name: 'New Deck Project',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    
    // Project settings
    settings: {
      units: 'imperial', // 'imperial' or 'metric'
      defaultHeight: 36, // inches
      species: 'SPF #2',
      deckingType: 'composite_1in',
      footingType: 'helical',
      optimizationGoal: 'cost'
    },
    
    // Design elements
    sections: [], // Array of deck sections
    stairs: [], // Array of stairs
    railings: [], // Future: railing segments
    
    // Generated data
    structure: null, // Overall structure combining all sections
    materials: null, // Total material takeoff
    cost: null, // Cost estimate
    
    // Validation
    validation: {
      errors: [],
      warnings: []
    }
  }
}

// Calculate bounds of a polygon
export function getPolygonBounds(polygon) {
  if (!polygon || polygon.length === 0) return null
  
  const xs = polygon.map(p => p.x)
  const ys = polygon.map(p => p.y)
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  }
}

// Calculate area of a polygon
export function getPolygonArea(polygon) {
  if (!polygon || polygon.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    area += polygon[i].x * polygon[j].y
    area -= polygon[j].x * polygon[i].y
  }
  
  return Math.abs(area / 2)
}

// Check if a polygon is rectangular
export function isRectangular(polygon) {
  if (!polygon || polygon.length !== 4) return false
  
  // Check if all angles are 90 degrees
  for (let i = 0; i < 4; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % 4]
    const p3 = polygon[(i + 2) % 4]
    
    // Calculate vectors
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
    
    // Check if perpendicular (dot product should be 0)
    const dot = v1.x * v2.x + v1.y * v2.y
    if (Math.abs(dot) > 0.01) return false
  }
  
  return true
}

// Get edges of a polygon
export function getPolygonEdges(polygon) {
  if (!polygon || polygon.length < 2) return []
  
  const edges = []
  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i]
    const end = polygon[(i + 1) % polygon.length]
    
    edges.push({
      index: i,
      start,
      end,
      length: Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)),
      angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
    })
  }
  
  return edges
}