/**
 * API routes for resume builder
 */

import { Express, Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { logger } from '@utils/logger';
import { generateResumeFromObject } from '@services/resumeGenerator';
import { PdfGenerationError } from '@utils/pdfGenerator';
import {
  validateRequest,
  generateResumeRequestSchema,
  validateResumeRequestSchema,
  enhanceResumeRequestSchema,
  getValidatedBody,
} from '@api/middleware';
import { validateAtsCompliance } from '@services/atsValidator';
import type { Resume } from '@resume-types/resume.types';

/**
 * Type for validated generate resume request body
 */
type GenerateResumeRequestBody = {
  resume: Resume;
  options?: {
    format?: 'pdf' | 'html';
    validate?: boolean;
    templateOptions?: {
      pageBreaks?: boolean;
      customCss?: string;
      printStyles?: boolean;
      multiplier?: number;
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
        const format = options.format || 'pdf';
        const runValidation = options.validate || false;
        const templateOptions = options.templateOptions;

        logger.debug(`[${requestId}] Format: ${format}, Validate: ${runValidation}`);

        // Create temporary output file
        const tempDir = os.tmpdir();
        const outputFileName = `resume-${requestId}.${format}`;
        const outputPath = path.join(tempDir, outputFileName);

        // Generate resume
        const result = await generateResumeFromObject(resume, outputPath, {
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

        if (error instanceof PdfGenerationError) {
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

  // POST /api/validate - Validate resume for ATS compliance
  app.post(
    '/api/validate',
    validateRequest(validateResumeRequestSchema),
    async (req: Request, res: Response) => {
      const startTime = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        logger.info(`[${requestId}] POST /api/validate - Starting resume validation`);

        // Get validated request body
        const body = getValidatedBody<{ resume: Resume }>(req);
        const { resume } = body;

        // Run ATS validation
        const validationResult = validateAtsCompliance(resume);

        logger.info(`[${requestId}] Validation completed - Score: ${validationResult.score}/100, Compliant: ${validationResult.isCompliant}`);

        // Return validation results
        res.status(200).json({
          score: validationResult.score,
          isCompliant: validationResult.isCompliant,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          suggestions: validationResult.suggestions,
        });

        const duration = Date.now() - startTime;
        logger.info(`[${requestId}] Request completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${requestId}] Error validating resume (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);

        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'An error occurred while validating the resume',
        });
      }
    }
  );

  // POST /api/enhanceResume - Enhance resume based on job description
  app.post(
    '/api/enhanceResume',
    validateRequest(enhanceResumeRequestSchema),
    async (req: Request, res: Response) => {
      const startTime = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        logger.info(`[${requestId}] POST /api/enhanceResume - Starting resume enhancement`);

        // Get validated request body
        const body = getValidatedBody<{
          resume: Resume;
          jobDescription: string;
          options?: {
            focusAreas?: Array<'keywords' | 'bulletPoints' | 'skills' | 'summary'>;
            tone?: 'professional' | 'technical' | 'leadership';
            maxSuggestions?: number;
          };
          aiOptions?: {
            temperature?: number;
            maxTokens?: number;
            timeout?: number;
            maxRetries?: number;
          };
        }>(req);
        const { resume, jobDescription, options, aiOptions } = body;

        logger.debug(`[${requestId}] Enhancing resume with ${jobDescription.length} character job description`);

        // Load Gemini configuration and set up client
        const { loadGeminiConfig } = await import('../services/ai/config');
        const { createGeminiResumeClient } = await import('../services/ai/gemini');

        const geminiConfig = await loadGeminiConfig({ loadFromEnv: true });
        if (!geminiConfig?.apiKey) {
          res.status(400).json({
            success: false,
            error: 'Configuration error',
            message: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env file.',
          });
          return;
        }

        const finalGeminiConfig = {
          ...geminiConfig,
          temperature: aiOptions?.temperature ?? geminiConfig.temperature ?? 0.7,
          maxTokens: aiOptions?.maxTokens,
          timeout: aiOptions?.timeout ?? geminiConfig.timeout,
          maxRetries: aiOptions?.maxRetries ?? geminiConfig.maxRetries,
        };
        const geminiClient = createGeminiResumeClient(finalGeminiConfig);

        logger.info(`[${requestId}] Using Gemini model: ${finalGeminiConfig.model}, temperature: ${finalGeminiConfig.temperature}`);

        // Enhance resume
        const { enhanceResume } = await import('../services/aiResumeEnhancementService');
        const enhancementResult = await enhanceResume({
          resume,
          jobDescription,
          options,
          aiClient: geminiClient,
        });

        // Get provider info for response
        const geminiInfo = geminiClient.getProviderInfo();

        logger.info(`[${requestId}] Resume enhanced - ATS Score: ${enhancementResult.atsScore.before} → ${enhancementResult.atsScore.after} (+${enhancementResult.atsScore.improvement})`);

        // Create temporary output directory
        const tempDir = os.tmpdir();
        const outputDir = path.join(tempDir, `enhanced-${requestId}`);
        await fs.ensureDir(outputDir);

        // Generate enhanced JSON
        const { generateEnhancedResumeOutput, generateAndWriteEnhancedResume } = await import('../services/enhancedResumeGenerator');
        const baseName = 'enhanced-resume';
        await generateAndWriteEnhancedResume(enhancementResult, {
          outputDir,
          baseName,
        });

        // Generate PDF
        const pdfPath = path.join(outputDir, `${baseName}.pdf`);
        await generateResumeFromObject(
          enhancementResult.enhancedResume,
          pdfPath,
          {
            format: 'pdf',
            validate: false,
          }
        );

        // Generate Markdown report
        const { generateAndWriteMarkdownReport } = await import('../services/mdGenerator');
        const enhancedOutput = generateEnhancedResumeOutput(enhancementResult, {
          outputDir,
          baseName,
        });
        const mdPath = path.join(outputDir, `${baseName}.md`);
        await generateAndWriteMarkdownReport(enhancedOutput, mdPath);

        logger.info(`[${requestId}] All outputs generated successfully`);

        // Read PDF file for base64 encoding
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');

        // Read Markdown file
        const mdContent = await fs.readFile(mdPath, 'utf8');

        // Return enhanced resume output with all metadata
        res.status(200).json({
          success: true,
          enhancedResume: {
            ...enhancedOutput,
            pdfPath: undefined, // Don't include file paths in response
            mdPath: undefined,
          },
          atsScore: enhancementResult.atsScore,
          gemini: {
            name: geminiInfo.name,
            displayName: geminiInfo.displayName,
            model: finalGeminiConfig.model,
            temperature: finalGeminiConfig.temperature,
          },
          pdf: {
            base64: pdfBase64,
            contentType: 'application/pdf',
            filename: 'enhanced-resume.pdf',
            size: pdfBuffer.length,
          },
          markdown: {
            content: mdContent,
            filename: 'enhanced-resume.md',
          },
        });

        // Clean up temporary files after sending response
        fs.remove(outputDir).catch((err) => {
          logger.warn(`[${requestId}] Failed to clean up temporary files: ${err.message}`);
        });

        const duration = Date.now() - startTime;
        logger.info(`[${requestId}] Request completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${requestId}] Error enhancing resume (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);

        // Import error types for proper error handling
        const { PdfGenerationError } = await import('../utils/pdfGenerator');
        const { JsonWriteError } = await import('../services/enhancedResumeGenerator');
        const { MarkdownWriteError } = await import('../services/mdGenerator');
        const { AIProviderError, RateLimitError, NetworkError, TimeoutError } = await import('../services/ai/provider.types');

        if (error instanceof PdfGenerationError) {
          res.status(500).json({
            success: false,
            error: 'PDF generation failed',
            message: error.message,
          });
        } else if (error instanceof JsonWriteError || error instanceof MarkdownWriteError) {
          res.status(500).json({
            success: false,
            error: 'File generation failed',
            message: error.message,
          });
        } else if (error instanceof AIProviderError) {
          // Handle Gemini errors
          if (error instanceof RateLimitError) {
            res.status(429).json({
              success: false,
              error: 'Rate limit exceeded',
              message: error.message,
              retryAfter: error.retryAfter,
            });
          } else if (error instanceof NetworkError) {
            res.status(503).json({
              success: false,
              error: 'Network error',
              message: error.message,
            });
          } else if (error instanceof TimeoutError) {
            res.status(504).json({
              success: false,
              error: 'Request timeout',
              message: error.message,
            });
          } else {
            res.status(500).json({
              success: false,
              error: 'Gemini error',
              message: error.message,
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'An error occurred while enhancing the resume',
          });
        }
      }
    }
  );
}
