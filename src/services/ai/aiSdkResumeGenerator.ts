/**
 * AI SDK-backed resume review and modification adapter.
 */

import { generateObject as aiGenerateObject } from 'ai';
import type { LanguageModel, LanguageModelUsage } from 'ai';
import { z } from 'zod';
import type {
  AIRequest,
  AIResponse,
  ReviewRequest,
  ReviewResponse,
} from './enhancement.types';
import { buildReviewPrompt, buildModifyPrompt } from '@services/ai/prompts';
import { InvalidResponseError } from './provider.types';

type GenerateObject = typeof aiGenerateObject;

export interface AISdkResumeGeneratorConfig {
  model: LanguageModel;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  generateObject?: GenerateObject;
}

const prioritizedActionSchema = z.object({
  type: z.enum(['enhance', 'reorder', 'add', 'remove', 'rewrite']),
  section: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  reason: z.string(),
  suggestedChange: z.string().optional(),
});

const reviewResultSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  prioritizedActions: z.array(prioritizedActionSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  reasoning: z.string().optional(),
});

const reviewResponseSchema = z.object({
  reviewResult: reviewResultSchema,
});

const improvementSchema = z.object({
  type: z.enum(['bulletPoint', 'summary', 'skill', 'keyword']),
  section: z.string(),
  original: z.string(),
  suggested: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

const modifyResponseSchema = z.object({
  enhancedResume: z.unknown(),
  improvements: z.array(improvementSchema).default([]),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export class AISdkResumeGenerator {
  private readonly generateObject: GenerateObject;

  constructor(private readonly config: AISdkResumeGeneratorConfig) {
    this.generateObject = config.generateObject || aiGenerateObject;
  }

  async reviewResume(request: ReviewRequest): Promise<ReviewResponse> {
    const prompt = buildReviewPrompt(
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

    const result = await this.generateObject({
      model: this.config.model,
      schema: reviewResponseSchema,
      schemaName: 'ResumeReviewResponse',
      schemaDescription: 'Structured resume review response',
      prompt,
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxTokens,
      maxRetries: this.config.maxRetries,
    });

    return {
      reviewResult: result.object.reviewResult,
      tokensUsed: this.getTotalTokens(result.usage),
      cost: 0,
    };
  }

  async modifyResume(request: AIRequest): Promise<AIResponse> {
    if (!request.reviewResult) {
      throw new InvalidResponseError(
        'Review result is required for modifyResume',
        'ai-sdk'
      );
    }

    const options = request.options as Record<string, unknown> | undefined;
    const mode = (options?.enhancementMode as 'full' | 'bulletPoints' | 'skills' | 'summary') || 'full';
    const prompt = buildModifyPrompt(
      {
        resume: request.resume,
        jobInfo: request.jobInfo,
        reviewResult: request.reviewResult,
        options,
      },
      {
        includeExamples: true,
        maxContextLength: this.config.maxTokens ? this.config.maxTokens * 4 : undefined,
        compress: false,
        mode,
      }
    );

    const result = await this.generateObject({
      model: this.config.model,
      schema: modifyResponseSchema,
      schemaName: 'ResumeModifyResponse',
      schemaDescription: 'Structured resume modification response',
      prompt,
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxTokens,
      maxRetries: this.config.maxRetries,
    });

    const object = result.object;

    if (!object.enhancedResume || typeof object.enhancedResume !== 'object') {
      throw new InvalidResponseError(
        'AI SDK modify response did not include an enhanced resume object',
        'ai-sdk',
        object
      );
    }

    return {
      enhancedResume: object.enhancedResume as AIResponse['enhancedResume'],
      improvements: object.improvements,
      reasoning: object.reasoning,
      confidence: object.confidence,
      tokensUsed: this.getTotalTokens(result.usage),
      cost: 0,
    };
  }

  private getTotalTokens(usage?: LanguageModelUsage): number | undefined {
    if (!usage) {
      return undefined;
    }

    return usage.totalTokens ?? this.sumTokens(usage.inputTokens, usage.outputTokens);
  }

  private sumTokens(input?: number, output?: number): number | undefined {
    if (input === undefined && output === undefined) {
      return undefined;
    }

    return (input || 0) + (output || 0);
  }

}
