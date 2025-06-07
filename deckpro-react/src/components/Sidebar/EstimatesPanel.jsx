import { useMemo } from 'react'
import useDeckStore from '../../store/deckStore'
import usePriceStore from '../../store/priceStore'
import { calculateMaterialCosts, formatCurrency, getCategoryIcon } from '../../utils/costCalculator'
import { DollarSign, TrendingUp, Package } from 'lucide-react'

export function EstimatesPanel() {
  const { project, selectedSectionId } = useDeckStore()
  const { setPriceBookOpen } = usePriceStore()
  
  const selectedSection = project.sections.find(s => s.id === selectedSectionId)
  const engineOut = selectedSection?.structure?.engineOut
  
  const costBreakdown = useMemo(() => {
    if (!engineOut) return null
    return calculateMaterialCosts(engineOut)
  }, [engineOut])
  
  if (!engineOut || !costBreakdown) return null
  
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
      
      {/* Total Cost Summary */}
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-medium text-gray-900">Total Estimated Cost</h4>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-3xl font-bold text-green-700">
          {formatCurrency(costBreakdown.totalCost)}
        </p>
        {costBreakdown.speciesMultiplier !== 1.0 && (
          <p className="text-sm text-gray-600 mt-1">
            Includes {((costBreakdown.speciesMultiplier - 1) * 100).toFixed(0)}% species adjustment
          </p>
        )}
      </div>
      
      {/* Cost by Category */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Cost Breakdown</h4>
        
        <div className="space-y-2">
          {Object.entries(costBreakdown.categories)
            .sort(([, a], [, b]) => b.cost - a.cost)
            .map(([category, data]) => (
              <div key={category} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <span className="font-medium text-gray-700">{category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(data.cost)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{data.items} items</span>
                  <span>{((data.cost / costBreakdown.totalCost) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Detailed Items (collapsible) */}
      <details className="space-y-2">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          Detailed Material List ({costBreakdown.items.length} items)
        </summary>
        
        <div className="mt-2 max-h-60 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Unit</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {costBreakdown.items
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-1 pr-2 text-gray-700">{item.item}</td>
                    <td className="text-center py-1">{item.qty}</td>
                    <td className="text-right py-1">{formatCurrency(item.unitCost)}</td>
                    <td className="text-right py-1 font-medium">{formatCurrency(item.totalCost)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}