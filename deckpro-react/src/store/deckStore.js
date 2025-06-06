import { create } from 'zustand'
import { computeStructure } from '../engine/index.js'
import { generateIRCCompliantGeometry } from '../utils/ircCompliantGeometry.js'
import { createDeckProject, createDeckSection, getPolygonBounds } from '../models/deckProject.js'
import toast from 'react-hot-toast'

const useDeckStore = create((set, get) => ({
  // Project state
  project: createDeckProject(),
  
  // Current editing state
  selectedSectionId: null,
  selectedElementType: null, // 'section', 'stair', etc.
  
  // Drawing state
  tool: 'section', // 'section', 'rectangle', 'stair', 'select', 'measure'
  drawingMode: null, // 'drawing', 'editing', null
  currentPolygon: [], // Points being drawn
  previewPoint: null, // Next point preview
  rectangleStart: null, // Start point for rectangle drawing
  measureStart: null, // Start point for measurement
  measureEnd: null, // End point for measurement
  
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
    
    // Auto-generate structure for this section
    setTimeout(() => get().generateSectionStructure(newSection.id), 100)
  },
  
  cancelDrawing: () => set({
    drawingMode: null,
    currentPolygon: [],
    previewPoint: null,
    rectangleStart: null,
    measureStart: null,
    measureEnd: null
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
      
      console.log('Generating structure for section:', sectionId, payload)
      const engineOut = computeStructure(payload)
      console.log('Engine output posts:', engineOut.posts)
      
      // Generate drawable geometry
      const structureGeometry = generateIRCCompliantGeometry(engineOut, section.polygon)
      console.log('Generated geometry posts:', structureGeometry?.posts)
      
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
      toast.error(error.message || 'Failed to generate structure')
      console.error('Engine error:', error)
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
        drawingMode: null
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
    console.log('Toggling layer:', layer, 'Current state:', {
      dimensions: state.showDimensions,
      joists: state.showJoists,
      beams: state.showBeams,
      posts: state.showPosts,
      decking: state.showDecking
    })
    
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
    
    // Log the new state after toggle
    const newState = get()
    console.log('After toggle:', layer, 'New state:', {
      dimensions: newState.showDimensions,
      joists: newState.showJoists,
      beams: newState.showBeams,
      posts: newState.showPosts,
      decking: newState.showDecking
    })
  },
  updateGridCfg: (updates) => set((state) => ({
    gridCfg: { ...state.gridCfg, ...updates }
  })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
  
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
  setFootprint: () => {
    console.warn('setFootprint is deprecated, use section-based drawing')
  },
  setEngineOut: () => {
    console.warn('setEngineOut is deprecated')
  },
  setPreviewRect: () => {
    console.warn('setPreviewRect is deprecated')
  }
}))

export default useDeckStore