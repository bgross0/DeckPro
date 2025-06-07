import { logger } from '../utils/logger.js'

// Input validation functions
export function validatePayload(payload) {
  const errors = [];
  
  // Required fields
  const required = ['width_ft', 'length_ft', 'height_ft', 'attachment', 'footing_type', 
                   'species_grade', 'decking_type'];
  
  required.forEach(field => {
    if (payload[field] === undefined || payload[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Numeric validation
  if (payload.width_ft <= 0) errors.push('width_ft must be greater than 0');
  if (payload.length_ft <= 0) errors.push('length_ft must be greater than 0');
  if (payload.height_ft < 0) errors.push('height_ft must be >= 0');
  
  // Enum validation
  if (payload.attachment && !['ledger', 'free'].includes(payload.attachment)) {
    errors.push('attachment must be "ledger" or "free"');
  }
  
  if (payload.beam_style_outer && !['drop', 'inline'].includes(payload.beam_style_outer)) {
    errors.push('beam_style_outer must be "drop" or "inline" or null');
  }
  
  if (payload.beam_style_inner && !['drop', 'inline'].includes(payload.beam_style_inner)) {
    errors.push('beam_style_inner must be "drop" or "inline" or null');
  }
  
  if (payload.footing_type && !['helical', 'concrete', 'surface'].includes(payload.footing_type)) {
    errors.push('footing_type must be "helical", "concrete", or "surface"');
  }
  
  if (payload.species_grade && !['SPF #2', 'DF #1', 'HF #2', 'SP #2'].includes(payload.species_grade)) {
    errors.push('Invalid species_grade');
  }
  
  if (payload.forced_joist_spacing_in && ![12, 16, 24].includes(payload.forced_joist_spacing_in)) {
    errors.push('forced_joist_spacing_in must be 12, 16, or 24');
  }
  
  if (payload.decking_type && !['composite_1in', 'wood_5/4', 'wood_2x'].includes(payload.decking_type)) {
    errors.push('Invalid decking_type');
  }
  
  if (payload.optimization_goal && !['cost', 'strength'].includes(payload.optimization_goal)) {
    errors.push('optimization_goal must be "cost" or "strength"');
  }
  
  // Business rule validation
  if (payload.footing_type === 'surface' && payload.height_ft >= 2.5 && payload.attachment === 'ledger') {
    errors.push('Surface footings illegal if height_ft >= 2.5 ft and attachment = "ledger"');
  }
  
  return errors;
}

export class EngineError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'EngineError';
  }
}

// Hardware validation following existing patterns
export function validateHardwareCompliance(frame, deckConfig, detailedHardware) {
  const warnings = [];
  
  try {
    // Validate joist hanger requirements
    if (deckConfig.hasLedger) {
      const joistCount = frame.joists.count;
      const hangerCount = detailedHardware.joistHangers.reduce((sum, h) => sum + h.qty, 0);
      
      if (hangerCount < joistCount) {
        warnings.push('Insufficient joist hangers for ledger attachment - all joists require hangers');
      }
      
      // Check for end joist concealed hangers
      const concealedHangers = detailedHardware.joistHangers.filter(h => h.model.includes('LSSU'));
      if (concealedHangers.length === 0) {
        warnings.push('End joists should use concealed flange hangers (LSSU) for better appearance');
      }
    }
    
    // Validate structural ties for cantilevers
    if (deckConfig.hasCantilever && frame.joists.cantilever_ft > 2) {
      const heavyTies = detailedHardware.structuralTies.filter(t => t.model === 'H2.5A');
      if (heavyTies.length === 0) {
        warnings.push('Cantilevers over 2 ft require H2.5A heavy hurricane ties');
      }
    }
    
    // Validate DTT1Z spacing for ledger connections
    if (deckConfig.hasLedger) {
      const dttTies = detailedHardware.structuralTies.filter(t => t.model === 'DTT1Z');
      const requiredDTT = Math.ceil(frame.joists.count / 4);
      
      if (dttTies.length > 0 && dttTies[0].qty < requiredDTT) {
        warnings.push('DTT1Z deck tension ties required every 4th joist for ledger attachment');
      }
    }
    
    // Validate post connections
    const postCount = frame.posts ? frame.posts.length : 0;
    if (postCount > 0) {
      const postCaps = detailedHardware.postConnections.filter(p => p.model.includes('BC') || p.model.includes('CBSQ'));
      if (postCaps.length === 0 || postCaps.reduce((sum, p) => sum + p.qty, 0) < postCount) {
        warnings.push('All posts require structural post caps for beam connection');
      }
    }
    
    // Validate fastener quantities
    const totalHardware = [...detailedHardware.joistHangers, ...detailedHardware.structuralTies, ...detailedHardware.postConnections];
    const requiredNails = totalHardware.reduce((sum, item) => sum + (item.qty * (item.nailsRequired || 0)), 0);
    const requiredScrews = totalHardware.reduce((sum, item) => sum + (item.qty * (item.screwsRequired || 0)), 0);
    
    if (requiredNails > 0 && detailedHardware.fasteners.nails.length === 0) {
      warnings.push('Joist hanger nails required for proper hardware installation');
    }
    
    if (requiredScrews > 0 && detailedHardware.fasteners.screws.length === 0) {
      warnings.push('Structural screws required for proper hardware installation');
    }
    
  } catch (error) {
    logger.warn('Hardware validation warning:', error.message);
    // Don't fail validation on hardware errors - graceful degradation
  }
  
  return warnings;
}