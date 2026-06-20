/**
 * Google Gemini AI Provider Implementation.
 *
 * Routes Gemini resume generation through the AI SDK adapter.
 */

import type {
  AIProviderConfig,
  ProviderInfo,
} from '@services/ai/provider.types';
import type {
  AIRequest,
  AIResponse,
  ReviewRequest,
  ReviewResponse,
} from '@services/ai/enhancement.types';
import {
  AIProviderError,
  RateLimitError,
  InvalidResponseError,
  NetworkError,
  TimeoutError,
} from '@services/ai/provider.types';
import { AISdkResumeGenerator } from '@services/ai/aiSdkResumeGenerator';
import type { AISdkResumeGeneratorConfig } from '@services/ai/aiSdkResumeGenerator';
import type { LanguageModel } from 'ai';
import { logger } from '@utils/logger';

/**
 * Gemini provider configuration
 */
export interface GeminiConfig extends AIProviderConfig {
  /** API key for Google AI */
  apiKey: string;
  /** Model to use - supports latest models from official docs */
  model: 'gemini-2.5-pro' | 'gemini-3-flash-preview';
  /** Temperature (0-1) for creativity control */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay base in milliseconds */
  retryDelayBase?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<GeminiConfig> = {
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  maxRetries: 3,
  retryDelayBase: 1000,
};

/**
 * Google Gemini AI Provider.
 */
export class GeminiProvider {
  private config: GeminiConfig;
  private generator: AISdkResumeGenerator;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new AIProviderError('API key is required', 'gemini', 'MISSING_API_KEY');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as GeminiConfig;

    this.generator = new AISdkResumeGenerator(this.buildGeneratorConfig());

    logger.info(`Initialized Gemini provider with model: ${this.config.model}`);
  }

  /**
   * Review resume against job requirements
   */
  async reviewResume(request: ReviewRequest): Promise<ReviewResponse> {
    logger.debug('Starting resume review with Gemini via AI SDK...');

    try {
      const response = await this.callWithRetry(() => this.generator.reviewResume(request));
      logger.info(`Review completed. Tokens: ${response.tokensUsed || 0}`);
      return response;
    } catch (error) {
      logger.error('Error in reviewResume:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Modify resume based on review findings
   */
  async modifyResume(request: AIRequest): Promise<AIResponse> {
    logger.debug('Starting resume modification with Gemini via AI SDK...');

    if (!request.reviewResult) {
      throw new InvalidResponseError(
        'Review result is required for modifyResume',
        'gemini'
      );
    }

    try {
      const response = await this.callWithRetry(() => this.generator.modifyResume(request));
      logger.info(`Modification completed. Tokens: ${response.tokensUsed || 0}`);
      return response;
    } catch (error) {
      logger.error('Error in modifyResume:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Enhance resume (orchestrates review + modify)
   */
  async enhanceResume(request: AIRequest): Promise<AIResponse> {
    logger.debug('Starting full resume enhancement (review + modify)...');

    const reviewRequest: ReviewRequest = {
      resume: request.resume,
      jobInfo: request.jobInfo,
      options: request.options,
    };

    const reviewResponse = await this.reviewResume(reviewRequest);

    const modifyResponse = await this.modifyResume({
      ...request,
      reviewResult: reviewResponse.reviewResult,
    });

    return {
      ...modifyResponse,
      tokensUsed: (reviewResponse.tokensUsed || 0) + (modifyResponse.tokensUsed || 0),
      cost: 0,
    };
  }

  /**
   * Get provider information
   */
  getProviderInfo(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-3-flash-preview', 'gemini-2.5-pro'],
      defaultModel: 'gemini-3-flash-preview',
      version: '3.0.0',
    };
  }

  private buildGeneratorConfig(): AISdkResumeGeneratorConfig {
    return {
      model: this.toAISdkModel(this.config.model),
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      maxRetries: 0,
    };
  }

  private toAISdkModel(model: GeminiConfig['model']): LanguageModel {
    if (model === 'gemini-2.5-pro') {
      return 'google/gemini-2.5-pro';
    }

    return 'google/gemini-3-flash';
  }

  private async callWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          this.createTimeoutPromise(),
        ]);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof InvalidResponseError || error instanceof TimeoutError) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = (this.config.retryDelayBase || 1000) * Math.pow(2, attempt);
          logger.warn(`Gemini AI SDK call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw this.handleError(lastError || new Error('Unknown error'));
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('Request timeout', 'gemini', this.config.timeout));
      }, this.config.timeout || 30000);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: unknown): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        return new RateLimitError('Rate limit exceeded', 'gemini');
      }

      if (error.message.toLowerCase().includes('network') || error.message.includes('ECONNREFUSED')) {
        return new NetworkError('Network error', 'gemini', error);
      }

      if (error.message.toLowerCase().includes('timeout')) {
        return new TimeoutError('Request timeout', 'gemini', this.config.timeout);
      }

      return new AIProviderError(error.message, 'gemini');
    }

    return new AIProviderError('Unknown error occurred', 'gemini');
  }
}
