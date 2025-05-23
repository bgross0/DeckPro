// Materials calculation functions

// Hardware calculation engine following existing patterns
function calculateHardwareRequirements(frame, deckConfig) {
  const hardware = {
    joistHangers: [],
    structuralTies: [],
    postConnections: [],
    fasteners: { nails: [], screws: [], bolts: [] }
  };
  
  try {
    // Calculate joist hangers based on attachment method
    if (frame.beams.some(b => b.style === 'ledger')) {
      hardware.joistHangers.push(...calculateJoistHangers(frame, deckConfig));
      hardware.structuralTies.push(...calculateLedgerTies(frame, deckConfig));
    }
    
    // Calculate rim joist connections for drop beams
    if (frame.beams.some(b => b.style === 'drop')) {
      hardware.structuralTies.push(...calculateRimJoistTies(frame, deckConfig));
    }
    
    // Calculate post connections
    if (frame.posts && frame.posts.length > 0) {
      hardware.postConnections.push(...calculatePostConnections(frame, deckConfig));
    }
    
    // Calculate beam splice connections
    const splicedBeams = frame.beams.filter(b => b.spliced);
    if (splicedBeams.length > 0) {
      hardware.structuralTies.push(...calculateBeamSplices(splicedBeams, deckConfig));
    }
    
    // Calculate fastener requirements
    hardware.fasteners = calculateFasteners(hardware);
    
  } catch (error) {
    console.warn('Hardware calculation warning:', error.message);
    // Graceful fallback - return empty hardware (maintains compatibility)
  }
  
  return hardware;
}

function calculateJoistHangers(frame, deckConfig) {
  const hangers = [];
  const joistSize = frame.joists.size;
  const joistCount = frame.joists.count;
  
  // Regular joists get standard face-mount hangers
  const regularHanger = materials.getJoistHanger(joistSize, 'regular', false);
  if (regularHanger) {
    hangers.push({
      item: `${joistSize} joist hanger (LUS)`,
      model: `LUS${joistSize.replace('2x', '')}`,
      qty: joistCount - 2, // Exclude end joists
      cost: regularHanger.cost,
      description: regularHanger.description,
      nailsRequired: regularHanger.nailsRequired,
      screwsRequired: regularHanger.screwsRequired
    });
  }
  
  // End joists get concealed flange hangers
  const concealedHanger = materials.getJoistHanger(joistSize, 'concealed', true);
  if (concealedHanger) {
    hangers.push({
      item: `${joistSize} concealed joist hanger (LSSU)`,
      model: `LSSU${joistSize.replace('2x', '')}`,
      qty: 2, // Two end joists
      cost: concealedHanger.cost,
      description: concealedHanger.description,
      nailsRequired: concealedHanger.nailsRequired,
      screwsRequired: concealedHanger.screwsRequired
    });
  }
  
  return hangers;
}

function calculateLedgerTies(frame, deckConfig) {
  const ties = [];
  const joistCount = frame.joists.count;
  
  // DTT1Z deck tension ties required every 4th joist for ledger attachment
  const dttCount = Math.ceil(joistCount / 4);
  const dttTie = materials.getStructuralTie(1200, true, false);
  
  if (dttTie) {
    ties.push({
      item: 'Deck tension tie (DTT1Z)',
      model: 'DTT1Z',
      qty: dttCount,
      cost: dttTie.cost,
      description: dttTie.description,
      nailsRequired: dttTie.nailsRequired,
      screwsRequired: dttTie.screwsRequired
    });
  }
  
  return ties;
}

