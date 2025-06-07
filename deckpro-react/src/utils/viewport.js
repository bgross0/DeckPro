// Viewport and zoom management utilities

export const PIXELS_PER_FOOT = 20

// Viewport constraints
export const VIEWPORT_CONSTRAINTS = {
  minZoom: 0.1,
  maxZoom: 5,
  defaultZoom: 1,
  zoomStep: 0.1,
  zoomWheelFactor: 1.1,
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  }
}

// Get initial viewport for a given deck size
export function getInitialViewport(deckBounds, canvasSize, padding = 50) {
  if (!deckBounds || !canvasSize) {
    return {
      x: 0,
      y: 0,
      scale: 1
    }
  }
  
  const { minX, maxX, minY, maxY, width, height } = deckBounds
  
  // Calculate center of deck in world coordinates
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  
  // Calculate scale to fit deck with padding
  const scaleX = (canvasSize.width - padding * 2) / (width * PIXELS_PER_FOOT)
  const scaleY = (canvasSize.height - padding * 2) / (height * PIXELS_PER_FOOT)
  const scale = Math.min(scaleX, scaleY, VIEWPORT_CONSTRAINTS.maxZoom)
  
  // Calculate position to center the deck
  const x = canvasSize.width / 2 - centerX * PIXELS_PER_FOOT * scale
  const y = canvasSize.height / 2 - centerY * PIXELS_PER_FOOT * scale
  
  return { x, y, scale }
}

// Fit all content in viewport
export function fitToContent(sections, canvasSize, padding = 50) {
  if (!sections || sections.length === 0) {
    return getInitialViewport(null, canvasSize)
  }
  
  // Calculate bounds of all sections
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  
  sections.forEach(section => {
    if (section.polygon) {
      section.polygon.forEach(point => {
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      })
    }
  })
  
  // Add some buffer for posts/cantilevers
  minX -= 5
  minY -= 5
  maxX += 5
  maxY += 5
  
  const bounds = {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  }
  
  return getInitialViewport(bounds, canvasSize, padding)
}

// Calculate zoom based on pointer position
export function calculateZoom(currentScale, deltaY, pointerPos, stagePos) {
  const scaleBy = VIEWPORT_CONSTRAINTS.zoomWheelFactor
  const oldScale = currentScale
  const newScale = deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
  
  // Clamp scale
  const scale = Math.max(
    VIEWPORT_CONSTRAINTS.minZoom,
    Math.min(VIEWPORT_CONSTRAINTS.maxZoom, newScale)
  )
  
  // Calculate new position to zoom towards pointer
  const mousePointTo = {
    x: (pointerPos.x - stagePos.x) / oldScale,
    y: (pointerPos.y - stagePos.y) / oldScale,
  }
  
  const newPos = {
    x: pointerPos.x - mousePointTo.x * scale,
    y: pointerPos.y - mousePointTo.y * scale,
  }
  
  return { scale, position: newPos }
}

// Get responsive scale factor based on viewport size
export function getResponsiveScale(viewportWidth) {
  const { breakpoints } = VIEWPORT_CONSTRAINTS
  
  if (viewportWidth <= breakpoints.mobile) {
    return 0.75 // Scale down for mobile
  } else if (viewportWidth <= breakpoints.tablet) {
    return 0.85 // Slightly scaled for tablet
  } else if (viewportWidth <= breakpoints.desktop) {
    return 1.0 // Normal scale for desktop
  } else {
    return 1.1 // Slightly larger for wide screens
  }
}

// Pan viewport with bounds checking
export function panViewport(currentPos, delta, scale, canvasSize, contentBounds) {
  // For now, allow free panning
  // Could add bounds checking later if needed
  return {
    x: currentPos.x + delta.x,
    y: currentPos.y + delta.y
  }
}

// Get grid spacing based on zoom level
export function getAdaptiveGridSpacing(baseSpacing, zoomLevel) {
  // Adjust grid spacing based on zoom to maintain visibility
  if (zoomLevel < 0.3) {
    return baseSpacing * 4 // Very zoomed out - larger grid
  } else if (zoomLevel < 0.6) {
    return baseSpacing * 2 // Zoomed out - double grid
  } else if (zoomLevel > 2) {
    return baseSpacing / 2 // Zoomed in - finer grid
  }
  return baseSpacing // Normal grid
}