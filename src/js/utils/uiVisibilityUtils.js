// UI visibility management utilities
window.UIVisibilityUtils = {
  /**
   * Updates UI element visibility based on deck attachment type
   * @param {Object} state - Application state object
   */
  updateUIVisibility(state) {
    // Show/hide inner beam style based on attachment
    const innerBeamLabel = document.getElementById('beam-style-inner-label');
    if (state.context.attachment === 'free') {
      innerBeamLabel.style.display = 'block';
    } else {
      innerBeamLabel.style.display = 'none';
    }
  }
};