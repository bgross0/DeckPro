// Production-safe logging utility
class Logger {
  constructor() {
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('debug=true');
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

window.logger = new Logger();