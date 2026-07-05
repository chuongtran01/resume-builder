/**
 * Unit tests for classic template
 */

import { classicTemplate } from '@templates/classic';
import { getTemplate } from '@templates/templateRegistry';
import type { Resume } from '@resume-types/resume.types';

describe('classicTemplate', () => {
  const sampleResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 123-456-7890',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
    },
    summary: 'Experienced software engineer with 5 years of experience.',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: [
          'Built scalable API services',
          'Led a team of 4 engineers',
        ],
      },
    ],
    education: [
      {
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2014',
        endDate: '2018-05',
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

  it('should have correct name and description', () => {
    expect(classicTemplate.name).toBe('classic');
    expect(classicTemplate.description).toBeDefined();
  });

  it('should render HTML from resume', () => {
    const html = classicTemplate.render(sampleResume);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
    expect(html).toContain('Experience');
    expect(html).toContain('Tech Corp');
  });

  it('should use Times New Roman font (classic styling)', () => {
    const html = classicTemplate.render(sampleResume);
    expect(html).toContain('Times New Roman');
  });

  it('should include all sections when present', () => {
    const html = classicTemplate.render(sampleResume);
    expect(html).toContain('Experience');
    expect(html).toContain('Education');
    expect(html).toContain('Skills');
  });

  it('should render education ranges using the provided date precision', () => {
    const resumeWithEducationRanges = {
      ...sampleResume,
      education: [
        {
          institution: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2014',
          endDate: '2018',
        },
        {
          institution: 'State University',
          degree: 'Master of Science',
          field: 'Data Science',
          startDate: '2026-08',
          endDate: 'Present',
        },
        {
          institution: 'Community College',
          degree: 'Certificate',
          field: 'Web Development',
          endDate: '2023-05',
        },
      ],
    } as any;

    const html = classicTemplate.render(resumeWithEducationRanges);

    expect(html).toContain('2014 - 2018');
    expect(html).toContain('August 2026 - Present');
    expect(html).toContain('May 2023');
  });

  it('should reject invalid education start and end dates', () => {
    const resumeWithInvalidEducationDates = {
      ...sampleResume,
      education: [
        {
          institution: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: 'Fall 2014',
          endDate: 'Now',
        },
      ],
    } as any;

    const result = classicTemplate.validate(resumeWithInvalidEducationDates);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'education[0].startDate has invalid format (expected YYYY or YYYY-MM)'
    );
    expect(result.errors).toContain(
      'education[0].endDate has invalid format (expected YYYY, YYYY-MM, or "Present")'
    );
  });

  it('should escape HTML special characters', () => {
    const resumeWithSpecialChars: Resume = {
      ...sampleResume,
      personalInfo: {
        ...sampleResume.personalInfo,
        name: 'John <script>alert("xss")</script> Doe',
      },
    };
    const html = classicTemplate.render(resumeWithSpecialChars);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should validate resume', () => {
    const result = classicTemplate.validate(sampleResume);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be registered in template registry', () => {
    const template = getTemplate('classic');
    expect(template).toBeDefined();
    expect(template?.name).toBe('classic');
  });

  it('should be the only registered template', () => {
    expect(getTemplate('classic')).toBeDefined();
    expect(getTemplate('modern')).toBeUndefined();
  });
});
