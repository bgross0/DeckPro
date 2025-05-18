// Beam calculation functions

function selectBeam(span, tributary, species) {
  const beamTable = spanTables.beams[species];
  if (!beamTable) {
    throw new EngineError('SPECIES_UNKNOWN', `Unknown species/grade: ${species}`);
  }
  
  // Round tributary up to next table value
  const tableTribs = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20];
  const tableTrib = tableTribs.find(t => t >= tributary) || 20;
  
  let bestBeam = null;
  let minCost = Infinity;
  
  // Test each beam configuration - start with multi-ply for better strength
  const beamSizes = ['(2)2x8', '(3)2x8', '(2)2x10', '(3)2x10', 
                     '(2)2x12', '(3)2x12', '(1)2x10', '(1)2x12', '(1)2x8'];
  
  // For larger tributary widths, require minimum ply count
  const minPlyCount = tributary >= 10 ? 2 : 1;
  
  for (const size of beamSizes) {
    const spanTable = beamTable[size];
    if (!spanTable || !spanTable[tableTrib]) continue;
    
    // Parse size to get ply count and dimensions
    const match = size.match(/\((\d+)\)(\d+x\d+)/);
    const plyCount = parseInt(match[1]);
    const dimension = match[2];
    
    // Skip if doesn't meet minimum ply requirement
    if (plyCount < minPlyCount) continue;
    
    const allowableSpan = spanTable[tableTrib];
    
    if (allowableSpan >= span) {
      
      // Calculate post spacing
      const postSpacing = Math.min(allowableSpan, span / Math.ceil(span / allowableSpan));
      const postCount = Math.ceil(span / postSpacing) + 1;
      
      // Calculate cost
      const beamLengthPerPly = span;
      const costPerFoot = materials.lumber[dimension].costPerFoot;
      const totalBeamCost = plyCount * beamLengthPerPly * costPerFoot;
      const postCost = postCount * materials.hardware.PB66.cost;
      const totalCost = totalBeamCost + postCost;
      
      if (totalCost < minCost) {
        minCost = totalCost;
        bestBeam = {
          size,
          plyCount,
          dimension,
          post_spacing_ft: postSpacing,
          post_count: postCount,
          span_ft: span,
          tributary_ft: tributary
        };
      }
    }
  }
  
  if (!bestBeam) {
    throw new EngineError('SPAN_EXCEEDED', `No beam configuration can span ${span} ft with ${tributary} ft tributary`);
  }
  
  return bestBeam;
}

// Determine beam style based on input and defaults
function determineBeamStyle(beamPosition, inputStyle, attachment, footingType) {
  if (inputStyle) return inputStyle;
  
  if (beamPosition === 'inner' && attachment === 'ledger') {
    return 'ledger';
  }
  
  if (beamPosition === 'inner' && attachment === 'free') {
    // Auto-select based on footing type
    return footingType === 'helical' ? 'inline' : 'drop';
  }
  
  // Default to drop beam for outer position
  return 'drop';
}