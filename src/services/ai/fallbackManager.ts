/**
 * Fallback Manager for AI Providers
 * 
 * Handles failures from AI providers with retry logic, exponential backoff,
 * and clear error reporting. Provides graceful error handling and recovery.
 */

import type { AIProvider } from '@services/ai/provider.types';
import {
  AIProviderError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  InvalidResponseError,
} from '@services/ai/provider.types';
import { logger } from '@utils/logger';

/**
 * Fallback configuration options
 */
export interface FallbackConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay for exponential backoff in milliseconds */
  retryDelayBase?: number;
  /** Maximum delay between retries in milliseconds */
  maxRetryDelay?: number;
  /** Whether to retry on rate limit errors */
  retryOnRateLimit?: boolean;
  /** Whether to retry on network errors */
  retryOnNetworkError?: boolean;
  /** Whether to retry on timeout errors */
  retryOnTimeout?: boolean;
  /** Whether to retry on invalid response errors */
  retryOnInvalidResponse?: boolean;
}

/**
 * Default fallback configuration
 */
const DEFAULT_CONFIG: Required<FallbackConfig> = {
  maxRetries: 3,
  retryDelayBase: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  retryOnRateLimit: true,
  retryOnNetworkError: true,
  retryOnTimeout: true,
  retryOnInvalidResponse: false, // Don't retry on invalid responses (likely won't improve)
};

/**
 * Error statistics for tracking failures
 */
export interface ErrorStatistics {
  /** Total number of errors encountered */
  totalErrors: number;
  /** Number of errors by type */
  errorsByType: Record<string, number>;
  /** Number of retries attempted */
  totalRetries: number;
  /** Number of successful recoveries after retry */
  successfulRecoveries: number;
  /** Last error encountered */
  lastError?: AIProviderError;
  /** Timestamp of last error */
  lastErrorTime?: Date;
}

/**
 * Fallback Manager
 * 
 * Manages retry logic, error handling, and statistics for AI provider failures.
 */
export class FallbackManager {
  private config: Required<FallbackConfig>;
  private statistics: ErrorStatistics;

  constructor(config: FallbackConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.statistics = {
      totalErrors: 0,
      errorsByType: {},
      totalRetries: 0,
      successfulRecoveries: 0,
    };
  }

