// Toast notification system
class ToastManager {
  constructor() {
    this.container = this.createContainer();
    this.toasts = [];
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${this.getColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      pointer-events: auto;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
    `;
    toast.textContent = message;

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Auto-remove
    setTimeout(() => this.remove(toast), duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => this.remove(toast));
  }

  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  getColor(type) {
    const colors = {
      success: '#10B981',
      error: '#EF4444', 
      warning: '#F59E0B',
      info: '#3B82F6'
    };
    return colors[type] || colors.info;
  }
}

// Export class and create global instance
window.ToastManager = ToastManager;
window.toastManager = new ToastManager();
window.showToast = (message, type, duration) => window.toastManager.show(message, type, duration);