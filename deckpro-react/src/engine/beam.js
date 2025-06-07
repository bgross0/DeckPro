import { spanTables } from '../data/span-tables.js'
import { materials } from '../data/materials.js'
import { EngineError } from './validation.js'
import { engineUtils } from './utils.js'

// Beam calculation functions

export function selectBeam(beamSpan, joistSpan, species, footingType = 'helical') {
  const beamTable = spanTables.beams[species];
  if (!beamTable) {
    throw new EngineError('SPECIES_UNKNOWN', `Unknown species/grade: ${species}`);
  }
  
  // IRC R507.5 uses joist span (6-20 ft) to determine beam configuration
  // Round joist span to nearest table value
  const tableJoistSpans = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20];
  const tableJoistSpan = tableJoistSpans.find(s => s >= joistSpan) || 20;
  
  let bestBeam = null;
  let minCost = Infinity;
  
  // Test each beam configuration
  const beamSizes = ['(2)2x8', '(3)2x8', '(2)2x10', '(3)2x10', 
                     '(2)2x12', '(3)2x12', '(1)2x10', '(1)2x12', '(1)2x8'];
  
  // For larger joist spans, prefer multi-ply beams
  const minPlyCount = joistSpan >= 10 ? 2 : 1;
  
  for (const size of beamSizes) {
    const spanTable = beamTable[size];
    if (!spanTable || !spanTable[tableJoistSpan]) continue;
    
    // Parse size to get ply count and dimensions
    const match = size.match(/\((\d+)\)(\d+x\d+)/);
    const plyCount = parseInt(match[1]);
    const dimension = match[2];
    
    // Skip if doesn't meet minimum ply requirement
    if (plyCount < minPlyCount) continue;
    
    // Get allowable beam span for this joist span
    // Convert from feet.inches format to decimal feet
    const spanValue = spanTable[tableJoistSpan];
    const allowableBeamSpan = engineUtils.feetInchesToDecimal(spanValue);
    
    // Check if this beam size can work with appropriate post spacing
    const maxPostSpacing = allowableBeamSpan;  // Max spacing is the allowable span
    const minPostsNeeded = Math.ceil(beamSpan / maxPostSpacing) + 1;
    const actualPostSpacing = beamSpan / (minPostsNeeded - 1);
    
    if (actualPostSpacing <= allowableBeamSpan) {
      // This beam size works with proper post spacing
      const postCount = minPostsNeeded;
      
      // Calculate cost
      const beamLengthPerPly = beamSpan;
      const costPerFoot = materials.lumber[dimension].costPerFoot;
      const totalBeamCost = plyCount * beamLengthPerPly * costPerFoot;
      const footingCost = materials.footingCosts[footingType] || materials.footingCosts.helical;
      const postCost = postCount * (materials.hardware.PB66.cost + footingCost);
      const totalCost = totalBeamCost + postCost;
      
      if (totalCost < minCost) {
        minCost = totalCost;
        bestBeam = {
          size,
          plyCount,
          dimension,
          post_spacing_ft: actualPostSpacing,
          post_count: postCount,
          span_ft: beamSpan,
          joist_span_ft: joistSpan,
          segments: [{
            start_ft: 0,
            end_ft: beamSpan,
            length_ft: beamSpan,
            splice: false
          }]
        };
      }
    }
    // Note: Splicing is removed as it was allowing non-compliant configurations
    // Each beam segment must independently satisfy span requirements
  }
  
  if (!bestBeam) {
    throw new EngineError('SPAN_EXCEEDED', `No beam configuration can span ${beamSpan} ft with ${joistSpan} ft joist span`);
  }
  
  return bestBeam;
}

// Determine beam style based on input and defaults
export function determineBeamStyle(beamPosition, inputStyle, attachment, footingType, heightFt) {
  if (inputStyle) return inputStyle;
  
  if (beamPosition === 'inner' && attachment === 'ledger') {
    return 'ledger';
  }
  
  // Always prefer drop beams unless clearance issues require inline
  // Inline beams are only needed for:
  // 1. Low clearance situations (height < 3 ft)
  // 2. Helical footings at inner position that need clearance from house
  if (beamPosition === 'inner' && attachment === 'free') {
    if (heightFt < 3 || footingType === 'helical') {
      return 'inline';
    }
    return 'drop';
  }
  
  // Always use drop beam for outer position (cantilever optimization)
  return 'drop';
}