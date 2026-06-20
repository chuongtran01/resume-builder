/**
 * Pure builders for AI enhancement workflow requests.
 */

import type { EnhancementOptions } from '@resume-types/enhancement.types';
import type { Resume } from '@resume-types/resume.types';
import type {
  AIRequest,
  ReviewRequest,
  ReviewResult,
} from '@services/ai/enhancement.types';
import type { ParsedJobDescription } from '@utils/jobParser';

export interface BuildReviewRequestInput {
  resume: Resume;
  jobInfo: ParsedJobDescription;
  options?: EnhancementOptions;
}

export interface BuildModifyRequestInput {
  resume: Resume;
  jobInfo: ParsedJobDescription;
  reviewResult: ReviewResult;
  options?: EnhancementOptions;
}

export function buildReviewRequest(input: BuildReviewRequestInput): ReviewRequest {
  const { resume, jobInfo, options } = input;

  return {
    resume,
    jobInfo,
    options: options as Record<string, unknown> | undefined,
  };
}

export function buildModifyRequest(input: BuildModifyRequestInput): AIRequest {
  const { resume, jobInfo, reviewResult, options } = input;

  return {
    resume,
    jobInfo,
    reviewResult,
    options: options as Record<string, unknown> | undefined,
  };
}
