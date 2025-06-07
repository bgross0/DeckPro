// Cost calculation utilities
import usePriceStore from '../store/priceStore'

export function calculateMaterialCosts(engineOut) {
  if (!engineOut || !engineOut.material_takeoff) return null
  
  const { getPrice, prices } = usePriceStore.getState()
  const speciesMultiplier = prices.speciesMultipliers[engineOut.input?.species_grade] || 1.0
  
  const costBreakdown = {
    categories: {},
    items: [],
    totalCost: 0,
    speciesMultiplier
  }
  
  // Process each item in the takeoff
  engineOut.material_takeoff.forEach(item => {
    const itemCost = calculateItemCost(item, getPrice, speciesMultiplier)
    
    costBreakdown.items.push({
      ...item,
      unitCost: itemCost.unitCost,
      totalCost: itemCost.totalCost,
      category: itemCost.category
    })
    
    // Aggregate by category
    if (!costBreakdown.categories[itemCost.category]) {
      costBreakdown.categories[itemCost.category] = {
        items: 0,
        cost: 0
      }
    }
    
    costBreakdown.categories[itemCost.category].items += 1
    costBreakdown.categories[itemCost.category].cost += itemCost.totalCost
    costBreakdown.totalCost += itemCost.totalCost
  })
  
  return costBreakdown
}

function calculateItemCost(item, getPrice, speciesMultiplier) {
  const { item: description, qty } = item
  let unitCost = 0
  let category = 'Other'
  
  // Parse the item description to determine pricing
  const lower = description.toLowerCase()
  
  // Lumber pricing
  if (lower.includes('2x6') || lower.includes('2x8') || lower.includes('2x10') || lower.includes('2x12')) {
    category = 'Framing Lumber'
    const size = description.match(/2x\d+/)[0]
    const length = parseFloat(description.match(/(\d+)'/)?.[1] || '0')
    const basePrice = getPrice('lumber', size)
    unitCost = basePrice * length * speciesMultiplier
  }
  else if (lower.includes('6x6') && lower.includes('post')) {
    category = 'Posts'
    const length = parseFloat(description.match(/(\d+)'/)?.[1] || '0')
    const basePrice = getPrice('lumber', '6x6')
    unitCost = basePrice * length * speciesMultiplier
  }
  // Beams
  else if (lower.includes('beam') || lower.includes('laminated')) {
    category = 'Beam Lumber'
    // Parse ply count and size
    const plyMatch = description.match(/(\d+)-ply/)
    const sizeMatch = description.match(/2x\d+/)
    if (plyMatch && sizeMatch) {
      const plyCount = parseInt(plyMatch[1])
      const size = sizeMatch[0]
      const length = parseFloat(description.match(/(\d+)'/)?.[1] || '0')
      const basePrice = getPrice('lumber', size)
      unitCost = basePrice * length * plyCount * speciesMultiplier
    }
  }
  // Simpson hardware
  else if (lower.includes('simpson') || lower.includes('hanger') || lower.includes('cap')) {
    category = 'Hardware'
    // Try to match specific Simpson part numbers
    if (lower.includes('lus26')) {
      unitCost = getPrice('simpsonZmax', 'hangers.LUS26')
    } else if (lower.includes('lus28')) {
      unitCost = getPrice('simpsonZmax', 'hangers.LUS28')
    } else if (lower.includes('lus210')) {
      unitCost = getPrice('simpsonZmax', 'hangers.LUS210')
    } else if (lower.includes('abu66')) {
      unitCost = getPrice('simpsonZmax', 'postBases.ABU66')
    } else if (lower.includes('ac6z')) {
      unitCost = getPrice('simpsonZmax', 'postCaps.AC6Z')
    } else if (lower.includes('bc6z')) {
      unitCost = getPrice('simpsonZmax', 'postCaps.BC6Z')
    } else {
      // Default hardware price
      unitCost = getPrice('hardware', 'default')
    }
  }
  // Screws
  else if (lower.includes('screw')) {
    category = 'Hardware'
    unitCost = getPrice('hardware', 'default')
  }
  // Footings
  else if (lower.includes('footing') || lower.includes('helical') || lower.includes('concrete')) {
    category = 'Footings'
    if (lower.includes('helical')) {
      unitCost = getPrice('footings', 'helical7ft')
    } else if (lower.includes('surface')) {
      unitCost = getPrice('footings', 'surface')
    } else {
      // Concrete footing - estimate based on size
      const sizeMatch = description.match(/(\d+)"/)
      const diameter = sizeMatch ? parseInt(sizeMatch[1]) : 12
      // Rough estimate: $50 per cubic foot of concrete
      const depth = 3 // feet
      const radius = diameter / 24 // convert to feet
      const volume = Math.PI * radius * radius * depth
      unitCost = volume * 50
    }
  }
  
  return {
    unitCost,
    totalCost: unitCost * qty,
    category
  }
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Get category icon
export function getCategoryIcon(category) {
  const icons = {
    'Framing Lumber': '🪵',
    'Beam Lumber': '🏗️',
    'Posts': '🏛️',
    'Hardware': '🔩',
    'Footings': '🏠',
    'Other': '📦'
  }
  return icons[category] || '📦'
}