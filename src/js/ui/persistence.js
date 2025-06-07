const persistence = {
  STORAGE_KEY: 'deckBuilder',
  
  save(state) {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      if (window.showToast) {
        showToast('Project saved successfully', 'success');
      }
      return true;
    } catch (error) {
      logger.error('Failed to save state:', error);
      if (window.showToast) {
        showToast('Failed to save project', 'error');
      }
      return false;
    }
  },
  
  load() {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (!serialized) return null;
      const state = JSON.parse(serialized);
      if (window.showToast) {
        showToast('Project loaded successfully', 'success');
      }
      return state;
    } catch (error) {
      logger.error('Failed to load state:', error);
      if (window.showToast) {
        showToast('Failed to load project', 'error');
      }
      return null;
    }
  },
  
  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      logger.error('Failed to clear state:', error);
      return false;
    }
  }
};