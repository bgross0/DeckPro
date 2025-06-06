import { useState, useEffect, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import useDeckStore from '../../store/deckStore'
import toast from 'react-hot-toast'
import {
  MousePointer, Square, Ruler, Grid, Eye, EyeOff, Grid3x3,
  Undo, Redo, Trash2, ZoomIn, ZoomOut, Download, Save,
  FolderOpen, Plus, HelpCircle, Settings, Hammer
} from 'lucide-react'

export function MainToolbar() {
  const {
    tool,
    setTool,
    footprint,
    setFootprint,
    engineOut,
    setEngineOut,
    generateStructure,
    loading,
    gridCfg,
    updateGridCfg,
    setPreviewRect
  } = useDeckStore()
  
  console.log('MainToolbar - gridCfg:', gridCfg)

  const [showGridSettings, setShowGridSettings] = useState(false)
  const [customGridSize, setCustomGridSize] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  
  const gridDropdownRef = useRef(null)
  const exportDropdownRef = useRef(null)

  // Grid spacing options
  const gridSpacingOptions = [
    { label: '6"', value: 6 },
    { label: '12"', value: 12 },
    { label: '16"', value: 16 },
    { label: '24"', value: 24 },
    { label: '36"', value: 36 },
    { label: '48"', value: 48 },
  ]

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (gridDropdownRef.current && !gridDropdownRef.current.contains(event.target)) {
        setShowGridSettings(false)
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Tool selection
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select', hotkey: 's' },
    { id: 'rectangle', icon: Square, label: 'Draw Rectangle', hotkey: 'r' },
    { id: 'measure', icon: Ruler, label: 'Measure', hotkey: 'm' }
  ]

  // Keyboard shortcuts
  useHotkeys('s', () => setTool('select'))
  useHotkeys('r', () => setTool('rectangle'))
  useHotkeys('m', () => setTool('measure'))
  useHotkeys('g', () => updateGridCfg({ visible: !gridCfg.visible }))
  useHotkeys('shift+g', () => updateGridCfg({ snap: !gridCfg.snap }))
  useHotkeys('delete', handleClearCanvas)
  useHotkeys('ctrl+z, cmd+z', handleUndo)
  useHotkeys('ctrl+y, cmd+y', handleRedo)

  function handleClearCanvas() {
    if (footprint || engineOut) {
      if (window.confirm('Clear the canvas? This action cannot be undone.')) {
        setFootprint(null)
        setEngineOut(null)
        setPreviewRect(null)
        // Also need to set structureGeometry to null
        useDeckStore.setState({ structureGeometry: null })
        toast.success('Canvas cleared')
      }
    }
  }

  function handleUndo() {
    // TODO: Implement with history
    toast.info('Undo not yet implemented')
  }

  function handleRedo() {
    // TODO: Implement with history
    toast.info('Redo not yet implemented')
  }

  function handleZoomIn() {
    // This will be handled by the canvas component
    window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: { direction: 'in' } }))
  }

  function handleZoomOut() {
    // This will be handled by the canvas component
    window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: { direction: 'out' } }))
  }

  function handleExportPNG() {
    // TODO: Implement PNG export
    toast.info('PNG export coming soon')
    setShowExportMenu(false)
  }

  function handleExportCSV() {
    // TODO: Implement CSV export
    toast.info('CSV export coming soon')
    setShowExportMenu(false)
  }

  function handleNewProject() {
    if (window.confirm('Start a new project? Unsaved changes will be lost.')) {
      setFootprint(null)
      setEngineOut(null)
      setPreviewRect(null)
      toast.success('New project created')
    }
  }

  function handleSaveProject() {
    // TODO: Implement project save
    toast.info('Save project coming soon')
  }

  function handleLoadProject() {
    // TODO: Implement project load
    toast.info('Load project coming soon')
  }

  return (
    <div className="absolute top-4 left-4 z-30">
      {/* Single cohesive toolbar */}
      <div className="bg-white rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-1">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 pr-2 border-r">
            {tools.map((t) => (
              <button
                key={t.id}
                className={`tool-button ${tool === t.id ? 'active' : ''}`}
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.hotkey.toUpperCase()})`}
              >
                <t.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1 px-2 border-r">
            <button
              className="tool-button"
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              disabled={true} // TODO: Enable when history is implemented
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              className="tool-button"
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              disabled={true} // TODO: Enable when history is implemented
            >
              <Redo className="w-5 h-5" />
            </button>
            <button
              className="tool-button"
              onClick={handleClearCanvas}
              title="Clear Canvas (Delete)"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* View Tools */}
          <div className="flex items-center gap-1 px-2 border-r">
            <button
              className="tool-button"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              className="tool-button"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Controls */}
          <div className="flex items-center gap-1 px-2 border-r">
            <button
              className={`tool-button ${gridCfg.visible ? '' : 'opacity-50'}`}
              onClick={() => updateGridCfg({ visible: !gridCfg.visible })}
              title={gridCfg.visible ? 'Hide Grid (G)' : 'Show Grid (G)'}
            >
              {gridCfg.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              className={`tool-button ${gridCfg.snap ? 'active' : ''}`}
              onClick={() => updateGridCfg({ snap: !gridCfg.snap })}
              title={gridCfg.snap ? 'Disable Snap (Shift+G)' : 'Enable Snap (Shift+G)'}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <div className="relative" ref={gridDropdownRef}>
              <button
                className={`tool-button ${showGridSettings ? 'active' : ''}`}
                onClick={() => {
                  console.log('Grid settings clicked, current state:', showGridSettings)
                  setShowGridSettings(!showGridSettings)
                }}
                title="Grid Settings"
              >
                <Grid className="w-5 h-5" />
              </button>

              {/* Grid Settings Dropdown */}
              {showGridSettings && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 min-w-[240px]" style={{ zIndex: 9999 }}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Grid Spacing</h4>
                  <div className="space-y-2">
                    {gridSpacingOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="gridSpacing"
                          value={option.value}
                          checked={gridCfg.spacing_in === option.value}
                          onChange={() => updateGridCfg({ spacing_in: option.value })}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom Size Input */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Size</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customGridSize}
                        onChange={(e) => setCustomGridSize(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customGridSize) {
                            const size = parseInt(customGridSize)
                            if (size > 0 && size <= 120) {
                              updateGridCfg({ spacing_in: size })
                              setCustomGridSize('')
                            }
                          }
                        }}
                        placeholder="Inches"
                        className="px-2 py-1 border rounded text-sm w-20"
                        min="1"
                        max="120"
                      />
                      <button
                        onClick={() => {
                          const size = parseInt(customGridSize)
                          if (size > 0 && size <= 120) {
                            updateGridCfg({ spacing_in: size })
                            setCustomGridSize('')
                          }
                        }}
                        disabled={!customGridSize || parseInt(customGridSize) <= 0 || parseInt(customGridSize) > 120}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                      >
                        Set
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">1-120 inches</p>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gridCfg.visible}
                        onChange={(e) => updateGridCfg({ visible: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Show Grid</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={gridCfg.snap}
                        onChange={(e) => updateGridCfg({ snap: e.target.checked })}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Snap to Grid</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generate Structure Button */}
          <div className="flex items-center gap-1 px-2 border-r">
            <button
              onClick={generateStructure}
              disabled={loading || !footprint}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Hammer className="w-4 h-4" />
                  Generate Structure
                </>
              )}
            </button>
          </div>

          {/* Project Tools */}
          <div className="flex items-center gap-1 px-2 border-r">
            <button
              className="tool-button"
              onClick={handleNewProject}
              title="New Project"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              className="tool-button"
              onClick={handleSaveProject}
              title="Save Project"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              className="tool-button"
              onClick={handleLoadProject}
              title="Load Project"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          </div>

          {/* Export and Settings */}
          <div className="flex items-center gap-1 pl-2">
            {/* Export Menu */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                className="tool-button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export"
              >
                <Download className="w-5 h-5" />
              </button>
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-2 min-w-[150px]" style={{ zIndex: 9999 }}>
                  <button
                    onClick={handleExportPNG}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              className="tool-button"
              onClick={() => toast.info('Settings coming soon')}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Help */}
            <button
              className="tool-button"
              onClick={() => toast.info('Help documentation coming soon')}
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Status - Below toolbar */}
      <div className="mt-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-75 inline-block">
        Grid: {gridCfg.spacing_in}" {gridCfg.snap ? '• Snap ON' : '• Snap OFF'}
      </div>
    </div>
  )
}