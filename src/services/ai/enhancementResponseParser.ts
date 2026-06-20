/**
 * Pure parsers for AI enhancement workflow responses.
 */

import type { EnhancementResult } from '@resume-types/enhancement.types';
import type { Resume } from '@resume-types/resume.types';
import type {
  AIResponse,
  ReviewResponse,
  ReviewResult,
} from '@services/ai/enhancement.types';
import { buildEnhancementResult } from '@services/ai/enhancementResultBuilder';
import type { ParsedJobDescription } from '@utils/jobParser';

export function parseReviewResponse(response: ReviewResponse): ReviewResult {
  if (!response || !response.reviewResult) {
    throw new Error('Invalid review response structure');
  }

  const reviewResult = response.reviewResult;

  if (!reviewResult || !Array.isArray(reviewResult.strengths) || !Array.isArray(reviewResult.weaknesses)) {
    throw new Error('Invalid review result structure');
  }

  return {
    strengths: reviewResult.strengths || [],
    weaknesses: reviewResult.weaknesses || [],
    opportunities: reviewResult.opportunities || [],
    prioritizedActions: reviewResult.prioritizedActions || [],
    confidence: reviewResult.confidence ?? 0.5,
    reasoning: reviewResult.reasoning,
  };
}

export function parseModifyResponse(
  originalResume: Resume,
  response: AIResponse,
  parsedJob: ParsedJobDescription
): EnhancementResult {
  if (!response || !Array.isArray(response.improvements)) {
    throw new Error('Invalid modification response structure');
  }

  const enhancedResume = response.enhancedResume;

  if (!enhancedResume || !enhancedResume.personalInfo || !enhancedResume.experience) {
    throw new Error('Invalid enhanced resume structure');
  }

  return buildEnhancementResult(originalResume, response, parsedJob);
}
