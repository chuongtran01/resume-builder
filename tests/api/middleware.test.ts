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
});
