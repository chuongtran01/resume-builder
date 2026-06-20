/**
 * Prompt Template Types
 * 
 * Defines types for structured prompt templates used in AI resume enhancement.
 */

import type { Resume } from '@resume-types/resume.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import type { ReviewResult } from '@services/ai/enhancement.types';

/**
 * Prompt context data
 */
export interface PromptContext {
  /** Resume data */
  resume: Resume;
  /** Job information */
  jobInfo: ParsedJobDescription;
  /** Review findings (for modify prompts) */
  reviewResult?: ReviewResult;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * Review example for few-shot learning
 */
export interface ReviewExample {
  /** Example resume snippet */
  resumeSnippet: string;
  /** Example job requirements */
  jobSnippet: string;
  /** Example review result */
  reviewResult: ReviewResult;
}

/**
 * Enhancement example for few-shot learning
 */
export interface EnhancementExample {
  /** Original content */
  original: string;
  /** Enhanced content */
  enhanced: string;
  /** Explanation of changes */
  explanation: string;
}

/**
 * Prompt builder options
 */
export interface PromptBuilderOptions {
  /** Include few-shot examples */
  includeExamples?: boolean;
  /** Enhancement mode */
  mode?: 'full' | 'bulletPoints' | 'skills' | 'summary';
}
