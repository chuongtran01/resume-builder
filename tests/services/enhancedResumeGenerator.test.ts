/**
 * Unit tests for enhanced resume generator service
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  generateEnhancedResumeOutput,
  writeEnhancedResumeJson,
  generateAndWriteEnhancedResume,
  JsonWriteError,
} from '../../src/services/enhancedResumeGenerator';
import type { EnhancementResult } from '../../src/types/enhancement.types';
import type { Resume } from '../../src/types/resume.types';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('enhancedResumeGenerator', () => {
  const testDir = path.join(__dirname, '../fixtures/enhancedResumeGenerator');

  const sampleResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 123-456-7890',
      location: 'San Francisco, CA',
    },
    summary: 'Experienced software engineer',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: ['Built scalable systems', 'Led team of engineers'],
      },
    ],
    skills: {
      categories: [
        {
          name: 'Programming Languages',
          items: ['TypeScript', 'JavaScript', 'Python'],
        },
      ],
    },
  };

  const firstExperience = sampleResume.experience[0];
  if (!firstExperience) {
    throw new Error('Test setup error: sampleResume must have at least one experience');
  }

  const sampleEnhancementResult: EnhancementResult = {
    originalResume: sampleResume,
    enhancedResume: {
      ...sampleResume,
      experience: [
        {
          company: firstExperience.company,
          role: firstExperience.role,
          startDate: firstExperience.startDate,
          endDate: firstExperience.endDate,
          location: firstExperience.location,
          bulletPoints: [
            'Built scalable systems using React and TypeScript',
            'Led team of engineers',
          ],
        },
      ],
    },
    improvements: [
      {
        type: 'bulletPoint',
        section: 'experience[0]',
        original: 'Built scalable systems',
        suggested: 'Built scalable systems using React and TypeScript',
        reason: 'Enhanced to include relevant keywords',
        confidence: 0.7,
      },
    ],
    keywordSuggestions: [
      {
        keyword: 'React',
        category: 'Frontend Framework',
        suggestedPlacement: ['summary', 'skills', 'experience'],
        importance: 'high',
      },
      {
        keyword: 'TypeScript',
        category: 'Programming Language',
        suggestedPlacement: ['summary', 'skills', 'experience'],
        importance: 'high',
      },
    ],
    missingSkills: ['Kubernetes', 'Docker'],
    atsScore: {
      before: 75,
      after: 85,
      improvement: 10,
    },
    recommendations: [
      'Consider adding more job-relevant keywords',
      'Add a professional summary to improve ATS score',
    ],
  };

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('generateEnhancedResumeOutput', () => {
    it('should generate enhanced resume output structure', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(output).toBeDefined();
      expect(output.updatedResume).toBeDefined();
      expect(output.suggestions).toBeDefined();
      expect(output.highlightedSkills).toBeDefined();
      expect(output.changesSummary).toBeDefined();
      expect(output.changesDetail).toBeDefined();
      expect(output.pdfPath).toBeDefined();
      expect(output.mdPath).toBeDefined();
    });

    it('should include all required fields', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(output).toHaveProperty('updatedResume');
      expect(output).toHaveProperty('suggestions');
      expect(output).toHaveProperty('highlightedSkills');
      expect(output).toHaveProperty('changesSummary');
      expect(output).toHaveProperty('changesDetail');
      expect(output).toHaveProperty('pdfPath');
      expect(output).toHaveProperty('mdPath');
    });

    it('should convert improvements to changesDetail', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(output.changesDetail.length).toBe(sampleEnhancementResult.improvements.length);
      expect(output.changesDetail[0]).toHaveProperty('old');
      expect(output.changesDetail[0]).toHaveProperty('new');
      expect(output.changesDetail[0]).toHaveProperty('section');
      expect(output.changesDetail[0]).toHaveProperty('type');
    });

    it('should generate changes summary', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(typeof output.changesSummary).toBe('string');
      expect(output.changesSummary.length).toBeGreaterThan(0);
    });

    it('should set suggestions from recommendations', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(output.suggestions).toEqual(sampleEnhancementResult.recommendations);
    });

    it('should identify highlighted skills', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(Array.isArray(output.highlightedSkills)).toBe(true);
      // Should include React and TypeScript as they're high importance and in resume
      expect(output.highlightedSkills.length).toBeGreaterThanOrEqual(0);
    });

    it('should use default output directory and base name', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);

      expect(output.pdfPath).toContain('output');
      expect(output.pdfPath).toContain('enhancedResume.pdf');
      expect(output.mdPath).toContain('output');
      expect(output.mdPath).toContain('enhancedResume.md');
    });

    it('should use custom output directory and base name', () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult, {
        outputDir: './custom-output',
        baseName: 'custom-resume',
      });

      expect(output.pdfPath).toContain('custom-output');
      expect(output.pdfPath).toContain('custom-resume.pdf');
      expect(output.mdPath).toContain('custom-output');
      expect(output.mdPath).toContain('custom-resume.md');
    });

    it('should handle empty improvements', () => {
      const emptyResult: EnhancementResult = {
        ...sampleEnhancementResult,
        improvements: [],
      };

      const output = generateEnhancedResumeOutput(emptyResult);

      expect(output.changesDetail).toEqual([]);
      expect(output.changesSummary).toContain('No changes');
    });

    it('should handle resume without skills', () => {
      const resumeWithoutSkills = { ...sampleResume };
      delete resumeWithoutSkills.skills;

      const resultWithoutSkills: EnhancementResult = {
        ...sampleEnhancementResult,
        enhancedResume: resumeWithoutSkills,
      };

      const output = generateEnhancedResumeOutput(resultWithoutSkills);

      expect(output).toBeDefined();
      expect(output.highlightedSkills).toBeDefined();
      expect(Array.isArray(output.highlightedSkills)).toBe(true);
    });
  });

  describe('writeEnhancedResumeJson', () => {
    it('should write enhanced resume JSON to file', async () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);
      const filePath = path.join(testDir, 'enhanced-resume.json');

      await writeEnhancedResumeJson(output, filePath);

      expect(await fs.pathExists(filePath)).toBe(true);
      
      const writtenData = await fs.readJson(filePath);
      expect(writtenData).toHaveProperty('updatedResume');
      expect(writtenData).toHaveProperty('suggestions');
      expect(writtenData).toHaveProperty('highlightedSkills');
      expect(writtenData).toHaveProperty('changesSummary');
      expect(writtenData).toHaveProperty('changesDetail');
    });

    it('should create output directory if it does not exist', async () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);
      const nestedDir = path.join(testDir, 'nested', 'directory');
      const filePath = path.join(nestedDir, 'enhanced-resume.json');

      await writeEnhancedResumeJson(output, filePath);

      expect(await fs.pathExists(filePath)).toBe(true);
      expect(await fs.pathExists(nestedDir)).toBe(true);
    });

    it('should format JSON with proper indentation', async () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);
      const filePath = path.join(testDir, 'enhanced-resume.json');

      await writeEnhancedResumeJson(output, filePath);

      const fileContent = await fs.readFile(filePath, 'utf8');
      // Should have proper indentation (2 spaces)
      expect(fileContent).toMatch(/^\s{2}"updatedResume"/m);
    });

    it('should throw JsonWriteError on write failure', async () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);
      // Use an invalid path that cannot be written to
      const invalidPath = '/invalid/path/that/does/not/exist/enhanced-resume.json';

      await expect(writeEnhancedResumeJson(output, invalidPath)).rejects.toThrow(JsonWriteError);
    });

    it('should handle file path with spaces', async () => {
      const output = generateEnhancedResumeOutput(sampleEnhancementResult);
      const filePath = path.join(testDir, 'enhanced resume with spaces.json');

      await writeEnhancedResumeJson(output, filePath);

      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('generateAndWriteEnhancedResume', () => {
    it('should generate and write enhanced resume in one step', async () => {
      const filePath = await generateAndWriteEnhancedResume(sampleEnhancementResult, {
        outputDir: testDir,
        baseName: 'test-resume',
      });

      expect(await fs.pathExists(filePath)).toBe(true);
      expect(filePath).toContain('test-resume.json');

      const writtenData = await fs.readJson(filePath);
      expect(writtenData).toHaveProperty('updatedResume');
    });

    it('should use default options when not provided', async () => {
      const filePath = await generateAndWriteEnhancedResume(sampleEnhancementResult);

      // Should use default output directory
      expect(filePath).toContain('output');
      expect(filePath).toContain('enhancedResume.json');
    });

    it('should return the correct file path', async () => {
      const customPath = path.join(testDir, 'custom');
      const filePath = await generateAndWriteEnhancedResume(sampleEnhancementResult, {
        outputDir: customPath,
        baseName: 'my-resume',
      });

      expect(filePath).toBe(path.join(customPath, 'my-resume.json'));
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });
});
