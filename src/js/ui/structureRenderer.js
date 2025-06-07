class StructureRenderer {
  constructor(store) {
    this.store = store;
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.subscribe('structure:generated', (engineOut) => {
      this.renderStructureResults(engineOut);
    });
  }

  renderStructureResults(engineOut) {
    logger.log('Rendering structure results');
    
    // Update framing details tab
    this.renderFramingDetails(engineOut);
    
    // Update material costs
    this.renderMaterialCosts(engineOut);
    
    // Update estimates
    this.renderEstimates(engineOut);
    
    // Update cost summary using MaterialCostUtils
    if (window.MaterialCostUtils) {
      MaterialCostUtils.updateCostSummary(this.store);
    }
    
    // Switch to framing details tab
    const framingTab = document.querySelector('[data-tab="framing"]');
    if (framingTab) {
      framingTab.click();
    }
  }

  renderFramingDetails(engineOut) {
    const container = document.getElementById('framing-specs');
    if (!container) return;

    let html = '<div class="specs-grid">';
    
    // Deck dimensions
    html += '<div class="spec-section">';
    html += '<h4>Deck Dimensions</h4>';
    html += `<p><strong>Size:</strong> ${engineOut.input.width_ft}' × ${engineOut.input.length_ft}'</p>`;
    html += `<p><strong>Area:</strong> ${engineOut.input.width_ft * engineOut.input.length_ft} sq ft</p>`;
    html += `<p><strong>Height:</strong> ${engineOut.input.height_ft}'</p>`;
    html += `<p><strong>Attachment:</strong> ${engineOut.input.attachment}</p>`;
    html += '</div>';

    // Joist specifications
    if (engineOut.joists) {
      html += '<div class="spec-section">';
      html += '<h4>Joist System</h4>';
      html += `<p><strong>Size:</strong> ${engineOut.joists.size}</p>`;
      html += `<p><strong>Spacing:</strong> ${engineOut.joists.spacing_in}"</p>`;
      html += `<p><strong>Span:</strong> ${engineOut.joists.span_ft.toFixed(1)}'</p>`;
      if (engineOut.joists.cantilever_ft > 0) {
        html += `<p><strong>Cantilever:</strong> ${engineOut.joists.cantilever_ft.toFixed(1)}'</p>`;
      }
      html += `<p><strong>Quantity:</strong> ${engineOut.joists.count}</p>`;
      html += '</div>';
    }

    // Beam specifications  
    if (engineOut.beams) {
      engineOut.beams.forEach((beam, index) => {
        html += '<div class="spec-section">';
        html += `<h4>${beam.position.charAt(0).toUpperCase() + beam.position.slice(1)} Beam</h4>`;
        html += `<p><strong>Size:</strong> ${beam.size}</p>`;
        html += `<p><strong>Style:</strong> ${beam.style}</p>`;
        if (beam.post_spacing_ft) {
          html += `<p><strong>Post Spacing:</strong> ${beam.post_spacing_ft.toFixed(1)}'</p>`;
        }
        html += '</div>';
      });
    }

    // Post specifications
    if (engineOut.posts && engineOut.posts.length > 0) {
      html += '<div class="spec-section">';
      html += '<h4>Post System</h4>';
      html += `<p><strong>Size:</strong> 6x6</p>`;
      html += `<p><strong>Quantity:</strong> ${engineOut.posts.length}</p>`;
      html += `<p><strong>Footing:</strong> ${engineOut.footing_type}</p>`;
      html += '</div>';
    }

    // Compliance
    if (engineOut.compliance) {
      html += '<div class="spec-section">';
      html += '<h4>Code Compliance</h4>';
      html += `<p><strong>Status:</strong> <span class="badge ${engineOut.compliance.passes ? 'badge-success' : 'badge-destructive'}">${engineOut.compliance.passes ? 'PASSES' : 'FAILS'}</span></p>`;
      
      if (engineOut.compliance.warnings.length > 0) {
        html += '<p><strong>Warnings:</strong></p>';
        html += '<ul>';
        engineOut.compliance.warnings.forEach(warning => {
          html += `<li>${warning}</li>`;
        });
        html += '</ul>';
      }
      html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  renderMaterialCosts(engineOut) {
    const container = document.getElementById('bom-table-container');
    if (!container) return;

    if (!engineOut.material_takeoff || engineOut.material_takeoff.length === 0) {
      container.innerHTML = '<p class="help-text">No materials calculated</p>';
      return;
    }

    let html = '<table id="bom-table">';
    html += '<thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead>';
    html += '<tbody>';

    engineOut.material_takeoff.forEach(item => {
      html += '<tr>';
      html += `<td>${item.item}</td>`;
      html += `<td>${item.qty}</td>`;
      html += `<td>${item.unit || 'ea'}</td>`;
      html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';

    container.innerHTML = html;

    // Update BOM count badge
    const bomCount = document.getElementById('bom-count');
    if (bomCount) {
      bomCount.textContent = `${engineOut.material_takeoff.length} items`;
    }
  }

  renderEstimates(engineOut) {
    const container = document.getElementById('cost-summary');
    if (!container) return;

    if (!engineOut.material_takeoff) {
      container.innerHTML = '<p class="help-text">Generate structure to see cost breakdown</p>';
      return;
    }

    // For now, show basic material list since we don't have costs in the engine output
    let html = '<div class="cost-breakdown">';
    
    // Summary section
    html += '<div class="cost-section">';
    html += '<h4>Material Summary</h4>';
    html += `<p><strong>Total Items:</strong> ${engineOut.material_takeoff.length}</p>`;
    html += '<p class="help-text">Cost calculations require material pricing configuration</p>';
    html += '</div>';

    // Group materials by category
    const categories = {};
    engineOut.material_takeoff.forEach(item => {
      const category = this.getCategoryForItem(item.item);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });

    // Category breakdown
    Object.keys(categories).forEach(category => {
      html += '<div class="cost-section">';
      html += `<h4>${category}</h4>`;
      categories[category].forEach(item => {
        html += `<p>${item.item}: ${item.qty} ${item.unit || 'ea'}</p>`;
      });
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  getCategoryForItem(description) {
    const lower = description.toLowerCase();
    if (lower.includes('joist') || lower.includes('2x')) return 'Framing Lumber';
    if (lower.includes('beam') || lower.includes('6x')) return 'Beam Lumber';
    if (lower.includes('post')) return 'Posts';
    if (lower.includes('hanger') || lower.includes('screw') || lower.includes('connector')) return 'Hardware';
    if (lower.includes('footing') || lower.includes('concrete') || lower.includes('helical')) return 'Footings';
    return 'Other';
  }
}

window.StructureRenderer = StructureRenderer;