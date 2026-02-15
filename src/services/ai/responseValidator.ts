/**
 * Response Format Validator
 * 
 * Validates that AI responses match the expected format and structure.
 * Provides error recovery mechanisms and helpful error messages.
 */

import type { Resume } from '@resume-types/resume.types';
import type { Improvement } from '@resume-types/enhancement.types';
import type { AIResponse, ReviewResponse } from '@services/ai/provider.types';
import { validateResume } from '@utils/resumeParser';
import { logger } from '@utils/logger';

/**
 * Response validation result
 */
export interface ResponseValidationResult {
  /** Whether the response is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
  /** Suggestions for fixing issues */
  suggestions: string[];
  /** Whether recovery was attempted */
  recoveryAttempted: boolean;
  /** Recovered response (if recovery was successful) */
  recoveredResponse?: AIResponse | ReviewResponse;
}

/**
 * Options for response validation
 */
export interface ResponseValidationOptions {
  /** Whether to attempt error recovery (default: true) */
  attemptRecovery?: boolean;
  /** Whether to validate resume structure strictly (default: true) */
  strictResumeValidation?: boolean;
  /** Whether to validate improvements array (default: true) */
  validateImprovements?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<ResponseValidationOptions> = {
  attemptRecovery: true,
  strictResumeValidation: true,
  validateImprovements: true,
};

/**
 * Valid improvement types (matching Improvement interface from enhancement.types)
 */
const VALID_IMPROVEMENT_TYPES = [
  'bulletPoint',
  'summary',
  'skill',
  'keyword',
] as const;

/**
 * Validate JSON structure
 */
function validateJsonStructure(
  response: unknown,
  type: 'ai' | 'review'
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof response !== 'object' || response === null) {
    errors.push('Response must be a JSON object');
    return { valid: false, errors, warnings };
  }

