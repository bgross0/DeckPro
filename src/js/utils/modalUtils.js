// Modal management utilities
window.ModalUtils = {
  /**
   * Sets up modal open/close behavior
   * @param {string} modalId - ID of the modal element
   * @param {string} openButtonId - ID of the button that opens the modal
   * @param {string} closeButtonId - ID of the button that closes the modal
   * @param {Function} addListenerCallback - Function to register event listeners for cleanup
   */
  setupModal(modalId, openButtonId, closeButtonId, addListenerCallback) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openButtonId);
    const closeBtn = document.getElementById(closeButtonId);
    
    if (openBtn && modal) {
      const openHandler = () => {
        modal.style.display = 'flex';
      };
      
      if (addListenerCallback) {
        addListenerCallback(openBtn, 'click', openHandler);
      } else {
        openBtn.addEventListener('click', openHandler);
      }
    }
    
    if (closeBtn && modal) {
      const closeHandler = () => {
        modal.style.display = 'none';
      };
      
      if (addListenerCallback) {
        addListenerCallback(closeBtn, 'click', closeHandler);
      } else {
        closeBtn.addEventListener('click', closeHandler);
      }
    }
    
    // Close modal when clicking backdrop
    if (modal) {
      const backdropHandler = (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      };
      
      if (addListenerCallback) {
        addListenerCallback(modal, 'click', backdropHandler);
      } else {
        modal.addEventListener('click', backdropHandler);
      }
    }
  }
};