function calculateRimJoistTies(frame, deckConfig) {
  const ties = [];
  
  // Rim joists need structural ties at each end
  const hasCantilever = frame.joists.cantilever_ft > 0;
  const tieType = materials.getStructuralTie(1000, false, hasCantilever);
  
  if (tieType) {
    const tieCount = 4; // Two rim joists, two connections each
    ties.push({
      item: `${hasCantilever ? 'Heavy ' : ''}Hurricane tie (${hasCantilever ? 'H2.5A' : 'H1'})`,
      model: hasCantilever ? 'H2.5A' : 'H1',
      qty: tieCount,
      cost: tieType.cost,
      description: tieType.description,
      nailsRequired: tieType.nailsRequired,
      screwsRequired: tieType.screwsRequired
    });
  }
  
  return ties;
}

function calculatePostConnections(frame, deckConfig) {
  const connections = [];
  const postCount = frame.posts.length;
  
  // Post caps for beam-to-post connections
  const postCap = materials.getPostConnection('6x6', false);
  if (postCap && postCount > 0) {
    connections.push({
      item: '6x6 post cap (BC6)',
      model: 'BC6',
      qty: postCount,
      cost: postCap.cost,
      description: postCap.description,
      screwsRequired: postCap.screwsRequired
    });
  }
  
  // Post bases (already calculated in main takeoff, but add fasteners)
  return connections;
}

function calculateBeamSplices(splicedBeams, deckConfig) {
  const splices = [];
  
  splicedBeams.forEach(beam => {
    const spliceCount = beam.segments - 1; // One splice between each segment
    if (spliceCount > 0) {
      const spliceTie = materials.simpsonZmax.structuralTies['DTT2Z'];
      if (spliceTie) {
        splices.push({
          item: 'Heavy deck tension tie (DTT2Z)',
          model: 'DTT2Z',
          qty: spliceCount,
          cost: spliceTie.cost,
          description: spliceTie.description,
          screwsRequired: spliceTie.screwsRequired
        });
      }
    }
  });
  
  return splices;
}

function calculateFasteners(hardware) {
  const fasteners = { nails: [], screws: [], bolts: [] };
  
  // Calculate total nails needed
  let totalNails = 0;
  let totalScrews25 = 0;
  let totalScrews6 = 0;
  
  // Sum up fastener requirements from all hardware
  [...hardware.joistHangers, ...hardware.structuralTies, ...hardware.postConnections].forEach(item => {
    if (item.nailsRequired) {
      totalNails += item.qty * item.nailsRequired;
    }
    if (item.screwsRequired) {
      if (item.model.includes('DTT') || item.model.includes('BC')) {
        totalScrews6 += item.qty * item.screwsRequired;
      } else {
        totalScrews25 += item.qty * item.screwsRequired;
      }
    }
  });
  
  // Add fasteners to takeoff
  if (totalNails > 0) {
    const nailBoxes = Math.ceil(totalNails / 100);
    fasteners.nails.push({
      item: 'Joist hanger nails (1.5" x 0.148")',
      qty: `${nailBoxes} box${nailBoxes > 1 ? 'es' : ''} (${totalNails} nails)`,
      cost: materials.simpsonZmax.fasteners.joistHangerNails['1.5x0.148'].costPer100,
      totalCost: nailBoxes * materials.simpsonZmax.fasteners.joistHangerNails['1.5x0.148'].costPer100
    });
  }
  
  if (totalScrews25 > 0) {
    const screwBoxes = Math.ceil(totalScrews25 / 50);
    fasteners.screws.push({
      item: 'SDS 2.5" structural screws',
      qty: `${screwBoxes} box${screwBoxes > 1 ? 'es' : ''} (${totalScrews25} screws)`,
      cost: materials.simpsonZmax.fasteners.structuralScrews.SDS25.costPer50,
      totalCost: screwBoxes * materials.simpsonZmax.fasteners.structuralScrews.SDS25.costPer50
    });
  }
  
  if (totalScrews6 > 0) {
    const screwBoxes = Math.ceil(totalScrews6 / 25);
    fasteners.screws.push({
      item: 'SDS 6" structural screws',
      qty: `${screwBoxes} box${screwBoxes > 1 ? 'es' : ''} (${totalScrews6} screws)`,
      cost: materials.simpsonZmax.fasteners.structuralScrews.SDS6.costPer25,
      totalCost: screwBoxes * materials.simpsonZmax.fasteners.structuralScrews.SDS6.costPer25
    });
  }
  
  return fasteners;
}

