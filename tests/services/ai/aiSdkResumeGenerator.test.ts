/**
 * Unit tests for the AI SDK resume generator adapter.
 */

import { AISdkResumeGenerator } from '../../../src/services/ai/aiSdkResumeGenerator';
import type { AIRequest, ReviewRequest } from '../../../src/services/ai/enhancement.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';
import { generateObject } from 'ai';

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));

describe('AISdkResumeGenerator', () => {
  const mockGenerateObject = generateObject as jest.MockedFunction<typeof generateObject>;

  const resume: Resume = {
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

  const jobInfo: ParsedJobDescription = {
    keywords: ['React'],
    requiredSkills: ['React'],
    preferredSkills: [],
    requirements: [],
  };

  beforeEach(() => {
    mockGenerateObject.mockReset();
  });

  it('generates a review response with AI SDK structured output', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        reviewResult: {
          strengths: ['Clear experience'],
          weaknesses: ['Missing React'],
          opportunities: ['Add React context'],
          prioritizedActions: [
            {
              type: 'rewrite',
              section: 'experience[0]',
              priority: 'high',
              reason: 'React is required',
            },
          ],
          confidence: 0.8,
          reasoning: 'Good baseline.',
        },
      },
      usage: {
        inputTokens: 100,
        outputTokens: 40,
        totalTokens: 140,
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const generator = new AISdkResumeGenerator({
      model: 'google/gemini-3-flash',
      temperature: 0.2,
      maxTokens: 1000,
      maxRetries: 1,
    });

    const request: ReviewRequest = { resume, jobInfo };
    const response = await generator.reviewResume(request);

    expect(response.reviewResult.strengths).toEqual(['Clear experience']);
    expect(response.tokensUsed).toBe(140);
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'google/gemini-3-flash',
        temperature: 0.2,
        maxOutputTokens: 1000,
        maxRetries: 1,
        schemaName: 'ResumeReviewResponse',
      })
    );
  });

  it('generates a modify response with AI SDK structured output', async () => {
    const reviewResult = {
      strengths: ['Clear experience'],
      weaknesses: ['Missing React'],
      opportunities: ['Add React context'],
      prioritizedActions: [],
      confidence: 0.8,
    };

    const enhancedResume: Resume = {
      ...resume,
      experience: [
        {
          ...resume.experience[0]!,
          bulletPoints: ['Built React web applications'],
        },
      ],
    };

    mockGenerateObject.mockResolvedValueOnce({
      object: {
        enhancedResume,
        improvements: [
          {
            type: 'bulletPoint',
            section: 'experience[0].bulletPoints[0]',
            original: 'Built web applications',
            suggested: 'Built React web applications',
            reason: 'Align with required skill',
            confidence: 0.9,
          },
        ],
        reasoning: 'Added truthful keyword context.',
        confidence: 0.9,
      },
      usage: {
        inputTokens: 120,
        outputTokens: 80,
        totalTokens: 200,
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const generator = new AISdkResumeGenerator({
      model: 'google/gemini-3-flash',
    });

    const request: AIRequest = { resume, jobInfo, reviewResult };
    const response = await generator.modifyResume(request);

    expect(response.enhancedResume.experience[0]?.bulletPoints[0]).toBe(
      'Built React web applications'
    );
    expect(response.improvements).toHaveLength(1);
    expect(response.tokensUsed).toBe(200);
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'ResumeModifyResponse',
      })
    );
  });

  it('requires a review result before modify generation', async () => {
    const generator = new AISdkResumeGenerator({
      model: 'google/gemini-3-flash',
    });

    await expect(generator.modifyResume({ resume, jobInfo })).rejects.toThrow(
      'Review result is required for modifyResume'
    );
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });
});
