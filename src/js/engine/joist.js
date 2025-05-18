// Joist calculation functions

function selectJoist(width, species, spacing, decking) {
  const joistTable = spanTables.joists[species];
  if (!joistTable) {
    throw new EngineError('SPECIES_UNKNOWN', `Unknown species/grade: ${species}`);
  }
  
  // Get maximum spacing allowed by decking
  const maxSpacing = spanTables.deckingSpacing[decking].perpendicular;
  
  // Use forced spacing or find optimal
  const validSpacings = spacing ? [spacing] : [12, 16, 24].filter(s => s <= maxSpacing);
  
  let bestJoist = null;
  let minCost = Infinity;
  
  for (const testSpacing of validSpacings) {
    // Find smallest joist that meets span requirement
    for (const size of ['2x6', '2x8', '2x10', '2x12']) {
      const allowableSpan = joistTable[size][testSpacing];
      
      if (allowableSpan >= width) {
        // Calculate cost for this configuration
        const joistCount = Math.ceil(width * 12 / testSpacing) + 1;
        const costPerJoist = materials.lumber[size].costPerFoot * width;
        const totalCost = joistCount * costPerJoist;
        
        if (totalCost < minCost) {
          minCost = totalCost;
          bestJoist = {
            size,
            spacing_in: testSpacing,
            count: joistCount,
            span_ft: width,
            cantilever_ft: Math.min(width / 4, 2) // Max cantilever = 1/4 span or 2 ft
          };
        }
        break; // Found adequate size for this spacing
      }
    }
  }
  
  if (!bestJoist) {
    throw new EngineError('SPAN_EXCEEDED', `No joist configuration can span ${width} ft`);
  }
  
  return bestJoist;
}

// Calculate joist tributary width for beam sizing
function getJoistTributaryWidth(joistSpacing, position, deckWidth) {
  const spacingFt = joistSpacing / 12;
  
  if (position === 'outer') {
    // Outer beam carries half joist span plus cantilever
    return deckWidth / 2 + 2; // Assuming 2 ft cantilever
  } else {
    // Inner beam or ledger carries half joist span
    return deckWidth / 2;
  }
}