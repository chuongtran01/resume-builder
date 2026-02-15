/**
 * API routes for resume builder
 */

import { Express, Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { logger } from '@utils/logger';
import { generateResumeFromObject, TemplateNotFoundError } from '@services/resumeGenerator';
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

      // Temporary provider name for this request (will be cleaned up)
      const tempProviderName = `gemini-${requestId}`;
      let providerRegistered = false;

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
          aiProvider?: 'gemini';
          aiModel?: 'gemini-2.5-pro' | 'gemini-3-flash-preview';
          aiOptions?: {
            temperature?: number;
            maxTokens?: number;
            timeout?: number;
            maxRetries?: number;
          };
        }>(req);
        const { resume, jobDescription, options, aiProvider, aiModel, aiOptions } = body;

        logger.debug(`[${requestId}] Enhancing resume with ${jobDescription.length} character job description`);

        // Load AI configuration and set up provider
        const { loadAIConfig, getGeminiConfig } = await import('../services/ai/config');
        const { GeminiProvider } = await import('../services/ai/gemini');
        const { registerProvider, unregisterProvider } = await import('../services/ai/providerRegistry');

        // Load base AI config
        const aiConfig = await loadAIConfig({ loadFromEnv: true });
        const baseGeminiConfig = getGeminiConfig(aiConfig);

        if (!baseGeminiConfig || !baseGeminiConfig.apiKey) {
          res.status(400).json({
            success: false,
            error: 'Configuration error',
            message: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env file.',
          });
          return;
        }

        // Determine provider to use (default to 'gemini' if not specified)
        const providerToUse = aiProvider || 'gemini';

        if (providerToUse !== 'gemini') {
          res.status(400).json({
            success: false,
            error: 'Invalid provider',
            message: `Provider "${providerToUse}" is not supported. Only "gemini" is currently supported.`,
          });
          return;
        }

        // Merge base config with request overrides
        const finalGeminiConfig = {
          ...baseGeminiConfig,
          model: aiModel || baseGeminiConfig.model || 'gemini-2.5-pro',
          temperature: aiOptions?.temperature !== undefined ? aiOptions.temperature : (baseGeminiConfig.temperature ?? 0.7),
          maxTokens: aiOptions?.maxTokens !== undefined ? aiOptions.maxTokens : baseGeminiConfig.maxTokens,
          timeout: aiOptions?.timeout !== undefined ? aiOptions.timeout : baseGeminiConfig.timeout,
          maxRetries: aiOptions?.maxRetries !== undefined ? aiOptions.maxRetries : baseGeminiConfig.maxRetries,
        };

        // Create and register provider with request-specific config
        const geminiProvider = new GeminiProvider(finalGeminiConfig);
        registerProvider(tempProviderName, geminiProvider);
        providerRegistered = true;

        logger.info(`[${requestId}] Using AI provider: ${providerToUse}, model: ${finalGeminiConfig.model}, temperature: ${finalGeminiConfig.temperature}`);

        // Create enhancement service with the temporary provider
        const { AIResumeEnhancementService } = await import('../services/aiResumeEnhancementService');
        const enhancementService = new AIResumeEnhancementService(tempProviderName);
        
        // Enhance resume
        const enhancementResult = await enhancementService.enhanceResume(
          resume,
          jobDescription,
          options
        );

        // Get provider info for response
        const providerInfo = geminiProvider.getProviderInfo();

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
            template: 'classic',
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
          provider: {
            name: providerInfo.name,
            displayName: providerInfo.displayName,
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

        // Clean up temporary provider
        if (providerRegistered) {
          try {
            unregisterProvider(tempProviderName);
            logger.debug(`[${requestId}] Cleaned up temporary provider: ${tempProviderName}`);
          } catch (cleanupError) {
            logger.warn(`[${requestId}] Failed to clean up temporary provider: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(`[${requestId}] Request completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${requestId}] Error enhancing resume (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);

        // Clean up temporary provider on error
        if (providerRegistered) {
          try {
            const { unregisterProvider } = await import('../services/ai/providerRegistry');
            unregisterProvider(tempProviderName);
          } catch (cleanupError) {
            logger.warn(`[${requestId}] Failed to clean up temporary provider on error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
          }
        }

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
          // Handle AI provider errors
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
              error: 'AI provider error',
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
