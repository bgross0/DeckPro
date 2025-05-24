// Material Cost Management Controller
window.MaterialCostController = class MaterialCostController {
  constructor(store) {
    this.store = store;
    this.listeners = [];
    
    // Delay setup to ensure DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupMaterialCostListeners());
    } else {
      setTimeout(() => this.setupMaterialCostListeners(), 100);
    }
  }

  // Helper method to add event listeners and track them for cleanup
  addListener(element, eventType, handler) {
    element.addEventListener(eventType, handler);
    this.listeners.push({ element, eventType, handler });
  }

  // Cleanup all registered event listeners
  cleanupEventListeners() {
    logger.log(`MaterialCostController cleaning up ${this.listeners.length} event listeners`);
    this.listeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
    this.listeners = [];
  }

  setupMaterialCostListeners() {
    if (document.readyState === 'loading') {
      this.addListener(document, 'DOMContentLoaded', () => this.setupMaterialCostListeners());
      return;
    }

    // Lumber costs
    const lumberCosts = ['2x6', '2x8', '2x10', '2x12', '6x6'];
    lumberCosts.forEach(size => {
      const input = document.getElementById(`cost-${size}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.lumber[size].costPerFoot = value;
          this.updateCostSummary();
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Simpson ZMAX Hardware costs
    const zmaxHardware = {
      'lus-hanger': { type: 'joistHangers', subtype: 'regular', keys: ['LUS26', 'LUS28', 'LUS210', 'LUS212'] },
      'lssu-hanger': { type: 'joistHangers', subtype: 'concealed', keys: ['LSSU26', 'LSSU28', 'LSSU210', 'LSSU212'] },
      'h1-tie': { type: 'structuralTies', subtype: 'H1', keys: ['H1'] },
      'h25a-tie': { type: 'structuralTies', subtype: 'H2.5A', keys: ['H2.5A'] },
      'dtt1z-tie': { type: 'structuralTies', subtype: 'DTT1Z', keys: ['DTT1Z'] },
      'bc6-cap': { type: 'postConnections', subtype: 'BC6', keys: ['BC6'] }
    };
    
    Object.entries(zmaxHardware).forEach(([id, config]) => {
      const input = document.getElementById(`cost-${id}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          config.keys.forEach(key => {
            if (materials.simpsonZmax[config.type][key]) {
              materials.simpsonZmax[config.type][key].cost = value;
            }
          });
          this.updateCostSummary();
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Fastener costs
    const fastenerCosts = {
      'hanger-nails': { type: 'joistHangerNails', key: '1.5x0.148', property: 'costPer100' },
      'sds25-screws': { type: 'structuralScrews', key: 'SDS25', property: 'costPer50' },
      'sds6-screws': { type: 'structuralScrews', key: 'SDS6', property: 'costPer25' }
    };
    
    Object.entries(fastenerCosts).forEach(([id, config]) => {
      const input = document.getElementById(`cost-${id}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.simpsonZmax.fasteners[config.type][config.key][config.property] = value;
          this.updateCostSummary();
        };
        this.addListener(input, 'change', handler);
      }
    });

    // Footing costs
    const footingTypes = ['helical', 'concrete', 'surface'];
    footingTypes.forEach(type => {
      const input = document.getElementById(`cost-${type}`);
      if (input) {
        const handler = (e) => {
          const value = parseFloat(e.target.value) || 0;
          materials.footingCosts[type] = value;
          this.updateCostSummary();
        };
        this.addListener(input, 'change', handler);
      }
    });
  }

  updateCostSummary() {
    try {
      const state = this.store.getState();
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
      logger.error('Error updating cost summary:', error);
    }
  }
};