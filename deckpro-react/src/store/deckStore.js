import { create } from 'zustand'
import { computeStructure } from '../engine/index.js'
import { generateIRCCompliantGeometry } from '../utils/ircCompliantGeometry.js'
import { createDeckProject, createDeckSection, createStair, getPolygonBounds, getPolygonEdges } from '../models/deckProject.js'
import toast from 'react-hot-toast'

// Helper function for point to line distance
function pointToLineDistance(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y
  
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  
  if (lenSq !== 0) {
    param = dot / lenSq
  }
  
  let xx, yy
  
  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }
  
  const dx = point.x - xx
  const dy = point.y - yy
  
  return Math.sqrt(dx * dx + dy * dy)
}

const useDeckStore = create((set, get) => ({
  // Project state
  project: createDeckProject(),
  
  // History management
  history: [createDeckProject()],
  historyIndex: 0,
  
  // Current editing state
  selectedSectionId: null,
  selectedElementType: null, // 'section', 'stair', etc.
  
  // Drawing state
  tool: 'select', // 'section', 'rectangle', 'stair', 'select', 'measure'
  drawingMode: null, // 'drawing', 'editing', null
  currentPolygon: [], // Points being drawn
  previewPoint: null, // Next point preview
  rectangleStart: null, // Start point for rectangle drawing
  measureStart: null, // Start point for measurement
  measureEnd: null, // End point for measurement
  stairStart: null, // Start point for stair placement
  stairEnd: null, // End point for stair placement
  stairConfig: {
    width: 36,
    riserHeight: 7.5,
    treadDepth: 11
  },
  
  // UI state
  sidebarOpen: true,
  loading: false,
  
  // Display toggles
  showGrid: true,
  showDimensions: true,
  showJoists: true,
  showBeams: true,
  showDecking: true,
  showPosts: true,
  activeLayer: 'all', // 'all', 'footprint', 'framing', 'decking'
  
  // Grid configuration
  gridCfg: {
    visible: true,
    snap: true,
    spacing_in: 6
  },
  
  // Actions
  setTool: (tool) => set({ tool, drawingMode: null, currentPolygon: [] }),
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  
  // Project actions
  updateProjectSettings: (settings) => set((state) => ({
    project: {
      ...state.project,
      settings: { ...state.project.settings, ...settings },
      modified: new Date().toISOString()
    }
  })),
  
  // Section actions
  startDrawingSection: () => {
    set({ 
      drawingMode: 'drawing',
      currentPolygon: [],
      previewPoint: null,
      rectangleStart: null
    })
  },
  
  startDrawingRectangle: (startPoint) => {
    set({ 
      drawingMode: 'drawing',
      rectangleStart: startPoint,
      previewPoint: null
    })
  },
  
  completeRectangle: (endPoint) => {
    const state = get()
    const start = state.rectangleStart
    if (!start) return
    
    // Create rectangle polygon from two points
    const polygon = [
      { x: start.x, y: start.y },
      { x: endPoint.x, y: start.y },
      { x: endPoint.x, y: endPoint.y },
      { x: start.x, y: endPoint.y }
    ]
    
    const newSection = createDeckSection()
    newSection.polygon = polygon
    newSection.elevation = state.project.settings.defaultHeight
    
    set(state => ({
      project: {
        ...state.project,
        sections: [...state.project.sections, newSection],
        modified: new Date().toISOString()
      },
      selectedSectionId: newSection.id,
      drawingMode: null,
      rectangleStart: null,
      previewPoint: null
    }))
    
    // Push to history after state update
    get().pushToHistory()
  },
  
  addPointToPolygon: (point) => set((state) => ({
    currentPolygon: [...state.currentPolygon, point]
  })),
  
  completeSection: () => {
    const state = get()
    if (state.currentPolygon.length < 3) {
      toast.error('A deck section needs at least 3 points')
      return
    }
    
    // Create new section
    const newSection = createDeckSection()
    newSection.polygon = [...state.currentPolygon]
    
    // Add to project
    set((state) => ({
      project: {
        ...state.project,
        sections: [...state.project.sections, newSection],
        modified: new Date().toISOString()
      },
      selectedSectionId: newSection.id,
      selectedElementType: 'section',
      drawingMode: null,
      currentPolygon: [],
      previewPoint: null
    }))
    
    toast.success('Deck section created')
    
    // Push to history
    get().pushToHistory()
    
    // Auto-generate structure for this section
    setTimeout(() => get().generateSectionStructure(newSection.id), 100)
  },
  
  cancelDrawing: () => set({
    drawingMode: null,
    currentPolygon: [],
    previewPoint: null,
    rectangleStart: null,
    measureStart: null,
    measureEnd: null,
    stairStart: null,
    stairEnd: null
  }),
  
  startMeasure: (point) => set({
    measureStart: point,
    measureEnd: null,
    drawingMode: 'measuring'
  }),
  
  updateMeasure: (point) => set({
    measureEnd: point
  }),
  
  completeMeasure: () => set({
    drawingMode: null
  }),
  
  // Stair actions
  startDrawingStair: (point) => set({
    drawingMode: 'drawing',
    stairStart: point,
    stairEnd: null
  }),
  
  updateStairEnd: (point) => set({
    stairEnd: point
  }),
  
  completeStair: () => {
    const state = get()
    if (!state.stairStart) return
    
    // Use the last updated stair end position
    const endPos = state.stairEnd || state.stairStart
    
    // Calculate stair dimensions
    const dx = endPos.x - state.stairStart.x
    const dy = endPos.y - state.stairStart.y
    const run = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    
    // Find the closest section edge for attachment
    let closestSection = null
    let closestEdge = null
    let minDistance = Infinity
    
    state.project.sections.forEach(section => {
      const edges = getPolygonEdges(section.polygon)
      edges.forEach(edge => {
        // Distance from stair start to edge
        const dist = pointToLineDistance(state.stairStart, edge.start, edge.end)
        
        // Also check if the stair start is close to edge endpoints for better corner attachment
        const distToStart = Math.sqrt(
          Math.pow(state.stairStart.x - edge.start.x, 2) + 
          Math.pow(state.stairStart.y - edge.start.y, 2)
        )
        const distToEnd = Math.sqrt(
          Math.pow(state.stairStart.x - edge.end.x, 2) + 
          Math.pow(state.stairStart.y - edge.end.y, 2)
        )
        
        const minEdgeDist = Math.min(dist, distToStart, distToEnd)
        
        if (minEdgeDist < minDistance && minEdgeDist < 3) { // Within 3 feet for better attachment
          minDistance = minEdgeDist
          closestSection = section
          closestEdge = edge
        }
      })
    })
    
    // Create stair
    const newStair = createStair()
    newStair.topConnection = {
      sectionId: closestSection?.id || null,
      edge: closestEdge?.index || null,
      position: state.stairStart
    }
    newStair.bottomConnection = {
      sectionId: null, // Going to ground
      edge: null,
      position: endPos
    }
    
    // Calculate rise based on connected section
    const totalRise = closestSection ? closestSection.elevation : 36
    const numberOfSteps = Math.ceil(totalRise / state.stairConfig.riserHeight)
    const actualRiserHeight = totalRise / numberOfSteps
    
    newStair.dimensions = {
      ...state.stairConfig,
      totalRise,
      numberOfSteps,
      riserHeight: actualRiserHeight,
      run: run * 12, // Convert to inches
      angle: angle * 180 / Math.PI
    }
    
    // Add to project
    set(state => ({
      project: {
        ...state.project,
        stairs: [...state.project.stairs, newStair],
        modified: new Date().toISOString()
      },
      drawingMode: null,
      stairStart: null,
      stairEnd: null
    }))
    
    toast.success('Stairs added')
    get().pushToHistory()
  },
  
  updateStairConfig: (config) => set(state => ({
    stairConfig: { ...state.stairConfig, ...config }
  })),
  
  deleteStair: (stairId) => {
    set(state => ({
      project: {
        ...state.project,
        stairs: state.project.stairs.filter(s => s.id !== stairId),
        modified: new Date().toISOString()
      }
    }))
    toast.success('Stairs deleted')
    get().pushToHistory()
  },
  
  selectSection: (sectionId) => set({
    selectedSectionId: sectionId,
    selectedElementType: 'section'
  }),
  
  updateSection: (sectionId, updates) => set((state) => ({
    project: {
      ...state.project,
      sections: state.project.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
      modified: new Date().toISOString()
    }
  })),
  
  deleteSection: (sectionId) => {
    const state = get()
    const section = state.project.sections.find(s => s.id === sectionId)
    if (!section) return
    
    if (window.confirm(`Delete ${section.name}?`)) {
      set((state) => ({
        project: {
          ...state.project,
          sections: state.project.sections.filter(s => s.id !== sectionId),
          modified: new Date().toISOString()
        },
        selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId
      }))
      toast.success('Section deleted')
    }
  },
  
  // Structure generation
  generateSectionStructure: async (sectionId) => {
    const state = get()
    const section = state.project.sections.find(s => s.id === sectionId)
    if (!section || !section.polygon || section.polygon.length < 3) return
    
    set({ loading: true })
    
    try {
      // Get bounds for rectangular calculation
      const bounds = getPolygonBounds(section.polygon)
      
      // Prepare payload for engine
      const payload = {
        ...state.project.settings,
        width_ft: bounds.width,
        length_ft: bounds.height,
        height_ft: section.elevation / 12, // Convert to feet
        attachment: section.connection.type === 'ledger' ? 'ledger' : 'free',
        footing_type: state.project.settings.footingType,
        species_grade: state.project.settings.species,
        decking_type: state.project.settings.deckingType,
        optimization_goal: state.project.settings.optimizationGoal
      }
      
      const engineOut = computeStructure(payload)
      
      // Generate drawable geometry
      const structureGeometry = generateIRCCompliantGeometry(engineOut, section.polygon)
      
      // Update section with structure
      set((state) => ({
        project: {
          ...state.project,
          sections: state.project.sections.map(s =>
            s.id === sectionId 
              ? { ...s, structure: { engineOut, geometry: structureGeometry } }
              : s
          ),
          modified: new Date().toISOString()
        },
        loading: false
      }))
      
      toast.success(`Structure generated for ${section.name}`)
      
    } catch (error) {
      set({ loading: false })
      
      // Provide better error messages
      let errorMessage = 'Failed to generate structure'
      
      if (error.code === 'INVALID_INPUT') {
        errorMessage = `Invalid deck configuration: ${error.message}`
      } else if (error.message.includes('span')) {
        errorMessage = 'Deck dimensions exceed maximum allowable spans. Try reducing deck size or changing material.'
      } else if (error.message.includes('height')) {
        errorMessage = 'Invalid deck height. Height must be between 12" and 120".'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, { duration: 6000 })
    }
  },
  
  generateAllStructures: async () => {
    const state = get()
    for (const section of state.project.sections) {
      await get().generateSectionStructure(section.id)
    }
  },
  
  // Clear/New project
  clearProject: () => {
    if (window.confirm('Start a new project? All unsaved changes will be lost.')) {
      set({
        project: createDeckProject(),
        selectedSectionId: null,
        selectedElementType: null,
        currentPolygon: [],
        previewPoint: null,
        drawingMode: null,
        stairStart: null,
        stairEnd: null,
        history: [createDeckProject()],
        historyIndex: 0
      })
      toast.success('New project created')
    }
  },
  
  // Display actions
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setShowJoists: (showJoists) => set({ showJoists }),
  setShowBeams: (showBeams) => set({ showBeams }),
  setShowDecking: (showDecking) => set({ showDecking }),
  setShowPosts: (showPosts) => set({ showPosts }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  toggleLayer: (layer) => {
    const state = get()
    
    switch(layer) {
      case 'dimensions':
        set({ showDimensions: !state.showDimensions })
        break
      case 'joists':
        set({ showJoists: !state.showJoists })
        break
      case 'beams':
        set({ showBeams: !state.showBeams })
        break
      case 'posts':
        set({ showPosts: !state.showPosts })
        break
      case 'decking':
        set({ showDecking: !state.showDecking })
        break
    }
    
  },
  updateGridCfg: (updates) => set((state) => ({
    gridCfg: { ...state.gridCfg, ...updates }
  })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
  
  // History management
  pushToHistory: () => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(state.project))) // Deep clone
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },
  
  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      set({
        project: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedSectionId: null,
        drawingMode: null,
        currentPolygon: [],
        previewPoint: null,
        rectangleStart: null
      })
      toast.success('Undo')
    }
  },
  
  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      set({
        project: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedSectionId: null,
        drawingMode: null,
        currentPolygon: [],
        previewPoint: null,
        rectangleStart: null
      })
      toast.success('Redo')
    }
  },
  
  canUndo: () => {
    const state = get()
    return state.historyIndex > 0
  },
  
  canRedo: () => {
    const state = get()
    return state.historyIndex < state.history.length - 1
  },
  
  // Save/Load functionality
  saveProject: () => {
    const state = get()
    const projectData = {
      version: '1.0',
      project: state.project,
      savedAt: new Date().toISOString()
    }
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deck-project-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Project saved')
  },
  
  loadProject: (file) => {
    const reader = new FileReader()
    reader.onerror = () => {
      toast.error('Failed to read project file')
    }
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.version !== '1.0') {
          toast.error('Incompatible project version')
          return
        }
        
        set({
          project: data.project,
          history: [data.project],
          historyIndex: 0,
          selectedSectionId: null,
          drawingMode: null,
          currentPolygon: [],
          previewPoint: null,
          rectangleStart: null
        })
        
        toast.success('Project loaded')
      } catch (error) {
        toast.error('Failed to load project file')
      }
    }
    reader.readAsText(file)
  },
  
  // Save to localStorage
  saveToLocalStorage: () => {
    const state = get()
    try {
      localStorage.setItem('deckpro-project', JSON.stringify({
        version: '1.0',
        project: state.project,
        savedAt: new Date().toISOString()
      }))
      toast.success('Project saved to browser')
    } catch (error) {
      toast.error('Failed to save to browser storage')
    }
  },
  
  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem('deckpro-project')
      if (!saved) {
        toast.error('No saved project found')
        return
      }
      
      const data = JSON.parse(saved)
      if (data.version !== '1.0') {
        toast.error('Incompatible project version')
        return
      }
      
      set({
        project: data.project,
        history: [data.project],
        historyIndex: 0,
        selectedSectionId: null,
        drawingMode: null,
        currentPolygon: [],
        previewPoint: null,
        rectangleStart: null
      })
      
      toast.success('Project loaded from browser')
    } catch (error) {
      toast.error('Failed to load from browser storage')
    }
  },
  
  // Legacy compatibility getters
  get footprint() {
    const state = get()
    // Return the selected section's polygon for compatibility
    if (state.selectedSectionId) {
      const section = state.project.sections.find(s => s.id === state.selectedSectionId)
      return section?.polygon || null
    }
    return null
  },
  
  get engineOut() {
    const state = get()
    if (state.selectedSectionId) {
      const section = state.project.sections.find(s => s.id === state.selectedSectionId)
      return section?.structure?.engineOut || null
    }
    return null
  },
  
  get structureGeometry() {
    const state = get()
    if (state.selectedSectionId) {
      const section = state.project.sections.find(s => s.id === state.selectedSectionId)
      return section?.structure?.geometry || null
    }
    return null
  },
  
  // Legacy setters for compatibility
  setFootprint: () => {},
  setEngineOut: () => {},
  setPreviewRect: () => {}
}))

export default useDeckStore
