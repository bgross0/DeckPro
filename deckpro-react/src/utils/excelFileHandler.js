import * as XLSX from 'xlsx';

/**
 * Excel File Handler for DeckPro Price Book
 * Handles import/export of pricing data to/from Excel files
 */

class ExcelFileHandler {
  /**
   * Import pricing data from an Excel/CSV file
   * @param {File} file - The file to import
   * @returns {Promise<{success: boolean, data?: object, error?: string, warnings?: string[]}>}
   */
  async importFromFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse the data into price structure
      const result = this.parseImportedData(rawData);

      return result;
    } catch (error) {
      console.error('Excel import error:', error);
      return {
        success: false,
        error: error.message || 'Failed to read Excel file'
      };
    }
  }

  /**
   * Parse raw spreadsheet data into priceStore format
   * @param {Array} rawData - Raw rows from spreadsheet
   * @returns {object} Parsed pricing data with warnings
   */
  parseImportedData(rawData) {
    const warnings = [];
    const prices = {
      lumber: {},
      hardware: {},
      simpsonZmax: {
        hangers: {},
        angles: {},
        posts: {},
        beams: {}
      },
      footings: {},
      speciesMultipliers: {}
    };

    // Skip header row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 3) continue;

      const [category, item, price, unit, description] = row;

      if (!category || !item || price === undefined) {
        warnings.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) {
        warnings.push(`Row ${i + 1}: Invalid price value "${price}"`);
        continue;
      }

      try {
        this.addPriceItem(prices, category, item, numPrice, unit, description);
      } catch (error) {
        warnings.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: true,
      data: prices,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Add a price item to the appropriate category
   */
  addPriceItem(prices, category, item, price, unit, description) {
    const cat = category.toLowerCase().trim();

    if (cat === 'lumber') {
      prices.lumber[item] = {
        costPerFoot: price,
        widthIn: this.parseLumberDimension(item, 0),
        depthIn: this.parseLumberDimension(item, 1)
      };
    } else if (cat === 'hardware') {
      prices.hardware[item] = {
        cost: price,
        description: description || item
      };
    } else if (cat === 'footings') {
      prices.footings[item] = {
        baseCost: price,
        description: description || item
      };
    } else if (cat === 'species multipliers' || cat === 'multipliers') {
      prices.speciesMultipliers[item] = price;
    } else if (cat.includes('simpson') || cat.includes('zmax')) {
      // Try to categorize Simpson hardware
      const subCat = this.categorizeSimpsonHardware(item);
      prices.simpsonZmax[subCat][item] = {
        cost: price,
        description: description || item
      };
    } else {
      throw new Error(`Unknown category "${category}"`);
    }
  }

  /**
   * Parse lumber dimensions from size string (e.g., "2x6" -> [2, 6])
   */
  parseLumberDimension(size, index) {
    const match = size.match(/(\d+)\s*x\s*(\d+)/i);
    if (match) {
      return parseInt(match[index + 1]);
    }
    return index === 0 ? 2 : 6; // Default to 2x6
  }

  /**
   * Categorize Simpson hardware by product code
   */
  categorizeSimpsonHardware(item) {
    const itemUpper = item.toUpperCase();
    if (itemUpper.includes('LUS') || itemUpper.includes('HANGER')) return 'hangers';
    if (itemUpper.includes('A') && itemUpper.includes('ANGLE')) return 'angles';
    if (itemUpper.includes('POST') || itemUpper.includes('BC')) return 'posts';
    if (itemUpper.includes('BEAM') || itemUpper.includes('LBV')) return 'beams';
    return 'hangers'; // Default
  }

  /**
   * Export pricing data to Excel file
   * @param {object} priceData - Price data from priceStore
   * @param {string} filename - Output filename (optional)
   */
  async exportToExcel(priceData, filename) {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create main pricing sheet
      const wsData = this.convertPricesToRows(priceData);
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Category
        { wch: 20 }, // Item
        { wch: 12 }, // Price
        { wch: 12 }, // Unit
        { wch: 40 }  // Description
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pricing Data');

      // Generate filename
      const fname = filename || `deckpro-prices-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fname);

      return { success: true };
    } catch (error) {
      console.error('Excel export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export Excel file'
      };
    }
  }

  /**
   * Convert price data to rows for Excel export
   */
  convertPricesToRows(priceData) {
    const rows = [
      ['Category', 'Item', 'Price', 'Unit', 'Description']
    ];

    // Add lumber
    if (priceData.lumber) {
      Object.entries(priceData.lumber).forEach(([size, data]) => {
        rows.push([
          'Lumber',
          size,
          data.costPerFoot || 0,
          'per foot',
          `${data.widthIn || ''}" x ${data.depthIn || ''}"`
        ]);
      });
    }

    // Add hardware
    if (priceData.hardware) {
      Object.entries(priceData.hardware).forEach(([item, data]) => {
        rows.push([
          'Hardware',
          item,
          data.cost || 0,
          'each',
          data.description || ''
        ]);
      });
    }

    // Add Simpson ZMAX hardware
    if (priceData.simpsonZmax) {
      Object.entries(priceData.simpsonZmax).forEach(([category, items]) => {
        Object.entries(items).forEach(([item, data]) => {
          rows.push([
            `Simpson ZMAX - ${category}`,
            item,
            data.cost || 0,
            'each',
            data.description || ''
          ]);
        });
      });
    }

    // Add footings
    if (priceData.footings) {
      Object.entries(priceData.footings).forEach(([type, data]) => {
        rows.push([
          'Footings',
          type,
          data.baseCost || 0,
          'each',
          data.description || ''
        ]);
      });
    }

    // Add species multipliers
    if (priceData.speciesMultipliers) {
      Object.entries(priceData.speciesMultipliers).forEach(([species, multiplier]) => {
        rows.push([
          'Species Multipliers',
          species,
          multiplier || 1,
          'multiplier',
          ''
        ]);
      });
    }

    return rows;
  }

  /**
   * Create and download a sample template Excel file
   */
  async createSampleTemplate() {
    const sampleData = {
      lumber: {
        '2x6': { costPerFoot: 2.50, widthIn: 2, depthIn: 6 },
        '2x8': { costPerFoot: 3.75, widthIn: 2, depthIn: 8 },
        '2x10': { costPerFoot: 5.25, widthIn: 2, depthIn: 10 },
        '2x12': { costPerFoot: 7.50, widthIn: 2, depthIn: 12 },
        '4x4': { costPerFoot: 4.25, widthIn: 4, depthIn: 4 },
        '6x6': { costPerFoot: 12.00, widthIn: 6, depthIn: 6 }
      },
      hardware: {
        'Joist Hanger 2x6': { cost: 2.50, description: 'Standard joist hanger for 2x6' },
        'Joist Hanger 2x8': { cost: 3.00, description: 'Standard joist hanger for 2x8' },
        'Deck Screws (lb)': { cost: 8.50, description: 'Exterior deck screws per pound' },
        'Lag Bolts': { cost: 1.25, description: '1/2" x 6" lag bolts' }
      },
      simpsonZmax: {
        hangers: {
          'LUS26Z': { cost: 2.75, description: 'ZMAX joist hanger for 2x6' },
          'LUS28Z': { cost: 3.25, description: 'ZMAX joist hanger for 2x8' }
        },
        angles: {
          'A23Z': { cost: 1.50, description: 'ZMAX angle bracket' }
        },
        posts: {
          'BC4Z': { cost: 8.50, description: 'ZMAX post base 4x4' }
        },
        beams: {}
      },
      footings: {
        'helical_pier': { baseCost: 45.00, description: 'Helical screw pier foundation' },
        'concrete_sonotube': { baseCost: 35.00, description: 'Concrete sonotube footing' },
        'surface_block': { baseCost: 15.00, description: 'Surface deck block' }
      },
      speciesMultipliers: {
        'SPF #2': 1.0,
        'SYP #2': 1.15,
        'HF #2': 1.05,
        'DFL #2': 1.20
      }
    };

    return this.exportToExcel(sampleData, 'deckpro-price-template.xlsx');
  }
}

// Export singleton instance
export const excelFileHandler = new ExcelFileHandler();
