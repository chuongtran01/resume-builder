/**
 * API routes for resume builder
 */

import { Express, Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';
import { generateResumeFromObject, TemplateNotFoundError } from '../services/resumeGenerator';
import { PdfGenerationError } from '../utils/pdfGenerator';
import {
  validateRequest,
  generateResumeRequestSchema,
  getValidatedBody,
} from './middleware';
import type { Resume } from '../types/resume.types';

/**
 * Type for validated generate resume request body
 */
type GenerateResumeRequestBody = {
  resume: Resume;
  options?: {
    template?: string;
    format?: 'pdf' | 'html';
    validate?: boolean;
    templateOptions?: {
      pageBreaks?: boolean;
      customCss?: string;
      printStyles?: boolean;
      spacing?: 'compact' | 'normal' | 'auto';
    };
  };
};

/**
 * Register API routes
 */
export function registerRoutes(app: Express): void {
  // POST /api/generateResume - Generate resume from JSON
  app.post(
    '/api/generateResume',
    validateRequest(generateResumeRequestSchema),
    async (req: Request, res: Response) => {
      const startTime = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        logger.info(`[${requestId}] POST /api/generateResume - Starting resume generation`);

        // Get validated request body
        const body = getValidatedBody<GenerateResumeRequestBody>(req);
        const { resume, options = {} } = body;

        // Extract options with defaults
        const template = options.template || 'classic';
        const format = options.format || 'pdf';
        const runValidation = options.validate || false;
        const templateOptions = options.templateOptions;

        logger.debug(`[${requestId}] Template: ${template}, Format: ${format}, Validate: ${runValidation}`);

        // Create temporary output file
        const tempDir = os.tmpdir();
        const outputFileName = `resume-${requestId}.${format}`;
        const outputPath = path.join(tempDir, outputFileName);

        // Generate resume
        const result = await generateResumeFromObject(resume, outputPath, {
          template,
          format,
          validate: runValidation,
          templateOptions,
        });

        logger.info(`[${requestId}] Resume generated successfully: ${result.outputPath} (${(result.fileSize / 1024).toFixed(2)} KB)`);

        // Read the generated file
        const fileBuffer = await fs.readFile(result.outputPath);

        // Set appropriate content-type headers
        const contentType = format === 'pdf' ? 'application/pdf' : 'text/html';
        const contentDisposition = `attachment; filename="resume.${format}"`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);
        res.setHeader('Content-Length', fileBuffer.length.toString());
        res.setHeader('X-Resume-Template', result.template);
        res.setHeader('X-Resume-Format', result.format);
        res.setHeader('X-Resume-Size', result.fileSize.toString());

        // Include ATS validation results in headers if available
        if (result.atsValidation) {
          res.setHeader('X-ATS-Score', result.atsValidation.score.toString());
          res.setHeader('X-ATS-Compliant', result.atsValidation.isCompliant ? 'true' : 'false');
        }

        // Send file
        res.status(200).send(fileBuffer);

        // Clean up temporary file after sending
        fs.remove(result.outputPath).catch((err) => {
          logger.warn(`[${requestId}] Failed to clean up temporary file: ${err.message}`);
        });

        const duration = Date.now() - startTime;
        logger.info(`[${requestId}] Request completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${requestId}] Error generating resume (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);

        if (error instanceof TemplateNotFoundError) {
          // Get available templates for error response
          try {
            const { getTemplateNames } = await import('../templates/templateRegistry');
            const availableTemplates = getTemplateNames();
            
            res.status(400).json({
              error: 'Invalid template',
              message: error.message,
              availableTemplates,
            });
          } catch (importError) {
            res.status(400).json({
              error: 'Invalid template',
              message: error.message,
            });
          }
        } else if (error instanceof PdfGenerationError) {
          res.status(500).json({
            error: 'PDF generation failed',
            message: error.message,
          });
        } else {
          res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'An error occurred while generating the resume',
          });
        }
      }
    }
  );
}
