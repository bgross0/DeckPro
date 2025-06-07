// Global error handling and recovery system
class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  setupGlobalHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });
  }

  handleError(errorInfo) {
    // Log error
    this.logError(errorInfo);

    // Show user-friendly message
    if (window.showToast) {
      const message = this.getUserFriendlyMessage(errorInfo);
      showToast(message, 'error', 8000);
    }

    // Attempt recovery
    this.attemptRecovery(errorInfo);
  }

  logError(errorInfo) {
    const timestamp = new Date().toISOString();
    const logEntry = { ...errorInfo, timestamp };
    
    this.errorLog.push(logEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console log for debugging
    console.error('DeckPro Error:', logEntry);
  }

  getUserFriendlyMessage(errorInfo) {
    if (errorInfo.message?.includes('computeStructure')) {
      return 'Structure calculation failed. Please check your deck dimensions and try again.';
    }
    if (errorInfo.message?.includes('canvas')) {
      return 'Drawing error occurred. Try refreshing the page if issues persist.';
    }
    if (errorInfo.message?.includes('export')) {
      return 'Export failed. Please try again or use a different format.';
    }
    return 'An unexpected error occurred. The application will continue running.';
  }

  attemptRecovery(errorInfo) {
    // Auto-save current state in case of major errors
    try {
      if (window.uiControls?.store && typeof persistence !== 'undefined') {
        const state = window.uiControls.store.getState();
        persistence.save(state);
        console.log('Auto-saved state due to error');
      }
    } catch (saveError) {
      console.error('Failed to auto-save during error recovery:', saveError);
    }
  }

  // Safe function wrapper
  safe(fn, context = null, fallback = null) {
    return (...args) => {
      try {
        return fn.apply(context, args);
      } catch (error) {
        this.handleError({
          type: 'wrapped',
          message: error.message,
          stack: error.stack,
          function: fn.name
        });
        return fallback;
      }
    };
  }

  // Get error report for debugging
  getErrorReport() {
    return {
      errors: this.errorLog,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      appState: window.uiControls?.store?.getState() || 'unavailable'
    };
  }
}

// Global instance
window.errorHandler = new ErrorHandler();