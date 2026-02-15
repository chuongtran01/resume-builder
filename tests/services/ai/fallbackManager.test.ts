/**
 * Unit tests for Fallback Manager
 */

import { FallbackManager, createFallbackManager } from '../../../src/services/ai/fallbackManager';
import type {
  AIProvider,
  ReviewRequest,
  ReviewResponse,
  AIRequest,
  AIResponse,
} from '../../../src/services/ai/provider.types';
import {
  AIProviderError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  InvalidResponseError,
} from '../../../src/services/ai/provider.types';

// Mock AI Provider for testing
class MockAIProvider implements AIProvider {
  constructor(public name: string) {}

  async reviewResume(_request: ReviewRequest): Promise<ReviewResponse> {
    throw new Error('Not implemented');
  }

  async modifyResume(_request: AIRequest): Promise<AIResponse> {
    throw new Error('Not implemented');
  }

  async enhanceResume(_request: AIRequest): Promise<AIResponse> {
    throw new Error('Not implemented');
  }

  validateResponse(_response: AIResponse | ReviewResponse): boolean {
    return true;
  }

  estimateCost(_request: AIRequest | ReviewRequest): number {
    return 0;
  }

  getProviderInfo() {
    return {
      name: this.name,
      displayName: `Mock ${this.name}`,
      supportedModels: ['test-model'],
      defaultModel: 'test-model',
    };
  }
}

