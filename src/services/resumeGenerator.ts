/**
 * Resume generator service
 * Orchestrates parsing, template rendering, and PDF/HTML generation
 */

import type { Resume } from '@resume-types/resume.types';
import type { TemplateOptions, ResumeTemplate } from '@resume-types/template.types';
import { parseResume } from '@utils/resumeParser';
import { getTemplate } from '@templates/templateRegistry';
import { generateHtmlFile, generateHtmlString } from '@utils/htmlGenerator';
import { generatePdfFromHtml, calculatePageCount, getBrowser } from '@utils/pdfGenerator';
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
 * Autofit resume to fit on one page using binary search
 * Scales typography values (font sizes and line-heights) using a multiplier
 * @param resume - Resume data object
 * @param template - Template instance to render with
 * @param templateOptions - Optional template options (will be extended with multiplier)
 * @returns HTML string with optimal multiplier applied
 */
async function autofitResumeToPage(
  resume: Resume,
  template: ResumeTemplate,
  templateOptions?: TemplateOptions
): Promise<string> {
  const MIN_MULTIPLIER = 0.818; // 9pt / 11pt
  const MAX_MULTIPLIER = 1.0;
  const MULTIPLIER_STEP = 0.023; // ~0.25pt steps for rounding precision
  const EPSILON = 0.001; // Small value for bound increments to prevent infinite loops
  const MAX_ITERATIONS = 20; // Safety limit for binary search

  // Create a single page for all calculations (performance optimization)
  const browser = await getBrowser();
  if (!browser) {
    throw new Error('Browser instance not available');
  }
  const page = await browser.newPage();

  try {
    // Setup viewport once (reused for all calculations)
    await page.setViewport({
      width: 816, // Letter width at 96 DPI
      height: 1056, // Letter height at 96 DPI
      deviceScaleFactor: 1,
    });

    // Render initial HTML with multiplier 1.0 (11pt base)
    let html = template.render(resume, { ...templateOptions, multiplier: MAX_MULTIPLIER });

    // Check initial page count (reuse page)
    logger.debug('Checking initial page count...');
    const initialCount = await calculatePageCount(html, page); // Pass page as required parameter
    logger.debug(`Initial page count: ${initialCount.pageCount}`);

    if (initialCount.pageCount <= 1) {
      logger.debug('Resume already fits on one page at 11pt - skipping autofit');
      return html; // Already fits at 11pt - early exit!
    }

    // Helper to round to nearest step
    const roundToStep = (mult: number): number => {
      return Math.round(mult / MULTIPLIER_STEP) * MULTIPLIER_STEP;
    };

    let low = MIN_MULTIPLIER;
    let high = MAX_MULTIPLIER;
    let bestMultiplier = MAX_MULTIPLIER;
    let bestHtml = html;
    let iterations = 0;

    logger.debug(`Starting binary search autofit (range: ${MIN_MULTIPLIER} to ${MAX_MULTIPLIER})`);

    // Binary search with page reuse (performance optimization)
    while (high >= low && iterations < MAX_ITERATIONS) {
      iterations++;
      const mid = roundToStep((low + high) / 2);

      // Ensure mid is within bounds
      if (mid < low || mid > high) {
        break;
      }

      logger.debug(`Iteration ${iterations}: Trying multiplier ${mid.toFixed(3)} (≈${(11 * mid).toFixed(1)}pt)`);

      // Re-render template with new multiplier
      const updatedHtml = template.render(resume, { ...templateOptions, multiplier: mid });

      // Reuse the same page for calculation (no page creation overhead)
      const result = await calculatePageCount(updatedHtml, page); // Pass page as required parameter

      logger.debug(`  Page count: ${result.pageCount}`);

      if (result.pageCount <= 1) {
        bestMultiplier = mid;
        bestHtml = updatedHtml;
        low = mid + EPSILON; // Try larger multiplier (to find maximum that fits)
        logger.debug(`  ✓ Fits! Trying larger multiplier...`);
      } else {
        high = Math.max(mid - EPSILON, low); // Ensure high doesn't go below low
        logger.debug(`  ✗ Doesn't fit, trying smaller multiplier...`);
      }
    }

    // Check if the best result from binary search still doesn't fit
    const bestResult = await calculatePageCount(bestHtml, page);
    if (bestResult.pageCount > 1) {
      logger.debug(`Binary search result still doesn't fit (${bestResult.pageCount} pages). Trying minimum multiplier ${MIN_MULTIPLIER.toFixed(3)} (≈${(11 * MIN_MULTIPLIER).toFixed(1)}pt)...`);
      const minHtml = template.render(resume, { ...templateOptions, multiplier: MIN_MULTIPLIER });
      const minResult = await calculatePageCount(minHtml, page);
      logger.debug(`  Page count: ${minResult.pageCount}`);

      bestMultiplier = MIN_MULTIPLIER;
      bestHtml = minHtml;

      if (minResult.pageCount <= 1) {
        logger.debug(`  ✓ Fits at minimum multiplier!`);
      } else {
        logger.debug(`  ✗ Still doesn't fit at minimum multiplier`);
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      logger.warn(`Binary search reached max iterations (${MAX_ITERATIONS}), using best result`);
    }

    if (bestMultiplier < MAX_MULTIPLIER) {
      logger.info(`Autofit applied: multiplier ${bestMultiplier.toFixed(3)} (≈${(11 * bestMultiplier).toFixed(1)}pt)`);
    } else if (bestMultiplier === MIN_MULTIPLIER && initialCount.pageCount > 1) {
      logger.warn(`Content still doesn't fit at minimum multiplier (${MIN_MULTIPLIER}), using minimum size`);
    }

    return bestHtml;
  } catch (error) {
    logger.error(`Autofit failed: ${error instanceof Error ? error.message : String(error)}`);
    // Fall back to original HTML if autofit fails
    return template.render(resume, { ...templateOptions, multiplier: MAX_MULTIPLIER });
  } finally {
    // Clean up page once at the end (caller's responsibility)
    await page.close();
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

  // Generate HTML with autofit for PDF, or direct render for HTML
  let html: string;
  if (outputFormat === 'pdf') {
    logger.debug('Rendering template with autofit to fit on one page...');
    html = await autofitResumeToPage(resume, template, templateOptions);
  } else {
    logger.debug('Rendering template...');
    html = template.render(resume, templateOptions);
  }

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

  // Generate HTML with autofit for PDF, or direct render for HTML
  let html: string;
  if (outputFormat === 'pdf') {
    logger.debug('Rendering template with autofit to fit on one page...');
    html = await autofitResumeToPage(resume, template, templateOptions);
  } else {
    logger.debug('Rendering template...');
    html = template.render(resume, templateOptions);
  }

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
