/**
 * Resume generator service
 * Orchestrates parsing, template rendering, and PDF/HTML generation
 */

import type { Resume } from '@resume-types/resume.types';
import type { TemplateOptions } from '@resume-types/template.types';
import { parseResume } from '@utils/resumeParser';
import { getTemplate } from '@templates/templateRegistry';
import { generateHtmlFile, generateHtmlString } from '@utils/htmlGenerator';
import { generatePdfFromHtml } from '@utils/pdfGenerator';
import { validateAtsCompliance, type AtsValidationResult } from '@services/atsValidator';
import { logger } from '@utils/logger';
import * as fs from 'fs-extra';

/**
 * Output format options
 */
export type OutputFormat = 'pdf' | 'html';

/**
 * Generator options
 */
export interface GeneratorOptions {
  /** Template name to use (default: 'classic') */
  template?: string;
  /** Output format (default: 'pdf') */
  format?: OutputFormat;
  /** Whether to run ATS validation */
  validate?: boolean;
  /** Template rendering options */
  templateOptions?: TemplateOptions;
  /** Base directory for resolving file references */
  baseDir?: string;
}

/**
 * Generator result
 */
export interface GeneratorResult {
  /** Path to generated file */
  outputPath: string;
  /** Format of generated file */
  format: OutputFormat;
  /** Template used */
  template: string;
  /** File size in bytes */
  fileSize: number;
  /** ATS validation result (if validation was enabled) */
  atsValidation?: AtsValidationResult;
  /** Warnings from generation process */
  warnings: string[];
}

/**
 * Error thrown when template is not found
 */
