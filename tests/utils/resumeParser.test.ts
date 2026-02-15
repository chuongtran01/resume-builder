/**
 * Unit tests for resumeParser utility
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  parseResume,
  parseResumeFromString,
  validateResume,
  ResumeValidationError,
} from '../../src/utils/resumeParser';
import type { Resume } from '../../src/types/resume.types';

describe('resumeParser', () => {
  const testDir = path.join(__dirname, '../fixtures/resumeParser');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('validateResume', () => {
    it('should validate a complete resume', () => {
      const resume: Resume = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            company: 'Test Corp',
            role: 'Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
      };

      const errors = validateResume(resume);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing personalInfo', () => {
      const resume = {
        experience: [
          {
            company: 'Test Corp',
            role: 'Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
      };

      const errors = validateResume(resume);
      expect(errors).toContain('personalInfo is required');
    });

    it('should detect missing experience', () => {
      const resume = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
      };

      const errors = validateResume(resume);
      expect(errors).toContain('experience is required and must be an array');
    });

    it('should detect missing required fields in experience', () => {
      const resume: Partial<Resume> = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            company: 'Test Corp',
            role: '',
            startDate: '',
            endDate: '',
            location: '',
            bulletPoints: [],
            // Missing role
          },
        ] as any,
      };

      const errors = validateResume(resume);
      expect(errors.some((e) => e.includes('role is required'))).toBe(true);
    });
  });

  describe('parseResume', () => {
    it('should parse a valid resume.json file', async () => {
      const resumeFile = path.join(testDir, 'resume.json');
      const resume: Resume = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            company: 'Test Corp',
            role: 'Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
      };

      await fs.writeJson(resumeFile, resume);

      const parsed = await parseResume({ resumePath: resumeFile });
      expect(parsed.personalInfo.name).toBe('John Doe');
      expect(parsed.experience).toHaveLength(1);
    });

    it('should resolve file references in resume', async () => {
      // Create education file
      const educationFile = path.join(testDir, 'education.json');
      await fs.writeJson(educationFile, {
        institution: 'Test University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        graduationDate: '2020-05',
      });

      // Create resume with file reference
      const resumeFile = path.join(testDir, 'resume.json');
      const resume = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            company: 'Test Corp',
            role: 'Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
        education: `file:${path.relative(testDir, educationFile)}`,
      };

      await fs.writeJson(resumeFile, resume);

      const parsed = await parseResume({ resumePath: resumeFile });
      expect(parsed.education).toBeDefined();
      if (parsed.education && typeof parsed.education === 'object' && !Array.isArray(parsed.education)) {
        expect(parsed.education.institution).toBe('Test University');
      }
    });

    it('should throw error for missing file', async () => {
      const resumeFile = path.join(testDir, 'nonexistent.json');

      await expect(
        parseResume({ resumePath: resumeFile })
      ).rejects.toThrow();
    });

    it('should throw error for invalid JSON', async () => {
      const resumeFile = path.join(testDir, 'invalid.json');
      await fs.writeFile(resumeFile, '{ invalid json }');

      await expect(
        parseResume({ resumePath: resumeFile })
      ).rejects.toThrow();
    });

    it('should throw validation error when validate=true', async () => {
      const resumeFile = path.join(testDir, 'invalid-resume.json');
      const invalidResume = {
        // Missing required fields
        personalInfo: {
          name: 'John Doe',
          // Missing email, phone, location
        },
      };

      await fs.writeJson(resumeFile, invalidResume);

      await expect(
        parseResume({ resumePath: resumeFile, validate: true })
      ).rejects.toThrow(ResumeValidationError);
    });

    it('should skip validation when validate=false', async () => {
      const resumeFile = path.join(testDir, 'invalid-resume.json');
      const invalidResume = {
        personalInfo: {
          name: 'John Doe',
        },
      };

      await fs.writeJson(resumeFile, invalidResume);

      const parsed = await parseResume({
        resumePath: resumeFile,
        validate: false,
      });
      expect(parsed.personalInfo.name).toBe('John Doe');
    });
  });

  describe('parseResumeFromString', () => {
    it('should parse resume from JSON string', async () => {
      const resumeJson = JSON.stringify({
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            company: 'Test Corp',
            role: 'Software Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
      });

      const parsed = await parseResumeFromString(resumeJson, testDir);
      expect(parsed.personalInfo.name).toBe('John Doe');
    });

    it('should throw error for invalid JSON string', async () => {
      const invalidJson = '{ invalid json }';

      await expect(
        parseResumeFromString(invalidJson, testDir)
      ).rejects.toThrow();
    });
  });
});
