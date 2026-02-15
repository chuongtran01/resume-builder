/**
 * ATS (Applicant Tracking System) compliance validator
 * Checks resume for ATS compatibility and provides suggestions
 */

import type { Resume } from '@resume-types/resume.types';
import { logger } from '@utils/logger';

/**
 * ATS validation result
 */
export interface AtsValidationResult {
  /** Overall ATS score (0-100) */
  score: number;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
  /** Array of suggestions for improvement */
  suggestions: string[];
  /** Whether the resume is ATS-compliant */
  isCompliant: boolean;
}

/**
 * Options for ATS validation
 */
export interface AtsValidationOptions {
  /** Whether to check for missing sections */
  checkMissingSections?: boolean;
  /** Whether to check heading structure */
  checkHeadings?: boolean;
  /** Whether to check bullet point length */
  checkBulletLength?: boolean;
  /** Whether to check date formats */
  checkDateFormats?: boolean;
  /** Maximum recommended bullet point length */
  maxBulletLength?: number;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<AtsValidationOptions> = {
  checkMissingSections: true,
  checkHeadings: true,
  checkBulletLength: true,
  checkDateFormats: true,
  maxBulletLength: 150,
};

/**
 * Standard ATS-friendly section headings
 */
const STANDARD_HEADINGS = [
  'experience',
  'professional experience',
  'work experience',
  'employment',
  'education',
  'skills',
  'technical skills',
  'certifications',
  'certificates',
  'projects',
  'languages',
  'awards',
  'honors',
  'summary',
  'professional summary',
  'objective',
];

/**
 * Validates date format (YYYY-MM or YYYY-MM-DD)
 */
function isValidDateFormat(date: string): boolean {
  if (date === 'Present') {
    return true;
  }
  const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
  return dateRegex.test(date);
}

/**
 * Validates ATS compliance of a resume
 * @param resume - Resume to validate
 * @param options - Validation options
 * @returns ATS validation result
 */
export function validateAtsCompliance(
  resume: Resume,
  options: AtsValidationOptions = {}
): AtsValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  logger.debug('Starting ATS compliance validation');

  // Check required sections
  if (opts.checkMissingSections) {
    if (!resume.personalInfo) {
      errors.push('Missing required section: personalInfo');
    } else {
      if (!resume.personalInfo.email) {
        errors.push('Missing required field: personalInfo.email');
      }
      if (!resume.personalInfo.phone) {
        errors.push('Missing required field: personalInfo.phone');
      }
    }

    if (!resume.experience || resume.experience.length === 0) {
      errors.push('Missing required section: experience');
    }

    // Check recommended sections
    if (!resume.summary) {
      warnings.push('Missing recommended section: summary (helps with ATS keyword matching)');
      suggestions.push('Add a professional summary section to improve ATS compatibility');
    }

    if (!resume.education) {
      warnings.push('Missing recommended section: education');
    }

    if (!resume.skills) {
      warnings.push('Missing recommended section: skills (important for ATS keyword matching)');
      suggestions.push('Add a skills section with relevant keywords for better ATS matching');
    }
  }

  // Check experience entries
  if (resume.experience && resume.experience.length > 0) {
    resume.experience.forEach((exp, index) => {
      // Check date formats
      if (opts.checkDateFormats) {
        if (!isValidDateFormat(exp.startDate)) {
          errors.push(
            `experience[${index}].startDate has invalid format (expected YYYY-MM or YYYY-MM-DD)`
          );
        }
        if (!isValidDateFormat(exp.endDate)) {
          errors.push(
            `experience[${index}].endDate has invalid format (expected YYYY-MM, YYYY-MM-DD, or "Present")`
          );
        }
      }

      // Check bullet points
      if (opts.checkBulletLength && exp.bulletPoints) {
        exp.bulletPoints.forEach((bullet, bulletIndex) => {
          if (bullet.length > opts.maxBulletLength) {
            warnings.push(
              `experience[${index}].bulletPoints[${bulletIndex}] exceeds recommended length of ${opts.maxBulletLength} characters (${bullet.length} characters)`
            );
            suggestions.push(
              `Consider shortening bullet point ${bulletIndex + 1} in experience entry ${index + 1} for better readability`
            );
          }
        });

        // Check for empty bullet points
        if (exp.bulletPoints.length === 0) {
          warnings.push(`experience[${index}] has no bullet points`);
        }
      }

      // Check for missing fields
      if (!exp.company) {
        errors.push(`experience[${index}] is missing company name`);
      }
      if (!exp.role) {
        errors.push(`experience[${index}] is missing role/title`);
      }
      if (!exp.location) {
        warnings.push(`experience[${index}] is missing location`);
      }
    });
  }

