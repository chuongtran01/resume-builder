/**
 * Unit tests for htmlGenerator utility
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  generateHtmlFile,
  generateHtmlString,
  validateHtml,
  formatHtml,
  HtmlValidationError,
} from '../../src/utils/htmlGenerator';

describe('htmlGenerator', () => {
  const testDir = path.join(__dirname, '../fixtures/htmlGenerator');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  const validHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  describe('validateHtml', () => {
    it('should validate correct HTML', () => {
      const result = validateHtml(validHtml);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing DOCTYPE', () => {
      const html = '<html><head></head><body></body></html>';
      const result = validateHtml(html);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing DOCTYPE declaration');
    });

    it('should detect missing html tag', () => {
      const html = '<!DOCTYPE html><head></head><body></body>';
      const result = validateHtml(html);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing <html> tag');
    });

    it('should detect mismatched tags', () => {
      const html = '<!DOCTYPE html><html><head></head><body></html>';
      const result = validateHtml(html);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Mismatched'))).toBe(true);
    });
  });

  describe('formatHtml', () => {
    it('should format HTML with newlines', () => {
      const html = '<!DOCTYPE html><html><head></head><body></body></html>';
      const formatted = formatHtml(html);
      expect(formatted).toContain('\n');
      expect(formatted).toContain('<html');
      expect(formatted).toContain('</html>');
    });
  });

  describe('generateHtmlString', () => {
    it('should return HTML string when valid', () => {
      const result = generateHtmlString(validHtml);
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
    });

    it('should throw error for invalid HTML when validate=true', () => {
      const invalidHtml = '<html><head></head><body></html>';
      expect(() => generateHtmlString(invalidHtml, true)).toThrow(
        HtmlValidationError
      );
    });

    it('should not validate when validate=false', () => {
      const invalidHtml = '<html><head></head><body></html>';
      expect(() => generateHtmlString(invalidHtml, false)).not.toThrow();
    });
  });

  describe('generateHtmlFile', () => {
    it('should generate HTML file', async () => {
      const outputPath = path.join(testDir, 'test.html');
      await generateHtmlFile(validHtml, { outputPath });

      expect(await fs.pathExists(outputPath)).toBe(true);
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
    });

    it('should validate HTML before writing', async () => {
      const outputPath = path.join(testDir, 'test.html');
      const invalidHtml = '<html><head></head><body></html>';

      await expect(
        generateHtmlFile(invalidHtml, { outputPath, validate: true })
      ).rejects.toThrow(HtmlValidationError);
    });

    it('should skip validation when validate=false', async () => {
      const outputPath = path.join(testDir, 'test.html');
      const invalidHtml = '<html><head></head><body></html>';

      await generateHtmlFile(invalidHtml, { outputPath, validate: false });
      expect(await fs.pathExists(outputPath)).toBe(true);
    });

    it('should format HTML when format=true', async () => {
      const outputPath = path.join(testDir, 'test.html');
      const unformattedHtml = '<!DOCTYPE html><html><head></head><body></body></html>';

      await generateHtmlFile(unformattedHtml, { outputPath, format: true });
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('\n');
    });

    it('should create output directory if it does not exist', async () => {
      const outputPath = path.join(testDir, 'nested', 'test.html');
      await generateHtmlFile(validHtml, { outputPath });

      expect(await fs.pathExists(outputPath)).toBe(true);
    });
  });
});