/**
 * Prompt Template Types
 * 
 * Defines types for structured prompt templates used in AI resume enhancement.
 */

import type { Resume } from '@resume-types/resume.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import type { ReviewResult } from '@services/ai/provider.types';

/**
 * Base prompt structure
 */
export interface BasePrompt {
  /** System message with role and instructions */
  systemMessage: string;
  /** Context section with data */
  context: PromptContext;
  /** Task description */
  taskDescription: string;
  /** Output format specification */
  outputFormat: string;
}

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
 * Review prompt template
 */
export interface ReviewPromptTemplate extends BasePrompt {
  /** Analysis focus areas */
  focusAreas: string[];
  /** Example reviews (few-shot) */
  examples?: ReviewExample[];
}

/**
 * Modify prompt template
 */
export interface ModifyPromptTemplate extends BasePrompt {
  /** Truthfulness requirements */
  truthfulnessRules: string[];
  /** Enhancement focus areas */
  enhancementAreas: string[];
  /** Example enhancements (few-shot) */
  examples?: EnhancementExample[];
  /** Enhancement mode */
  mode?: 'full' | 'bulletPoints' | 'skills' | 'summary';
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
  /** Maximum context length */
  maxContextLength?: number;
  /** Compress prompt */
  compress?: boolean;
  /** Enhancement mode */
  mode?: 'full' | 'bulletPoints' | 'skills' | 'summary';
}