  // Check education entries
  if (resume.education) {
    const educationArray = Array.isArray(resume.education)
      ? resume.education
      : [resume.education];

    educationArray.forEach((edu, index) => {
      if (typeof edu === 'object' && edu !== null) {
        if (opts.checkDateFormats && 'graduationDate' in edu) {
          const graduationDate = edu.graduationDate;
          if (typeof graduationDate === 'string' && !isValidDateFormat(graduationDate)) {
            warnings.push(
              `education[${index}].graduationDate has invalid format (expected YYYY-MM)`
            );
          }
        }

        if (!edu.institution) {
          warnings.push(`education[${index}] is missing institution name`);
        }
        if (!edu.degree) {
          warnings.push(`education[${index}] is missing degree`);
        }
      }
    });
  }

  // Check skills
  if (resume.skills && typeof resume.skills === 'object' && 'categories' in resume.skills) {
    if (!resume.skills.categories || resume.skills.categories.length === 0) {
      warnings.push('skills section has no categories');
    } else {
      resume.skills.categories.forEach((category, index) => {
        if (!category.items || category.items.length === 0) {
          warnings.push(`skills.categories[${index}] has no items`);
        }
      });
    }
  }

  // Calculate ATS score
  const score = calculateAtsScore(errors, warnings, resume);

  // Determine compliance
  const isCompliant = errors.length === 0 && score >= 70;

  logger.debug(`ATS validation complete. Score: ${score}, Errors: ${errors.length}, Warnings: ${warnings.length}`);

  return {
    score,
    errors,
    warnings,
    suggestions,
    isCompliant,
  };
}

/**
 * Calculates ATS compliance score (0-100)
 * @param errors - Array of errors
 * @param warnings - Array of warnings
 * @param resume - Resume object
 * @returns ATS score (0-100)
 */
function calculateAtsScore(
  errors: string[],
  warnings: string[],
  resume: Resume
): number {
  let score = 100;

  // Deduct points for errors (more severe)
  score -= errors.length * 10;
  if (score < 0) score = 0;

  // Deduct points for warnings (less severe)
  score -= warnings.length * 3;
  if (score < 0) score = 0;

  // Bonus points for having recommended sections
  if (resume.summary) score += 5;
  if (resume.education) score += 5;
  if (resume.skills) score += 5;
  if (resume.certifications) score += 3;
  if (resume.projects) score += 2;

  // Bonus for having multiple experience entries
  if (resume.experience && resume.experience.length >= 3) {
    score += 5;
  }

  // Ensure score is within bounds
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return Math.round(score);
}

/**
 * Validates heading structure (for template validation)
 * @param heading - Heading text to validate
 * @returns True if heading is ATS-friendly
 */
export function isValidAtsHeading(heading: string): boolean {
  const normalized = heading.toLowerCase().trim();
  return STANDARD_HEADINGS.some((standard) => normalized.includes(standard));
}

/**
 * Suggests alternative heading if non-standard
 * @param heading - Heading text
 * @returns Suggested alternative or null if already standard
 */
export function suggestHeading(heading: string): string | null {
  const normalized = heading.toLowerCase().trim();

  // Common non-standard headings and their suggestions (check this first)
  const suggestions: Record<string, string> = {
    'work history': 'Experience',
    'employment history': 'Experience',
    'professional history': 'Experience',
    'career history': 'Experience',
    'work experience': 'Experience',
    'professional experience': 'Experience',
    'technical expertise': 'Skills',
    'core competencies': 'Skills',
    'key skills': 'Skills',
    'qualifications': 'Skills',
    'academic background': 'Education',
    'educational background': 'Education',
    'academic qualifications': 'Education',
  };

  // Check exact matches first
  if (suggestions[normalized]) {
    return suggestions[normalized];
  }

  // Check if it's already a standard heading (exact match)
  const exactMatch = STANDARD_HEADINGS.find((standard) => normalized === standard);
  if (exactMatch) {
    return null;
  }

  // Check if it contains a standard heading (but is not exact)
  for (const standard of STANDARD_HEADINGS) {
    if (normalized.includes(standard) && normalized !== standard) {
      return standard.charAt(0).toUpperCase() + standard.slice(1);
    }
  }

  return null;
}