export class TemplateNotFoundError extends Error {
  constructor(templateName: string, availableTemplates: string[]) {
    super(
      `Template "${templateName}" not found. Available templates: ${availableTemplates.join(', ')}`
    );
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Generates resume from JSON file
 * @param resumePath - Path to resume.json file
 * @param outputPath - Path for output file
 * @param options - Generator options
 * @returns Generator result
 */
export async function generateResumeFromFile(
  resumePath: string,
  outputPath: string,
  options: GeneratorOptions = {}
): Promise<GeneratorResult> {
  const {
    template: templateName = 'classic',
    format: outputFormat = 'pdf',
    validate: runValidation = false,
    templateOptions,
  } = options;

  logger.info(`Generating ${outputFormat.toUpperCase()} resume from: ${resumePath}`);

  // Parse resume
  logger.debug('Parsing resume...');
  const resume = await parseResume({
    resumePath,
    validate: true,
  });

  // Get template
  logger.debug(`Selecting template: ${templateName}`);
  const template = getTemplate(templateName);
  if (!template) {
    const { getTemplateNames } = await import('../templates/templateRegistry');
    const availableTemplates = getTemplateNames();
    throw new TemplateNotFoundError(templateName, availableTemplates);
  }

  // Run ATS validation if requested
  let atsValidation: AtsValidationResult | undefined;
  const warnings: string[] = [];

  if (runValidation) {
    logger.debug('Running ATS validation...');
    atsValidation = validateAtsCompliance(resume);
    warnings.push(...atsValidation.warnings);
    if (atsValidation.errors.length > 0) {
      logger.warn(`ATS validation found ${atsValidation.errors.length} errors`);
      warnings.push(...atsValidation.errors);
    }
  }

  // Render template to HTML
  logger.debug('Rendering template...');
  const html = template.render(resume, templateOptions);

  // Generate output based on format
  let finalOutputPath: string;
  let fileSize: number;

  if (outputFormat === 'html') {
    // Generate HTML file
    logger.debug('Generating HTML file...');
    finalOutputPath = await generateHtmlFile(html, {
      outputPath,
      validate: true,
    });

    const stats = await fs.stat(finalOutputPath);
    fileSize = stats.size;
  } else {
    // Generate PDF file
    logger.debug('Generating PDF file...');
    finalOutputPath = await generatePdfFromHtml(html, {
      outputPath,
    });

    const stats = await fs.stat(finalOutputPath);
    fileSize = stats.size;

    // Warn if PDF is too large
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > 2) {
      warnings.push(
        `Generated PDF is ${fileSizeMB.toFixed(2)}MB (recommended: < 2MB for ATS systems)`
      );
    }
  }

  logger.info(`Resume generated successfully: ${finalOutputPath} (${(fileSize / 1024).toFixed(2)}KB)`);

  return {
    outputPath: finalOutputPath,
    format: outputFormat,
    template: templateName,
    fileSize,
    atsValidation,
    warnings,
  };
}

/**
 * Generates resume from Resume object (useful for API)
 * @param resume - Resume object
 * @param outputPath - Path for output file
 * @param options - Generator options
 * @returns Generator result
 */
export async function generateResumeFromObject(
  resume: Resume,
  outputPath: string,
  options: GeneratorOptions = {}
): Promise<GeneratorResult> {
  const {
    template: templateName = 'classic',
    format: outputFormat = 'pdf',
    validate: runValidation = false,
    templateOptions,
  } = options;

  logger.info(`Generating ${outputFormat.toUpperCase()} resume from Resume object`);

  // Get template
  logger.debug(`Selecting template: ${templateName}`);
  const template = getTemplate(templateName);
  if (!template) {
    const { getTemplateNames } = await import('../templates/templateRegistry');
    const availableTemplates = getTemplateNames();
    throw new TemplateNotFoundError(templateName, availableTemplates);
  }

  // Run ATS validation if requested
  let atsValidation: AtsValidationResult | undefined;
  const warnings: string[] = [];

  if (runValidation) {
    logger.debug('Running ATS validation...');
    atsValidation = validateAtsCompliance(resume);
    warnings.push(...atsValidation.warnings);
    if (atsValidation.errors.length > 0) {
      logger.warn(`ATS validation found ${atsValidation.errors.length} errors`);
      warnings.push(...atsValidation.errors);
    }
  }

  // Render template to HTML
  logger.debug('Rendering template...');
  const html = template.render(resume, templateOptions);

  // Generate output based on format
  let finalOutputPath: string;
  let fileSize: number;

  if (outputFormat === 'html') {
    // Generate HTML file
    logger.debug('Generating HTML file...');
    finalOutputPath = await generateHtmlFile(html, {
      outputPath,
      validate: true,
    });

    const stats = await fs.stat(finalOutputPath);
    fileSize = stats.size;
  } else {
    // Generate PDF file
    logger.debug('Generating PDF file...');
    finalOutputPath = await generatePdfFromHtml(html, {
      outputPath,
    });

    const stats = await fs.stat(finalOutputPath);
    fileSize = stats.size;

    // Warn if PDF is too large
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > 2) {
      warnings.push(
        `Generated PDF is ${fileSizeMB.toFixed(2)}MB (recommended: < 2MB for ATS systems)`
      );
    }
  }

  logger.info(`Resume generated successfully: ${finalOutputPath} (${(fileSize / 1024).toFixed(2)}KB)`);

  return {
    outputPath: finalOutputPath,
    format: outputFormat,
    template: templateName,
    fileSize,
    atsValidation,
    warnings,
  };
}

/**
 * Generates HTML string from Resume object (useful for API responses)
 * @param resume - Resume object
 * @param options - Generator options
 * @returns HTML string
 */
export async function generateResumeHtml(
  resume: Resume,
  options: Omit<GeneratorOptions, 'format'> = {}
): Promise<string> {
  const { template: templateName = 'classic', templateOptions } = options;

  // Get template
  const template = getTemplate(templateName);
  if (!template) {
    const { getTemplateNames } = await import('../templates/templateRegistry');
    const availableTemplates = getTemplateNames();
    throw new TemplateNotFoundError(templateName, availableTemplates);
  }

  // Render template to HTML
  const html = template.render(resume, templateOptions);

  // Validate and return HTML string
  return generateHtmlString(html, true);
}
