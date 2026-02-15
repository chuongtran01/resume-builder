/**
 * Unit tests for ATS validator
 */

import {
  validateAtsCompliance,
  isValidAtsHeading,
  suggestHeading,
} from '../../src/services/atsValidator';
import type { Resume } from '../../src/types/resume.types';

describe('atsValidator', () => {
  const completeResume: Resume = {
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
        role: 'Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: [
          'Built scalable systems',
          'Led team of engineers',
        ],
      },
    ],
    education: {
      institution: 'University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: '2018-05',
    },
    skills: {
      categories: [
        {
          name: 'Programming',
          items: ['TypeScript', 'JavaScript'],
        },
      ],
    },
  };

  describe('validateAtsCompliance', () => {
    it('should validate a complete resume with high score', () => {
      const result = validateAtsCompliance(completeResume);

      expect(result.isCompliant).toBe(true);
      expect(result.score).toBeGreaterThan(70);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required sections', () => {
      const incompleteResume: Partial<Resume> = {
        personalInfo: {
          name: 'John Doe',
          email: '',
          phone: '',
          location: 'SF',
        },
      };

      const result = validateAtsCompliance(incompleteResume as Resume);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('email'))).toBe(true);
      expect(result.errors.some((e) => e.includes('phone'))).toBe(true);
      expect(result.score).toBeLessThan(100);
    });

    it('should warn about missing recommended sections', () => {
      const resumeWithoutSummary: Resume = {
        personalInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 123-456-7890',
          location: 'SF',
        },
        experience: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Did something'],
          },
        ],
      };

      const result = validateAtsCompliance(resumeWithoutSummary);

      expect(result.warnings.some((w) => w.includes('summary'))).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should validate date formats', () => {
      const resumeWithInvalidDates: Resume = {
        ...completeResume,
        experience: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            startDate: 'invalid-date',
            endDate: 'also-invalid',
            location: 'Remote',
            bulletPoints: ['Something'],
          },
        ],
      };

      const result = validateAtsCompliance(resumeWithInvalidDates);

      expect(result.errors.some((e) => e.includes('startDate'))).toBe(true);
      expect(result.errors.some((e) => e.includes('endDate'))).toBe(true);
    });

    it('should accept "Present" as valid end date', () => {
      const resumeWithPresent: Resume = {
        ...completeResume,
        experience: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['Something'],
          },
        ],
      };

      const result = validateAtsCompliance(resumeWithPresent);

      expect(result.errors.some((e) => e.includes('endDate'))).toBe(false);
    });

    it('should warn about long bullet points', () => {
      const longBullet = 'A'.repeat(200);
      const resumeWithLongBullets: Resume = {
        ...completeResume,
        experience: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: [longBullet],
          },
        ],
      };

      const result = validateAtsCompliance(resumeWithLongBullets, {
        maxBulletLength: 150,
      });

      expect(result.warnings.some((w) => w.includes('exceeds recommended length'))).toBe(true);
    });

    it('should calculate score based on errors and warnings', () => {
      const badResume: Resume = {
        personalInfo: {
          name: 'John',
          email: '',
          phone: '',
          location: 'SF',
        },
        experience: [],
      };

      const result = validateAtsCompliance(badResume);

      expect(result.score).toBeLessThan(70);
      expect(result.isCompliant).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should give bonus points for recommended sections', () => {
      const resumeWithAllSections: Resume = {
        ...completeResume,
        certifications: [
          {
            name: 'AWS Certified',
            issuer: 'AWS',
            date: '2023-01',
          },
        ],
        projects: [
          {
            name: 'Project',
            description: 'Description',
          },
        ],
      };

      const result = validateAtsCompliance(resumeWithAllSections);

      expect(result.score).toBeGreaterThan(90);
    });

    it('should respect validation options', () => {
      const resumeWithLongBullets: Resume = {
        ...completeResume,
        experience: [
          {
            company: 'Tech Corp',
            role: 'Engineer',
            startDate: '2020-01',
            endDate: 'Present',
            location: 'Remote',
            bulletPoints: ['A'.repeat(200)],
          },
        ],
      };

      const resultWithCheck = validateAtsCompliance(resumeWithLongBullets, {
        checkBulletLength: true,
      });
      const resultWithoutCheck = validateAtsCompliance(resumeWithLongBullets, {
        checkBulletLength: false,
      });

      expect(resultWithCheck.warnings.length).toBeGreaterThan(resultWithoutCheck.warnings.length);
    });
  });

  describe('isValidAtsHeading', () => {
    it('should validate standard headings', () => {
      expect(isValidAtsHeading('Experience')).toBe(true);
      expect(isValidAtsHeading('Education')).toBe(true);
      expect(isValidAtsHeading('Skills')).toBe(true);
      expect(isValidAtsHeading('Professional Experience')).toBe(true);
    });

    it('should reject non-standard headings', () => {
      expect(isValidAtsHeading('Random Section')).toBe(false);
      expect(isValidAtsHeading('About Me')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isValidAtsHeading('EXPERIENCE')).toBe(true);
      expect(isValidAtsHeading('experience')).toBe(true);
    });
  });

  describe('suggestHeading', () => {
    it('should suggest alternatives for non-standard headings', () => {
      expect(suggestHeading('Work History')).toBe('Experience');
      expect(suggestHeading('Employment History')).toBe('Experience');
      expect(suggestHeading('Technical Expertise')).toBe('Skills');
      expect(suggestHeading('Academic Background')).toBe('Education');
    });

    it('should return null for standard headings', () => {
      expect(suggestHeading('Experience')).toBeNull();
      expect(suggestHeading('Education')).toBeNull();
      expect(suggestHeading('Skills')).toBeNull();
    });

    it('should return null for unrecognized headings', () => {
      expect(suggestHeading('Random Section')).toBeNull();
    });
  });
});
