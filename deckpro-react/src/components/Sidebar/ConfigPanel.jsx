import useDeckStore from '../../store/deckStore'

export function ConfigPanel() {
  const { context, updateContext, footprint } = useDeckStore()
  
  return (
    <div className="space-y-6">
      {/* Deck Dimensions Display */}
      {footprint && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Deck Dimensions</h3>
          <div className="text-sm text-blue-700">
            <p>Width: {footprint.width_ft}'</p>
            <p>Length: {footprint.length_ft}'</p>
            <p>Area: {footprint.width_ft * footprint.length_ft} sq ft</p>
          </div>
        </div>
      )}
      
      {/* Configuration Form */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Deck Configuration</h3>
        
        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (ft)
          </label>
          <input 
            type="number" 
            min="0"
            max="30"
            step="0.5"
            value={context.height_ft}
            onChange={(e) => updateContext({ height_ft: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachment Type
          </label>
          <select 
            value={context.attachment}
            onChange={(e) => updateContext({ attachment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ledger">Ledger Attached</option>
            <option value="free">Freestanding</option>
          </select>
        </div>
        
        {/* Footing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Footing Type
          </label>
          <select 
            value={context.footing_type}
            onChange={(e) => updateContext({ footing_type: e.target.value })}
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
            value={context.species_grade}
            onChange={(e) => updateContext({ species_grade: e.target.value })}
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
            value={context.decking_type}
            onChange={(e) => updateContext({ decking_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="composite_1in">1" Composite</option>
            <option value="wood_5/4">5/4" Wood</option>
            <option value="wood_2x">2x Wood</option>
          </select>
        </div>
        
        {/* Optimization Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Optimization Goal
          </label>
          <select 
            value={context.optimization_goal}
            onChange={(e) => updateContext({ optimization_goal: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cost">Minimize Cost</option>
            <option value="strength">Maximize Strength</option>
          </select>
        </div>
      </div>
    </div>
  )
}