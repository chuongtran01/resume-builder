/**
 * AI Provider Interface Types
 * 
 * Defines unified interfaces for AI providers (designed for Gemini, extensible for future providers).
 * Supports sequential review → modify workflow for resume enhancement.
 */

import type { Resume } from '../../types/resume.types';
import type {
  EnhancementOptions,
  Improvement,
} from '../../types/enhancement.types';
import type { ParsedJobDescription } from '../../utils/jobParser';

/**
 * Provider information
 */
export interface ProviderInfo {
  /** Provider name (e.g., "gemini", "openai", "anthropic") */
  name: string;
  /** Provider display name */
  displayName: string;
  /** Supported models */
  supportedModels: string[];
  /** Default model */
  defaultModel: string;
  /** Provider version */
  version?: string;
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  /** API key for the provider */
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
  /** Additional provider-specific options */
  [key: string]: unknown;
}

/**
 * Review result from AI analysis phase
 */
export interface ReviewResult {
  /** Strengths identified in the resume */
  strengths: string[];
  /** Weaknesses or gaps identified */
  weaknesses: string[];
  /** Opportunities for improvement */
  opportunities: string[];
  /** Prioritized actions to take */
  prioritizedActions: PrioritizedAction[];
  /** Overall confidence in the review (0-1) */
  confidence: number;
  /** Additional reasoning or notes */
  reasoning?: string;
}

/**
 * Prioritized action for enhancement
 */
export interface PrioritizedAction {
  /** Type of action */
  type: 'enhance' | 'reorder' | 'add' | 'remove' | 'rewrite';
  /** Section where action applies */
  section: string;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Reason for the action */
  reason: string;
  /** Suggested change (if applicable) */
  suggestedChange?: string;
}

/**
 * AI request for enhancement
 */
export interface AIRequest {
  /** Original resume data */
  resume: Resume;
  /** Parsed job description information */
  jobInfo: ParsedJobDescription;
  /** Enhancement options */
  options?: EnhancementOptions;
  /** Custom prompt template (optional) */
  promptTemplate?: string;
  /** Review result (for modify phase) */
  reviewResult?: ReviewResult;
}

/**
 * AI response from provider
 */
export interface AIResponse {
  /** Enhanced resume data */
  enhancedResume: Resume;
  /** List of improvements made */
  improvements: Improvement[];
  /** Reasoning for changes (optional) */
  reasoning?: string;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Tokens used in the request */
  tokensUsed?: number;
  /** Estimated cost in USD */
  cost?: number;
}

/**
 * Review request for AI analysis phase
 */
export interface ReviewRequest {
  /** Original resume data */
  resume: Resume;
  /** Parsed job description information */
  jobInfo: ParsedJobDescription;
  /** Enhancement options */
  options?: EnhancementOptions;
}

/**
 * Review response from AI provider
 */
export interface ReviewResponse {
  /** Review result with analysis */
  reviewResult: ReviewResult;
  /** Tokens used in the request */
  tokensUsed?: number;
  /** Estimated cost in USD */
  cost?: number;
}

/**
 * Enhancement prompt structure
 */
export interface EnhancementPrompt {
  /** System message/instructions */
  systemMessage: string;
  /** User prompt/content */
  userPrompt: string;
  /** Few-shot examples (optional) */
  examples?: Array<{
    input: string;
    output: string;
  }>;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Base error class for AI provider errors
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

/**
 * AI Provider interface
 * 
 * Unified interface for AI providers (Gemini, OpenAI, Anthropic, etc.)
 * Supports sequential review → modify workflow
 */
export interface AIProvider {
  /**
   * Review resume against job requirements
   * Step 1 of the enhancement process: Analyze and identify opportunities
   * 
   * @param request - Review request with resume and job info
   * @returns Promise resolving to review response with analysis
   * @throws {AIProviderError} If review fails
   */
  reviewResume(request: ReviewRequest): Promise<ReviewResponse>;

  /**
   * Modify resume based on review findings
   * Step 2 of the enhancement process: Apply enhancements
   * 
   * @param request - Enhancement request with resume, job info, and review result
   * @returns Promise resolving to AI response with enhanced resume
   * @throws {AIProviderError} If modification fails
   */
  modifyResume(request: AIRequest): Promise<AIResponse>;

  /**
   * Enhance resume (convenience method that orchestrates review + modify)
   * 
   * @param request - Enhancement request with resume and job info
   * @returns Promise resolving to AI response with enhanced resume
   * @throws {AIProviderError} If enhancement fails
   */
  enhanceResume(request: AIRequest): Promise<AIResponse>;

  /**
   * Validate AI response structure
   * 
   * @param response - AI response to validate
   * @returns True if response is valid, false otherwise
   */
  validateResponse(response: AIResponse | ReviewResponse): boolean;

  /**
   * Estimate cost for a request
   * 
   * @param request - AI request to estimate cost for
   * @returns Estimated cost in USD
   */
  estimateCost(request: AIRequest | ReviewRequest): number;

  /**
   * Get provider information
   * 
   * @returns Provider information including name, models, etc.
   */
  getProviderInfo(): ProviderInfo;
}
