/**
 * AI SDK-backed resume review and modification adapter.
 */

import { generateText as aiGenerateText, Output } from 'ai';
import type { LanguageModel, LanguageModelUsage } from 'ai';
import { z } from 'zod';
import type {
  AIRequest,
  AIResponse,
  ResumeAIClient,
  ReviewRequest,
  ReviewResponse,
} from './enhancement.types';
import { buildReviewPrompt, buildModifyPrompt } from '@services/ai/prompts';
import { InvalidResponseError } from './provider.types';
import { validateResume } from '@utils/resumeParser';

type GenerateText = typeof aiGenerateText;

export interface AISdkResumeGeneratorConfig {
  model: LanguageModel;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  generateText?: GenerateText;
}

export type AISdkResumeClient = ResumeAIClient;

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

const personalInfoSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
}).passthrough();

const experienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string(),
  bulletPoints: z.array(z.string()),
}).passthrough();

const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceSchema).min(1),
}).passthrough();

const modifyResponseSchema = z.object({
  enhancedResume: resumeSchema,
  improvements: z.array(improvementSchema).default([]),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export function createAISdkResumeClient(config: AISdkResumeGeneratorConfig): AISdkResumeClient {
  const generateText = config.generateText || aiGenerateText;

  async function reviewResume(request: ReviewRequest): Promise<ReviewResponse> {
    const prompt = buildReviewPrompt(
      {
        resume: request.resume,
        jobInfo: request.jobInfo,
        options: request.options as Record<string, unknown> | undefined,
      },
      {
        includeExamples: true,
        maxContextLength: config.maxTokens ? config.maxTokens * 4 : undefined,
        compress: false,
      }
    );

    const result = await generateText({
      model: config.model,
      output: Output.object({
        schema: reviewResponseSchema,
        name: 'ResumeReviewResponse',
        description: 'Structured resume review response',
      }),
      prompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      maxRetries: config.maxRetries,
    });

    return {
      reviewResult: result.output.reviewResult,
      tokensUsed: getTotalTokens(result.totalUsage),
      cost: 0,
    };
  }

  async function modifyResume(request: AIRequest): Promise<AIResponse> {
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
        maxContextLength: config.maxTokens ? config.maxTokens * 4 : undefined,
        compress: false,
        mode,
      }
    );

    const result = await generateText({
      model: config.model,
      output: Output.object({
        schema: modifyResponseSchema,
        name: 'ResumeModifyResponse',
        description: 'Structured resume modification response',
      }),
      prompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      maxRetries: config.maxRetries,
    });

    const object = result.output;

    const validationErrors = validateResume(object.enhancedResume);
    if (validationErrors.length > 0) {
      throw new InvalidResponseError(
        'AI SDK modify response did not include a complete enhanced resume',
        'ai-sdk',
        { errors: validationErrors, response: object }
      );
    }

    return {
      enhancedResume: object.enhancedResume as AIResponse['enhancedResume'],
      improvements: object.improvements,
      reasoning: object.reasoning,
      confidence: object.confidence,
      tokensUsed: getTotalTokens(result.totalUsage),
      cost: 0,
    };
  }

  return {
    reviewResume,
    modifyResume,
  };
}

function getTotalTokens(usage?: LanguageModelUsage): number | undefined {
  if (!usage) {
    return undefined;
  }

  return usage.totalTokens ?? sumTokens(usage.inputTokens, usage.outputTokens);
}

function sumTokens(input?: number, output?: number): number | undefined {
  if (input === undefined && output === undefined) {
    return undefined;
  }

  return (input || 0) + (output || 0);
}
