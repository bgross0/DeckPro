// Material cost calculation utilities
window.MaterialCostUtils = {
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
  }
};