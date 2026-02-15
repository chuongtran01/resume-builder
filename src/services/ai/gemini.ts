/**
 * Google Gemini AI Provider Implementation
 * 
 * Implements the AIProvider interface for Google Gemini models.
 * Supports sequential review → modify workflow for resume enhancement.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
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
import { logger } from '@utils/logger';

/**
 * Gemini provider configuration
 */
export interface GeminiConfig extends AIProviderConfig {
  /** API key for Google AI */
  apiKey: string;
  /** Model to use */
  model: 'gemini-pro' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
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
 * Gemini pricing per 1M tokens (as of 2024)
 * Note: These are approximate and should be updated based on actual pricing
 */
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-pro': {
    input: 0.50, // $0.50 per 1M input tokens
    output: 1.50, // $1.50 per 1M output tokens
  },
  'gemini-1.5-pro': {
    input: 1.25, // $1.25 per 1M input tokens
    output: 5.00, // $5.00 per 1M output tokens
  },
  'gemini-1.5-flash': {
    input: 0.075, // $0.075 per 1M input tokens
    output: 0.30, // $0.30 per 1M output tokens
  },
};

/**
 * Google Gemini AI Provider
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new AIProviderError('API key is required', 'gemini', 'MISSING_API_KEY');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as GeminiConfig;

    // Initialize Google AI client
    this.client = new GoogleGenerativeAI(this.config.apiKey);

    // Get the model
    this.model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
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

      // Estimate tokens and cost
      const tokensUsed = this.estimateTokens(prompt, response);
      const cost = this.calculateCost(tokensUsed.input, tokensUsed.output);

      logger.info(`Review completed. Tokens: ${tokensUsed.input + tokensUsed.output}, Cost: $${cost.toFixed(4)}`);

      return {
        reviewResult,
        tokensUsed: tokensUsed.input + tokensUsed.output,
        cost,
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

      // Estimate tokens and cost
      const tokensUsed = this.estimateTokens(prompt, response);
      const cost = this.calculateCost(tokensUsed.input, tokensUsed.output);

      logger.info(`Modification completed. Tokens: ${tokensUsed.input + tokensUsed.output}, Cost: $${cost.toFixed(4)}`);

      return {
        enhancedResume,
        improvements,
        confidence: 0.85, // Default confidence
        tokensUsed: tokensUsed.input + tokensUsed.output,
        cost,
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

    // Combine costs
    const totalTokens = (reviewResponse.tokensUsed || 0) + (modifyResponse.tokensUsed || 0);
    const totalCost = (reviewResponse.cost || 0) + (modifyResponse.cost || 0);

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
   */
  estimateCost(request: AIRequest | ReviewRequest): number {
    // Rough estimation based on prompt size
    const prompt = 'reviewResult' in request
      ? this.buildReviewPrompt(request)
      : this.buildModifyPrompt(request as AIRequest);

    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = this.config.maxTokens || 2000;

    return this.calculateCost(estimatedInputTokens, estimatedOutputTokens);
  }

  /**
   * Get provider information
   */
  getProviderInfo(): ProviderInfo {
    return {
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultModel: 'gemini-pro',
      version: '1.0.0',
    };
  }

  /**
   * Build review prompt
   */
  private buildReviewPrompt(request: ReviewRequest): string {
    const resumeJson = JSON.stringify(request.resume, null, 2);
    const jobInfoJson = JSON.stringify(request.jobInfo, null, 2);

    return `You are an expert resume reviewer. Analyze the following resume against the job requirements and provide a structured review.

RESUME:
${resumeJson}

JOB REQUIREMENTS:
${jobInfoJson}

Please provide a JSON response with the following structure:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "opportunities": ["opportunity1", "opportunity2", ...],
  "prioritizedActions": [
    {
      "type": "enhance" | "reorder" | "add" | "remove" | "rewrite",
      "section": "section name",
      "priority": "high" | "medium" | "low",
      "reason": "explanation",
      "suggestedChange": "optional suggestion"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "overall analysis"
}

Focus on:
- How well the resume matches the job requirements
- Missing keywords or skills
- Areas for improvement
- Prioritized actions to enhance the resume`;
  }

  /**
   * Build modify prompt
   */
  private buildModifyPrompt(request: AIRequest): string {
    const resumeJson = JSON.stringify(request.resume, null, 2);
    const jobInfoJson = JSON.stringify(request.jobInfo, null, 2);
    const reviewJson = JSON.stringify(request.reviewResult, null, 2);

    return `You are an expert resume writer. Enhance the following resume based on the review findings and job requirements.

ORIGINAL RESUME:
${resumeJson}

JOB REQUIREMENTS:
${jobInfoJson}

REVIEW FINDINGS:
${reviewJson}

CRITICAL RULES:
1. NEVER add experiences, skills, or achievements not present in the original resume
2. Only enhance and reword existing content
3. Maintain truthfulness - all claims must be supported by original resume
4. Use natural language - avoid mechanical keyword stuffing
5. Preserve the original meaning and context

Please provide a JSON response with the enhanced resume in the same structure as the original:
{
  "personalInfo": { ... },
  "summary": "enhanced summary",
  "experience": [ ... ],
  "education": { ... },
  "skills": { ... },
  ...
}

Focus on:
- Rewriting bullet points to naturally incorporate job-relevant keywords
- Reordering skills to prioritize job-relevant ones
- Enhancing summary to align with job requirements
- Maintaining professional tone and authenticity`;
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiWithRetry(prompt: string): Promise<string> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const generatePromise = this.model.generateContent(prompt);
        const timeoutPromise = this.createTimeoutPromise();

        const result = await Promise.race([generatePromise, timeoutPromise]);

        // If we get here, generatePromise resolved (timeout would have rejected)
        const response = result.response;
        const text = response.text();

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
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const pricing = GEMINI_PRICING[this.config.model];
    if (!pricing) {
      logger.warn(`Unknown pricing for model ${this.config.model}, using gemini-pro pricing`);
      const defaultPricing = GEMINI_PRICING['gemini-pro'];
      if (!defaultPricing) {
        throw new Error('Default pricing not found');
      }
      return this.calculateCostWithPricing(inputTokens, outputTokens, defaultPricing);
    }

    return this.calculateCostWithPricing(inputTokens, outputTokens, pricing);
  }

  /**
   * Calculate cost with specific pricing
   */
  private calculateCostWithPricing(
    inputTokens: number,
    outputTokens: number,
    pricing: { input: number; output: number }
  ): number {
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }

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
