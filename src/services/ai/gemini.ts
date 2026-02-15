/**
 * Google Gemini AI Provider Implementation
 * 
 * Implements the AIProvider interface for Google Gemini models.
 * Supports sequential review → modify workflow for resume enhancement.
 * 
 * Based on official Gemini API documentation:
 * https://ai.google.dev/gemini-api/docs/text-generation
 * https://ai.google.dev/gemini-api/docs/quickstart
 */

import { GoogleGenAI } from '@google/genai';
import type {
  AIProvider,
  AIProviderConfig,
  AIRequest,
  AIResponse,
  ReviewRequest,
  ReviewResponse,
  ProviderInfo,
} from '@services/ai/provider.types';
import {
  AIProviderError,
  RateLimitError,
  InvalidResponseError,
  NetworkError,
  TimeoutError,
} from '@services/ai/provider.types';
import { buildReviewPrompt, buildModifyPrompt } from '@services/ai/prompts';
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
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayBase: 1000, // 1 second
};

/**
 * Gemini pricing per 1M tokens (as of 2025)
 * Note: Cost calculation removed - will be improved in later phases
 * @deprecated Pricing constants will be reimplemented in later phases
 */
// const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
//   // Removed - will be improved in later phases
// };

/**
 * Google Gemini AI Provider
 * 
 * Uses the official @google/genai SDK following the patterns from:
 * https://ai.google.dev/gemini-api/docs/text-generation
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new AIProviderError('API key is required', 'gemini', 'MISSING_API_KEY');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as GeminiConfig;

    // Initialize Google AI client with API key
    // The new SDK accepts apiKey in constructor options
    this.client = new GoogleGenAI({
      apiKey: this.config.apiKey,
    });

    logger.info(`Initialized Gemini provider with model: ${this.config.model}`);
  }

  /**
   * Review resume against job requirements
   */
  async reviewResume(request: ReviewRequest): Promise<ReviewResponse> {
    logger.debug('Starting resume review with Gemini...');

    try {
      const prompt = this.buildReviewPrompt(request);
      const response = await this.callGeminiWithRetry(prompt);
      const reviewResult = this.parseReviewResponse(response);

      // Estimate tokens (cost calculation removed - will be improved in later phases)
      const tokensUsed = this.estimateTokens(prompt, response);

      logger.info(`Review completed. Tokens: ${tokensUsed.input + tokensUsed.output}`);

      return {
        reviewResult,
        tokensUsed: tokensUsed.input + tokensUsed.output,
        cost: 0, // Cost calculation removed - will be improved in later phases
      };
    } catch (error) {
      logger.error('Error in reviewResume:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Modify resume based on review findings
   */
  async modifyResume(request: AIRequest): Promise<AIResponse> {
    logger.debug('Starting resume modification with Gemini...');

    if (!request.reviewResult) {
      throw new InvalidResponseError(
        'Review result is required for modifyResume',
        'gemini'
      );
    }

    try {
      const prompt = this.buildModifyPrompt(request);
      const response = await this.callGeminiWithRetry(prompt);
      const enhancedResume = this.parseModifyResponse(response);

      // Generate improvements list from changes
      const improvements = this.generateImprovements(request.resume, enhancedResume);

      // Estimate tokens (cost calculation removed - will be improved in later phases)
      const tokensUsed = this.estimateTokens(prompt, response);

      logger.info(`Modification completed. Tokens: ${tokensUsed.input + tokensUsed.output}`);

      return {
        enhancedResume,
        improvements,
        confidence: 0.85, // Default confidence
        tokensUsed: tokensUsed.input + tokensUsed.output,
        cost: 0, // Cost calculation removed - will be improved in later phases
      };
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

    // Step 1: Review
    const reviewRequest: ReviewRequest = {
      resume: request.resume,
      jobInfo: request.jobInfo,
      options: request.options,
    };

    const reviewResponse = await this.reviewResume(reviewRequest);

    // Step 2: Modify based on review
    const modifyRequest: AIRequest = {
      ...request,
      reviewResult: reviewResponse.reviewResult,
    };

    const modifyResponse = await this.modifyResume(modifyRequest);

    // Combine tokens (cost calculation removed - will be improved in later phases)
    const totalTokens = (reviewResponse.tokensUsed || 0) + (modifyResponse.tokensUsed || 0);
    const totalCost = 0; // Cost calculation removed - will be improved in later phases

    return {
      ...modifyResponse,
      tokensUsed: totalTokens,
      cost: totalCost,
    };
  }

  /**
   * Validate AI response structure
   */
  validateResponse(response: AIResponse | ReviewResponse): boolean {
    if ('reviewResult' in response) {
      // ReviewResponse validation
      const review = response.reviewResult;
      return (
        Array.isArray(review.strengths) &&
        Array.isArray(review.weaknesses) &&
        Array.isArray(review.opportunities) &&
        Array.isArray(review.prioritizedActions) &&
        typeof review.confidence === 'number' &&
        review.confidence >= 0 &&
        review.confidence <= 1
      );
    } else {
      // AIResponse validation
      return (
        response.enhancedResume !== undefined &&
        Array.isArray(response.improvements) &&
        (response.confidence === undefined ||
          (typeof response.confidence === 'number' &&
            response.confidence >= 0 &&
            response.confidence <= 1))
      );
    }
  }

  /**
   * Estimate cost for a request
   * Note: Cost calculation removed - will be improved in later phases
   */
  estimateCost(_request: AIRequest | ReviewRequest): number {
    // Cost calculation removed - will be improved in later phases
    return 0;
  }

  /**
   * Get provider information
   */
  getProviderInfo(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-2.5-pro', 'gemini-3-flash-preview'],
      defaultModel: 'gemini-2.5-pro',
      version: '2.0.0', // Updated for new SDK
    };
  }

  /**
   * Build review prompt using template
   */
  private buildReviewPrompt(request: ReviewRequest): string {
    return buildReviewPrompt(
      {
        resume: request.resume,
        jobInfo: request.jobInfo,
        options: request.options as Record<string, unknown> | undefined,
      },
      {
        includeExamples: true,
        maxContextLength: this.config.maxTokens ? this.config.maxTokens * 4 : undefined,
        compress: false,
      }
    );
  }

  /**
   * Build modify prompt using template
   */
  private buildModifyPrompt(request: AIRequest): string {
    if (!request.reviewResult) {
      throw new InvalidResponseError(
        'Review result is required for modifyResume',
        'gemini'
      );
    }

    // Determine enhancement mode from options if available
    const options = request.options as Record<string, unknown> | undefined;
    const mode = (options?.enhancementMode as 'full' | 'bulletPoints' | 'skills' | 'summary') || 'full';

    return buildModifyPrompt(
      {
        resume: request.resume,
        jobInfo: request.jobInfo,
        reviewResult: request.reviewResult,
        options: options,
      },
      {
        includeExamples: true,
        maxContextLength: this.config.maxTokens ? this.config.maxTokens * 4 : undefined,
        compress: false,
        mode,
      }
    );
  }

  /**
   * Call Gemini API with retry logic
   * 
   * Uses the new SDK pattern: client.models.generateContent()
   * Based on: https://ai.google.dev/gemini-api/docs/text-generation
   */
  private async callGeminiWithRetry(prompt: string): Promise<string> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use the new SDK pattern: client.models.generateContent()
        const generatePromise = this.client.models.generateContent({
          model: this.config.model,
          contents: prompt,
          config: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          },
        });
        const timeoutPromise = this.createTimeoutPromise();

        const response = await Promise.race([generatePromise, timeoutPromise]);

        // Extract text from response
        // The new SDK returns response.text directly
        const text = response.text;

        if (!text) {
          throw new InvalidResponseError('Empty response from Gemini', 'gemini');
        }

        return text;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof InvalidResponseError || error instanceof TimeoutError) {
          throw error;
        }

        // Retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = (this.config.retryDelayBase || 1000) * Math.pow(2, attempt);
          logger.warn(`Gemini API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw this.handleError(lastError || new Error('Unknown error'));
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('Request timeout', 'gemini', this.config.timeout));
      }, this.config.timeout || 30000);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse review response from Gemini
   */
  private parseReviewResponse(response: string): ReviewResponse['reviewResult'] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new InvalidResponseError('No JSON found in response', 'gemini', response);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.weaknesses) ||
        !Array.isArray(parsed.opportunities) ||
        !Array.isArray(parsed.prioritizedActions) ||
        typeof parsed.confidence !== 'number'
      ) {
        throw new InvalidResponseError('Invalid review response structure', 'gemini', parsed);
      }

      return {
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        opportunities: parsed.opportunities || [],
        prioritizedActions: parsed.prioritizedActions || [],
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      if (error instanceof InvalidResponseError) {
        throw error;
      }
      throw new InvalidResponseError(
        `Failed to parse review response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'gemini',
        response
      );
    }
  }

  /**
   * Parse modify response from Gemini
   */
  private parseModifyResponse(response: string): AIResponse['enhancedResume'] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new InvalidResponseError('No JSON found in response', 'gemini', response);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Basic validation
      if (!parsed.personalInfo || !parsed.experience) {
        throw new InvalidResponseError('Invalid resume structure in response', 'gemini', parsed);
      }

      return parsed;
    } catch (error) {
      if (error instanceof InvalidResponseError) {
        throw error;
      }
      throw new InvalidResponseError(
        `Failed to parse modify response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'gemini',
        response
      );
    }
  }

  /**
   * Generate improvements list from changes
   */
  private generateImprovements(
    original: AIRequest['resume'],
    enhanced: AIResponse['enhancedResume']
  ): AIResponse['improvements'] {
    const improvements: AIResponse['improvements'] = [];

    // Compare experience bullet points
    if (original.experience && enhanced.experience) {
      for (let i = 0; i < Math.min(original.experience.length, enhanced.experience.length); i++) {
        const origExp = original.experience[i];
        const enhExp = enhanced.experience[i];

        if (origExp && enhExp && origExp.bulletPoints && enhExp.bulletPoints) {
          for (let j = 0; j < Math.min(origExp.bulletPoints.length, enhExp.bulletPoints.length); j++) {
            const orig = origExp.bulletPoints[j];
            const enh = enhExp.bulletPoints[j];

            if (orig && enh && orig !== enh) {
              improvements.push({
                type: 'bulletPoint',
                section: `experience[${i}]`,
                original: orig,
                suggested: enh,
                reason: 'Enhanced to better match job requirements',
                confidence: 0.85,
              });
            }
          }
        }
      }
    }

    // Compare summary
    if (original.summary && enhanced.summary && original.summary !== enhanced.summary) {
      improvements.push({
        type: 'summary',
        section: 'summary',
        original: original.summary,
        suggested: enhanced.summary,
        reason: 'Enhanced to align with job requirements',
        confidence: 0.85,
      });
    }

    return improvements;
  }

  /**
   * Estimate tokens used
   */
  private estimateTokens(prompt: string, response: string): { input: number; output: number } {
    // Rough estimation: 1 token ≈ 4 characters
    return {
      input: Math.ceil(prompt.length / 4),
      output: Math.ceil(response.length / 4),
    };
  }

  /**
   * Calculate cost based on tokens
   * Note: Cost calculation removed - will be improved in later phases
   * @deprecated Cost calculation will be reimplemented in later phases
   */
  // Removed - will be improved in later phases

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for rate limit errors
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return new RateLimitError('Rate limit exceeded', 'gemini');
      }

      // Check for network errors
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        return new NetworkError('Network error', 'gemini', error);
      }

      // Check for timeout
      if (error.message.includes('timeout')) {
        return new TimeoutError('Request timeout', 'gemini', this.config.timeout);
      }

      // Generic error
      return new AIProviderError(error.message, 'gemini');
    }

    return new AIProviderError('Unknown error occurred', 'gemini');
  }
}
