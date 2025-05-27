import useDeckStore from '../../store/deckStore'
import usePriceStore from '../../store/priceStore'
import { DollarSign } from 'lucide-react'

export function EstimatesPanel() {
  const { engineOut } = useDeckStore()
  const { setPriceBookOpen } = usePriceStore()
  
  if (!engineOut) return null
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Cost Estimates</h3>
      
      <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
        <p className="text-sm text-blue-800">
          Configure material prices for accurate estimates
        </p>
        <button
          onClick={() => setPriceBookOpen(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <DollarSign className="w-4 h-4" />
          Price Book
        </button>
      </div>
      
      {/* Material Summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Material Summary</h4>
        
        {engineOut.material_takeoff && (
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span className="font-medium">{engineOut.material_takeoff.length}</span>
            </div>
            
            {/* Group by category */}
            {(() => {
              const categories = {}
              engineOut.material_takeoff.forEach(item => {
                const category = getCategory(item.item)
                if (!categories[category]) categories[category] = 0
                categories[category]++
              })
              
              return Object.entries(categories).map(([category, count]) => (
                <div key={category} className="flex justify-between text-gray-600">
                  <span>{category}:</span>
                  <span>{count} items</span>
                </div>
              ))
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

function getCategory(itemDescription) {
  const lower = itemDescription.toLowerCase()
  if (lower.includes('joist') || lower.includes('2x')) return 'Framing Lumber'
  if (lower.includes('beam') || lower.includes('6x')) return 'Beam Lumber'
  if (lower.includes('post')) return 'Posts'
  if (lower.includes('hanger') || lower.includes('screw') || lower.includes('connector')) return 'Hardware'
  if (lower.includes('footing') || lower.includes('concrete') || lower.includes('helical')) return 'Footings'
  return 'Other'
}