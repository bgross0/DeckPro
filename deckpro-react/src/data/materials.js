// Material definitions and costs
export const materials = {
  lumber: {
    '2x6': { costPerFoot: 2.50, widthIn: 5.5, depthIn: 1.5 },
    '2x8': { costPerFoot: 3.25, widthIn: 7.25, depthIn: 1.5 },
    '2x10': { costPerFoot: 4.50, widthIn: 9.25, depthIn: 1.5 },
    '2x12': { costPerFoot: 5.75, widthIn: 11.25, depthIn: 1.5 },
    '6x6': { costPerFoot: 12.00, widthIn: 5.5, depthIn: 5.5 }
  },
  
  hardware: {
    // Legacy hardware (maintained for compatibility)
    'LUS26': { cost: 3.50, description: '2x6 joist hanger' },
    'LUS28': { cost: 3.75, description: '2x8 joist hanger' },
    'LUS210': { cost: 4.00, description: '2x10 joist hanger' },
    'LUS212': { cost: 4.50, description: '2x12 joist hanger' },
    'LUS2x6': { cost: 3.50, description: '2x6 joist hanger' },
    'LUS2x8': { cost: 3.75, description: '2x8 joist hanger' },
    'LUS2x10': { cost: 4.00, description: '2x10 joist hanger' },
    'LUS2x12': { cost: 4.50, description: '2x12 joist hanger' },
    'PB66': { cost: 35.00, description: '6x6 post base' },
    'PCZ66': { cost: 28.00, description: '6x6 post cap' },
    'PB105': { cost: 22.00, description: 'Beam splice plate' }
  },
  
  // Comprehensive Simpson ZMAX Hardware Database
  simpsonZmax: {
    joistHangers: {
      regular: {
        'LUS26': { cost: 3.50, description: '2x6 face-mount joist hanger', nailsRequired: 10, screwsRequired: 0 },
        'LUS28': { cost: 3.75, description: '2x8 face-mount joist hanger', nailsRequired: 10, screwsRequired: 0 },
        'LUS210': { cost: 4.00, description: '2x10 face-mount joist hanger', nailsRequired: 10, screwsRequired: 0 },
        'LUS212': { cost: 4.50, description: '2x12 face-mount joist hanger', nailsRequired: 10, screwsRequired: 0 }
      },
      concealed: {
        'LSSU26': { cost: 4.25, description: '2x6 concealed flange hanger', nailsRequired: 8, screwsRequired: 4 },
        'LSSU28': { cost: 4.50, description: '2x8 concealed flange hanger', nailsRequired: 8, screwsRequired: 4 },
        'LSSU210': { cost: 4.75, description: '2x10 concealed flange hanger', nailsRequired: 8, screwsRequired: 4 },
        'LSSU212': { cost: 5.25, description: '2x12 concealed flange hanger', nailsRequired: 8, screwsRequired: 4 }
      },
      skewed: {
        'LUSA26': { cost: 4.75, description: '2x6 skewed joist hanger', nailsRequired: 10, screwsRequired: 2 },
        'LUSA28': { cost: 5.00, description: '2x8 skewed joist hanger', nailsRequired: 10, screwsRequired: 2 },
        'LUSA210': { cost: 5.25, description: '2x10 skewed joist hanger', nailsRequired: 10, screwsRequired: 2 },
        'LUSA212': { cost: 5.75, description: '2x12 skewed joist hanger', nailsRequired: 10, screwsRequired: 2 }
      }
    },
    structuralTies: {
      'H1': { cost: 2.50, description: 'Hurricane tie 850 lbs', load: 850, nailsRequired: 8, screwsRequired: 0 },
      'H2.5A': { cost: 4.75, description: 'Hurricane tie 1500 lbs', load: 1500, nailsRequired: 10, screwsRequired: 0 },
      'DTT1Z': { cost: 8.50, description: 'Deck tension tie', load: 1200, nailsRequired: 0, screwsRequired: 6, ledgerRequired: true },
      'DTT2Z': { cost: 12.75, description: 'Heavy deck tension tie', load: 1800, nailsRequired: 0, screwsRequired: 8, beamSplice: true }
    },
    postConnections: {
      'BC6': { cost: 28.00, description: '6x6 post cap', screwsRequired: 8, postSize: '6x6' },
      'CBSQ6': { cost: 35.50, description: '6x6 skewable post cap', screwsRequired: 10, postSize: '6x6' },
      'PB66': { cost: 35.00, description: '6x6 post base', screwsRequired: 4, boltRequired: 1 }
    },
    fasteners: {
      joistHangerNails: {
        '1.5x0.148': { costPer100: 12.50, description: '1.5" x 0.148" galvanized joist hanger nails', length: 1.5 }
      },
      structuralScrews: {
        'SDS25': { costPer50: 18.75, description: '2.5" SDS structural screws', length: 2.5 },
        'SDS3': { costPer50: 22.50, description: '3" SDS structural screws', length: 3.0 },
        'SDS6': { costPer25: 35.00, description: '6" SDS structural screws', length: 6.0 }
      },
      lagScrews: {
        'LAG_5x6': { costEach: 2.75, description: '1/2" x 6" lag screw', diameter: 0.5, length: 6.0 }
      },
      commonNails: {
        '16d': { costPer100: 8.50, description: '16d galvanized common nails', length: 3.5 }
      }
    }
  },
  
  // Footing costs by type
  footingCosts: {
    'helical': 500.00,
    'concrete': 150.00,
    'surface': 75.00
  },
  
  standardLengths: {
    '2x6': [8, 10, 12, 14, 16, 20],
    '2x8': [8, 10, 12, 14, 16, 20],
    '2x10': [8, 10, 12, 14, 16, 20],
    '2x12': [8, 10, 12, 14, 16, 20],
    '6x6': [8, 10, 12]
  },
  
  // Species cost multipliers
  speciesMultipliers: {
    'SPF #2': 1.0,
    'DF #1': 1.35,
    'HF #2': 1.15,
    'SP #2': 1.25
  },
  
  // Utility functions
  getStockLength: function(requiredLength, size) {
    const availableLengths = this.standardLengths[size];
    if (!availableLengths) {
      throw new Error(`Unknown lumber size: ${size}`);
    }
    
    // Find the smallest stock length that meets the requirement
    for (const length of availableLengths) {
      if (length >= requiredLength) {
        return length;
      }
    }
    
    // Return the largest available if none are big enough
    return availableLengths[availableLengths.length - 1];
  },
  
  calculateBoardFeet: function(size, lengthFt) {
    const lumber = this.lumber[size];
    if (!lumber) {
      throw new Error(`Unknown lumber size: ${size}`);
    }
    
    // Board feet = (width in inches × thickness in inches × length in feet) / 12
    return (lumber.widthIn * lumber.depthIn * lengthFt) / 12;
  },
  
  // Simpson ZMAX Hardware Utilities  
  getJoistHanger: function(joistSize, hangerType = 'regular', isEndJoist = false) {
    // End joists use concealed flange hangers for better appearance
    const type = isEndJoist ? 'concealed' : hangerType;
    const hangerKey = `LUS${joistSize === '2x6' ? '26' : joistSize.replace('2x', '')}`;
    const concealedKey = `LSSU${joistSize === '2x6' ? '26' : joistSize.replace('2x', '')}`;
    
    if (type === 'concealed') {
      return this.simpsonZmax.joistHangers.concealed[concealedKey];
    } else if (type === 'skewed') {
      const skewedKey = `LUSA${joistSize === '2x6' ? '26' : joistSize.replace('2x', '')}`;
      return this.simpsonZmax.joistHangers.skewed[skewedKey];
    } else {
      return this.simpsonZmax.joistHangers.regular[hangerKey];
    }
  },
  
  getStructuralTie: function(load, isLedger = false, isCantilever = false) {
    if (isLedger) {
      return this.simpsonZmax.structuralTies['DTT1Z'];
    } else if (isCantilever || load > 1000) {
      return this.simpsonZmax.structuralTies['H2.5A'];
    } else {
      return this.simpsonZmax.structuralTies['H1'];
    }
  },
  
  getPostConnection: function(postSize = '6x6', isSkewed = false) {
    if (isSkewed) {
      return this.simpsonZmax.postConnections['CBSQ6'];
    } else {
      return this.simpsonZmax.postConnections['BC6'];
    }
  }
};