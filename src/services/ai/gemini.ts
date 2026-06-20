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
  ResumeAIClient,
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
import {
  createAISdkResumeClient,
  type AISdkResumeGeneratorConfig,
} from '@services/ai/aiSdkResumeGenerator';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '@utils/logger';

/**
 * Gemini provider configuration
 */
export interface GeminiConfig extends AIProviderConfig {
  /** API key for Google AI */
  apiKey: string;
  /** Model to use - supports latest models from official docs */
  model: 'gemini-3.1-pro' | 'gemini-3.5-flash';
  /** Temperature (0-1) for creativity control */
  temperature?: number;
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
  timeout: 30000,
  maxRetries: 3,
  retryDelayBase: 1000,
};

/**
 * Gemini resume client shape.
 */
export interface GeminiResumeClient extends ResumeAIClient {
  enhanceResume(request: AIRequest): Promise<AIResponse>;
  getProviderInfo(): ProviderInfo;
}

/**
 * Create a Google Gemini resume client.
 */
export function createGeminiResumeClient(config: GeminiConfig): GeminiResumeClient {
  if (!config.apiKey) {
    throw new AIProviderError('API key is required', 'gemini', 'MISSING_API_KEY');
  }

  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  } as GeminiConfig;

  const generator = createAISdkResumeClient(buildGeneratorConfig(finalConfig));

  logger.info(`Initialized Gemini client with model: ${finalConfig.model}`);

  async function reviewResume(request: ReviewRequest): Promise<ReviewResponse> {
    logger.debug('Starting resume review with Gemini via AI SDK...');

    try {
      const response = await callWithRetry(finalConfig, () => generator.reviewResume(request));
      logger.info(`Review completed. Tokens: ${response.tokensUsed || 0}`);
      return response;
    } catch (error) {
      logger.error('Error in reviewResume:', error);
      throw handleError(finalConfig, error);
    }
  }

  async function modifyResume(request: AIRequest): Promise<AIResponse> {
    logger.debug('Starting resume modification with Gemini via AI SDK...');

    if (!request.reviewResult) {
      throw new InvalidResponseError(
        'Review result is required for modifyResume',
        'gemini'
      );
    }

    try {
      const response = await callWithRetry(finalConfig, () => generator.modifyResume(request));
      logger.info(`Modification completed. Tokens: ${response.tokensUsed || 0}`);
      return response;
    } catch (error) {
      logger.error('Error in modifyResume:', error);
      throw handleError(finalConfig, error);
    }
  }

  async function enhanceResume(request: AIRequest): Promise<AIResponse> {
    logger.debug('Starting full resume enhancement (review + modify)...');

    const reviewRequest: ReviewRequest = {
      resume: request.resume,
      jobInfo: request.jobInfo,
      options: request.options,
    };

    const reviewResponse = await reviewResume(reviewRequest);

    const modifyResponse = await modifyResume({
      ...request,
      reviewResult: reviewResponse.reviewResult,
    });

    return {
      ...modifyResponse,
      tokensUsed: (reviewResponse.tokensUsed || 0) + (modifyResponse.tokensUsed || 0),
      cost: 0,
    };
  }

  function getProviderInfo(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-3.1-pro', 'gemini-3.5-flash'],
      defaultModel: 'gemini-3.1-pro',
      version: '3.0.0',
    };
  }

  return {
    reviewResume,
    modifyResume,
    enhanceResume,
    getProviderInfo,
  };
}

function buildGeneratorConfig(config: GeminiConfig): AISdkResumeGeneratorConfig {
  const google = createGoogleGenerativeAI({
    apiKey: config.apiKey,
  });

  return {
    model: google(toGoogleModelId(config.model)),
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    maxRetries: 0,
  };
}

function toGoogleModelId(model: GeminiConfig['model']): Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0] {
  if (model === 'gemini-3.1-pro') {
    return 'gemini-3.1-pro-preview';
  }

  return 'gemini-3.5-flash';
}

async function callWithRetry<T>(
  config: GeminiConfig,
  operation: () => Promise<T>
): Promise<T> {
  const maxRetries = config.maxRetries || 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        createTimeoutPromise(config),
      ]);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof InvalidResponseError || error instanceof TimeoutError) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = (config.retryDelayBase || 1000) * Math.pow(2, attempt);
        logger.warn(`Gemini AI SDK call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw handleError(config, lastError || new Error('Unknown error'));
}

function createTimeoutPromise(config: GeminiConfig): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError('Request timeout', 'gemini', config.timeout));
    }, config.timeout || 30000);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleError(config: GeminiConfig, error: unknown): AIProviderError {
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
      return new TimeoutError('Request timeout', 'gemini', config.timeout);
    }

    return new AIProviderError(error.message, 'gemini');
  }

  return new AIProviderError('Unknown error occurred', 'gemini');
}
