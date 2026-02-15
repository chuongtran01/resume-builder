/**
 * Resume parser utility
 * Parses resume.json and resolves all file references
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  resolveFileReferences,
  FileNotFoundError,
  InvalidJsonError,
} from '@utils/fileLoader';
import { logger } from '@utils/logger';
import type { Resume } from '@resume-types/resume.types';

/**
 * Error thrown when required fields are missing
 */
export class MissingRequiredFieldError extends Error {
  constructor(field: string) {
    super(`Missing required field: ${field}`);
    this.name = 'MissingRequiredFieldError';
  }
}

/**
 * Error thrown when resume validation fails
 */
export class ResumeValidationError extends Error {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
    this.name = 'ResumeValidationError';
  }
}

/**
 * Options for parsing resume
 */
export interface ParseResumeOptions {
  /** Path to resume.json file */
  resumePath: string;
  /** Whether to validate required fields */
  validate?: boolean;
}

/**
 * Validates that required fields are present in resume
 * @param resume - Resume object to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateResume(resume: Partial<Resume>): string[] {
  const errors: string[] = [];

  // Check personalInfo
  if (!resume.personalInfo) {
    errors.push('personalInfo is required');
  } else {
    const { personalInfo } = resume;
    if (!personalInfo.name) errors.push('personalInfo.name is required');
    if (!personalInfo.email) errors.push('personalInfo.email is required');
    if (!personalInfo.phone) errors.push('personalInfo.phone is required');
    if (!personalInfo.location) {
      errors.push('personalInfo.location is required');
    }
  }

  // Check experience
  if (!resume.experience || !Array.isArray(resume.experience)) {
    errors.push('experience is required and must be an array');
  } else if (resume.experience.length === 0) {
    errors.push('experience array must contain at least one entry');
  } else {
    resume.experience.forEach((exp, index) => {
      if (!exp.company) {
        errors.push(`experience[${index}].company is required`);
      }
      if (!exp.role) {
        errors.push(`experience[${index}].role is required`);
      }
      if (!exp.startDate) {
        errors.push(`experience[${index}].startDate is required`);
      }
      if (!exp.endDate) {
        errors.push(`experience[${index}].endDate is required`);
      }
      if (!exp.location) {
        errors.push(`experience[${index}].location is required`);
      }
      if (!exp.bulletPoints || !Array.isArray(exp.bulletPoints)) {
        errors.push(`experience[${index}].bulletPoints is required and must be an array`);
      }
    });
  }

  return errors;
}

/**
 * Parses a resume.json file and resolves all file references
 * @param options - Parse options
 * @returns Fully resolved Resume object
 * @throws {FileNotFoundError} If resume file doesn't exist}
 * @throws {InvalidJsonError} If JSON is invalid
 * @throws {ResumeValidationError} If validation fails
 */
export async function parseResume(
  options: ParseResumeOptions
): Promise<Resume> {
  const { resumePath, validate = true } = options;

  logger.debug(`Parsing resume from: ${resumePath}`);

  // Check if file exists
  const exists = await fs.pathExists(resumePath);
  if (!exists) {
    throw new FileNotFoundError(resumePath);
  }

  // Read and parse JSON
  let rawResume: unknown;
  try {
    const content = await fs.readFile(resumePath, 'utf-8');
    rawResume = JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidJsonError(resumePath, error);
    }
    throw error;
  }

  // Get base directory for resolving file references
  const baseDir = path.dirname(path.resolve(resumePath));

  logger.debug(`Resolving file references from base directory: ${baseDir}`);

  // Resolve all file references
  const resolvedResume = (await resolveFileReferences(rawResume, {
    baseDir,
  })) as Resume;

  // Validate required fields
  if (validate) {
    const validationErrors = validateResume(resolvedResume);
    if (validationErrors.length > 0) {
      throw new ResumeValidationError(
        'Resume validation failed',
        validationErrors
      );
    }
  }

  logger.debug('Resume parsed and validated successfully');

  return resolvedResume;
}

/**
 * Parses resume from a JSON string (useful for API)
 * @param jsonString - JSON string to parse
 * @param baseDir - Base directory for resolving file references
 * @param validate - Whether to validate required fields
 * @returns Fully resolved Resume object
 */
export async function parseResumeFromString(
  jsonString: string,
  baseDir: string,
  validate = true
): Promise<Resume> {
  logger.debug('Parsing resume from JSON string');

  // Parse JSON
  let rawResume: unknown;
  try {
    rawResume = JSON.parse(jsonString);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidJsonError('JSON string', error);
    }
    throw error;
  }

  // Resolve all file references
  const resolvedResume = (await resolveFileReferences(rawResume, {
    baseDir,
  })) as Resume;

  // Validate required fields
  if (validate) {
    const validationErrors = validateResume(resolvedResume);
    if (validationErrors.length > 0) {
      throw new ResumeValidationError(
        'Resume validation failed',
        validationErrors
      );
    }
  }

  logger.debug('Resume parsed and validated successfully');

  return resolvedResume;
}
