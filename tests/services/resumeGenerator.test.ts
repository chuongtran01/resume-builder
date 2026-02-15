/**
 * Unit tests for resume generator service
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  generateResumeFromFile,
  generateResumeFromObject,
  generateResumeHtml,
  TemplateNotFoundError,
} from '../../src/services/resumeGenerator';
import type { Resume } from '../../src/types/resume.types';

// Import templates to ensure they are registered
import '../../src/templates';

// Mock dependencies
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock PDF generator to return a file path and create the file
jest.mock('../../src/utils/pdfGenerator', () => ({
  generatePdfFromHtml: jest.fn().mockImplementation(async (_html: string, options: { outputPath: string }) => {
    const fs = require('fs-extra');
    await fs.ensureDir(require('path').dirname(options.outputPath));
    await fs.writeFile(options.outputPath, Buffer.from('mock pdf content'));
    return options.outputPath;
  }),
}));

describe('ResumeGenerator', () => {
  const testResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 123-456-7890',
      location: 'San Francisco, CA',
    },
    summary: 'Software engineer with 5 years of experience',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: ['Built scalable APIs', 'Led team of 5'],
      },
    ],
  };

  const testResumePath = path.join(__dirname, '../fixtures/test-resume.json');
  const testOutputPath = path.join(__dirname, '../output/test-resume.pdf');

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure output directory exists
    fs.ensureDirSync(path.dirname(testOutputPath));
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputPath)) {
      fs.removeSync(testOutputPath);
    }
  });

  describe('generateResumeFromFile', () => {
    it('should generate PDF from resume file', async () => {
      // Create test resume file
      await fs.ensureDir(path.dirname(testResumePath));
      await fs.writeJson(testResumePath, testResume);

      const result = await generateResumeFromFile(testResumePath, testOutputPath, {
        template: 'modern',
        format: 'pdf',
      });

      expect(result.format).toBe('pdf');
      expect(result.template).toBe('modern');
      expect(result.outputPath).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should generate HTML from resume file', async () => {
      // Create test resume file
      await fs.ensureDir(path.dirname(testResumePath));
      await fs.writeJson(testResumePath, testResume);

      const htmlOutputPath = testOutputPath.replace('.pdf', '.html');
      const result = await generateResumeFromFile(testResumePath, htmlOutputPath, {
        template: 'modern',
        format: 'html',
      });

      expect(result.format).toBe('html');
      expect(result.template).toBe('modern');
      expect(result.outputPath).toBe(htmlOutputPath);
      expect(fs.existsSync(htmlOutputPath)).toBe(true);

      // Clean up
      if (fs.existsSync(htmlOutputPath)) {
        fs.removeSync(htmlOutputPath);
      }
    });

    it('should throw error for invalid template', async () => {
      await fs.ensureDir(path.dirname(testResumePath));
      await fs.writeJson(testResumePath, testResume);

      await expect(
        generateResumeFromFile(testResumePath, testOutputPath, {
          template: 'invalid-template',
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('should run ATS validation when requested', async () => {
      await fs.ensureDir(path.dirname(testResumePath));
      await fs.writeJson(testResumePath, testResume);

      const result = await generateResumeFromFile(testResumePath, testOutputPath, {
        template: 'modern',
        validate: true,
      });

      expect(result.atsValidation).toBeDefined();
      expect(result.atsValidation?.score).toBeGreaterThanOrEqual(0);
      expect(result.atsValidation?.score).toBeLessThanOrEqual(100);
    });

    it('should include warnings in result', async () => {
      await fs.ensureDir(path.dirname(testResumePath));
      await fs.writeJson(testResumePath, testResume);

      const result = await generateResumeFromFile(testResumePath, testOutputPath, {
        template: 'modern',
        validate: true,
      });

      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('generateResumeFromObject', () => {
    it('should generate PDF from Resume object', async () => {
      const result = await generateResumeFromObject(testResume, testOutputPath, {
        template: 'modern',
        format: 'pdf',
      });

      expect(result.format).toBe('pdf');
      expect(result.template).toBe('modern');
      expect(result.outputPath).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should generate HTML from Resume object', async () => {
      const htmlOutputPath = testOutputPath.replace('.pdf', '.html');
      const result = await generateResumeFromObject(testResume, htmlOutputPath, {
        template: 'modern',
        format: 'html',
      });

      expect(result.format).toBe('html');
      expect(result.template).toBe('modern');
      expect(result.outputPath).toBe(htmlOutputPath);
      expect(fs.existsSync(htmlOutputPath)).toBe(true);

      // Clean up
      if (fs.existsSync(htmlOutputPath)) {
        fs.removeSync(htmlOutputPath);
      }
    });

    it('should throw error for invalid template', async () => {
      await expect(
        generateResumeFromObject(testResume, testOutputPath, {
          template: 'invalid-template',
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('should run ATS validation when requested', async () => {
      const result = await generateResumeFromObject(testResume, testOutputPath, {
        template: 'modern',
        validate: true,
      });

      expect(result.atsValidation).toBeDefined();
      expect(result.atsValidation?.score).toBeGreaterThanOrEqual(0);
      expect(result.atsValidation?.score).toBeLessThanOrEqual(100);
    });

    it('should support different templates', async () => {
      const templates = ['modern', 'classic'];

      for (const template of templates) {
        const result = await generateResumeFromObject(testResume, testOutputPath, {
          template,
          format: 'pdf',
        });

        expect(result.template).toBe(template);
      }
    });
  });

  describe('generateResumeHtml', () => {
    it('should generate HTML string from Resume object', async () => {
      const html = await generateResumeHtml(testResume, {
        template: 'modern',
      });

      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
    });

    it('should throw error for invalid template', async () => {
      await expect(
        generateResumeHtml(testResume, {
          template: 'invalid-template',
        })
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('should support different templates', async () => {
      const templates = ['modern', 'classic'];

      for (const template of templates) {
        const html = await generateResumeHtml(testResume, { template });
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('John Doe');
      }
    });
  });

  describe('error handling', () => {
    it('should handle missing resume file gracefully', async () => {
      const nonExistentPath = path.join(__dirname, '../fixtures/non-existent.json');

      await expect(
        generateResumeFromFile(nonExistentPath, testOutputPath)
      ).rejects.toThrow();
    });

    it('should handle invalid JSON gracefully', async () => {
      const invalidJsonPath = path.join(__dirname, '../fixtures/invalid-resume.json');
      await fs.ensureDir(path.dirname(invalidJsonPath));
      await fs.writeFile(invalidJsonPath, '{ invalid json }');

      await expect(
        generateResumeFromFile(invalidJsonPath, testOutputPath)
      ).rejects.toThrow();
    });
  });
});
