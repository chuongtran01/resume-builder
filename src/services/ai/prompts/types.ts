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
 * Prompt builder options
 */
export interface PromptBuilderOptions {}
