// ShadCN UI Component Handlers
window.ShadCNComponents = class ShadCNComponents {
  constructor() {
    this.initializeComponents();
  }

  initializeComponents() {
    this.setupDropdowns();
    this.setupCollapsibles();
    this.setupStatusIndicators();
    this.setupTooltips();
  }

  // Dropdown functionality
  setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const content = dropdown.querySelector('.dropdown-content');
      const items = dropdown.querySelectorAll('.dropdown-item');
      
      if (!trigger || !content) return;

      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown(trigger, content);
      });

      // Handle dropdown items
      items.forEach(item => {
        item.addEventListener('click', (e) => {
          const value = item.getAttribute('data-value');
          if (value) {
            this.handleDropdownSelection(dropdown, value, item.textContent.trim());
            this.closeDropdown(trigger, content);
          }
        });
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          this.closeDropdown(trigger, content);
        }
      });
    });
  }

  toggleDropdown(trigger, content) {
    const isOpen = trigger.getAttribute('data-state') === 'open';
    
    if (isOpen) {
      this.closeDropdown(trigger, content);
    } else {
      this.openDropdown(trigger, content);
    }
  }

  openDropdown(trigger, content) {
    trigger.setAttribute('data-state', 'open');
    content.setAttribute('data-state', 'open');
  }

  closeDropdown(trigger, content) {
    trigger.setAttribute('data-state', 'closed');
    content.setAttribute('data-state', 'closed');
  }

  handleDropdownSelection(dropdown, value, text) {
    // Handle export dropdown
    if (dropdown.querySelector('#export-dropdown-trigger')) {
      this.handleExportSelection(value);
    }
  }

  handleExportSelection(value) {
    // Trigger existing export functionality
    const exportSelect = document.getElementById('export-menu');
    if (exportSelect) {
      exportSelect.value = value;
      exportSelect.dispatchEvent(new Event('change'));
    }
  }

  handleSettingsSelection(action) {\n    console.log('Settings action:', action);\n    \n    switch (action) {\n      case 'pricing':\n        // Open pricing modal\n        const pricingModal = document.getElementById('pricing-modal');\n        if (pricingModal) {\n          pricingModal.style.display = 'flex';\n        }\n        break;\n        \n      case 'units':\n        this.showAlert('Units & Precision settings coming soon!', 'default');\n        break;\n        \n      case 'export-settings':\n        this.showAlert('Export settings coming soon!', 'default');\n        break;\n        \n      case 'reset':\n        if (confirm('Reset all settings to defaults?')) {\n          this.showAlert('Settings reset to defaults', 'success');\n          // Add actual reset logic here\n        }\n        break;\n        \n      default:\n        console.log('Unknown settings action:', action);\n    }\n  }\n\n  // Collapsible functionality
  setupCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible');
    
    collapsibles.forEach(collapsible => {
      const trigger = collapsible.querySelector('.collapsible-trigger');
      const content = collapsible.querySelector('.collapsible-content');
      
      if (!trigger || !content) return;

      trigger.addEventListener('click', () => {
        this.toggleCollapsible(trigger, content);
      });
    });
  }

  toggleCollapsible(trigger, content) {
    const isOpen = trigger.getAttribute('data-state') === 'open';
    
    if (isOpen) {
      trigger.setAttribute('data-state', 'closed');
      content.setAttribute('data-state', 'closed');
    } else {
      trigger.setAttribute('data-state', 'open');
      content.setAttribute('data-state', 'open');
    }
  }

  // Status indicators
  setupStatusIndicators() {
    this.updateStructureStatus('ready');
  }

  updateStructureStatus(status) {
    const statusDot = document.getElementById('structure-status');
    const statusText = document.getElementById('structure-status-text');
    
    if (!statusDot || !statusText) return;

    // Remove existing status classes
    statusDot.classList.remove('success', 'warning', 'error', 'loading');
    
    switch (status) {
      case 'ready':
        statusText.textContent = 'Ready';
        break;
      case 'generating':
        statusDot.classList.add('loading');
        statusText.textContent = 'Generating...';
        this.showProgress();
        break;
      case 'success':
        statusDot.classList.add('success');
        statusText.textContent = 'Complete';
        this.hideProgress();
        break;
      case 'error':
        statusDot.classList.add('error');
        statusText.textContent = 'Error';
        this.hideProgress();
        break;
    }
  }

  showProgress() {
    const progress = document.getElementById('generation-progress');
    if (progress) {
      progress.style.display = 'block';
    }
  }

  hideProgress() {
    const progress = document.getElementById('generation-progress');
    if (progress) {
      progress.style.display = 'none';
    }
  }

  // Enhanced tooltips (improve on CSS-only version)
  setupTooltips() {
    const tooltips = document.querySelectorAll('.tooltip');
    
    tooltips.forEach(tooltip => {
      const content = tooltip.querySelector('.tooltip-content');
      if (!content) return;

      let timeout;

      tooltip.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          content.style.opacity = '1';
          content.style.visibility = 'visible';
        }, 500); // Delay for better UX
      });

      tooltip.addEventListener('mouseleave', () => {
        clearTimeout(timeout);
        content.style.opacity = '0';
        content.style.visibility = 'hidden';
      });
    });
  }

  // Alert system
  showAlert(message, type = 'default', container = null) {
    const alertContainer = container || document.querySelector('.tab-content .active');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <div class="alert-description">${message}</div>
    `;

    // Insert at the top of the container
    alertContainer.insertBefore(alert, alertContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 5000);

    return alert;
  }

  // Update generation button state
  updateGenerateButton(enabled, text = null) {
    const btn = document.getElementById('generate-btn');
    const btnText = document.getElementById('generate-btn-text');
    const help = document.getElementById('generate-help');
    
    if (btn) {
      btn.disabled = !enabled;
      if (enabled) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    }
    
    if (btnText && text) {
      btnText.textContent = text;
    }
    
    if (help) {
      help.style.display = enabled ? 'none' : 'block';
    }
  }

  // Enhanced visual feedback
  addSuccessBadge(element, text) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-success';
    badge.textContent = text;
    element.appendChild(badge);
    
    setTimeout(() => {
      if (badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    }, 3000);
  }

  // Smooth transitions for better UX
  fadeIn(element, duration = 200) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.min(progress, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  fadeOut(element, duration = 200) {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.max(1 - progress, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Initialize ShadCN components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
document.addEventListener('DOMContentLoaded', () => {
  window.shadcnComponents = new ShadCNComponents();
  
  // Demo badge updates after 3 seconds to show they work
  setTimeout(() => {
    // Update footprint badge to show it's set
    const footprintBadge = document.getElementById('footprint-status');
    if (footprintBadge) {
      footprintBadge.textContent = 'Defined';
      footprintBadge.className = 'badge badge-success';
    }
    
    // Update BOM badge to show items
    const bomCountBadge = document.getElementById('bom-count');
    const bomStatusBadge = document.getElementById('bom-status');
    if (bomCountBadge) bomCountBadge.textContent = '15 items';
    if (bomStatusBadge) {
      bomStatusBadge.textContent = 'Complete';
      bomStatusBadge.className = 'badge badge-success';
    }
  }, 3000);
});