  if (type === 'review') {
    const reviewResponse = response as Partial<ReviewResponse>;
    
    if (!('reviewResult' in reviewResponse)) {
      errors.push('Review response missing "reviewResult" field');
    } else {
      const review = reviewResponse.reviewResult;
      if (!review || typeof review !== 'object') {
        errors.push('"reviewResult" must be an object');
      } else {
        // Validate strengths
        if (!('strengths' in review)) {
          errors.push('"reviewResult.strengths" is required');
        } else if (!Array.isArray(review.strengths)) {
          errors.push('"reviewResult.strengths" must be an array');
        } else {
          review.strengths.forEach((item, index) => {
            if (typeof item !== 'string') {
              errors.push(`"reviewResult.strengths[${index}]" must be a string`);
            }
          });
        }

        // Validate weaknesses
        if (!('weaknesses' in review)) {
          errors.push('"reviewResult.weaknesses" is required');
        } else if (!Array.isArray(review.weaknesses)) {
          errors.push('"reviewResult.weaknesses" must be an array');
        } else {
          review.weaknesses.forEach((item, index) => {
            if (typeof item !== 'string') {
              errors.push(`"reviewResult.weaknesses[${index}]" must be a string`);
            }
          });
        }

        // Validate opportunities
        if (!('opportunities' in review)) {
          warnings.push('"reviewResult.opportunities" is missing (optional but recommended)');
        } else if (!Array.isArray(review.opportunities)) {
          errors.push('"reviewResult.opportunities" must be an array');
        } else {
          review.opportunities.forEach((item, index) => {
            if (typeof item !== 'string') {
              errors.push(`"reviewResult.opportunities[${index}]" must be a string`);
            }
          });
        }

        // Validate prioritizedActions
        if (!('prioritizedActions' in review)) {
          warnings.push('"reviewResult.prioritizedActions" is missing (optional but recommended)');
        } else if (!Array.isArray(review.prioritizedActions)) {
          errors.push('"reviewResult.prioritizedActions" must be an array');
        } else {
          review.prioritizedActions.forEach((action, index) => {
            if (typeof action !== 'object' || action === null) {
              errors.push(`"reviewResult.prioritizedActions[${index}]" must be an object`);
            } else {
              if (!('type' in action) || typeof action.type !== 'string') {
                errors.push(`"reviewResult.prioritizedActions[${index}].type" is required and must be a string`);
              }
              if (!('priority' in action) || typeof action.priority !== 'string') {
                errors.push(`"reviewResult.prioritizedActions[${index}].priority" is required and must be a string`);
              }
              if (!('reason' in action) || typeof action.reason !== 'string') {
                errors.push(`"reviewResult.prioritizedActions[${index}].reason" is required and must be a string`);
              }
            }
          });
        }

        // Validate confidence
        if (!('confidence' in review)) {
          warnings.push('"reviewResult.confidence" is missing (optional but recommended)');
        } else if (typeof review.confidence !== 'number') {
          errors.push('"reviewResult.confidence" must be a number');
        } else if (review.confidence < 0 || review.confidence > 1) {
          errors.push('"reviewResult.confidence" must be between 0 and 1');
        }
      }
    }
  } else {
    // AIResponse validation
    const aiResponse = response as Partial<AIResponse>;
    
    if (!('enhancedResume' in aiResponse)) {
      errors.push('AI response missing "enhancedResume" field');
    } else if (!aiResponse.enhancedResume || typeof aiResponse.enhancedResume !== 'object') {
      errors.push('"enhancedResume" must be an object');
    }

    if (!('improvements' in aiResponse)) {
      errors.push('AI response missing "improvements" field');
    } else if (!Array.isArray(aiResponse.improvements)) {
      errors.push('"improvements" must be an array');
    }

    // Validate optional fields
    if ('reasoning' in aiResponse && typeof aiResponse.reasoning !== 'string') {
      errors.push('"reasoning" must be a string');
    }

    if ('confidence' in aiResponse) {
      if (typeof aiResponse.confidence !== 'number') {
        errors.push('"confidence" must be a number');
      } else if (aiResponse.confidence < 0 || aiResponse.confidence > 1) {
        errors.push('"confidence" must be between 0 and 1');
      }
    }

    if ('tokensUsed' in aiResponse && typeof aiResponse.tokensUsed !== 'number') {
      errors.push('"tokensUsed" must be a number');
    }

    if ('cost' in aiResponse && typeof aiResponse.cost !== 'number') {
      errors.push('"cost" must be a number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate resume structure
 */
function validateResumeStructure(
  resume: unknown,
  strict: boolean
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!resume || typeof resume !== 'object') {
    errors.push('Resume must be an object');
    return { valid: false, errors, warnings };
  }

  // Use existing resume validator
  try {
    const validationErrors = validateResume(resume as Partial<Resume>);
    
    if (validationErrors.length > 0) {
      if (strict) {
        errors.push(...validationErrors);
      } else {
        warnings.push(...validationErrors);
      }
    }
  } catch (error) {
    errors.push(
      `Resume validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate improvements array
 */
function validateImprovements(
  improvements: unknown
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(improvements)) {
    errors.push('Improvements must be an array');
    return { valid: false, errors, warnings };
  }

  improvements.forEach((improvement, index) => {
    if (typeof improvement !== 'object' || improvement === null) {
      errors.push(`improvements[${index}] must be an object`);
      return;
    }

    const imp = improvement as Partial<Improvement>;

    // Validate type
    if (!('type' in imp) || typeof imp.type !== 'string') {
      errors.push(`improvements[${index}].type is required and must be a string`);
    } else if (!VALID_IMPROVEMENT_TYPES.includes(imp.type as typeof VALID_IMPROVEMENT_TYPES[number])) {
      errors.push(
        `improvements[${index}].type must be one of: ${VALID_IMPROVEMENT_TYPES.join(', ')}`
      );
    }

    // Validate section
    if (!('section' in imp) || typeof imp.section !== 'string') {
      errors.push(`improvements[${index}].section is required and must be a string`);
    }

    // Validate original (required)
    if (!('original' in imp) || typeof imp.original !== 'string') {
      errors.push(`improvements[${index}].original is required and must be a string`);
    }

    // Validate suggested (required)
    if (!('suggested' in imp) || typeof imp.suggested !== 'string') {
      errors.push(`improvements[${index}].suggested is required and must be a string`);
    }

    // Validate reason (required)
    if (!('reason' in imp) || typeof imp.reason !== 'string') {
      errors.push(`improvements[${index}].reason is required and must be a string`);
    }

    // Validate confidence (required)
    if (!('confidence' in imp) || typeof imp.confidence !== 'number') {
      errors.push(`improvements[${index}].confidence is required and must be a number`);
    } else if (imp.confidence < 0 || imp.confidence > 1) {
      errors.push(`improvements[${index}].confidence must be between 0 and 1`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempt to recover from common JSON parsing errors
 */
function attemptJsonRecovery(
  rawResponse: string
): { success: boolean; recovered?: unknown; errors: string[] } {
  const errors: string[] = [];

  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const recovered = JSON.parse(jsonMatch[1]);
        return { success: true, recovered, errors: [] };
      } catch (e) {
        errors.push('Found JSON in code block but parsing failed');
      }
    }

    // Try to find JSON object in response
    const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (objectMatch && objectMatch[0]) {
      try {
        const recovered = JSON.parse(objectMatch[0]);
        return { success: true, recovered, errors: [] };
      } catch (e) {
        errors.push('Found JSON-like structure but parsing failed');
      }
    }

    // Try to fix common JSON issues
    let fixed = rawResponse
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]
      .replace(/([{,]\s*)(\w+)(\s*):/g, '$1"$2":') // Add quotes to unquoted keys
      .replace(/:\s*([^",\[\]{}]+)(\s*[,}\]])/g, (match, value, suffix) => {
        // Add quotes to unquoted string values
        const trimmed = value.trim();
        if (!trimmed.match(/^(true|false|null|\d+)$/)) {
          return `: "${trimmed}"${suffix}`;
        }
        return match;
      });

    try {
      const recovered = JSON.parse(fixed);
      return { success: true, recovered, errors: [] };
    } catch (e) {
      errors.push('Attempted JSON fixes but parsing still failed');
    }
  } catch (error) {
    errors.push(`Recovery attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { success: false, errors };
}

/**
 * Attempt to fix common response structure issues
 */
function attemptStructureRecovery(
  response: unknown,
  type: 'ai' | 'review'
): { success: boolean; recovered?: AIResponse | ReviewResponse; errors: string[] } {
  const errors: string[] = [];

  try {
    if (type === 'review') {
      const review = response as Partial<ReviewResponse>;
      
      // Ensure reviewResult exists
      if (!review.reviewResult) {
        review.reviewResult = {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.5,
        };
      }

      const result = review.reviewResult;

      // Ensure arrays exist
      if (!Array.isArray(result.strengths)) {
        result.strengths = [];
      }
      if (!Array.isArray(result.weaknesses)) {
        result.weaknesses = [];
      }
      if (!Array.isArray(result.opportunities)) {
        result.opportunities = [];
      }
      if (!Array.isArray(result.prioritizedActions)) {
        result.prioritizedActions = [];
      }

      // Ensure confidence is valid
      if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
        result.confidence = 0.5;
      }

      return { success: true, recovered: review as ReviewResponse, errors: [] };
    } else {
      const ai = response as Partial<AIResponse>;
      
      // Ensure enhancedResume exists (can't recover if missing)
      if (!ai.enhancedResume) {
        errors.push('Cannot recover: enhancedResume is missing');
        return { success: false, errors };
      }

      // Ensure improvements array exists
      if (!Array.isArray(ai.improvements)) {
        ai.improvements = [];
      }

      // Ensure confidence is valid
      if (ai.confidence !== undefined) {
        if (typeof ai.confidence !== 'number' || ai.confidence < 0 || ai.confidence > 1) {
          ai.confidence = undefined;
        }
      }

      return { success: true, recovered: ai as AIResponse, errors: [] };
    }
  } catch (error) {
    errors.push(`Structure recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
}

/**
 * Generate suggestions for fixing validation errors
 */
function generateSuggestions(
  errors: string[],
  _warnings: string[],
  type: 'ai' | 'review'
): string[] {
  const suggestions: string[] = [];

  // JSON structure errors
  if (errors.some(e => e.includes('must be a JSON object'))) {
    suggestions.push('Ensure the response is a valid JSON object, not a string or other type');
  }

  // Missing required fields
  if (type === 'review') {
    if (errors.some(e => e.includes('reviewResult'))) {
      suggestions.push('Review response must include a "reviewResult" object with strengths, weaknesses, opportunities, and prioritizedActions');
    }
    if (errors.some(e => e.includes('strengths'))) {
      suggestions.push('Review result must include a "strengths" array of strings');
    }
    if (errors.some(e => e.includes('weaknesses'))) {
      suggestions.push('Review result must include a "weaknesses" array of strings');
    }
  } else {
    if (errors.some(e => e.includes('enhancedResume'))) {
      suggestions.push('AI response must include an "enhancedResume" object');
    }
    if (errors.some(e => e.includes('improvements'))) {
      suggestions.push('AI response must include an "improvements" array');
    }
  }

  // Resume validation errors
  if (errors.some(e => e.includes('personalInfo') || e.includes('experience'))) {
    suggestions.push('Ensure the enhanced resume includes all required fields: personalInfo, experience, etc.');
  }

  // Improvements validation errors
  if (errors.some(e => e.includes('improvements'))) {
    suggestions.push('Each improvement must have: type (added/modified/removed/reordered/enhanced), section, and description');
  }

  // Type errors
  if (errors.some(e => e.includes('must be a') || e.includes('must be an'))) {
    suggestions.push('Check that all field types match the expected schema (strings, arrays, objects, numbers)');
  }

  // Confidence errors
  if (errors.some(e => e.includes('confidence'))) {
    suggestions.push('Confidence score must be a number between 0 and 1');
  }

  return suggestions;
}

/**
 * Validate response format
 * 
 * @param response - Raw response string or parsed object
 * @param type - Type of response ('ai' or 'review')
 * @param options - Validation options
 * @returns Validation result
 */
export function validateResponseFormat(
  response: string | unknown,
  type: 'ai' | 'review',
  options: ResponseValidationOptions = {}
): ResponseValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsedResponse: unknown = response;
  let recoveryAttempted = false;
  let recoveredResponse: AIResponse | ReviewResponse | undefined;

  logger.debug(`Validating ${type} response format`);

  // If response is a string, try to parse it
  if (typeof response === 'string') {
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      // Attempt JSON recovery
      if (opts.attemptRecovery) {
        recoveryAttempted = true;
        const recovery = attemptJsonRecovery(response);
        if (recovery.success && recovery.recovered) {
          parsedResponse = recovery.recovered;
          warnings.push('JSON parsing errors were automatically recovered');
        } else {
          errors.push(
            `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          errors.push(...recovery.errors);
          return {
            isValid: false,
            errors,
            warnings,
            suggestions: generateSuggestions(errors, warnings, type),
            recoveryAttempted,
          };
        }
      } else {
        errors.push(
          `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return {
          isValid: false,
          errors,
          warnings,
          suggestions: generateSuggestions(errors, warnings, type),
          recoveryAttempted: false,
        };
      }
    }
  }

  // Validate JSON structure
  const structureValidation = validateJsonStructure(parsedResponse, type);
  errors.push(...structureValidation.errors);
  warnings.push(...structureValidation.warnings);

  // Attempt structure recovery if needed
  if (errors.length > 0 && opts.attemptRecovery) {
    recoveryAttempted = true;
    const recovery = attemptStructureRecovery(parsedResponse, type);
    if (recovery.success && recovery.recovered) {
      recoveredResponse = recovery.recovered;
      warnings.push('Response structure issues were automatically recovered');
      // Re-validate recovered response
      const recoveredValidation = validateJsonStructure(recoveredResponse, type);
      errors.length = 0; // Clear errors
      errors.push(...recoveredValidation.errors);
      warnings.push(...recoveredValidation.warnings);
      parsedResponse = recoveredResponse;
    } else {
      errors.push(...recovery.errors);
    }
  }

  // Validate resume structure (for AI responses)
  if (type === 'ai' && parsedResponse && typeof parsedResponse === 'object') {
    const aiResponse = parsedResponse as Partial<AIResponse>;
    if (aiResponse.enhancedResume) {
      const resumeValidation = validateResumeStructure(
        aiResponse.enhancedResume,
        opts.strictResumeValidation
      );
      if (opts.strictResumeValidation) {
        errors.push(...resumeValidation.errors);
      } else {
        warnings.push(...resumeValidation.errors);
      }
      warnings.push(...resumeValidation.warnings);
    }
  }

  // Validate improvements (for AI responses)
  if (type === 'ai' && opts.validateImprovements && parsedResponse && typeof parsedResponse === 'object') {
    const aiResponse = parsedResponse as Partial<AIResponse>;
    if (aiResponse.improvements) {
      const improvementsValidation = validateImprovements(aiResponse.improvements);
      errors.push(...improvementsValidation.errors);
      warnings.push(...improvementsValidation.warnings);
    }
  }

  const isValid = errors.length === 0;

  logger.debug(
    `Response validation complete. Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`
  );

  return {
    isValid,
    errors,
    warnings,
    suggestions: generateSuggestions(errors, warnings, type),
    recoveryAttempted,
    recoveredResponse,
  };
}

/**
 * Validate resume structure only
 * 
 * @param resume - Resume object to validate
 * @param strict - Whether to use strict validation
 * @returns True if valid, false otherwise
 */
export function validateResumeStructureOnly(
  resume: unknown,
  strict = true
): boolean {
  const result = validateResumeStructure(resume, strict);
  return result.valid;
}

/**
 * Validate improvements array only
 * 
 * @param improvements - Improvements array to validate
 * @returns True if valid, false otherwise
 */
export function validateImprovementsOnly(improvements: unknown): boolean {
  const result = validateImprovements(improvements);
  return result.valid;
}
