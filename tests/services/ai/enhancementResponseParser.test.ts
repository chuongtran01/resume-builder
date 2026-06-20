/**
 * Unit tests for AI enhancement response parsers.
 */

import {
  parseModifyResponse,
  parseReviewResponse,
} from '../../../src/services/ai/enhancementResponseParser';
import type {
  AIResponse,
  ReviewResponse,
} from '../../../src/services/ai/enhancement.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';

jest.mock('../../../src/services/atsValidator', () => ({
  validateAtsCompliance: jest.fn(() => ({ score: 80 })),
}));

describe('enhancementResponseParser', () => {
  const resume: Resume = {
    personalInfo: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '123-456-7890',
      location: 'Austin, TX',
    },
    experience: [
      {
        company: 'Acme',
        role: 'Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: ['Built apps'],
      },
    ],
  };

  const parsedJob: ParsedJobDescription = {
    keywords: ['React'],
    requiredSkills: ['TypeScript'],
    preferredSkills: [],
    requirements: [],
  };

  it('parses valid review responses and applies defaults', () => {
    const response: ReviewResponse = {
      reviewResult: {
        strengths: ['Strong experience'],
        weaknesses: ['Missing React'],
        opportunities: undefined as unknown as string[],
        prioritizedActions: undefined as unknown as ReviewResponse['reviewResult']['prioritizedActions'],
        confidence: undefined as unknown as number,
      },
    };

    expect(parseReviewResponse(response)).toEqual({
      strengths: ['Strong experience'],
      weaknesses: ['Missing React'],
      opportunities: [],
      prioritizedActions: [],
      confidence: 0.5,
      reasoning: undefined,
    });
  });

  it('throws when review response is missing review result', () => {
    expect(() => parseReviewResponse({} as ReviewResponse)).toThrow(
      'Invalid review response structure'
    );
  });

  it('throws when review response arrays are invalid', () => {
    const response: ReviewResponse = {
      reviewResult: {
        strengths: 'not an array' as unknown as string[],
        weaknesses: [],
        opportunities: [],
        prioritizedActions: [],
        confidence: 0.8,
      },
    };

    expect(() => parseReviewResponse(response)).toThrow(
      'Invalid review result structure'
    );
  });

  it('parses valid modify responses into enhancement results', () => {
    const response: AIResponse = {
      enhancedResume: {
        ...resume,
        summary: 'React engineer',
      },
      improvements: [
        {
          type: 'summary',
          section: 'summary',
          original: '',
          suggested: 'React engineer',
          reason: 'Add job keyword',
          confidence: 0.9,
        },
      ],
    };

    const result = parseModifyResponse(resume, response, parsedJob);

    expect(result.originalResume).toEqual(resume);
    expect(result.enhancedResume.summary).toBe('React engineer');
    expect(result.improvements).toHaveLength(1);
  });

  it('throws when modify response is missing improvements', () => {
    const response = {
      enhancedResume: resume,
    } as AIResponse;

    expect(() => parseModifyResponse(resume, response, parsedJob)).toThrow(
      'Invalid modification response structure'
    );
  });

  it('throws when enhanced resume shape is invalid', () => {
    const response: AIResponse = {
      enhancedResume: {
        personalInfo: resume.personalInfo,
      } as Resume,
      improvements: [],
    };

    expect(() => parseModifyResponse(resume, response, parsedJob)).toThrow(
      'Invalid enhanced resume structure'
    );
  });
});
