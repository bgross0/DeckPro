import useDeckStore from '../../store/deckStore'
import { Grid, Grid3x3, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export function GridControls() {
  const { gridCfg, updateGridCfg } = useDeckStore()
  const [showSettings, setShowSettings] = useState(false)
  const [customSize, setCustomSize] = useState('')
  
  const gridSpacingOptions = [
    { label: '6"', value: 6 },
    { label: '12"', value: 12 },
    { label: '16"', value: 16 },
    { label: '24"', value: 24 },
    { label: '36"', value: 36 },
    { label: '48"', value: 48 },
  ]
  
  // Keyboard shortcuts
  useHotkeys('g', () => updateGridCfg({ visible: !gridCfg.visible }))
  useHotkeys('shift+g', () => updateGridCfg({ snap: !gridCfg.snap }))
  
  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-20 bg-white rounded-lg shadow-lg">
        {/* Main Grid Controls */}
        <div className="flex items-center p-2 gap-1">
          <button
            className={`tool-button ${gridCfg.visible ? '' : 'opacity-50'}`}
            onClick={() => updateGridCfg({ visible: !gridCfg.visible })}
            title={gridCfg.visible ? 'Hide Grid' : 'Show Grid'}
          >
            {gridCfg.visible ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
          
          <button
            className={`tool-button ${gridCfg.snap ? 'active' : ''}`}
            onClick={() => updateGridCfg({ snap: !gridCfg.snap })}
            title={gridCfg.snap ? 'Disable Snap' : 'Enable Snap'}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          
          <button
            className="tool-button"
            onClick={() => setShowSettings(!showSettings)}
            title="Grid Settings"
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
        
        {/* Grid Settings Dropdown */}
        {showSettings && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Grid Spacing</h4>
            <div className="space-y-2">
              {gridSpacingOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="gridSpacing"
                    value={option.value}
                    checked={gridCfg.spacing_in === option.value}
                    onChange={() => {
                      updateGridCfg({ spacing_in: option.value })
                      setShowSettings(false)
                    }}
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
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSize) {
                      const size = parseInt(customSize)
                      if (size > 0 && size <= 120) {
                        updateGridCfg({ spacing_in: size })
                        setCustomSize('')
                      }
                    }
                  }}
                  placeholder="Enter inches"
                  className="px-2 py-1 border rounded text-sm w-24"
                  min="1"
                  max="120"
                />
                <button
                  onClick={() => {
                    const size = parseInt(customSize)
                    if (size > 0 && size <= 120) {
                      updateGridCfg({ spacing_in: size })
                      setCustomSize('')
                    }
                  }}
                  disabled={!customSize || parseInt(customSize) <= 0 || parseInt(customSize) > 120}
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
      
      {/* Grid Status */}
      <div className="absolute right-4 top-20 z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-75">
        Grid: {gridCfg.spacing_in}" {gridCfg.snap ? '• Snap ON' : ''}
      </div>
    </div>
  )
}