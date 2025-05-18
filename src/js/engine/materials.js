// Material takeoff generation

function generateMaterialTakeoff(frame, species) {
  const takeoff = [];
  const speciesMultiplier = materials.speciesMultipliers[species];
  
  // Joists
  const joistLength = findStandardLength(frame.joists.span_ft + frame.joists.cantilever_ft, frame.joists.size);
  takeoff.push({
    item: `${frame.joists.size}-${joistLength}' joist`,
    qty: frame.joists.count,
    unitCost: materials.lumber[frame.joists.size].costPerFoot * joistLength * speciesMultiplier,
    totalCost: materials.lumber[frame.joists.size].costPerFoot * joistLength * speciesMultiplier * frame.joists.count
  });
  
  // Joist hangers
  const joistSize = frame.joists.size.replace('2', ''); // Convert "2x8" to "x8"
  const hangerType = `LUS2${joistSize}`; // Create "LUS2x8" format
  if (materials.hardware[hangerType] || materials.hardware[`LUS${frame.joists.size}`]) {
    const actualHangerType = materials.hardware[hangerType] ? hangerType : `LUS${frame.joists.size}`;
    takeoff.push({
      item: `${actualHangerType} hanger`,
      qty: frame.joists.count,
      unitCost: materials.hardware[actualHangerType].cost,
      totalCost: materials.hardware[actualHangerType].cost * frame.joists.count
    });
  } else {
    console.warn(`Hanger type not found: ${hangerType} for joist size: ${frame.joists.size}`);
  }
  
  // Beams
  frame.beams.forEach(beam => {
    if (beam.style === 'ledger') return; // No materials for ledger
    
    // Parse beam dimension from size like "(3)2x10"
    let beamDimension = beam.dimension;
    if (!beamDimension && beam.size) {
      const match = beam.size.match(/\d+x\d+/);
      beamDimension = match ? match[0] : null;
    }
    
    if (!beamDimension || !materials.lumber[beamDimension]) {
      console.warn(`Beam dimension not found: ${beamDimension} from size: ${beam.size}`);
      return;
    }
    
    const beamLength = findStandardLength(beam.span_ft, beamDimension);
    const plyCount = beam.plyCount || 1;
    
    takeoff.push({
      item: `${beamDimension}-${beamLength}' beam`,
      qty: plyCount * (beam.post_count - 1), // Sections between posts
      unitCost: materials.lumber[beamDimension].costPerFoot * beamLength * speciesMultiplier,
      totalCost: materials.lumber[beamDimension].costPerFoot * beamLength * speciesMultiplier * plyCount * (beam.post_count - 1)
    });
  });
  
  // Posts
  const uniquePosts = {};
  frame.posts.forEach(post => {
    if (!post.size || !post.height_ft) {
      console.warn('Post missing size or height:', post);
      return;
    }
    const key = `${post.size}-${post.height_ft}'`;
    if (!uniquePosts[key]) {
      uniquePosts[key] = 0;
    }
    uniquePosts[key]++;
  });
  
  Object.entries(uniquePosts).forEach(([key, qty]) => {
    const [size, lengthStr] = key.split('-');
    const lengthNum = parseFloat(lengthStr);
    
    if (!materials.lumber[size]) {
      console.warn(`Post size not found in materials: ${size}`);
      return;
    }
    
    takeoff.push({
      item: `${key} post`,
      qty: qty,
      unitCost: materials.lumber[size].costPerFoot * lengthNum * speciesMultiplier,
      totalCost: materials.lumber[size].costPerFoot * lengthNum * speciesMultiplier * qty
    });
  });
  
  // Post hardware
  const totalPosts = frame.posts.length;
  if (totalPosts > 0) {
    takeoff.push({
      item: 'PB66 post base',
      qty: totalPosts,
      unitCost: materials.hardware.PB66.cost,
      totalCost: materials.hardware.PB66.cost * totalPosts
    });
    
    takeoff.push({
      item: 'PCZ66 post cap',
      qty: totalPosts,
      unitCost: materials.hardware.PCZ66.cost,
      totalCost: materials.hardware.PCZ66.cost * totalPosts
    });
  }
  
  // Calculate totals
  const totalCost = takeoff.reduce((sum, item) => sum + item.totalCost, 0);
  const totalBoardFeet = calculateBoardFeet(takeoff);
  
  return {
    items: takeoff.map(({ item, qty }) => ({ item, qty })), // Remove cost info for output
    totalCost,
    totalBoardFeet
  };
}

function findStandardLength(requiredLength, size) {
  const lengths = materials.standardLengths[size];
  for (const length of lengths) {
    if (length >= requiredLength) {
      return length;
    }
  }
  return lengths[lengths.length - 1];
}

function calculateBoardFeet(takeoff) {
  let boardFeet = 0;
  
  takeoff.forEach(item => {
    if (item.item.includes('joist') || item.item.includes('beam') || item.item.includes('post')) {
      const match = item.item.match(/(\d+)x(\d+)-(\d+)'/);
      if (match) {
        const width = parseInt(match[1]);
        const depth = parseInt(match[2]);
        const length = parseInt(match[3]);
        boardFeet += (width * depth * length / 12) * item.qty;
      }
    }
  });
  
  return Math.round(boardFeet);
}