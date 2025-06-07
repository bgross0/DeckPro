import { useState, useEffect, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import useDeckStore from '../../store/deckStore'
import toast from 'react-hot-toast'
import { HelpModal } from '../HelpModal'
import { SettingsModal } from '../SettingsModal'
import {
  MousePointer, Square, Ruler, Grid, Eye, EyeOff, Grid3x3,
  Undo, Redo, Trash2, ZoomIn, ZoomOut, Download, Save,
  FolderOpen, Plus, HelpCircle, Settings, Hammer, Layers
} from 'lucide-react'

export function MainToolbar() {
  const {
    tool,
    setTool,
    project,
    clearProject,
    generateAllStructures,
    loading,
    gridCfg,
    updateGridCfg,
    activeLayer,
    setActiveLayer,
    selectedSectionId,
    showDimensions,
    showJoists,
    showBeams,
    showDecking,
    showPosts,
    toggleLayer,
    undo,
    redo,
    canUndo,
    canRedo,
    saveProject,
    loadProject,
    saveToLocalStorage
  } = useDeckStore()
  

  const [showGridSettings, setShowGridSettings] = useState(false)
  const [customGridSize, setCustomGridSize] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showLayersMenu, setShowLayersMenu] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const gridDropdownRef = useRef(null)
  const exportDropdownRef = useRef(null)
  const layersDropdownRef = useRef(null)
  const toolbarRef = useRef(null)

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
      if (layersDropdownRef.current && !layersDropdownRef.current.contains(event.target)) {
        setShowLayersMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation for dropdowns
  useEffect(() => {
    function handleKeyDown(event) {
      // Close dropdowns on Escape
      if (event.key === 'Escape') {
        setShowGridSettings(false)
        setShowExportMenu(false)
        setShowLayersMenu(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Custom icon components
  const PolygonIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M12 3 L20 8 L20 16 L12 21 L4 16 L4 8 Z" />
      <circle cx="12" cy="3" r="2" fill="currentColor" />
      <circle cx="20" cy="8" r="2" fill="currentColor" />
      <circle cx="20" cy="16" r="2" fill="currentColor" />
      <circle cx="12" cy="21" r="2" fill="currentColor" />
      <circle cx="4" cy="16" r="2" fill="currentColor" />
      <circle cx="4" cy="8" r="2" fill="currentColor" />
    </svg>
  )

  const StairsIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M4 20 L4 16 L8 16 L8 12 L12 12 L12 8 L16 8 L16 4 L20 4" />
      <path d="M4 20 L20 20 L20 4" strokeWidth="1" opacity="0.3" />
    </svg>
  )

  const RectangleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <circle cx="4" cy="6" r="2" fill="currentColor" />
      <circle cx="20" cy="6" r="2" fill="currentColor" />
      <circle cx="20" cy="18" r="2" fill="currentColor" />
      <circle cx="4" cy="18" r="2" fill="currentColor" />
    </svg>
  )

  // Tool selection
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select', hotkey: 's' },
    { id: 'rectangle', icon: RectangleIcon, label: 'Draw Rectangle', hotkey: 'r' },
    { id: 'section', icon: PolygonIcon, label: 'Draw Polygon Section', hotkey: 'd' },
    { id: 'stair', icon: StairsIcon, label: 'Add Stairs', hotkey: 't' },
    { id: 'measure', icon: Ruler, label: 'Measure', hotkey: 'm' }
  ]
  
  // Layer options
  const layers = [
    { id: 'all', label: 'All Layers' },
    { id: 'footprint', label: 'Footprint Only' },
    { id: 'framing', label: 'Framing Only' },
    { id: 'decking', label: 'Decking Only' }
  ]

  // Keyboard shortcuts
  useHotkeys('s', () => setTool('select'))
  useHotkeys('r', () => setTool('rectangle'))
  useHotkeys('d', () => setTool('section'))
  useHotkeys('t', () => setTool('stair'))
  useHotkeys('m', () => setTool('measure'))
  useHotkeys('g', () => updateGridCfg({ visible: !gridCfg.visible }))
  useHotkeys('shift+g', () => updateGridCfg({ snap: !gridCfg.snap }))
  useHotkeys('delete', handleClearCanvas)
  useHotkeys('ctrl+z, cmd+z', handleUndo)
  useHotkeys('ctrl+y, cmd+y', handleRedo)
  useHotkeys('f1', () => setShowHelpModal(true))

  function handleClearCanvas() {
    clearProject()
  }

  function handleUndo() {
    undo()
  }

  function handleRedo() {
    redo()
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
    clearProject()
  }

  function handleSaveProject() {
    // Show options: save to file or browser
    const choice = window.confirm('Save to file? (OK = File, Cancel = Browser Storage)')
    if (choice) {
      saveProject()
    } else {
      saveToLocalStorage()
    }
  }

  function handleLoadProject() {
    // Create file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        loadProject(file)
      }
    }
    input.click()
  }

  return (
    <div className="absolute top-4 left-4 z-30">
      {/* Single cohesive toolbar */}
      <nav 
        ref={toolbarRef}
        className="bg-white rounded-lg shadow-lg p-2"
        role="toolbar"
        aria-label="Main toolbar"
      >
        <div className="flex items-center gap-1">
          {/* Drawing Tools */}
          <div 
            className="flex items-center gap-1 pr-2 border-r"
            role="group"
            aria-label="Drawing tools"
          >
            {tools.map((t) => (
              <button
                key={t.id}
                className={`tool-button ${tool === t.id ? 'active' : ''}`}
                onClick={() => setTool(t.id)}
                aria-label={t.label}
                aria-keyshortcuts={t.hotkey.toUpperCase()}
                aria-pressed={tool === t.id}
                title={`${t.label} (${t.hotkey.toUpperCase()})`}
              >
                <t.icon className="w-5 h-5" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Action Tools */}
          <div 
            className="flex items-center gap-1 px-2 border-r"
            role="group"
            aria-label="Action tools"
          >
            <button
              className="tool-button"
              onClick={handleUndo}
              aria-label="Undo last action"
              aria-keyshortcuts="Control+Z"
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="tool-button"
              onClick={handleRedo}
              aria-label="Redo last action"
              aria-keyshortcuts="Control+Y"
              disabled={!canRedo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="tool-button"
              onClick={handleClearCanvas}
              aria-label="Clear canvas"
              aria-keyshortcuts="Delete"
              title="Clear Canvas (Delete)"
            >
              <Trash2 className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* View Tools */}
          <div 
            className="flex items-center gap-1 px-2 border-r"
            role="group"
            aria-label="View controls"
          >
            <button
              className="tool-button"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="tool-button"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Grid Controls */}
          <div 
            className="flex items-center gap-1 px-2 border-r"
            role="group"
            aria-label="Grid controls"
          >
            <button
              className={`tool-button ${gridCfg.visible ? '' : 'opacity-50'}`}
              onClick={() => updateGridCfg({ visible: !gridCfg.visible })}
              aria-label={gridCfg.visible ? 'Hide grid' : 'Show grid'}
              aria-keyshortcuts="G"
              aria-pressed={gridCfg.visible}
              title={gridCfg.visible ? 'Hide Grid (G)' : 'Show Grid (G)'}
            >
              {gridCfg.visible ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
            </button>
            <button
              className={`tool-button ${gridCfg.snap ? 'active' : ''}`}
              onClick={() => updateGridCfg({ snap: !gridCfg.snap })}
              aria-label={gridCfg.snap ? 'Disable snap to grid' : 'Enable snap to grid'}
              aria-keyshortcuts="Shift+G"
              aria-pressed={gridCfg.snap}
              title={gridCfg.snap ? 'Disable Snap (Shift+G)' : 'Enable Snap (Shift+G)'}
            >
              <Grid3x3 className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="relative" ref={gridDropdownRef}>
              <button
                className={`tool-button ${showGridSettings ? 'active' : ''}`}
                onClick={() => {
                  setShowGridSettings(!showGridSettings)
                }}
                aria-label="Grid settings"
                aria-expanded={showGridSettings}
                aria-haspopup="true"
                title="Grid Settings"
              >
                <Grid className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Grid Settings Dropdown */}
              {showGridSettings && (
                <div 
                  className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 min-w-[240px]" 
                  style={{ zIndex: 9999 }}
                  role="dialog"
                  aria-label="Grid settings menu"
                >
                  <h4 className="text-sm font-medium text-gray-700 mb-3" id="grid-spacing-label">Grid Spacing</h4>
                  <div className="space-y-2" role="radiogroup" aria-labelledby="grid-spacing-label">
                    {gridSpacingOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          name="gridSpacing"
                          value={option.value}
                          checked={gridCfg.spacing_in === option.value}
                          onChange={() => updateGridCfg({ spacing_in: option.value })}
                          className="text-blue-600"
                          aria-label={`Grid spacing ${option.label}`}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom Size Input */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2" id="custom-size-label">Custom Size</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customGridSize}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 120)) {
                            setCustomGridSize(value)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customGridSize) {
                            const size = parseInt(customGridSize)
                            if (size > 0 && size <= 120) {
                              updateGridCfg({ spacing_in: size })
                              setCustomGridSize('')
                              toast.success(`Grid spacing set to ${size}"`)
                            }
                          }
                        }}
                        placeholder="Inches"
                        className="px-2 py-1 border rounded text-sm w-20 focus:border-blue-500"
                        min="1"
                        max="120"
                        aria-label="Custom grid spacing in inches"
                        aria-describedby="custom-size-help"
                      />
                      <button
                        onClick={() => {
                          const size = parseInt(customGridSize)
                          if (size > 0 && size <= 120) {
                            updateGridCfg({ spacing_in: size })
                            setCustomGridSize('')
                            toast.success(`Grid spacing set to ${size}"`)
                          } else {
                            toast.error('Grid spacing must be between 1 and 120 inches')
                          }
                        }}
                        disabled={!customGridSize || parseInt(customGridSize) <= 0 || parseInt(customGridSize) > 120}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        aria-label="Set custom grid spacing"
                      >
                        Set
                      </button>
                    </div>
                    <p id="custom-size-help" className="text-xs text-gray-500 mt-1">1-120 inches</p>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={gridCfg.visible}
                        onChange={(e) => updateGridCfg({ visible: e.target.checked })}
                        className="text-blue-600"
                        aria-label="Show grid"
                      />
                      <span className="text-sm">Show Grid</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer mt-2 hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={gridCfg.snap}
                        onChange={(e) => updateGridCfg({ snap: e.target.checked })}
                        className="text-blue-600"
                        aria-label="Snap to grid"
                      />
                      <span className="text-sm">Snap to Grid</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Layer Controls */}
          <div className="relative" ref={layersDropdownRef}>
            <div 
              className="flex items-center gap-1 px-2 border-r"
              role="group"
              aria-label="Layer controls"
            >
              <button
                className={`tool-button ${showLayersMenu ? 'active' : ''}`}
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                aria-label="Layer controls"
                aria-expanded={showLayersMenu}
                aria-haspopup="true"
                title="Layer Controls"
              >
                <Layers className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            {/* Layers Dropdown */}
            {showLayersMenu && (
              <div 
                className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 min-w-[200px]" 
                style={{ zIndex: 9999 }}
                role="dialog"
                aria-label="Layer controls menu"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-3" id="toggle-layers-label">Toggle Layers</h4>
                
                <div className="space-y-2" role="group" aria-labelledby="toggle-layers-label">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showDimensions}
                      onChange={() => toggleLayer('dimensions')}
                      className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label="Show dimensions"
                    />
                    <span className="text-sm">Dimensions</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showJoists}
                      onChange={() => toggleLayer('joists')}
                      className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label="Show joists"
                    />
                    <span className="text-sm">Joists</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showBeams}
                      onChange={() => toggleLayer('beams')}
                      className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label="Show beams"
                    />
                    <span className="text-sm">Beams</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showPosts}
                      onChange={() => toggleLayer('posts')}
                      className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label="Show posts"
                    />
                    <span className="text-sm">Posts</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showDecking}
                      onChange={() => toggleLayer('decking')}
                      className="text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label="Show decking"
                    />
                    <span className="text-sm">Decking</span>
                  </label>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h5 className="text-xs font-medium text-gray-600 mb-2" id="quick-presets-label">Quick Presets</h5>
                  <div className="space-y-1" role="group" aria-labelledby="quick-presets-label">
                    <button
                      onClick={() => {
                        setActiveLayer('all');
                        if (!showDimensions) toggleLayer('dimensions');
                        if (!showJoists) toggleLayer('joists');
                        if (!showBeams) toggleLayer('beams');
                        if (!showPosts) toggleLayer('posts');
                        if (!showDecking) toggleLayer('decking');
                      }}
                      className="text-xs text-blue-600 hover:underline rounded px-1"
                      aria-label="Show all layers"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => {
                        setActiveLayer('framing');
                        if (!showJoists) toggleLayer('joists');
                        if (!showBeams) toggleLayer('beams');
                        if (!showPosts) toggleLayer('posts');
                        if (showDecking) toggleLayer('decking');
                        if (showDimensions) toggleLayer('dimensions');
                      }}
                      className="text-xs text-blue-600 hover:underline block focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                      aria-label="Show framing layers only"
                    >
                      Framing Only
                    </button>
                    <button
                      onClick={() => {
                        setActiveLayer('footprint');
                        if (showJoists) toggleLayer('joists');
                        if (showBeams) toggleLayer('beams');
                        if (showPosts) toggleLayer('posts');
                        if (showDecking) toggleLayer('decking');
                      }}
                      className="text-xs text-blue-600 hover:underline block focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                      aria-label="Show footprint only"
                    >
                      Footprint Only
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Structure Button */}
          <div 
            className="flex items-center gap-1 px-2 border-r"
            role="group"
            aria-label="Structure generation"
          >
            <button
              onClick={generateAllStructures}
              disabled={loading || project.sections.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1"
              aria-label={loading ? "Generating structure" : "Generate structure"}
              aria-busy={loading}
              aria-disabled={loading || project.sections.length === 0}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span aria-live="polite">Generating...</span>
                </>
              ) : (
                <>
                  <Hammer className="w-4 h-4" aria-hidden="true" />
                  Generate Structure
                </>
              )}
            </button>
          </div>

          {/* Project Tools */}
          <div 
            className="flex items-center gap-1 px-2 border-r"
            role="group"
            aria-label="Project management"
          >
            <button
              className="tool-button"
              onClick={handleNewProject}
              aria-label="New project"
              title="New Project"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="tool-button"
              onClick={handleSaveProject}
              aria-label="Save project"
              title="Save Project"
            >
              <Save className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="tool-button"
              onClick={handleLoadProject}
              aria-label="Load project"
              title="Load Project"
            >
              <FolderOpen className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Export and Settings */}
          <div 
            className="flex items-center gap-1 pl-2"
            role="group"
            aria-label="Export and settings"
          >
            {/* Export Menu */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                className="tool-button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                aria-label="Export options"
                aria-expanded={showExportMenu}
                aria-haspopup="true"
                title="Export"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
              </button>
              {showExportMenu && (
                <div 
                  className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-2 min-w-[150px]" 
                  style={{ zIndex: 9999 }}
                  role="menu"
                  aria-label="Export format options"
                >
                  <button
                    onClick={handleExportPNG}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    role="menuitem"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    role="menuitem"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              className="tool-button"
              onClick={() => setShowSettingsModal(true)}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Help */}
            <button
              className="tool-button"
              onClick={() => setShowHelpModal(true)}
              aria-label="Help"
              aria-keyshortcuts="F1"
              title="Help (F1)"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* Grid Status - Below toolbar */}
      <div 
        className="mt-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-75 inline-block"
        role="status"
        aria-live="polite"
        aria-label={`Grid spacing: ${gridCfg.spacing_in} inches. Snap to grid is ${gridCfg.snap ? 'enabled' : 'disabled'}`}
      >
        Grid: {gridCfg.spacing_in}" {gridCfg.snap ? '• Snap ON' : '• Snap OFF'}
      </div>
      
      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      
      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  )
}