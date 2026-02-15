/**
 * Unit tests for minimal template
 */

import { minimalTemplate } from '../../src/templates/minimal';
import { getTemplate } from '../../src/templates/templateRegistry';
import type { Resume } from '../../src/types/resume.types';

describe('minimalTemplate', () => {
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
    expect(minimalTemplate.name).toBe('minimal');
    expect(minimalTemplate.description).toBeDefined();
  });

  it('should render HTML from resume', () => {
    const html = minimalTemplate.render(sampleResume);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
    expect(html).toContain('Experience');
    expect(html).toContain('Tech Corp');
  });

  it('should use Calibri font (minimal styling)', () => {
    const html = minimalTemplate.render(sampleResume);
    expect(html).toContain('Calibri');
  });

  it('should have minimal styling with light borders', () => {
    const html = minimalTemplate.render(sampleResume);
    expect(html).toContain('#cccccc');
    expect(html).toContain('0.5pt');
  });

  it('should include all sections when present', () => {
    const html = minimalTemplate.render(sampleResume);
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
    const html = minimalTemplate.render(resumeWithSpecialChars);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should validate resume', () => {
    const result = minimalTemplate.validate(sampleResume);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be registered in template registry', () => {
    const template = getTemplate('minimal');
    expect(template).toBeDefined();
    expect(template?.name).toBe('minimal');
  });

  it('should be visually distinct from other templates', () => {
    const minimalHtml = minimalTemplate.render(sampleResume);
    const { modernTemplate } = require('../../src/templates/modern');
    const { classicTemplate } = require('../../src/templates/classic');
    const modernHtml = modernTemplate.render(sampleResume);
    const classicHtml = classicTemplate.render(sampleResume);

    // Minimal uses Calibri, modern uses Arial, classic uses Times New Roman
    expect(minimalHtml).toContain('Calibri');
    expect(modernHtml).toContain('Arial');
    expect(classicHtml).toContain('Times New Roman');

    // Minimal has lighter borders
    expect(minimalHtml).toContain('#cccccc');
    expect(modernHtml).toContain('#000000');
  });
});
