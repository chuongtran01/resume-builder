/**
 * API middleware for request validation and error handling
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  error: 'Validation Error';
  message: string;
  details: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Zod schema for PersonalInfo
 */
const personalInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  location: z.string().min(1, 'Location is required'),
  linkedin: z.string().url('Invalid LinkedIn URL').optional(),
  github: z.string().url('Invalid GitHub URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
});

/**
 * Zod schema for Experience
 */
const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$|^Present$/, 'Start date must be in YYYY-MM format or "Present"'),
  endDate: z.string().regex(/^\d{4}-\d{2}$|^Present$/, 'End date must be in YYYY-MM format or "Present"'),
  location: z.string().min(1, 'Location is required'),
  bulletPoints: z.array(z.string().min(1, 'Bullet point cannot be empty')).min(1, 'At least one bullet point is required'),
});

/**
 * Zod schema for Education
 */
const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  graduationDate: z.string().regex(/^\d{4}-\d{2}$/, 'Graduation date must be in YYYY-MM format'),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
});

/**
 * Zod schema for SkillCategory
 */
const skillCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  items: z.array(z.string().min(1, 'Skill item cannot be empty')).min(1, 'At least one skill item is required'),
});

/**
 * Zod schema for Skills
 */
const skillsSchema = z.object({
  categories: z.array(skillCategorySchema).min(1, 'At least one skill category is required'),
});

/**
 * Zod schema for Certification
 */
const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
  expirationDate: z.string().regex(/^\d{4}-\d{2}$/, 'Expiration date must be in YYYY-MM format').optional(),
  credentialId: z.string().optional(),
});

/**
 * Zod schema for Project
 */
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  technologies: z.array(z.string().min(1, 'Technology cannot be empty')),
  url: z.string().url('Invalid URL').optional(),
  github: z.string().url('Invalid GitHub URL').optional(),
});

/**
 * Zod schema for Language
 */
const languageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  proficiency: z.string().min(1, 'Proficiency level is required'),
});

/**
 * Zod schema for Award
 */
const awardSchema = z.object({
  name: z.string().min(1, 'Award name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
  description: z.string().optional(),
});

/**
 * Zod schema for Resume (full resume object)
 * Note: This doesn't support file: references - those should be resolved before validation
 */
export const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().optional(),
  experience: z.array(experienceSchema).min(1, 'At least one experience entry is required'),
  education: z.union([educationSchema, z.array(educationSchema)]).optional(),
  skills: skillsSchema.optional(),
  certifications: z.union([certificationSchema, z.array(certificationSchema)]).optional(),
  projects: z.array(projectSchema).optional(),
  languages: z.union([languageSchema, z.array(languageSchema)]).optional(),
  awards: z.union([awardSchema, z.array(awardSchema)]).optional(),
});

/**
 * Zod schema for TemplateOptions
 */
const templateOptionsSchema = z.object({
  pageBreaks: z.boolean().optional(),
  customCss: z.string().optional(),
  printStyles: z.boolean().optional(),
  spacing: z.enum(['compact', 'normal', 'auto']).optional(),
});

/**
 * Zod schema for GenerateResume request body
 */
export const generateResumeRequestSchema = z.object({
  resume: resumeSchema,
  options: z.object({
    template: z.string().min(1, 'Template name is required').optional(),
    format: z.enum(['pdf', 'html']).optional(),
    validate: z.boolean().optional(),
    templateOptions: templateOptionsSchema.optional(),
  }).optional(),
});

/**
 * Zod schema for ValidateResume request body
 */
export const validateResumeRequestSchema = z.object({
  resume: resumeSchema,
});

/**
 * Zod schema for EnhancementOptions
 */
const enhancementOptionsSchema = z.object({
  focusAreas: z.array(z.enum(['keywords', 'bulletPoints', 'skills', 'summary'])).optional(),
  tone: z.enum(['professional', 'technical', 'leadership']).optional(),
  maxSuggestions: z.number().int().positive().optional(),
});

/**
 * Zod schema for EnhanceResume request body
 */
export const enhanceResumeRequestSchema = z.object({
  resume: resumeSchema,
  jobDescription: z.string().min(1, 'Job description is required'),
  options: enhancementOptionsSchema.optional(),
});

/**
 * Format Zod error for API response
 */
function formatZodError(error: ZodError): ValidationErrorResponse {
  return {
    error: 'Validation Error',
    message: 'Request validation failed',
    details: error.issues.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and parse request body
      const validatedData = schema.parse(req.body);
      
      // Replace req.body with validated data (ensures type safety)
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse = formatZodError(error);
        
        logger.warn(`Validation error: ${errorResponse.message}`);
        if (logger.isVerbose()) {
          logger.debug(`Validation details: ${JSON.stringify(errorResponse.details, null, 2)}`);
        }
        
        res.status(400).json(errorResponse);
      } else {
        // Unexpected error
        logger.error(`Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred during validation',
        });
      }
    }
  };
}

/**
 * Type-safe request body extractor
 * Use this to get the validated request body with proper typing
 */
export function getValidatedBody<T>(req: Request): T {
  return req.body as T;
}
