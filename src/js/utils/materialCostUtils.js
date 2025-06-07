// Material cost calculation utilities
window.MaterialCostUtils = {
  PRICE_STORAGE_KEY: 'deckBuilderPrices',
  
  /**
   * Loads saved prices from localStorage and updates materials object
   */
  loadSavedPrices() {
    try {
      const savedPrices = localStorage.getItem(this.PRICE_STORAGE_KEY);
      if (savedPrices) {
        const prices = JSON.parse(savedPrices);
        Object.keys(prices).forEach(inputId => {
          this.updateMaterialPrice(inputId, prices[inputId]);
          // Update UI
          const input = document.getElementById(inputId);
          if (input) {
            input.value = prices[inputId];
          }
        });
        logger.log('Loaded saved prices from localStorage');
      }
    } catch (error) {
      logger.error('Error loading saved prices:', error);
    }
  },
  
  /**
   * Saves current prices to localStorage
   */
  savePrices() {
    try {
      const prices = {};
      const costInputs = [
        'cost-2x6', 'cost-2x8', 'cost-2x10', 'cost-2x12', 'cost-6x6',
        'cost-lus-hanger', 'cost-lssu-hanger', 'cost-h1-tie', 'cost-h25a-tie',
        'cost-dtt1z-tie', 'cost-bc6-cap', 'cost-hanger-nails', 'cost-sds25-screws',
        'cost-sds6-screws', 'cost-helical', 'cost-concrete', 'cost-surface'
      ];
      
      costInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          prices[id] = parseFloat(input.value);
        }
      });
      
      localStorage.setItem(this.PRICE_STORAGE_KEY, JSON.stringify(prices));
      logger.log('Saved prices to localStorage');
    } catch (error) {
      logger.error('Error saving prices:', error);
    }
  },
  /**
   * Updates the cost summary display with enhanced breakdown
   * @param {Object} store - State store instance
   */
  updateCostSummary(store) {
    try {
      const state = store.getState();
      if (!state.engineOut || !state.engineOut.material_takeoff) {
        return;
      }

      // Enhanced cost calculation with hardware categories
      let totalCost = 0;
      const breakdown = {
        lumber: 0,
        hardware: 0,
        fasteners: 0,
        footings: 0
      };

      state.engineOut.material_takeoff.forEach(item => {
        let itemCost = 0;
        
        // Use totalCost from item if available (new enhanced format)
        if (item.totalCost) {
          itemCost = item.totalCost;
          const category = item.category || 'lumber';
          if (breakdown[category] !== undefined) {
            breakdown[category] += itemCost;
          } else {
            breakdown.lumber += itemCost; // Default fallback
          }
        } else {
          // Legacy cost calculation for backward compatibility
          const amount = parseInt(item.qty) || 0;
          
          if (item.item.includes('2x') || item.item.includes('6x6')) {
            // Lumber - extract size
            const sizeMatch = item.item.match(/([26])x(\d+)/);
            if (sizeMatch) {
              const size = sizeMatch[0];
              if (materials.lumber[size]) {
                itemCost = amount * materials.lumber[size].costPerFoot;
                breakdown.lumber += itemCost;
              }
            }
          } else if (item.item.includes('hanger')) {
            itemCost = amount * materials.hardware.LUS2x8.cost;
            breakdown.hardware += itemCost;
          } else if (item.item.includes('post base')) {
            itemCost = amount * materials.hardware.PB66.cost;
            breakdown.hardware += itemCost;
          } else if (item.item.includes('pile') || item.item.includes('footing')) {
            const footingType = state.context.footing_type;
            itemCost = amount * materials.footingCosts[footingType];
            breakdown.footings += itemCost;
          }
        }
        
        totalCost += itemCost;
      });

      // Update the cost summary display with enhanced breakdown
      const summaryDiv = document.getElementById('cost-summary');
      if (summaryDiv) {
        let html = '<div class="cost-breakdown">';
        html += `<p><strong>Total Project Cost:</strong> $${totalCost.toFixed(2)}</p>`;
        html += '<p><strong>Cost Breakdown:</strong></p>';
        html += '<ul>';
        
        Object.entries(breakdown).forEach(([category, cost]) => {
          if (cost > 0) {
            const percentage = ((cost / totalCost) * 100).toFixed(1);
            html += `<li><strong>${category.charAt(0).toUpperCase() + category.slice(1)}:</strong> $${cost.toFixed(2)} (${percentage}%)</li>`;
          }
        });
        
        html += '</ul>';
        
        // Add hardware details if available
        if (breakdown.hardware > 0 || breakdown.fasteners > 0) {
          html += '<p style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">Hardware includes Simpson ZMAX galvanized connectors and structural fasteners.</p>';
        }
        
        html += '</div>';
        summaryDiv.innerHTML = html;
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('Error updating cost summary:', error);
      } else {
        console.error('Error updating cost summary:', error);
      }
    }
  },

  /**
   * Sets up material cost related event listeners
   * @param {Function} addListenerCallback - Function to register event listeners for cleanup
   * @param {Object} store - State store instance
   */
  setupMaterialCostListeners(addListenerCallback, store) {
    // Load saved prices on startup
    this.loadSavedPrices();
    
    // Setup pricing modal listeners
    const pricingSettingsBtn = document.getElementById('pricing-settings-btn');
    if (pricingSettingsBtn) {
      const handler = () => {
        const pricingModal = document.getElementById('pricing-modal');
        if (pricingModal) {
          pricingModal.style.display = 'block';
        }
      };
      addListenerCallback(pricingSettingsBtn, 'click', handler);
    }

    // Setup pricing modal close
    const pricingModalClose = document.getElementById('pricing-modal-close');
    if (pricingModalClose) {
      const handler = () => {
        const pricingModal = document.getElementById('pricing-modal');
        if (pricingModal) {
          pricingModal.style.display = 'none';
        }
      };
      addListenerCallback(pricingModalClose, 'click', handler);
    }

    // Setup cost input listeners for all pricing inputs
    const costInputs = [
      'cost-2x6', 'cost-2x8', 'cost-2x10', 'cost-2x12', 'cost-6x6',
      'cost-lus-hanger', 'cost-lssu-hanger', 'cost-h1-tie', 'cost-h25a-tie',
      'cost-dtt1z-tie', 'cost-bc6-cap', 'cost-hanger-nails', 'cost-sds25-screws',
      'cost-sds6-screws', 'cost-helical', 'cost-concrete', 'cost-surface'
    ];

    costInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        const handler = () => {
          // Update the materials object with new price
          this.updateMaterialPrice(id, parseFloat(input.value));
          // Save prices to localStorage
          this.savePrices();
          // Update cost summary when pricing changes
          this.updateCostSummary(store);
        };
        addListenerCallback(input, 'change', handler);
      }
    });
  },
  
  /**
   * Updates material prices in the global materials object
   * @param {string} inputId - The ID of the input element
   * @param {number} newPrice - The new price value
   */
  updateMaterialPrice(inputId, newPrice) {
    if (!materials || isNaN(newPrice)) return;
    
    switch(inputId) {
      // Lumber prices
      case 'cost-2x6':
        materials.lumber['2x6'].costPerFoot = newPrice;
        break;
      case 'cost-2x8':
        materials.lumber['2x8'].costPerFoot = newPrice;
        break;
      case 'cost-2x10':
        materials.lumber['2x10'].costPerFoot = newPrice;
        break;
      case 'cost-2x12':
        materials.lumber['2x12'].costPerFoot = newPrice;
        break;
      case 'cost-6x6':
        materials.lumber['6x6'].costPerFoot = newPrice;
        break;
        
      // Hardware prices - update both legacy and new format
      case 'cost-lus-hanger':
        // Update all LUS hangers with same base price
        materials.hardware.LUS26.cost = newPrice;
        materials.hardware.LUS28.cost = newPrice + 0.25;
        materials.hardware.LUS210.cost = newPrice + 0.50;
        materials.hardware.LUS212.cost = newPrice + 1.00;
        materials.hardware.LUS2x6.cost = newPrice;
        materials.hardware.LUS2x8.cost = newPrice + 0.25;
        materials.hardware.LUS2x10.cost = newPrice + 0.50;
        materials.hardware.LUS2x12.cost = newPrice + 1.00;
        // Update Simpson Zmax
        materials.simpsonZmax.joistHangers.regular.LUS26.cost = newPrice;
        materials.simpsonZmax.joistHangers.regular.LUS28.cost = newPrice + 0.25;
        materials.simpsonZmax.joistHangers.regular.LUS210.cost = newPrice + 0.50;
        materials.simpsonZmax.joistHangers.regular.LUS212.cost = newPrice + 1.00;
        break;
        
      case 'cost-lssu-hanger':
        materials.simpsonZmax.joistHangers.concealed.LSSU26.cost = newPrice;
        materials.simpsonZmax.joistHangers.concealed.LSSU28.cost = newPrice + 0.25;
        materials.simpsonZmax.joistHangers.concealed.LSSU210.cost = newPrice + 0.50;
        materials.simpsonZmax.joistHangers.concealed.LSSU212.cost = newPrice + 1.00;
        break;
        
      case 'cost-h1-tie':
        materials.simpsonZmax.structuralTies.H1.cost = newPrice;
        break;
        
      case 'cost-h25a-tie':
        materials.simpsonZmax.structuralTies['H2.5A'].cost = newPrice;
        break;
        
      case 'cost-dtt1z-tie':
        materials.simpsonZmax.structuralTies.DTT1Z.cost = newPrice;
        break;
        
      case 'cost-bc6-cap':
        materials.hardware.PCZ66.cost = newPrice;
        materials.simpsonZmax.postConnections.BC6.cost = newPrice;
        break;
        
      // Fasteners
      case 'cost-hanger-nails':
        materials.simpsonZmax.fasteners.joistHangerNails['1.5x0.148'].costPer100 = newPrice;
        break;
        
      case 'cost-sds25-screws':
        materials.simpsonZmax.fasteners.structuralScrews.SDS25.costPer50 = newPrice;
        break;
        
      case 'cost-sds6-screws':
        materials.simpsonZmax.fasteners.structuralScrews.SDS6.costPer25 = newPrice;
        break;
        
      // Footing costs
      case 'cost-helical':
        materials.footingCosts.helical = newPrice;
        break;
        
      case 'cost-concrete':
        materials.footingCosts.concrete = newPrice;
        break;
        
      case 'cost-surface':
        materials.footingCosts.surface = newPrice;
        break;
    }
    
    logger.log(`Updated ${inputId} to $${newPrice}`);
  }
};