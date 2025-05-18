// Main engine API

function computeStructure(payload) {
  // Validate input
  const errors = validatePayload(payload);
  if (errors.length > 0) {
    throw new EngineError('INVALID_INPUT', errors.join('; '));
  }
  
  // Set defaults
  const input = {
    ...payload,
    optimization_goal: payload.optimization_goal || 'cost'
  };
  
  // Determine beam styles
  input.beam_style_outer = determineBeamStyle('outer', input.beam_style_outer, input.attachment, input.footing_type);
  if (input.attachment === 'free') {
    input.beam_style_inner = determineBeamStyle('inner', input.beam_style_inner, input.attachment, input.footing_type);
  }
  
  // Calculate joists
  const joists = selectJoist(
    input.width_ft,
    input.species_grade,
    input.forced_joist_spacing_in,
    input.decking_type
  );
  
  // Calculate beams
  const beams = [];
  
  // Outer beam
  const outerTributary = getJoistTributaryWidth(joists.spacing_in, 'outer', input.width_ft);
  const outerBeam = selectBeam(input.length_ft, outerTributary, input.species_grade);
  beams.push({
    position: 'outer',
    style: input.beam_style_outer,
    size: outerBeam.size,
    post_spacing_ft: outerBeam.post_spacing_ft,
    post_count: outerBeam.post_count,
    span_ft: input.length_ft,
    dimension: outerBeam.dimension,
    plyCount: outerBeam.plyCount
  });
  
  // Inner beam/ledger
  if (input.attachment === 'ledger') {
    beams.push({
      position: 'inner',
      style: 'ledger'
    });
  } else {
    const innerTributary = getJoistTributaryWidth(joists.spacing_in, 'inner', input.width_ft);
    const innerBeam = selectBeam(input.length_ft, innerTributary, input.species_grade);
    beams.push({
      position: 'inner',
      style: input.beam_style_inner,
      size: innerBeam.size,
      post_spacing_ft: innerBeam.post_spacing_ft,
      post_count: innerBeam.post_count,
      span_ft: input.length_ft,
      dimension: innerBeam.dimension,
      plyCount: innerBeam.plyCount
    });
  }
  
  // Generate posts
  const posts = generatePostList(beams, input.height_ft, input.footing_type, input.width_ft);
  
  // Create frame configuration
  const frame = {
    joists,
    beams,
    posts
  };
  
  // Generate material takeoff
  const takeoff = generateMaterialTakeoff(frame, input.species_grade);
  
  // Calculate metrics
  const metrics = {};
  if (input.optimization_goal === 'cost') {
    metrics.total_board_ft = takeoff.totalBoardFeet;
  } else {
    // Calculate minimum reserve capacity
    const joistCapacity = calculateReserveCapacity(joists, input);
    const beamCapacity = beams.map(b => calculateReserveCapacity(b, input)).filter(c => c > 0);
    metrics.reserve_capacity_min = Math.min(joistCapacity, ...beamCapacity);
  }
  
  // Check compliance
  const warnings = checkCompliance(input, frame);
  
  // Format output
  return {
    optimization_goal: input.optimization_goal,
    joists: {
      size: joists.size,
      spacing_in: joists.spacing_in,
      cantilever_ft: joists.cantilever_ft
    },
    beams: beams.map(beam => ({
      position: beam.position,
      style: beam.style,
      size: beam.size,
      post_spacing_ft: beam.post_spacing_ft,
      post_count: beam.post_count
    })),
    posts: posts.map(post => ({ x: post.x, y: post.y })),
    material_takeoff: takeoff.items,
    metrics,
    compliance: {
      joist_table: 'IRC-2021 R507.6(1)',
      beam_table: 'IRC-2021 R507.5(1)',
      assumptions: ['IRC default loads'],
      warnings
    }
  };
}

function calculateReserveCapacity(member, input) {
  // Simplified reserve capacity calculation
  // Actual/Allowable stress ratio
  return 1.5; // Placeholder - would need full stress calculations
}

function checkCompliance(input, frame) {
  const warnings = [];
  
  // Check surface footing restriction
  if (input.footing_type === 'surface' && input.height_ft >= 2.5 && input.attachment === 'ledger') {
    warnings.push('Surface footings require height < 2.5 ft for ledger attachment');
  }
  
  // Check decking vs joist spacing
  const maxDeckingSpacing = spanTables.deckingSpacing[input.decking_type].perpendicular;
  if (frame.joists.spacing_in > maxDeckingSpacing) {
    warnings.push(`${input.decking_type} requires max ${maxDeckingSpacing}" joist spacing`);
  }
  
  // Check cantilever limit
  if (frame.joists.cantilever_ft > frame.joists.span_ft / 4) {
    warnings.push('Cantilever exceeds 1/4 of back-span');
  }
  
  return warnings;
}