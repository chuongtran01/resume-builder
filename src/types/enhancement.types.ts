/**
 * Type definitions for AI enhancement service (Phase 2)
 */

import type { Resume } from '@resume-types/resume.types';

/**
 * Enhancement focus areas
 */
export type EnhancementFocusArea =
  | 'keywords'
  | 'bulletPoints'
  | 'skills'
  | 'summary';

/**
 * Enhancement tone options
 */
export type EnhancementTone = 'professional' | 'technical' | 'leadership';

/**
 * Enhancement options for AI service
 */
export interface EnhancementOptions {
  /** Focus areas for enhancement */
  focusAreas?: EnhancementFocusArea[];
  /** Desired tone for enhancements */
  tone?: EnhancementTone;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

/**
 * Improvement suggestion
 */
export interface Improvement {
  /** Type of improvement */
  type: 'bulletPoint' | 'summary' | 'skill' | 'keyword';
  /** Section where improvement applies */
  section: string;
  /** Original text/content */
  original: string;
  /** Suggested replacement */
  suggested: string;
  /** Reason for the suggestion */
  reason: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Keyword suggestion
 */
export interface KeywordSuggestion {
  /** Suggested keyword */
  keyword: string;
  /** Category of the keyword */
  category: string;
  /** Suggested placement locations in resume */
  suggestedPlacement: string[];
  /** Importance level */
  importance: 'high' | 'medium' | 'low';
}

/**
 * ATS score information
 */
export interface AtsScore {
  /** Score before enhancement (0-100) */
  before: number;
  /** Score after enhancement (0-100) */
  after: number;
  /** Improvement amount */
  improvement: number;
}

/**
 * Enhancement result from AI service
 */
export interface EnhancementResult {
  /** Original resume data */
  originalResume: Resume;
  /** Enhanced resume data */
  enhancedResume: Resume;
  /** List of improvement suggestions */
  improvements: Improvement[];
  /** Keyword suggestions */
  keywordSuggestions: KeywordSuggestion[];
  /** Missing skills detected */
  missingSkills: string[];
  /** ATS score comparison */
  atsScore: AtsScore;
  /** General recommendations */
  recommendations: string[];
}

/**
 * Change detail tracking for resume enhancements
 * Tracks individual changes made during enhancement process
 */
export interface ChangeDetail {
  /** Original text/content before enhancement */
  old: string;
  /** Enhanced/replaced text/content after enhancement */
  new: string;
  /** Section where change occurred (e.g., "experience", "skills") */
  section?: string;
  /** Type of change made */
  type?: 'bulletPoint' | 'skill' | 'summary' | 'keyword';
}

/**
 * Enhanced resume output structure
 * Contains the enhanced resume along with change tracking metadata
 */
export interface EnhancedResumeOutput {
  /** The enhanced resume object */
  updatedResume: Resume;
  /** List of general suggestions for improvement */
  suggestions: string[];
  /** Skills highlighted as important for the job */
  highlightedSkills: string[];
  /** Human-readable summary of all changes made */
  changesSummary: string;
  /** Detailed list of all changes (old → new) */
  changesDetail: ChangeDetail[];
  /** Path to generated PDF file */
  pdfPath: string;
  /** Path to generated Markdown report */
  mdPath: string;
}

/**
 * AI enhancement service interface
 */
export interface ResumeEnhancementService {
  /**
   * Enhance resume based on job description
   * @param resume - Original resume data
   * @param jobDescription - Job description to match against
   * @param options - Enhancement options
   * @returns Promise resolving to enhancement result
   */
  enhanceResume(
    resume: Resume,
    jobDescription: string,
    options?: EnhancementOptions
  ): Promise<EnhancementResult>;
}
