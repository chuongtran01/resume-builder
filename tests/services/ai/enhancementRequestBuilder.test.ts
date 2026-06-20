/**
 * Unit tests for AI enhancement request builders.
 */

import {
  buildModifyRequest,
  buildReviewRequest,
} from '../../../src/services/ai/enhancementRequestBuilder';
import type { ReviewResult } from '../../../src/services/ai/enhancement.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';

describe('enhancementRequestBuilder', () => {
  const resume: Resume = {
    personalInfo: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '123-456-7890',
      location: 'Austin, TX',
    },
    experience: [],
  };

  const jobInfo: ParsedJobDescription = {
    keywords: ['React'],
    requiredSkills: ['TypeScript'],
    preferredSkills: ['Node.js'],
    requirements: [],
  };

  const reviewResult: ReviewResult = {
    strengths: ['Clear experience'],
    weaknesses: ['Missing React'],
    opportunities: ['Add frontend keywords'],
    prioritizedActions: [],
    confidence: 0.8,
  };

  it('builds review requests with resume, job info, and options', () => {
    const request = buildReviewRequest({
      resume,
      jobInfo,
      options: {
        focusAreas: ['skills'],
      },
    });

    expect(request).toEqual({
      resume,
      jobInfo,
      options: {
        focusAreas: ['skills'],
      },
    });
  });

  it('omits review options when none are provided', () => {
    const request = buildReviewRequest({
      resume,
      jobInfo,
    });

    expect(request).toEqual({
      resume,
      jobInfo,
      options: undefined,
    });
  });

  it('builds modify requests with review result', () => {
    const request = buildModifyRequest({
      resume,
      jobInfo,
      reviewResult,
      options: {
        tone: 'professional',
      },
    });

    expect(request).toEqual({
      resume,
      jobInfo,
      reviewResult,
      options: {
        tone: 'professional',
      },
    });
  });
});
