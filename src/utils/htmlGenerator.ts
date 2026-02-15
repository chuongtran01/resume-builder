/**
 * HTML generator utility
 * Generates standalone HTML files from template output
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from '@utils/logger';

/**
 * Options for HTML generation
 */
export interface HtmlGeneratorOptions {
  /** Output file path */
  outputPath: string;
  /** Whether to validate HTML */
  validate?: boolean;
  /** Whether to format/beautify HTML */
  format?: boolean;
}

/**
 * Error thrown when HTML validation fails
 */
export class HtmlValidationError extends Error {
  constructor(message: string) {
    super(`HTML validation failed: ${message}`);
    this.name = 'HtmlValidationError';
  }
}

/**
 * Validates basic HTML structure
 * @param html - HTML string to validate
 * @returns True if HTML appears valid
 */
export function validateHtml(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for DOCTYPE
  if (!html.includes('<!DOCTYPE')) {
    errors.push('Missing DOCTYPE declaration');
  }

  // Check for html tag
  if (!html.includes('<html')) {
    errors.push('Missing <html> tag');
  }

  // Check for head tag
  if (!html.includes('<head')) {
    errors.push('Missing <head> tag');
  }

  // Check for body tag
  if (!html.includes('<body')) {
    errors.push('Missing <body> tag');
  }

  // Check for closing tags
  if ((html.match(/<html/g) || []).length !== (html.match(/<\/html>/g) || []).length) {
    errors.push('Mismatched <html> tags');
  }

  if ((html.match(/<head/g) || []).length !== (html.match(/<\/head>/g) || []).length) {
    errors.push('Mismatched <head> tags');
  }

  if ((html.match(/<body/g) || []).length !== (html.match(/<\/body>/g) || []).length) {
    errors.push('Mismatched <body> tags');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats HTML for better readability (basic formatting)
 * @param html - HTML string to format
 * @returns Formatted HTML string
 */
export function formatHtml(html: string): string {
  // Basic HTML formatting - add newlines after major tags
  let formatted = html
    .replace(/(<html[^>]*>)/gi, '$1\n')
    .replace(/(<\/html>)/gi, '\n$1')
    .replace(/(<head[^>]*>)/gi, '$1\n')
    .replace(/(<\/head>)/gi, '\n$1')
    .replace(/(<body[^>]*>)/gi, '$1\n')
    .replace(/(<\/body>)/gi, '\n$1')
    .replace(/(<style[^>]*>)/gi, '$1\n')
    .replace(/(<\/style>)/gi, '\n$1');

  // Clean up excessive newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

/**
 * Generates a standalone HTML file from template HTML
 * @param html - HTML string from template
 * @param options - Generation options
 * @returns Path to generated HTML file
 */
export async function generateHtmlFile(
  html: string,
  options: HtmlGeneratorOptions
): Promise<string> {
  const { outputPath, validate = true, format = false } = options;

  logger.debug(`Generating HTML file: ${outputPath}`);

  // Validate HTML if requested
  if (validate) {
    const validation = validateHtml(html);
    if (!validation.isValid) {
      throw new HtmlValidationError(validation.errors.join(', '));
    }
  }

  // Format HTML if requested
  const finalHtml = format ? formatHtml(html) : html;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.ensureDir(outputDir);

  // Write HTML file
  await fs.writeFile(outputPath, finalHtml, 'utf-8');

  logger.debug(`HTML file generated successfully: ${outputPath}`);

  return outputPath;
}

/**
 * Generates HTML string (doesn't write to file)
 * Useful for API responses
 * @param html - HTML string from template
 * @param validate - Whether to validate HTML
 * @returns Validated/formatted HTML string
 */
export function generateHtmlString(html: string, validate = true): string {
  // Validate HTML if requested
  if (validate) {
    const validation = validateHtml(html);
    if (!validation.isValid) {
      throw new HtmlValidationError(validation.errors.join(', '));
    }
  }

  return html;
}
