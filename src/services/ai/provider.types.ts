/**
 * AI client metadata and shared error types.
 */

export type {
  AIRequest,
  AIResponse,
  EnhancementPrompt,
  PrioritizedAction,
  ReviewRequest,
  ReviewResponse,
  ReviewResult,
} from './enhancement.types';

/**
 * AI client information
 */
export interface ProviderInfo {
  /** Client name */
  name: string;
  /** Client display name */
  displayName: string;
  /** Supported models */
  supportedModels: string[];
  /** Default model */
  defaultModel: string;
  /** Client version */
  version?: string;
}

/**
 * AI client configuration
 */
export interface AIProviderConfig {
  /** API key for the client */
  apiKey: string;
  /** Model to use */
  model: string;
  /** Temperature (0-1) for creativity control */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable streaming responses */
  enableStreaming?: boolean;
  /** Additional client-specific options */
  [key: string]: unknown;
}

/**
 * Base error class for AI client errors
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AIProviderError';
    Object.setPrototypeOf(this, AIProviderError.prototype);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AIProviderError {
  constructor(
    message: string,
    provider: string,
    public readonly retryAfter?: number
  ) {
    super(message, provider, 'RATE_LIMIT');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Invalid response error
 */
export class InvalidResponseError extends AIProviderError {
  constructor(
    message: string,
    provider: string,
    public readonly response?: unknown
  ) {
    super(message, provider, 'INVALID_RESPONSE');
    this.name = 'InvalidResponseError';
    Object.setPrototypeOf(this, InvalidResponseError.prototype);
  }
}

/**
 * Cost limit exceeded error
 */
export class CostLimitExceededError extends AIProviderError {
  constructor(
    message: string,
    provider: string,
    public readonly estimatedCost?: number,
    public readonly limit?: number
  ) {
    super(message, provider, 'COST_LIMIT_EXCEEDED');
    this.name = 'CostLimitExceededError';
    Object.setPrototypeOf(this, CostLimitExceededError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends AIProviderError {
  constructor(message: string, provider: string, public readonly originalError?: Error) {
    super(message, provider, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AIProviderError {
  constructor(message: string, provider: string, public readonly timeout?: number) {
    super(message, provider, 'TIMEOUT');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