  /**
   * Execute a function with retry logic and fallback handling
   * 
   * @param fn - Function to execute (should return a Promise)
   * @param provider - AI provider instance (for error context)
   * @param operation - Operation name (for logging)
   * @returns Promise resolving to the function result
   * @throws {AIProviderError} If all retries fail
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    provider: AIProvider,
    operation: string = 'operation'
  ): Promise<T> {
    const providerName = provider.getProviderInfo().name;
    let lastError: AIProviderError | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await fn();
        
        // If we retried and succeeded, count as recovery
        if (attempt > 0) {
          this.statistics.successfulRecoveries++;
          logger.info(
            `Operation "${operation}" succeeded after ${attempt} retry(ies) for provider "${providerName}"`
          );
        }

        return result;
      } catch (error) {
        lastError = this.normalizeError(error, providerName);
        this.recordError(lastError);

        // Check if we should retry this error
        if (attempt < this.config.maxRetries && this.shouldRetry(lastError)) {
          attempt++;
          this.statistics.totalRetries++;

          const delay = this.calculateRetryDelay(attempt, lastError);
          logger.warn(
            `Operation "${operation}" failed for provider "${providerName}" (attempt ${attempt}/${this.config.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`
          );

          await this.sleep(delay);
          continue;
        }

        // No more retries or error is not retryable
        break;
      }
    }

    // All retries exhausted or error is not retryable
    if (lastError) {
      logger.error(
        `Operation "${operation}" failed for provider "${providerName}" after ${attempt} attempt(s): ${lastError.message}`
      );
      throw lastError;
    }

    // This should never happen, but TypeScript requires it
    throw new AIProviderError('Unknown error occurred', providerName);
  }

  /**
   * Check if an error should be retried
   * 
   * @param error - Error to check
   * @returns True if error should be retried
   */
  shouldRetry(error: AIProviderError): boolean {
    if (error instanceof RateLimitError) {
      return this.config.retryOnRateLimit;
    }

    if (error instanceof NetworkError) {
      return this.config.retryOnNetworkError;
    }

    if (error instanceof TimeoutError) {
      return this.config.retryOnTimeout;
    }

    if (error instanceof InvalidResponseError) {
      return this.config.retryOnInvalidResponse;
    }

    // For other AIProviderError types, retry by default
    // (e.g., temporary API issues)
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   * 
   * @param attempt - Current attempt number (1-based)
   * @param error - Error that triggered the retry
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(attempt: number, error: AIProviderError): number {
    // If rate limit error has retryAfter, use that
    if (error instanceof RateLimitError && error.retryAfter) {
      return Math.min(error.retryAfter * 1000, this.config.maxRetryDelay);
    }

    // Exponential backoff: base * 2^(attempt - 1)
    const delay = this.config.retryDelayBase * Math.pow(2, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
    
    return Math.min(delay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Normalize an error to AIProviderError
   * 
   * @param error - Error to normalize
   * @param providerName - Provider name for context
   * @returns Normalized AIProviderError
   */
  private normalizeError(error: unknown, providerName: string): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for common error patterns
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('429')) {
        return new RateLimitError(`Rate limit exceeded: ${error.message}`, providerName);
      }

      if (message.includes('timeout') || message.includes('timed out')) {
        return new TimeoutError(`Request timeout: ${error.message}`, providerName);
      }

      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      ) {
        return new NetworkError(`Network error: ${error.message}`, providerName, error);
      }

      // Generic AI provider error
      return new AIProviderError(error.message, providerName);
    }

    // Unknown error type
    return new AIProviderError(
      `Unknown error: ${String(error)}`,
      providerName,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Record an error in statistics
   * 
   * @param error - Error to record
   */
  private recordError(error: AIProviderError): void {
    this.statistics.totalErrors++;
    
    const errorType = error.constructor.name;
    this.statistics.errorsByType[errorType] = (this.statistics.errorsByType[errorType] || 0) + 1;
    
    this.statistics.lastError = error;
    this.statistics.lastErrorTime = new Date();
  }

  /**
   * Get error statistics
   * 
   * @returns Current error statistics
   */
  getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  /**
   * Reset error statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalErrors: 0,
      errorsByType: {},
      totalRetries: 0,
      successfulRecoveries: 0,
    };
  }

  /**
   * Get next provider (for future multi-provider support)
   * Currently returns null as only Gemini is supported
   * 
   * @param currentProvider - Current provider that failed
   * @returns Next provider or null if none available
   */
  getNextProvider(currentProvider: AIProvider): AIProvider | null {
    // For now, only Gemini is supported, so no fallback provider
    // This method is here for future extensibility when multiple providers are available
    logger.debug(
      `No alternative provider available. Current provider: ${currentProvider.getProviderInfo().name}`
    );
    return null;
  }

  /**
   * Handle a provider failure
   * 
   * @param error - Error that occurred
   * @param provider - Provider that failed
   * @returns Next provider to try, or null if none available
   */
  handleFailure(error: AIProviderError, provider: AIProvider): AIProvider | null {
    const providerName = provider.getProviderInfo().name;
    const errorType = error.constructor.name;

    logger.error(
      `Provider "${providerName}" failed with ${errorType}: ${error.message}`
    );

    // Try to get next provider
    const nextProvider = this.getNextProvider(provider);
    
    if (nextProvider) {
      const nextProviderName = nextProvider.getProviderInfo().name;
      logger.info(
        `Switching from "${providerName}" to "${nextProviderName}" due to failure`
      );
      return nextProvider;
    }

    // No alternative provider available
    logger.warn(`No alternative provider available. Error: ${error.message}`);
    return null;
  }

  /**
   * Sleep for a specified duration
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a default fallback manager instance
 * 
 * @param config - Optional configuration
 * @returns Fallback manager instance
 */
export function createFallbackManager(config?: FallbackConfig): FallbackManager {
  return new FallbackManager(config);
}

/**
 * Default fallback manager instance
 */
export const defaultFallbackManager = new FallbackManager();
