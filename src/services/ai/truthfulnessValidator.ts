/**
 * Truthfulness Validator
 * 
 * Validates that AI enhancements maintain truthfulness while allowing intelligent inference.
 * Allows AI to add related content that can be reasonably inferred from existing resume information
 * (e.g., Java → backend development, React → frontend development).
 * Prevents fabrication of completely unrelated content.
 */

import type { Resume, Skills } from '@resume-types/resume.types';
import { logger } from '@utils/logger';

/**
 * Truthfulness validation result
 */
export interface TruthfulnessValidationResult {
  /** Whether the enhanced resume is truthful */
  isTruthful: boolean;
  /** Array of validation errors (fabrications detected) */
  errors: string[];
  /** Array of validation warnings (potentially problematic) */
  warnings: string[];
  /** Array of suggestions for corrections */
  suggestions: string[];
  /** Detailed validation results by section */
  details: {
    experiences: ExperienceValidationResult;
    skills: SkillsValidationResult;
    education: EducationValidationResult;
    bulletPoints: BulletPointValidationResult;
    summary: SummaryValidationResult;
  };
}

/**
 * Experience validation result
 */
export interface ExperienceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  newExperiencesDetected: number;
  mismatchedCompanies: string[];
  mismatchedDates: string[];
  mismatchedRoles: string[];
}

/**
 * Skills validation result
 */
export interface SkillsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  newSkills: string[];
  inferredSkills: string[];
  unrelatedSkills: string[];
}

/**
 * Education validation result
 */
export interface EducationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mismatchedInstitutions: string[];
  mismatchedDegrees: string[];
  mismatchedDates: string[];
}

/**
 * Bullet point validation result
 */
export interface BulletPointValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fabricatedMetrics: string[];
  unrelatedTechnologies: string[];
  inferredTechnologies: string[];
}

/**
 * Summary validation result
 */
export interface SummaryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mismatchedClaims: string[];
}

/**
 * Options for truthfulness validation
 */
