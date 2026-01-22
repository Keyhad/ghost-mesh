/**
 * Logger utility with configurable log levels
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.debug('Detailed info');
 *   logger.info('General info');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 *
 * Set log level via environment variable:
 *   LOG_LEVEL=debug npm run dev:all
 *   LOG_LEVEL=info npm run dev:all
 *   LOG_LEVEL=warn npm run dev:all
 *   LOG_LEVEL=error npm run dev:all
 *   LOG_LEVEL=silent npm run dev:all
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Default to INFO level
    this.level = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
  }

  private parseLogLevel(level: string): LogLevel {
    const normalized = level.toLowerCase();
    switch (normalized) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
      case 'warning':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      case 'silent':
      case 'none':
        return LogLevel.SILENT;
      default:
        console.warn(`Unknown log level: ${level}, defaulting to INFO`);
        return LogLevel.INFO;
    }
  }

  setLevel(level: LogLevel | string) {
    if (typeof level === 'string') {
      this.level = this.parseLogLevel(level);
    } else {
      this.level = level;
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }

  debug(...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log('🔍', ...args);
    }
  }

  info(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log('ℹ️ ', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn('⚠️ ', ...args);
    }
  }

  error(...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error('❌', ...args);
    }
  }

  // Convenience methods that always log regardless of level
  success(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log('✅', ...args);
    }
  }

  // BLE-specific logging helpers
  ble(...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log('📡', ...args);
    }
  }

  message(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log('📬', ...args);
    }
  }

  connection(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log('🔌', ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export the class for custom instances
export { Logger };