describe('FallbackManager', () => {
  let fallbackManager: FallbackManager;
  let mockProvider: AIProvider;

  beforeEach(() => {
    fallbackManager = new FallbackManager({
      maxRetries: 3,
      retryDelayBase: 100,
      maxRetryDelay: 1000,
    });
    mockProvider = new MockAIProvider('test');
  });

  describe('executeWithRetry', () => {
    it('should execute function successfully on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await fallbackManager.executeWithRetry(fn, mockProvider, 'test');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors and eventually succeed', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new NetworkError('Network error', 'test');
        }
        return 'success';
      });

      const result = await fallbackManager.executeWithRetry(fn, mockProvider, 'test');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });

    it('should throw error after max retries exhausted', async () => {
      const networkError = new NetworkError('Network error', 'test');
      const fn = jest.fn().mockRejectedValue(networkError);

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(NetworkError);

      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const invalidError = new InvalidResponseError('Invalid response', 'test');
      const fn = jest.fn().mockRejectedValue(invalidError);

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(InvalidResponseError);

      expect(fn).toHaveBeenCalledTimes(1); // No retries for invalid response
    });

    it('should use retryAfter from RateLimitError if available', async () => {
      const rateLimitError = new RateLimitError('Rate limit', 'test', 5); // 5 seconds
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw rateLimitError;
        }
        return 'success';
      });

      const startTime = Date.now();
      const result = await fallbackManager.executeWithRetry(fn, mockProvider, 'test');
      const elapsed = Date.now() - startTime;

      expect(result).toBe('success');
      // Should wait approximately 5 seconds (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(4000);
      expect(elapsed).toBeLessThan(6000);
    });

    it('should normalize unknown errors to AIProviderError', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Unknown error'));

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(AIProviderError);

      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should track successful recoveries', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new NetworkError('Network error', 'test');
        }
        return 'success';
      });

      await fallbackManager.executeWithRetry(fn, mockProvider, 'test');

      const stats = fallbackManager.getStatistics();
      expect(stats.successfulRecoveries).toBe(1);
      expect(stats.totalRetries).toBe(1);
    });
  });

  describe('shouldRetry', () => {
    it('should retry RateLimitError when retryOnRateLimit is true', () => {
      const error = new RateLimitError('Rate limit', 'test');
      expect(fallbackManager.shouldRetry(error)).toBe(true);
    });

    it('should not retry RateLimitError when retryOnRateLimit is false', () => {
      const manager = new FallbackManager({ retryOnRateLimit: false });
      const error = new RateLimitError('Rate limit', 'test');
      expect(manager.shouldRetry(error)).toBe(false);
    });

    it('should retry NetworkError when retryOnNetworkError is true', () => {
      const error = new NetworkError('Network error', 'test');
      expect(fallbackManager.shouldRetry(error)).toBe(true);
    });

    it('should not retry NetworkError when retryOnNetworkError is false', () => {
      const manager = new FallbackManager({ retryOnNetworkError: false });
      const error = new NetworkError('Network error', 'test');
      expect(manager.shouldRetry(error)).toBe(false);
    });

    it('should retry TimeoutError when retryOnTimeout is true', () => {
      const error = new TimeoutError('Timeout', 'test');
      expect(fallbackManager.shouldRetry(error)).toBe(true);
    });

    it('should not retry TimeoutError when retryOnTimeout is false', () => {
      const manager = new FallbackManager({ retryOnTimeout: false });
      const error = new TimeoutError('Timeout', 'test');
      expect(manager.shouldRetry(error)).toBe(false);
    });

    it('should not retry InvalidResponseError by default', () => {
      const error = new InvalidResponseError('Invalid response', 'test');
      expect(fallbackManager.shouldRetry(error)).toBe(false);
    });

    it('should retry InvalidResponseError when retryOnInvalidResponse is true', () => {
      const manager = new FallbackManager({ retryOnInvalidResponse: true });
      const error = new InvalidResponseError('Invalid response', 'test');
      expect(manager.shouldRetry(error)).toBe(true);
    });

    it('should retry generic AIProviderError by default', () => {
      const error = new AIProviderError('Generic error', 'test');
      expect(fallbackManager.shouldRetry(error)).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should use retryAfter from RateLimitError', () => {
      const error = new RateLimitError('Rate limit', 'test', 5);
      const delay = fallbackManager.calculateRetryDelay(1, error);
      expect(delay).toBe(5000); // 5 seconds in milliseconds
    });

    it('should cap retryAfter at maxRetryDelay', () => {
      const manager = new FallbackManager({ maxRetryDelay: 2000 });
      const error = new RateLimitError('Rate limit', 'test', 10);
      const delay = manager.calculateRetryDelay(1, error);
      expect(delay).toBe(2000); // Capped at maxRetryDelay
    });

    it('should use exponential backoff for non-rate-limit errors', () => {
      const error = new NetworkError('Network error', 'test');
      
      const delay1 = fallbackManager.calculateRetryDelay(1, error);
      const delay2 = fallbackManager.calculateRetryDelay(2, error);
      const delay3 = fallbackManager.calculateRetryDelay(3, error);

      // Exponential backoff: base * 2^(attempt - 1)
      expect(delay1).toBeGreaterThanOrEqual(100); // base
      expect(delay2).toBeGreaterThanOrEqual(200); // base * 2
      expect(delay3).toBeGreaterThanOrEqual(400); // base * 4
    });

    it('should cap exponential backoff at maxRetryDelay', () => {
      const manager = new FallbackManager({
        retryDelayBase: 10000,
        maxRetryDelay: 1000,
      });
      const error = new NetworkError('Network error', 'test');
      const delay = manager.calculateRetryDelay(5, error);
      expect(delay).toBeLessThanOrEqual(1000);
    });
  });

  describe('handleFailure', () => {
    it('should return null when no alternative provider available', () => {
      const error = new NetworkError('Network error', 'test');
      const result = fallbackManager.handleFailure(error, mockProvider);
      expect(result).toBeNull();
    });

    it('should record error in statistics', () => {
      const error = new NetworkError('Network error', 'test');
      fallbackManager.handleFailure(error, mockProvider);

      const stats = fallbackManager.getStatistics();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType['NetworkError']).toBe(1);
      expect(stats.lastError).toBe(error);
    });
  });

  describe('getNextProvider', () => {
    it('should return null when only one provider available', () => {
      const result = fallbackManager.getNextProvider(mockProvider);
      expect(result).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return current statistics', () => {
      const stats = fallbackManager.getStatistics();
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('totalRetries');
      expect(stats).toHaveProperty('successfulRecoveries');
    });

    it('should track errors by type', async () => {
      const networkError = new NetworkError('Network error', 'test');
      const rateLimitError = new RateLimitError('Rate limit', 'test');
      const fn1 = jest.fn().mockRejectedValue(networkError);
      const fn2 = jest.fn().mockRejectedValue(rateLimitError);

      try {
        await fallbackManager.executeWithRetry(fn1, mockProvider, 'test1');
      } catch {
        // Expected to fail
      }

      try {
        await fallbackManager.executeWithRetry(fn2, mockProvider, 'test2');
      } catch {
        // Expected to fail
      }

      const stats = fallbackManager.getStatistics();
      expect(stats.errorsByType['NetworkError']).toBeGreaterThan(0);
      expect(stats.errorsByType['RateLimitError']).toBeGreaterThan(0);
    });
  });

  describe('resetStatistics', () => {
    it('should reset all statistics', async () => {
      const error = new NetworkError('Network error', 'test');
      const fn = jest.fn().mockRejectedValue(error);

      try {
        await fallbackManager.executeWithRetry(fn, mockProvider, 'test');
      } catch {
        // Expected to fail
      }

      expect(fallbackManager.getStatistics().totalErrors).toBeGreaterThan(0);

      fallbackManager.resetStatistics();

      const stats = fallbackManager.getStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.totalRetries).toBe(0);
      expect(stats.successfulRecoveries).toBe(0);
      expect(Object.keys(stats.errorsByType).length).toBe(0);
    });
  });

  describe('createFallbackManager', () => {
    it('should create a fallback manager with default config', () => {
      const manager = createFallbackManager();
      expect(manager).toBeInstanceOf(FallbackManager);
    });

    it('should create a fallback manager with custom config', () => {
      const manager = createFallbackManager({
        maxRetries: 5,
        retryDelayBase: 2000,
      });
      expect(manager).toBeInstanceOf(FallbackManager);
    });
  });

  describe('Error normalization', () => {
    it('should normalize Error with rate limit message to RateLimitError', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(RateLimitError);
    });

    it('should normalize Error with timeout message to TimeoutError', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Request timed out'));

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(TimeoutError);
    });

    it('should normalize Error with network message to NetworkError', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network connection failed'));

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(NetworkError);
    });

    it('should normalize unknown error to AIProviderError', async () => {
      const fn = jest.fn().mockRejectedValue('String error');

      await expect(
        fallbackManager.executeWithRetry(fn, mockProvider, 'test')
      ).rejects.toThrow(AIProviderError);
    });
  });
});