export interface TruthfulnessValidationOptions {
  /** Whether to allow intelligent inference (default: true) */
  allowInference?: boolean;
  /** Strictness level: 'strict' | 'moderate' | 'lenient' (default: 'moderate') */
  strictness?: 'strict' | 'moderate' | 'lenient';
  /** Whether to generate correction suggestions (default: true) */
  generateSuggestions?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<TruthfulnessValidationOptions> = {
  allowInference: true,
  strictness: 'moderate',
  generateSuggestions: true,
};

/**
 * Technology inference patterns
 * Maps technologies to commonly associated terms that can be reasonably inferred
 */
const INFERENCE_PATTERNS: Record<string, string[]> = {
  // Backend technologies
  'java': ['backend development', 'server-side programming', 'enterprise applications', 'restful apis', 'microservices'],
  'spring': ['backend development', 'enterprise applications', 'dependency injection', 'restful apis'],
  'node.js': ['backend development', 'server-side programming', 'api development', 'javascript'],
  'python': ['data science', 'automation', 'scripting', 'backend development', 'machine learning'],
  'django': ['web development', 'backend development', 'python'],
  'flask': ['web development', 'backend development', 'python'],
  
  // Frontend technologies
  'react': ['frontend development', 'user interface', 'client-side applications', 'component-based architecture'],
  'vue': ['frontend development', 'user interface', 'client-side applications'],
  'angular': ['frontend development', 'user interface', 'client-side applications', 'typescript'],
  'javascript': ['frontend development', 'web development', 'client-side programming'],
  'typescript': ['frontend development', 'type safety', 'javascript'],
  
  // Cloud & DevOps
  'aws': ['cloud infrastructure', 'cloud services', 'cloud deployment', 'devops'],
  'azure': ['cloud infrastructure', 'cloud services', 'cloud deployment', 'devops'],
  'gcp': ['cloud infrastructure', 'cloud services', 'cloud deployment', 'devops'],
  'docker': ['containerization', 'container orchestration', 'devops', 'deployment'],
  'kubernetes': ['container orchestration', 'devops', 'deployment', 'scalability'],
  
  // Databases
  'postgresql': ['database management', 'sql', 'relational database'],
  'mysql': ['database management', 'sql', 'relational database'],
  'mongodb': ['database management', 'nosql', 'document database'],
  'redis': ['caching', 'in-memory database', 'performance optimization'],
  
  // Data Science
  'pandas': ['data analysis', 'data processing', 'python'],
  'numpy': ['data analysis', 'numerical computing', 'python'],
  'tensorflow': ['machine learning', 'deep learning', 'ai'],
  'pytorch': ['machine learning', 'deep learning', 'ai'],
};

/**
 * Check if a skill/term can be reasonably inferred from existing skills
 */
function canInferTerm(term: string, existingSkills: string[]): boolean {
  const termLower = term.toLowerCase();
  const existingSkillsLower = existingSkills.map(s => s.toLowerCase());
  
  // Check if term is already present
  if (existingSkillsLower.some(s => s.includes(termLower) || termLower.includes(s))) {
    return true;
  }
  
  // Check inference patterns
  for (const [tech, inferredTerms] of Object.entries(INFERENCE_PATTERNS)) {
    const techLower = tech.toLowerCase();
    
    // If existing skill matches a technology pattern
    if (existingSkillsLower.some(s => s.includes(techLower) || techLower.includes(s))) {
      // Check if the term matches any inferred terms for that technology
      if (inferredTerms.some(inferred => 
        termLower.includes(inferred.toLowerCase()) || 
        inferred.toLowerCase().includes(termLower)
      )) {
        return true;
      }
    }
    
    // If term matches a technology pattern
    if (termLower.includes(techLower) || techLower.includes(termLower)) {
      // Check if any existing skill matches inferred terms for that technology
      if (existingSkillsLower.some(s => 
        inferredTerms.some(inferred => 
          s.includes(inferred.toLowerCase()) || 
          inferred.toLowerCase().includes(s)
        )
      )) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Flatten skills object into array of skill names
 */
function flattenSkills(skills: Resume['skills']): string[] {
  if (!skills || typeof skills === 'string') {
    return []; // File reference or undefined
  }
  
  if (typeof skills === 'object' && 'categories' in skills) {
    const skillsObj = skills as Skills;
    if (Array.isArray(skillsObj.categories)) {
      const allSkills: string[] = [];
      for (const category of skillsObj.categories) {
        if (category.items && Array.isArray(category.items)) {
          allSkills.push(...category.items);
        }
      }
      return allSkills;
    }
  }
  
  return [];
}

/**
 * Validate experiences section
 */
function validateExperiences(
  original: Resume,
  enhanced: Resume,
  _options: Required<TruthfulnessValidationOptions>
): ExperienceValidationResult {
  const result: ExperienceValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    newExperiencesDetected: 0,
    mismatchedCompanies: [],
    mismatchedDates: [],
    mismatchedRoles: [],
  };
  
  const originalExp = original.experience || [];
  const enhancedExp = enhanced.experience || [];
  
  // Check if new experiences were added
  if (enhancedExp.length > originalExp.length) {
    result.newExperiencesDetected = enhancedExp.length - originalExp.length;
    result.valid = false;
    result.errors.push(
      `Detected ${result.newExperiencesDetected} new experience(s) that were not in the original resume`
    );
  }
  
  // Validate each experience entry
  for (let i = 0; i < Math.min(originalExp.length, enhancedExp.length); i++) {
    const orig = originalExp[i];
    const enh = enhancedExp[i];
    
    if (!orig || !enh) continue;
    
    // Check company name
    if (orig.company && enh.company && orig.company !== enh.company) {
      result.mismatchedCompanies.push(
        `Experience[${i}]: Company changed from "${orig.company}" to "${enh.company}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedCompanies[result.mismatchedCompanies.length - 1] || '');
    }
    
    // Check role
    if (orig.role && enh.role && orig.role !== enh.role) {
      result.mismatchedRoles.push(
        `Experience[${i}]: Role changed from "${orig.role}" to "${enh.role}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedRoles[result.mismatchedRoles.length - 1] || '');
    }
    
    // Check dates
    if (orig.startDate && enh.startDate && orig.startDate !== enh.startDate) {
      result.mismatchedDates.push(
        `Experience[${i}]: Start date changed from "${orig.startDate}" to "${enh.startDate}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedDates[result.mismatchedDates.length - 1] || '');
    }
    
    if (orig.endDate && enh.endDate && orig.endDate !== enh.endDate) {
      result.mismatchedDates.push(
        `Experience[${i}]: End date changed from "${orig.endDate}" to "${enh.endDate}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedDates[result.mismatchedDates.length - 1] || '');
    }
  }
  
  return result;
}

/**
 * Validate skills section
 */
function validateSkills(
  original: Resume,
  enhanced: Resume,
  options: Required<TruthfulnessValidationOptions>
): SkillsValidationResult {
  const result: SkillsValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    newSkills: [],
    inferredSkills: [],
    unrelatedSkills: [],
  };
  
  const originalSkills = flattenSkills(original.skills);
  const enhancedSkills = flattenSkills(enhanced.skills);
  const originalSkillsLower = originalSkills.map(s => s.toLowerCase());
  
  // Find new skills
  for (const skill of enhancedSkills) {
    const skillLower = skill.toLowerCase();
    const isOriginal = originalSkillsLower.some(os => 
      os.includes(skillLower) || skillLower.includes(os)
    );
    
    if (!isOriginal) {
      // Check if it can be inferred
      if (options.allowInference && canInferTerm(skill, originalSkills)) {
        result.inferredSkills.push(skill);
        if (options.strictness === 'strict') {
          result.warnings.push(
            `New skill "${skill}" was inferred from existing skills. Verify this is appropriate.`
          );
        }
      } else {
        result.unrelatedSkills.push(skill);
        result.valid = false;
        result.errors.push(
          `Unrelated skill "${skill}" was added. This cannot be reasonably inferred from existing skills.`
        );
      }
    }
  }
  
  // Collect all new skills for reporting
  result.newSkills = [...result.inferredSkills, ...result.unrelatedSkills];
  
  return result;
}

/**
 * Validate education section
 */
function validateEducation(
  original: Resume,
  enhanced: Resume,
  _options: Required<TruthfulnessValidationOptions>
): EducationValidationResult {
  const result: EducationValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    mismatchedInstitutions: [],
    mismatchedDegrees: [],
    mismatchedDates: [],
  };
  
  const originalEdu = Array.isArray(original.education) ? original.education : 
    (original.education ? [original.education] : []);
  const enhancedEdu = Array.isArray(enhanced.education) ? enhanced.education : 
    (enhanced.education ? [enhanced.education] : []);
  
  // Check if new education entries were added
  if (enhancedEdu.length > originalEdu.length) {
    result.valid = false;
    result.errors.push(
      `Detected ${enhancedEdu.length - originalEdu.length} new education entry/entries that were not in the original resume`
    );
  }
  
  // Validate each education entry
  for (let i = 0; i < Math.min(originalEdu.length, enhancedEdu.length); i++) {
    const orig = originalEdu[i];
    const enh = enhancedEdu[i];
    
    if (!orig || !enh) continue;
    
    // Skip file references
    if (typeof orig === 'string' || typeof enh === 'string') {
      continue;
    }
    
    // Check institution
    if (orig.institution && enh.institution && orig.institution !== enh.institution) {
      result.mismatchedInstitutions.push(
        `Education[${i}]: Institution changed from "${orig.institution}" to "${enh.institution}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedInstitutions[result.mismatchedInstitutions.length - 1] || '');
    }
    
    // Check degree
    if (orig.degree && enh.degree && orig.degree !== enh.degree) {
      result.mismatchedDegrees.push(
        `Education[${i}]: Degree changed from "${orig.degree}" to "${enh.degree}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedDegrees[result.mismatchedDegrees.length - 1] || '');
    }
    
    // Check graduation date
    if (orig.graduationDate && enh.graduationDate && orig.graduationDate !== enh.graduationDate) {
      result.mismatchedDates.push(
        `Education[${i}]: Graduation date changed from "${orig.graduationDate}" to "${enh.graduationDate}"`
      );
      result.valid = false;
      result.errors.push(result.mismatchedDates[result.mismatchedDates.length - 1] || '');
    }
  }
  
  return result;
}

/**
 * Extract technologies mentioned in text
 */
function extractTechnologies(text: string): string[] {
  const technologies: string[] = [];
  const textLower = text.toLowerCase();
  
  // Check against inference patterns
  for (const [tech, _] of Object.entries(INFERENCE_PATTERNS)) {
    if (textLower.includes(tech.toLowerCase())) {
      technologies.push(tech);
    }
  }
  
  // Also look for common tech terms (capitalized words that might be technologies)
  const techPattern = /\b([A-Z][a-z]+(?:\.[a-z]+)?)\b/g;
  const matches = text.match(techPattern);
  if (matches) {
    technologies.push(...matches);
  }
  
  return [...new Set(technologies)]; // Remove duplicates
}

/**
 * Validate bullet points
 */
function validateBulletPoints(
  original: Resume,
  enhanced: Resume,
  options: Required<TruthfulnessValidationOptions>
): BulletPointValidationResult {
  const result: BulletPointValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    fabricatedMetrics: [],
    unrelatedTechnologies: [],
    inferredTechnologies: [],
  };
  
  const originalExp = original.experience || [];
  const enhancedExp = enhanced.experience || [];
  const originalSkills = flattenSkills(original.skills);
  
  // Extract all technologies from original resume
  const originalTechnologies = new Set<string>();
  for (const exp of originalExp) {
    if (exp.bulletPoints) {
      const techs = exp.bulletPoints.flatMap(bp => extractTechnologies(bp));
      techs.forEach(t => originalTechnologies.add(t.toLowerCase()));
    }
  }
  originalSkills.forEach(s => originalTechnologies.add(s.toLowerCase()));
  
  // Validate each experience entry's bullet points
  for (let i = 0; i < Math.min(originalExp.length, enhancedExp.length); i++) {
    const orig = originalExp[i];
    const enh = enhancedExp[i];
    
    if (!orig || !enh || !orig.bulletPoints || !enh.bulletPoints) continue;
    
    // Check if new bullet points were added (count)
    if (enh.bulletPoints.length > orig.bulletPoints.length) {
      result.warnings.push(
        `Experience[${i}]: Number of bullet points increased from ${orig.bulletPoints.length} to ${enh.bulletPoints.length}`
      );
    }
    
    // Validate each bullet point
    for (let j = 0; j < enh.bulletPoints.length; j++) {
      const enhancedBullet = enh.bulletPoints[j];
      if (!enhancedBullet) continue;
      
      // Extract technologies from enhanced bullet point
      const enhancedTechs = extractTechnologies(enhancedBullet);
      
      // Check for unrelated technologies
      for (const tech of enhancedTechs) {
        const techLower = tech.toLowerCase();
        const isOriginal = originalTechnologies.has(techLower) ||
          originalTechnologies.has(tech) ||
          Array.from(originalTechnologies).some(ot => 
            ot.includes(techLower) || techLower.includes(ot)
          );
        
        if (!isOriginal) {
          // Check if it can be inferred
          if (options.allowInference && canInferTerm(tech, Array.from(originalTechnologies))) {
            result.inferredTechnologies.push(tech);
            if (options.strictness === 'strict') {
              result.warnings.push(
                `Experience[${i}].bulletPoints[${j}]: Technology "${tech}" was inferred. Verify this is appropriate.`
              );
            }
          } else {
            result.unrelatedTechnologies.push(tech);
            result.valid = false;
            result.errors.push(
              `Experience[${i}].bulletPoints[${j}]: Unrelated technology "${tech}" was added. This cannot be reasonably inferred.`
            );
          }
        }
      }
      
      // Check for fabricated metrics (numbers that weren't in original)
      // This is a heuristic - extract numbers from both and compare
      const originalNumbers = new Set<string>();
      const originalBullet = orig.bulletPoints[j];
      if (originalBullet) {
        const origNumbers = originalBullet.match(/\d+/g);
        if (origNumbers) {
          origNumbers.forEach(n => originalNumbers.add(n));
        }
      }
      
      const enhancedNumbers = enhancedBullet.match(/\d+/g);
      if (enhancedNumbers) {
        for (const num of enhancedNumbers) {
          if (!originalNumbers.has(num)) {
            // Check if it's a percentage or common metric pattern
            const context = enhancedBullet.toLowerCase();
            if (context.includes(`${num}%`) || 
                context.includes(`${num} percent`) ||
                context.includes(`by ${num}`) ||
                context.includes(`of ${num}`)) {
              result.fabricatedMetrics.push(num);
              if (options.strictness !== 'lenient') {
                result.valid = false;
                result.errors.push(
                  `Experience[${i}].bulletPoints[${j}]: Metric "${num}" appears to be fabricated (not in original)`
                );
              } else {
                result.warnings.push(
                  `Experience[${i}].bulletPoints[${j}]: Metric "${num}" may be fabricated (not in original)`
                );
              }
            }
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Calculate years of experience from resume
 */
function calculateYearsOfExperience(resume: Resume): number {
  if (!resume.experience || resume.experience.length === 0) {
    return 0;
  }
  
  let totalMonths = 0;
  for (const exp of resume.experience) {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                     (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  }
  
  return Math.floor(totalMonths / 12);
}

/**
 * Validate summary section
 */
function validateSummary(
  original: Resume,
  enhanced: Resume,
  options: Required<TruthfulnessValidationOptions>
): SummaryValidationResult {
  const result: SummaryValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    mismatchedClaims: [],
  };
  
  if (!original.summary || !enhanced.summary) {
    return result;
  }
  
  // Calculate years of experience
  const enhancedYears = calculateYearsOfExperience(enhanced);
  
  // Check for years of experience claims in summary
  const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi;
  const originalYearsMatches = original.summary.match(yearsPattern);
  const enhancedYearsMatches = enhanced.summary.match(yearsPattern);
  
  if (enhancedYearsMatches && !originalYearsMatches) {
    // New years claim was added
    const claimedYears = parseInt(enhancedYearsMatches[0].match(/\d+/)?.[0] || '0', 10);
    if (claimedYears > enhancedYears) {
      result.mismatchedClaims.push(
        `Summary claims "${claimedYears} years of experience" but resume only shows ${enhancedYears} years`
      );
      result.valid = false;
      result.errors.push(result.mismatchedClaims[result.mismatchedClaims.length - 1] || '');
    }
  }
  
  // Check for major technology claims that weren't in original
  const originalTechs = new Set<string>();
  if (original.experience) {
    for (const exp of original.experience) {
      if (exp.bulletPoints) {
        exp.bulletPoints.forEach(bp => {
          extractTechnologies(bp).forEach(t => originalTechs.add(t.toLowerCase()));
        });
      }
    }
  }
  
  const enhancedTechs = extractTechnologies(enhanced.summary);
  for (const tech of enhancedTechs) {
    const techLower = tech.toLowerCase();
    if (!Array.from(originalTechs).some(ot => 
      ot.includes(techLower) || techLower.includes(ot)
    )) {
      // Check if it can be inferred
      if (options.allowInference && canInferTerm(tech, Array.from(originalTechs))) {
        // Allowed inference
        if (options.strictness === 'strict') {
          result.warnings.push(
            `Summary mentions "${tech}" which was inferred. Verify this is appropriate.`
          );
        }
      } else {
        result.mismatchedClaims.push(
          `Summary claims expertise in "${tech}" which is not in the original resume and cannot be reasonably inferred`
        );
        result.valid = false;
        result.errors.push(result.mismatchedClaims[result.mismatchedClaims.length - 1] || '');
      }
    }
  }
  
  return result;
}

/**
 * Generate correction suggestions based on validation results
 */
function generateSuggestions(
  result: TruthfulnessValidationResult,
  options: Required<TruthfulnessValidationOptions>
): string[] {
  if (!options.generateSuggestions) {
    return [];
  }
  
  const suggestions: string[] = [];
  
  // Experience suggestions
  if (result.details.experiences.newExperiencesDetected > 0) {
    suggestions.push(
      `Remove ${result.details.experiences.newExperiencesDetected} newly added experience(s). Only enhance existing experiences.`
    );
  }
  
  if (result.details.experiences.mismatchedCompanies.length > 0) {
    suggestions.push(
      `Restore original company names. Company names should not be changed.`
    );
  }
  
  if (result.details.experiences.mismatchedDates.length > 0) {
    suggestions.push(
      `Restore original dates. Employment dates should not be changed.`
    );
  }
  
  // Skills suggestions
  if (result.details.skills.unrelatedSkills.length > 0) {
    suggestions.push(
      `Remove unrelated skills: ${result.details.skills.unrelatedSkills.join(', ')}. These cannot be reasonably inferred from existing skills.`
    );
  }
  
  if (result.details.skills.inferredSkills.length > 0 && options.strictness === 'strict') {
    suggestions.push(
      `Review inferred skills: ${result.details.skills.inferredSkills.join(', ')}. Verify these are appropriate inferences.`
    );
  }
  
  // Bullet point suggestions
  if (result.details.bulletPoints.fabricatedMetrics.length > 0) {
    suggestions.push(
      `Remove or verify fabricated metrics. Metrics should only be added if they can be reasonably inferred from original content.`
    );
  }
  
  if (result.details.bulletPoints.unrelatedTechnologies.length > 0) {
    suggestions.push(
      `Remove unrelated technologies from bullet points: ${result.details.bulletPoints.unrelatedTechnologies.join(', ')}`
    );
  }
  
  // Summary suggestions
  if (result.details.summary.mismatchedClaims.length > 0) {
    suggestions.push(
      `Review summary claims. Ensure all claims match the experience and skills in the resume.`
    );
  }
  
  return suggestions;
}

/**
 * Validate truthfulness of enhanced resume
 * 
 * @param original - Original resume before enhancement
 * @param enhanced - Enhanced resume after AI processing
 * @param options - Validation options
 * @returns Truthfulness validation result
 */
export function validateTruthfulness(
  original: Resume,
  enhanced: Resume,
  options: TruthfulnessValidationOptions = {}
): TruthfulnessValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  logger.debug('Starting truthfulness validation');
  
  // Validate each section
  const experiencesResult = validateExperiences(original, enhanced, opts);
  const skillsResult = validateSkills(original, enhanced, opts);
  const educationResult = validateEducation(original, enhanced, opts);
  const bulletPointsResult = validateBulletPoints(original, enhanced, opts);
  const summaryResult = validateSummary(original, enhanced, opts);
  
  // Combine all errors and warnings
  const allErrors: string[] = [
    ...experiencesResult.errors,
    ...skillsResult.errors,
    ...educationResult.errors,
    ...bulletPointsResult.errors,
    ...summaryResult.errors,
  ];
  
  const allWarnings: string[] = [
    ...experiencesResult.warnings,
    ...skillsResult.warnings,
    ...educationResult.warnings,
    ...bulletPointsResult.warnings,
    ...summaryResult.warnings,
  ];
  
  // Determine overall truthfulness
  const isTruthful = allErrors.length === 0;
  
  // Generate suggestions
  const result: TruthfulnessValidationResult = {
    isTruthful,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: [],
    details: {
      experiences: experiencesResult,
      skills: skillsResult,
      education: educationResult,
      bulletPoints: bulletPointsResult,
      summary: summaryResult,
    },
  };
  
  result.suggestions = generateSuggestions(result, opts);
  
  logger.debug(`Truthfulness validation complete. Truthful: ${isTruthful}, Errors: ${allErrors.length}, Warnings: ${allWarnings.length}`);
  
  return result;
}

/**
 * Validate experiences only
 */
export function validateExperiencesOnly(
  original: Resume,
  enhanced: Resume,
  options: TruthfulnessValidationOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result = validateExperiences(original, enhanced, opts);
  return result.valid;
}

/**
 * Validate skills only
 */
export function validateSkillsOnly(
  original: Resume,
  enhanced: Resume,
  options: TruthfulnessValidationOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result = validateSkills(original, enhanced, opts);
  return result.valid;
}

/**
 * Validate bullet points only
 */
export function validateBulletPointsOnly(
  original: Resume,
  enhanced: Resume,
  options: TruthfulnessValidationOptions = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result = validateBulletPoints(original, enhanced, opts);
  return result.valid;
}
