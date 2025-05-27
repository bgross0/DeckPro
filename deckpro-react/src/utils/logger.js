// Production-safe logging utility
class Logger {
  constructor() {
    // Check if running in browser environment
    this.isDevelopment = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.search.includes('debug=true')
    ) || (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development');
  }

  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  error(...args) {
    console.error(...args); // Always log errors
  }

  info(...args) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }
}

export const logger = new Logger();