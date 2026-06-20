/**
 * Unit tests for AI enhancement result building.
 */

import { buildEnhancementResult } from '../../../src/services/ai/enhancementResultBuilder';
import type { AIResponse } from '../../../src/services/ai/enhancement.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';

jest.mock('@services/atsValidator', () => ({
  validateAtsCompliance: jest.fn((resume: Resume) => ({
    score: JSON.stringify(resume).includes('React') ? 90 : 70,
  })),
}));

describe('enhancementResultBuilder', () => {
  const originalResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    summary: 'Software engineer',
    experience: [
      {
        company: 'Acme',
        role: 'Engineer',
        startDate: '2020-01',
        bulletPoints: ['Built web applications'],
      },
    ],
    skills: {
      categories: [
        {
          name: 'Languages',
          items: ['JavaScript'],
        },
      ],
    },
  };

  const parsedJob: ParsedJobDescription = {
    keywords: ['React', 'TypeScript'],
    requiredSkills: ['React'],
    preferredSkills: ['TypeScript'],
    requirements: [],
  };

  it('filters sections that were not present in the original resume', () => {
    const response: AIResponse = {
      enhancedResume: {
        ...originalResume,
        projects: [
          {
            name: 'Generated Project',
            description: 'This section should not be added.',
          },
        ],
      },
      improvements: [],
    };

    const result = buildEnhancementResult(originalResume, response, parsedJob);

    expect(result.enhancedResume.projects).toBeUndefined();
    expect(result.enhancedResume.summary).toBe(originalResume.summary);
  });

  it('builds metadata from enhanced resume changes', () => {
    const response: AIResponse = {
      enhancedResume: {
        ...originalResume,
        experience: [
          {
            ...originalResume.experience[0]!,
            bulletPoints: ['Built React web applications'],
          },
        ],
      },
      improvements: [],
      reasoning: 'Improved keyword alignment.',
    };

    const result = buildEnhancementResult(originalResume, response, parsedJob);

    expect(result.improvements).toEqual([
      expect.objectContaining({
        type: 'bulletPoint',
        original: 'Built web applications',
        suggested: 'Built React web applications',
      }),
    ]);
    expect(result.missingSkills).toEqual(['React']);
    expect(result.atsScore).toEqual({ before: 70, after: 90, improvement: 20 });
    expect(result.recommendations).toContain('Improved keyword alignment.');
  });

  it('uses AI-provided improvements when present', () => {
    const response: AIResponse = {
      enhancedResume: {
        ...originalResume,
        summary: 'React-focused software engineer',
      },
      improvements: [
        {
          type: 'summary',
          section: 'summary',
          original: 'Software engineer',
          suggested: 'React-focused software engineer',
          reason: 'Use the AI-provided reason',
          confidence: 0.9,
        },
      ],
    };

    const result = buildEnhancementResult(originalResume, response, parsedJob);

    expect(result.improvements).toBe(response.improvements);
  });
});
