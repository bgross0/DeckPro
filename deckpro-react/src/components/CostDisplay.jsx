import { useEffect, useState } from 'react'
import useDeckStore from '../store/deckStore'
import usePriceStore from '../store/priceStore'

export function CostDisplay() {
  const { engineOut } = useDeckStore()
  const { prices } = usePriceStore()
  const [totalCost, setTotalCost] = useState(0)
  
  useEffect(() => {
    if (!engineOut || !engineOut.material_takeoff) {
      setTotalCost(0)
      return
    }
    
    // Calculate total cost
    let total = 0
    
    engineOut.material_takeoff.forEach(item => {
      // Use the totalCost if provided in the takeoff
      if (item.totalCost) {
        total += item.totalCost
        return
      }
      
      const amount = parseInt(item.qty) || 0
      let itemCost = 0
      
      // Parse lumber items
      if (item.item.includes('2x') || item.item.includes('6x6')) {
        const sizeMatch = item.item.match(/([26])x(\d+)/)
        if (sizeMatch) {
          const size = sizeMatch[0]
          if (prices.lumber[size]) {
            const lengthMatch = item.item.match(/(\d+)'/)
            const length = lengthMatch ? parseInt(lengthMatch[1]) : 1
            itemCost = amount * length * prices.lumber[size].costPerFoot
          }
        }
      } 
      // Hardware items
      else if (item.item.includes('hanger')) {
        // Try to match specific hanger type
        const hangerMatch = item.item.match(/LUS(\d+)/)
        if (hangerMatch) {
          const hangerType = `LUS${hangerMatch[1]}`
          itemCost = amount * (prices.hardware[hangerType]?.cost || 4.00)
        } else {
          itemCost = amount * 4.00 // Default hanger cost
        }
      } else if (item.item.includes('post base')) {
        itemCost = amount * prices.hardware.PB66.cost
      } else if (item.item.includes('post cap')) {
        itemCost = amount * prices.hardware.PCZ66.cost
      } 
      // Footings
      else if (item.item.includes('pile') || item.item.includes('footing')) {
        const footingType = engineOut.input?.footing_type || 'helical'
        itemCost = amount * (prices.footings[footingType]?.baseCost || 500)
      }
      
      total += itemCost
    })
    
    setTotalCost(total)
  }, [engineOut, prices])
  
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Estimated Cost:</span>
        <span className="text-2xl font-bold text-green-600">
          ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      {engineOut && (
        <div className="text-xs text-gray-500 mt-1">
          {engineOut.material_takeoff?.length || 0} items
        </div>
      )}
    </div>
  )
}