/**
 * PDF generator utility
 * Converts HTML to PDF using Puppeteer
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from './logger';

/**
 * Options for PDF generation
 */
export interface PdfGeneratorOptions {
  /** Output file path */
  outputPath: string;
  /** PDF format (default: 'Letter') */
  format?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
  /** Margins in inches */
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Whether to print background graphics */
  printBackground?: boolean;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to display header and footer */
  displayHeaderFooter?: boolean;
}

/**
 * Error thrown when PDF generation fails
 */
export class PdfGenerationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(`PDF generation failed: ${message}`);
    this.name = 'PdfGenerationError';
    this.cause = originalError;
  }
}

/**
 * Default PDF options
 */
const DEFAULT_PDF_OPTIONS: Required<Omit<PdfGeneratorOptions, 'outputPath'>> = {
  format: 'Letter',
  margins: {
    top: '0.5in',
    right: '0.5in',
    bottom: '0.5in',
    left: '0.5in',
  },
  printBackground: true,
  timeout: 30000,
  displayHeaderFooter: false,
};

/**
 * Browser instance cache (reuse browser for performance)
 */
let browserInstance: Browser | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    logger.debug('Launching Puppeteer browser...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    logger.debug('Browser launched successfully');
  }
  return browserInstance;
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.debug('Puppeteer browser closed');
  }
}

/**
 * Generates PDF from HTML string
 * @param html - HTML string to convert to PDF
 * @param options - PDF generation options
 * @returns Path to generated PDF file
 */
export async function generatePdfFromHtml(
  html: string,
  options: PdfGeneratorOptions
): Promise<string> {
  const {
    outputPath,
    format = DEFAULT_PDF_OPTIONS.format,
    margins = DEFAULT_PDF_OPTIONS.margins,
    printBackground = DEFAULT_PDF_OPTIONS.printBackground,
    timeout = DEFAULT_PDF_OPTIONS.timeout,
    displayHeaderFooter = DEFAULT_PDF_OPTIONS.displayHeaderFooter,
  } = options;

  logger.debug(`Generating PDF from HTML: ${outputPath}`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.ensureDir(outputDir);

  let page: Page | null = null;
  let browser: Browser | null = null;

  try {
    // Get browser instance
    browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set content with timeout
    await Promise.race([
      page.setContent(html, { waitUntil: 'networkidle0' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('HTML loading timeout')), timeout)
      ),
    ]).catch((error) => {
      throw new PdfGenerationError(`Failed to load HTML content: ${error.message}`, error);
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format,
      margin: margins,
      printBackground,
      displayHeaderFooter,
      preferCSSPageSize: false,
    });

    // Write PDF file
    await fs.writeFile(outputPath, pdfBuffer);

    // Check file size
    const stats = await fs.stat(outputPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 2) {
      logger.warn(`Generated PDF is large: ${fileSizeMB.toFixed(2)}MB (recommended: < 2MB)`);
    }

    logger.debug(`PDF generated successfully: ${outputPath} (${fileSizeMB.toFixed(2)}MB)`);

    return outputPath;
  } catch (error) {
    if (error instanceof PdfGenerationError) {
      throw error;
    }
    throw new PdfGenerationError(
      `Unexpected error during PDF generation: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  } finally {
    // Close page
    if (page) {
      await page.close().catch(() => {
        // Ignore errors when closing page
      });
    }
  }
}

/**
 * Generates PDF from HTML file
 * @param htmlFilePath - Path to HTML file
 * @param options - PDF generation options
 * @returns Path to generated PDF file
 */
export async function generatePdfFromFile(
  htmlFilePath: string,
  options: PdfGeneratorOptions
): Promise<string> {
  // Check if HTML file exists
  const exists = await fs.pathExists(htmlFilePath);
  if (!exists) {
    throw new PdfGenerationError(`HTML file not found: ${htmlFilePath}`);
  }

  // Read HTML file
  const html = await fs.readFile(htmlFilePath, 'utf-8');

  // Generate PDF from HTML
  return generatePdfFromHtml(html, options);
}