function generateMaterialTakeoff(frame, speciesGrade, footingType = 'helical') {
  const items = [];
  const boardFeet = {};
  let totalBoardFeet = 0;
  
  // Calculate joist materials - use ACTUAL joist length (including cantilever)
  const joistLength = frame.joists.total_length_ft || (frame.joists.span_ft + frame.joists.cantilever_ft);
  const joistStockLength = materials.getStockLength(joistLength, frame.joists.size);
  const joistCount = frame.joists.count;
  
  // Add joists to takeoff
  const joistCostPerPiece = materials.lumber[frame.joists.size].costPerFoot * joistStockLength;
  items.push({
    item: `${frame.joists.size}-${joistStockLength}' joist`,
    qty: joistCount,
    cost: joistCostPerPiece,
    totalCost: joistCount * joistCostPerPiece,
    category: 'lumber',
    subcategory: 'framing'
  });
  
  // Track board feet
  const joistBF = materials.calculateBoardFeet(frame.joists.size, joistStockLength) * joistCount;
  boardFeet[frame.joists.size] = (boardFeet[frame.joists.size] || 0) + joistBF;
  totalBoardFeet += joistBF;
  
  // Calculate beam materials
  frame.beams.forEach(beam => {
    if (beam.style === 'ledger') {
      // Add ledger board (2x10 typically)
      const ledgerLength = materials.getStockLength(beam.span_ft || frame.length_ft, '2x10');
      items.push({
        item: `2x10-${ledgerLength}' ledger`,
        qty: 1
      });
      
      const ledgerBF = materials.calculateBoardFeet('2x10', ledgerLength);
      boardFeet['2x10'] = (boardFeet['2x10'] || 0) + ledgerBF;
      totalBoardFeet += ledgerBF;
    } else {
      // Regular beam - account for plies
      const beamLength = materials.getStockLength(beam.span_ft, beam.dimension);
      const totalBeamQty = beam.plyCount;
      
      items.push({
        item: `${beam.dimension}-${beamLength}' beam`,
        qty: totalBeamQty
      });
      
      const beamBF = materials.calculateBoardFeet(beam.dimension, beamLength) * totalBeamQty;
      boardFeet[beam.dimension] = (boardFeet[beam.dimension] || 0) + beamBF;
      totalBoardFeet += beamBF;
    }
  });
  
  // Calculate post materials
  const uniquePostHeights = new Map();
  frame.posts.forEach(post => {
    const height = post.height_ft;
    uniquePostHeights.set(height, (uniquePostHeights.get(height) || 0) + 1);
  });
  
  uniquePostHeights.forEach((count, height) => {
    items.push({
      item: `6x6-${height}' post`,
      qty: count
    });
    
    const postBF = materials.calculateBoardFeet('6x6', height) * count;
    boardFeet['6x6'] = (boardFeet['6x6'] || 0) + postBF;
    totalBoardFeet += postBF;
  });
  
  // Add legacy hardware for backward compatibility (basic items)
  if (frame.beams.some(b => b.style === 'ledger')) {
    const hangerCost = materials.hardware[`LUS${frame.joists.size.replace('2x', '')}`]?.cost || materials.hardware.LUS28.cost;
    items.push({
      item: `LUS${frame.joists.size.replace('2x', '')} hanger (basic)`,
      qty: joistCount,
      cost: hangerCost,
      totalCost: joistCount * hangerCost,
      category: 'hardware',
      subcategory: 'legacy'
    });
  }
  
  // Add hardware - post bases  
  const totalPosts = frame.posts.length;
  if (totalPosts > 0) {
    const postBaseCost = materials.hardware.PB66.cost;
    items.push({
      item: 'PB66 post base',
      qty: totalPosts,
      cost: postBaseCost,
      totalCost: totalPosts * postBaseCost,
      category: 'hardware',
      subcategory: 'legacy'
    });
    
    // Add footings based on type
    let footingItem = '';
    const footingCost = materials.footingCosts[footingType];
    switch(footingType) {
      case 'helical':
        footingItem = 'Helical pile';
        break;
      case 'concrete':
        footingItem = 'Concrete footing';
        break;
      case 'surface':
        footingItem = 'Surface mount pad';
        break;
    }
    
    if (footingItem && footingCost) {
      items.push({
        item: footingItem,
        qty: totalPosts,
        cost: footingCost,
        totalCost: totalPosts * footingCost,
        category: 'footings',
        subcategory: 'structural'
      });
    }
  }
  
  // Add rim joists only if drop beam style
  const hasDropBeam = frame.beams.some(b => b.style === 'drop');
  if (hasDropBeam) {
    const rimJoistCount = 2; // One at each end perpendicular to joists
    // Rim joists run along the beam span (perpendicular to joists)
    const rimLength = materials.getStockLength(frame.beams[0].span_ft, frame.joists.size);
    const rimJoistCost = materials.lumber[frame.joists.size].costPerFoot * rimLength;
    
    items.push({
      item: `${frame.joists.size}-${rimLength}' rim joist`,
      qty: rimJoistCount,
      cost: rimJoistCost,
      totalCost: rimJoistCount * rimJoistCost,
      category: 'lumber',
      subcategory: 'framing'
    });
    
    const rimBF = materials.calculateBoardFeet(frame.joists.size, rimLength) * rimJoistCount;
    boardFeet[frame.joists.size] = (boardFeet[frame.joists.size] || 0) + rimBF;
    totalBoardFeet += rimBF;
  }
  
  // Calculate detailed hardware requirements (Simpson ZMAX)
  const deckConfig = {
    species: speciesGrade,
    footingType: footingType,
    hasLedger: frame.beams.some(b => b.style === 'ledger'),
    hasCantilever: frame.joists.cantilever_ft > 0
  };
  
  const detailedHardware = calculateHardwareRequirements(frame, deckConfig);
  
  // Add detailed hardware to takeoff
  if (detailedHardware.joistHangers.length > 0) {
    detailedHardware.joistHangers.forEach(hanger => {
      items.push({
        item: hanger.item,
        qty: hanger.qty,
        cost: hanger.cost,
        totalCost: hanger.qty * hanger.cost,
        category: 'hardware',
        subcategory: 'joistHangers'
      });
    });
  }
  
  if (detailedHardware.structuralTies.length > 0) {
    detailedHardware.structuralTies.forEach(tie => {
      items.push({
        item: tie.item,
        qty: tie.qty,
        cost: tie.cost,
        totalCost: tie.qty * tie.cost,
        category: 'hardware',
        subcategory: 'structuralTies'
      });
    });
  }
  
  if (detailedHardware.postConnections.length > 0) {
    detailedHardware.postConnections.forEach(connection => {
      items.push({
        item: connection.item,
        qty: connection.qty,
        cost: connection.cost,
        totalCost: connection.qty * connection.cost,
        category: 'hardware',
        subcategory: 'postConnections'
      });
    });
  }
  
  // Add fasteners to takeoff
  [...detailedHardware.fasteners.nails, ...detailedHardware.fasteners.screws, ...detailedHardware.fasteners.bolts].forEach(fastener => {
    if (fastener.totalCost > 0) {
      items.push({
        item: fastener.item,
        qty: fastener.qty,
        cost: fastener.cost,
        totalCost: fastener.totalCost,
        category: 'fasteners',
        subcategory: 'structural'
      });
    }
  });

  return {
    items,
    boardFeet,
    totalBoardFeet,
    detailedHardware // Include detailed hardware breakdown for advanced features
  };
}