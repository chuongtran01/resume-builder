/**
 * Helper functions for template validation and common operations
 */

import type { ValidationResult } from '../types/template.types';
import type { Resume } from '../types/resume.types';

/**
 * Create a validation result
 */
export function createValidationResult(
  isValid: boolean,
  errors: string[] = [],
  warnings: string[] = []
): ValidationResult {
  return {
    isValid,
    errors,
    warnings,
  };
}

/**
 * Validate that required sections are present
 */
export function validateRequiredSections(resume: Resume): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required sections
  if (!resume.personalInfo) {
    errors.push('personalInfo section is required');
  }

  if (!resume.experience || resume.experience.length === 0) {
    errors.push('experience section is required and must contain at least one entry');
  }

  // Check optional but recommended sections
  if (!resume.summary) {
    warnings.push('summary section is recommended for better ATS compatibility');
  }

  if (!resume.education) {
    warnings.push('education section is recommended');
  }

  if (!resume.skills) {
    warnings.push('skills section is recommended');
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Validate date formats (YYYY-MM or YYYY-MM-DD)
 */
export function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
  return dateRegex.test(date) || date === 'Present';
}

/**
 * Validate that bullet points are not too long
 */
export function validateBulletPoints(
  bulletPoints: string[],
  maxLength = 150
): string[] {
  const warnings: string[] = [];
  bulletPoints.forEach((bullet, index) => {
    if (bullet.length > maxLength) {
      warnings.push(
        `Bullet point ${index + 1} exceeds recommended length of ${maxLength} characters`
      );
    }
  });
  return warnings;
}

/**
 * Base template validation that all templates can use
 */
export function baseTemplateValidation(resume: Resume): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required sections
  const sectionValidation = validateRequiredSections(resume);
  errors.push(...sectionValidation.errors);
  warnings.push(...sectionValidation.warnings);

  // Validate experience dates
  if (resume.experience) {
    resume.experience.forEach((exp, index) => {
      if (!validateDateFormat(exp.startDate)) {
        errors.push(
          `experience[${index}].startDate has invalid format (expected YYYY-MM)`
        );
      }
      if (!validateDateFormat(exp.endDate)) {
        errors.push(
          `experience[${index}].endDate has invalid format (expected YYYY-MM or "Present")`
        );
      }

      // Validate bullet points
      if (exp.bulletPoints) {
        const bulletWarnings = validateBulletPoints(exp.bulletPoints);
        warnings.push(...bulletWarnings);
      }
    });
  }

  // Validate education dates
  if (resume.education) {
    const educationArray = Array.isArray(resume.education)
      ? resume.education
      : [resume.education];

    educationArray.forEach((edu, index) => {
      if (typeof edu === 'object' && edu !== null && 'graduationDate' in edu) {
        const graduationDate = edu.graduationDate;
        if (typeof graduationDate === 'string' && !validateDateFormat(graduationDate)) {
          errors.push(
            `education[${index}].graduationDate has invalid format (expected YYYY-MM)`
          );
        }
      }
    });
  }

  return createValidationResult(errors.length === 0, errors, warnings);
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Format date for display (YYYY-MM -> Month YYYY)
 */
export function formatDate(date: string): string {
  if (date === 'Present') {
    return 'Present';
  }

  const parts = date.split('-');
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return date;
  }

  const year = parts[0];
  const month = parts[1];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthNames[monthIndex]} ${year}`;
  }

  return date;
}

/**
 * Estimate if resume content is dense and needs compact spacing
 * Returns 'compact' if content is dense, 'normal' otherwise
 */
export function estimateContentDensity(resume: Resume): 'compact' | 'normal' {
  let itemCount = 0;
  let totalBulletPoints = 0;
  let totalTextLength = 0;

  // Count experience items and bullet points
  itemCount += resume.experience.length;
  resume.experience.forEach((exp) => {
    if (exp.bulletPoints) {
      totalBulletPoints += exp.bulletPoints.length;
      exp.bulletPoints.forEach((bullet) => {
        totalTextLength += bullet.length;
      });
    }
  });

  // Count education items
  if (resume.education) {
    const edu = Array.isArray(resume.education) ? resume.education : [resume.education];
    itemCount += edu.length;
  }

  // Count projects
  if (resume.projects) {
    const proj = Array.isArray(resume.projects) ? resume.projects : [resume.projects];
    itemCount += proj.length;
    proj.forEach((project) => {
      if (typeof project === 'object' && project !== null && 'description' in project) {
        const desc = project.description;
        if (typeof desc === 'string') {
          totalTextLength += desc.length;
        }
      }
    });
  }

  // Count certifications
  if (resume.certifications) {
    const cert = Array.isArray(resume.certifications)
      ? resume.certifications
      : [resume.certifications];
    itemCount += cert.length;
  }

  // Count languages
  if (resume.languages) {
    const lang = Array.isArray(resume.languages) ? resume.languages : [resume.languages];
    itemCount += lang.length;
  }

  // Count awards
  if (resume.awards) {
    const award = Array.isArray(resume.awards) ? resume.awards : [resume.awards];
    itemCount += award.length;
  }

  // Count skills categories
  if (resume.skills && typeof resume.skills === 'object' && 'categories' in resume.skills) {
    itemCount += resume.skills.categories?.length || 0;
  }

  // Add summary length
  if (resume.summary) {
    totalTextLength += resume.summary.length;
  }

  // Heuristic: Use compact if:
  // - More than 20 total items, OR
  // - More than 15 bullet points, OR
  // - More than 2000 characters of text
  if (itemCount > 20 || totalBulletPoints > 15 || totalTextLength > 2000) {
    return 'compact';
  }

  return 'normal';
}
