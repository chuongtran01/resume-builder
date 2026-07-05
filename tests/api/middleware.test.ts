import { generateResumeRequestSchema } from '@api/middleware';
import type { Resume } from '@resume-types/resume.types';

describe('API middleware schemas', () => {
  const resume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-123-4567',
      location: 'San Francisco, CA',
    },
    experience: [
      {
        company: 'Acme',
        role: 'Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: ['Built reliable services'],
      },
    ],
  };

  it('rejects templateOptions on generate resume requests', () => {
    const result = generateResumeRequestSchema.safeParse({
      resume,
      options: {
        format: 'pdf',
        templateOptions: {
          multiplier: 0.9,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts only an array for education', () => {
    const education = {
      institution: 'University of California',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: '2018-05',
    };

    const arrayResult = generateResumeRequestSchema.safeParse({
      resume: {
        ...resume,
        education: [education],
      },
      options: {
        format: 'pdf',
      },
    });

    const singleResult = generateResumeRequestSchema.safeParse({
      resume: {
        ...resume,
        education,
      },
      options: {
        format: 'pdf',
      },
    });

    expect(arrayResult.success).toBe(true);
    expect(singleResult.success).toBe(false);
  });
});
