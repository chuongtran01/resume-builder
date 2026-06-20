/**
 * AI resume enhancement workflow types.
 *
 * These types describe the review -> modify flow independently from any
 * provider implementation.
 */

import type { Resume } from '@resume-types/resume.types';
import type {
  EnhancementOptions,
  Improvement,
} from '@resume-types/enhancement.types';
import type { ParsedJobDescription } from '@utils/jobParser';

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
 * Review response from AI client
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
 * Minimal client interface used by resume enhancement orchestration.
 */
export interface ResumeAIClient {
  reviewResume(request: ReviewRequest): Promise<ReviewResponse>;
  modifyResume(request: AIRequest): Promise<AIResponse>;
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
