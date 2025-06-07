// Tab switching utility for UI panels
window.TabSwitchingUtils = {
  /**
   * Sets up tab switching behavior for tab buttons and panels
   * @param {Function} addListenerCallback - Function to register event listeners for cleanup
   */
  setupTabSwitching(addListenerCallback) {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      const handler = () => {
        const targetTab = button.dataset.tab;
        
        // Update button states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update panel visibility
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${targetTab}-tab`).classList.add('active');
      };
      
      if (addListenerCallback) {
        addListenerCallback(button, 'click', handler);
      } else {
        button.addEventListener('click', handler);
      }
    });
  }
};