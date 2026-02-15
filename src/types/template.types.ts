/**
 * Type definitions for the template system
 */

import type { Resume } from './resume.types';

/**
 * Validation result from template validation
 */
export interface ValidationResult {
  /** Whether the resume is valid for this template */
  isValid: boolean;
  /** Array of validation errors (if any) */
  errors: string[];
  /** Array of validation warnings (if any) */
  warnings: string[];
}

/**
 * Spacing mode for templates
 */
export type SpacingMode = 'compact' | 'normal' | 'spacious' | 'auto';

/**
 * Template rendering options
 */
export interface TemplateOptions {
  /** Whether to include page breaks */
  pageBreaks?: boolean;
  /** Custom CSS to inject */
  customCss?: string;
  /** Whether to include print styles */
  printStyles?: boolean;
  /** Spacing mode: 'compact' for tight spacing, 'normal' for standard, 'spacious' for loose, 'auto' to auto-detect */
  spacing?: SpacingMode;
}

/**
 * Resume template interface
 * All templates must implement this interface
 */
export interface ResumeTemplate {
  /** Template name (e.g., "modern", "classic", "minimal") */
  name: string;
  /** Template description */
  description: string;
  /**
   * Render resume to HTML string
   * @param resume - The resume data to render
   * @param options - Optional template rendering options
   * @returns HTML string representation of the resume
   */
  render(resume: Resume, options?: TemplateOptions): string;
  /**
   * Validate resume data for this template
   * @param resume - The resume data to validate
   * @returns Validation result with errors and warnings
   */
  validate(resume: Resume): ValidationResult;
}

/**
 * Template registry type
 * Maps template names to template instances
 */
export type TemplateRegistry = Record<string, ResumeTemplate>;

/**
 * Template factory function type
 * Creates a new template instance
 */
export type TemplateFactory = () => ResumeTemplate;
