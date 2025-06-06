import { create } from 'zustand'
import { computeStructure } from '../engine/index.js'
import { generateStructureGeometry } from '../utils/structureGeometry.js'
import toast from 'react-hot-toast'

const useDeckStore = create((set, get) => ({
  // Drawing state
  footprint: null, // Start with null - draw a footprint to begin
  tool: 'rectangle',
  previewRect: null,
  
  // Configuration state
  context: {
    height_ft: 3,
    attachment: 'ledger',
    beam_style_outer: null,
    beam_style_inner: null,
    footing_type: 'helical',
    species_grade: 'SPF #2',
    forced_joist_spacing_in: null,
    decking_type: 'composite_1in',
    optimization_goal: 'cost'
  },
  
  // Generated structure
  engineOut: null,
  structureGeometry: null,
  
  // UI state
  sidebarOpen: true,
  loading: false,
  
  // Display toggles
  showGrid: true,
  showDimensions: true,
  showJoists: true,
  showBeams: true,
  showDecking: true,
  
  // Grid configuration
  gridCfg: {
    visible: true,
    snap: true,
    spacing_in: 6
  },
  
  // Actions
  setFootprint: (footprint) => set({ footprint }),
  setTool: (tool) => set({ tool }),
  setPreviewRect: (previewRect) => set({ previewRect }),
  updateContext: (updates) => set((state) => ({ 
    context: { ...state.context, ...updates }
  })),
  setEngineOut: (engineOut) => set({ engineOut }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
  updateGridCfg: (updates) => set((state) => ({
    gridCfg: { ...state.gridCfg, ...updates }
  })),
  
  // Display toggle actions
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setShowJoists: (showJoists) => set({ showJoists }),
  setShowBeams: (showBeams) => set({ showBeams }),
  setShowDecking: (showDecking) => set({ showDecking }),
  
  // Computed properties / getters
  get structure() {
    return get().structureGeometry
  },
  get config() {
    return get().context
  },
  
  // Generate structure action
  generateStructure: async () => {
    const state = get()
    if (!state.footprint || state.footprint.length < 3) {
      toast.error('Please draw a deck footprint first')
      return
    }
    
    set({ loading: true })
    
    try {
      // Calculate dimensions from footprint
      const minX = Math.min(...state.footprint.map(p => p.x))
      const maxX = Math.max(...state.footprint.map(p => p.x))
      const minY = Math.min(...state.footprint.map(p => p.y))
      const maxY = Math.max(...state.footprint.map(p => p.y))
      
      const width_ft = maxX - minX
      const length_ft = maxY - minY
      
      const payload = {
        ...state.context,
        width_ft,
        length_ft
      }
      
      console.log('Generating structure with:', payload)
      const engineOut = computeStructure(payload)
      
      // Generate drawable geometry from engine output
      const structureGeometry = generateStructureGeometry(engineOut, state.footprint)
      
      set({ 
        engineOut,
        structureGeometry,
        loading: false 
      })
      
      toast.success('Structure generated successfully!')
      console.log('Engine output:', engineOut)
      console.log('Structure geometry:', structureGeometry)
      
    } catch (error) {
      set({ loading: false })
      toast.error(error.message || 'Failed to generate structure')
      console.error('Engine error:', error)
    }
  }
}))

export default useDeckStore