import useDeckStore from '../../store/deckStore'

export function MaterialsPanel() {
  const { engineOut } = useDeckStore()
  
  if (!engineOut || !engineOut.material_takeoff) return null
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Bill of Materials</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {engineOut.material_takeoff.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{item.item}</td>
                <td className="text-right py-2">{item.qty}</td>
                <td className="text-right py-2">{item.unit || 'ea'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm text-gray-600 mt-4">
        Total items: {engineOut.material_takeoff.length}
      </div>
    </div>
  )
}