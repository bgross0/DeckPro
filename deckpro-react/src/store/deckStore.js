import { create } from 'zustand'
import { computeStructure } from '../engine/index.js'
import toast from 'react-hot-toast'

const useDeckStore = create((set, get) => ({
  // Drawing state
  footprint: null, // Start with null - draw a footprint to begin
  tool: 'rectangle',
  
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
  
  // UI state
  sidebarOpen: true,
  loading: false,
  
  // Grid configuration
  gridCfg: {
    visible: true,
    snap: true,
    spacing_in: 6
  },
  
  // Actions
  setFootprint: (footprint) => set({ footprint }),
  setTool: (tool) => set({ tool }),
  updateContext: (updates) => set((state) => ({ 
    context: { ...state.context, ...updates }
  })),
  setEngineOut: (engineOut) => set({ engineOut }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setLoading: (loading) => set({ loading }),
  updateGridCfg: (updates) => set((state) => ({
    gridCfg: { ...state.gridCfg, ...updates }
  })),
  
  // Generate structure action
  generateStructure: async () => {
    const state = get()
    if (!state.footprint) {
      toast.error('Please draw a deck footprint first')
      return
    }
    
    set({ loading: true })
    
    try {
      const payload = {
        ...state.context,
        ...state.footprint
      }
      
      console.log('Generating structure with:', payload)
      const engineOut = computeStructure(payload)
      
      set({ 
        engineOut,
        loading: false 
      })
      
      toast.success('Structure generated successfully!')
      
    } catch (error) {
      set({ loading: false })
      toast.error(error.message || 'Failed to generate structure')
      console.error('Engine error:', error)
    }
  }
}))

export default useDeckStore