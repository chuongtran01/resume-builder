/**
 * Unit tests for modern template
 */

import { modernTemplate } from '../../src/templates/modern';
import { getTemplate } from '../../src/templates/templateRegistry';
import type { Resume } from '../../src/types/resume.types';

describe('modernTemplate', () => {
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
    education: {
      institution: 'University of California',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: '2018-05',
    },
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
    expect(modernTemplate.name).toBe('modern');
    expect(modernTemplate.description).toBeDefined();
  });

  it('should render HTML from resume', () => {
    const html = modernTemplate.render(sampleResume);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
    expect(html).toContain('Experience');
    expect(html).toContain('Tech Corp');
  });

  it('should include all sections when present', () => {
    const html = modernTemplate.render(sampleResume);
    expect(html).toContain('Experience');
    expect(html).toContain('Education');
    expect(html).toContain('Skills');
  });

  it('should escape HTML special characters', () => {
    const resumeWithSpecialChars: Resume = {
      ...sampleResume,
      personalInfo: {
        ...sampleResume.personalInfo,
        name: 'John <script>alert("xss")</script> Doe',
      },
    };
    const html = modernTemplate.render(resumeWithSpecialChars);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should validate resume', () => {
    const result = modernTemplate.validate(sampleResume);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be registered in template registry', () => {
    const template = getTemplate('modern');
    expect(template).toBeDefined();
    expect(template?.name).toBe('modern');
  });
});
