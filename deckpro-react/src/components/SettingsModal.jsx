import { useState } from 'react'
import useDeckStore from '../store/deckStore'
import { X, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsModal({ isOpen, onClose }) {
  const { project, updateProjectSettings, stairConfig, updateStairConfig } = useDeckStore()
  
  const [settings, setSettings] = useState({
    ...project.settings,
    stairWidth: stairConfig.width,
    stairRiserHeight: stairConfig.riserHeight,
    stairTreadDepth: stairConfig.treadDepth,
    autoSave: localStorage.getItem('deckpro-autosave') === 'true',
    autoSaveInterval: parseInt(localStorage.getItem('deckpro-autosave-interval') || '300')
  })
  
  if (!isOpen) return null
  
  const handleSave = () => {
    // Update project settings
    updateProjectSettings({
      defaultHeight: settings.defaultHeight,
      species: settings.species,
      deckingType: settings.deckingType,
      footingType: settings.footingType,
      optimizationGoal: settings.optimizationGoal
    })
    
    // Update stair config
    updateStairConfig({
      width: settings.stairWidth,
      riserHeight: settings.stairRiserHeight,
      treadDepth: settings.stairTreadDepth
    })
    
    // Save auto-save preferences
    try {
      localStorage.setItem('deckpro-autosave', settings.autoSave)
      localStorage.setItem('deckpro-autosave-interval', settings.autoSaveInterval)
    } catch (err) {
      toast.error('Failed to save settings to browser storage')
    }
    
    toast.success('Settings saved')
    onClose()
  }
  
  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setSettings({
        units: 'imperial',
        defaultHeight: 36,
        species: 'SPF #2',
        deckingType: 'composite_1in',
        footingType: 'helical',
        optimizationGoal: 'cost',
        stairWidth: 36,
        stairRiserHeight: 7.5,
        stairTreadDepth: 11,
        autoSave: false,
        autoSaveInterval: 300
      })
      toast.success('Settings reset to defaults')
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Default Deck Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4">Default Deck Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Height (inches)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultHeight}
                    onChange={(e) => setSettings({...settings, defaultHeight: parseInt(e.target.value) || 36})}
                    className="w-full px-3 py-2 border rounded-md"
                    min="12"
                    max="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Species
                  </label>
                  <select
                    value={settings.species}
                    onChange={(e) => setSettings({...settings, species: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="SPF #2">SPF #2</option>
                    <option value="Hem-Fir #2">Hem-Fir #2</option>
                    <option value="Southern Pine #2">Southern Pine #2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Decking
                  </label>
                  <select
                    value={settings.deckingType}
                    onChange={(e) => setSettings({...settings, deckingType: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="composite_1in">1" Composite</option>
                    <option value="wood_5/4in">5/4" Wood</option>
                    <option value="wood_2in">2" Wood</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Footing Type
                  </label>
                  <select
                    value={settings.footingType}
                    onChange={(e) => setSettings({...settings, footingType: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="helical">Helical</option>
                    <option value="concrete">Concrete</option>
                    <option value="surface">Surface</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Optimization Goal
                  </label>
                  <select
                    value={settings.optimizationGoal}
                    onChange={(e) => setSettings({...settings, optimizationGoal: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="cost">Minimize Cost</option>
                    <option value="strength">Maximize Strength</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Stair Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4">Default Stair Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (inches)
                  </label>
                  <input
                    type="number"
                    value={settings.stairWidth}
                    onChange={(e) => setSettings({...settings, stairWidth: parseInt(e.target.value) || 36})}
                    className="w-full px-3 py-2 border rounded-md"
                    min="24"
                    max="72"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Riser Height (inches)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={settings.stairRiserHeight}
                    onChange={(e) => setSettings({...settings, stairRiserHeight: parseFloat(e.target.value) || 7.5})}
                    className="w-full px-3 py-2 border rounded-md"
                    min="4"
                    max="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tread Depth (inches)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={settings.stairTreadDepth}
                    onChange={(e) => setSettings({...settings, stairTreadDepth: parseFloat(e.target.value) || 11})}
                    className="w-full px-3 py-2 border rounded-md"
                    min="10"
                    max="14"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Stair dimensions must comply with IRC requirements: max riser 7¾", min tread 10"
              </p>
            </div>
            
            {/* Auto-save Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4">Auto-save Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Enable auto-save to browser storage</span>
                </label>
                
                {settings.autoSave && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-save interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={settings.autoSaveInterval}
                      onChange={(e) => setSettings({...settings, autoSaveInterval: parseInt(e.target.value) || 300})}
                      className="w-full px-3 py-2 border rounded-md"
                      min="30"
                      max="1800"
                      step="30"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
