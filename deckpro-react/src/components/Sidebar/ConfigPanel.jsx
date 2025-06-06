import useDeckStore from '../../store/deckStore'
import { getPolygonArea } from '../../models/deckProject'

export function ConfigPanel() {
  const { 
    project, 
    selectedSectionId, 
    updateProjectSettings,
    updateSection
  } = useDeckStore()
  
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const settings = project.settings
  
  return (
    <div className="space-y-6">
      {/* Selected Section Info */}
      {selectedSection && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            {selectedSection.name}
          </h3>
          <div className="text-sm text-blue-700">
            <p>Area: {getPolygonArea(selectedSection.polygon).toFixed(1)} sq ft</p>
            <p>Elevation: {selectedSection.elevation}" from grade</p>
          </div>
        </div>
      )}
      
      {/* Project Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Project Settings</h3>
        
        {/* Default Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Height (inches)
          </label>
          <input 
            type="number" 
            min="0"
            max="360"
            step="6"
            value={settings.defaultHeight}
            onChange={(e) => updateProjectSettings({ 
              defaultHeight: parseInt(e.target.value) 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Footing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Footing Type
          </label>
          <select 
            value={settings.footingType}
            onChange={(e) => updateProjectSettings({ 
              footingType: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="helical">Helical Piles</option>
            <option value="concrete">Concrete Footings</option>
            <option value="surface">Surface Blocks</option>
          </select>
        </div>
        
        {/* Species/Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lumber Species/Grade
          </label>
          <select 
            value={settings.species}
            onChange={(e) => updateProjectSettings({ 
              species: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SPF #2">SPF #2</option>
            <option value="DF #1">Douglas Fir #1</option>
            <option value="HF #2">Hem-Fir #2</option>
            <option value="SP #2">Southern Pine #2</option>
          </select>
        </div>
        
        {/* Decking Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Decking Type
          </label>
          <select 
            value={settings.deckingType}
            onChange={(e) => updateProjectSettings({ 
              deckingType: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="composite_1in">Composite (1")</option>
            <option value="wood_5/4">Wood (5/4")</option>
            <option value="wood_2x6">Wood (2x6)</option>
            <option value="pvc_1in">PVC (1")</option>
          </select>
        </div>
        
        {/* Optimization Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Optimize For
          </label>
          <select 
            value={settings.optimizationGoal}
            onChange={(e) => updateProjectSettings({ 
              optimizationGoal: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cost">Lowest Cost</option>
            <option value="strength">Maximum Strength</option>
          </select>
        </div>
      </div>
      
      {/* Section-Specific Settings */}
      {selectedSection && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900">Section Settings</h3>
          
          {/* Section Elevation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Elevation (inches)
            </label>
            <input 
              type="number" 
              min="0"
              max="360"
              step="6"
              value={selectedSection.elevation}
              onChange={(e) => updateSection(selectedSectionId, { 
                elevation: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Connection Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Type
            </label>
            <select 
              value={selectedSection.connection.type}
              onChange={(e) => updateSection(selectedSectionId, { 
                connection: { ...selectedSection.connection, type: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ledger">Ledger Attached</option>
              <option value="freestanding">Freestanding</option>
              <option value="rim_joist">Rim Joist</option>
            </select>
          </div>
          
          {/* Joist Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joist Direction
            </label>
            <select 
              value={selectedSection.config.joistDirection}
              onChange={(e) => updateSection(selectedSectionId, { 
                config: { ...selectedSection.config, joistDirection: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto (Span Shortest)</option>
              <option value="horizontal">Force Horizontal</option>
              <option value="vertical">Force Vertical</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Help Text */}
      <div className="text-xs text-gray-500 pt-4 border-t">
        <p>• Draw deck sections with the Deck tool (D)</p>
        <p>• Select sections to edit their properties</p>
        <p>• Generate structures after making changes</p>
      </div>
    </div>
  )
}