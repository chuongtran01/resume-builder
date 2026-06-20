/**
 * Unit tests for AI resume enhancement workflow types.
 */

import type {
  AIRequest,
  AIResponse,
  EnhancementPrompt,
  PrioritizedAction,
  ReviewRequest,
  ReviewResponse,
  ReviewResult,
} from '../../../src/services/ai/enhancement.types';

describe('AI Enhancement Types', () => {
  const sampleResume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    experience: [
      {
        company: 'Acme',
        role: 'Engineer',
        startDate: '2020-01',
        bulletPoints: ['Built web applications'],
      },
    ],
  };

  const sampleJobInfo = {
    title: 'Software Engineer',
    company: 'Example Co',
    requirements: ['React'],
    responsibilities: ['Build user interfaces'],
    keywords: ['React', 'TypeScript'],
    requiredSkills: ['React'],
    preferredSkills: ['TypeScript'],
    experienceLevel: 'mid' as const,
  };

  it('supports review result and prioritized action structures', () => {
    const action: PrioritizedAction = {
      type: 'enhance',
      section: 'experience[0]',
      priority: 'high',
      reason: 'Highlight React experience',
      suggestedChange: 'Mention React in relevant bullet points',
    };

    const result: ReviewResult = {
      strengths: ['Relevant engineering background'],
      weaknesses: ['Missing explicit React keyword'],
      opportunities: ['Align bullet points with role keywords'],
      prioritizedActions: [action],
      confidence: 0.8,
      reasoning: 'The resume is close but can improve keyword alignment.',
    };

    expect(result.prioritizedActions[0]).toBe(action);
    expect(result.confidence).toBe(0.8);
  });

  it('supports review and modify request/response structures', () => {
    const reviewRequest: ReviewRequest = {
      resume: sampleResume,
      jobInfo: sampleJobInfo,
      options: { focusAreas: ['experience'] },
    };

    const reviewResponse: ReviewResponse = {
      reviewResult: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        prioritizedActions: [],
        confidence: 0.5,
      },
      tokensUsed: 100,
    };

    const modifyRequest: AIRequest = {
      ...reviewRequest,
      reviewResult: reviewResponse.reviewResult,
    };

    const modifyResponse: AIResponse = {
      enhancedResume: sampleResume,
      improvements: [],
      confidence: 0.7,
      tokensUsed: 120,
    };

    expect(modifyRequest.reviewResult).toBe(reviewResponse.reviewResult);
    expect(modifyResponse.enhancedResume).toBe(sampleResume);
  });

  it('supports prompt structures independent of providers', () => {
    const prompt: EnhancementPrompt = {
      systemMessage: 'You enhance resumes truthfully.',
      userPrompt: 'Review this resume.',
      examples: [{ input: 'before', output: 'after' }],
      context: { source: 'test' },
    };

    expect(prompt.examples?.[0]?.output).toBe('after');
  });
});
