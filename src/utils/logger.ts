/**
 * Logging utility for CLI and API usage
 * Supports different log levels and color output for terminal
 */

import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether verbose mode is enabled */
  verbose: boolean;
  /** Whether to use colors in output */
  useColors: boolean;
}

/**
 * Logger class
 */
class Logger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    verbose: false,
    useColors: true,
  };

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Enable or disable verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.config.verbose = verbose;
  }

  /**
   * Enable or disable colors
   */
  setUseColors(useColors: boolean): void {
    this.config.useColors = useColors;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format message with color if enabled
   */
  private formatMessage(message: string, colorFn: (str: string) => string): string {
    return this.config.useColors ? colorFn(message) : message;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.config.verbose) {
      const formatted = this.formatMessage(`[DEBUG] ${message}`, chalk.gray);
      console.log(formatted, ...args);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(message, chalk.blue);
      console.log(formatted, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage(`[WARN] ${message}`, chalk.yellow);
      console.warn(formatted, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage(`[ERROR] ${message}`, chalk.red);
      console.error(formatted, ...args);
    }
  }

  /**
   * Log a success message
   */
  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(message, chalk.green);
      console.log(formatted, ...args);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance
 */
export function createLogger(): Logger {
  return new Logger();
}
