/**
 * Unit tests for Google Gemini AI Provider.
 */

import {
  createGeminiResumeClient,
  type GeminiConfig,
  type GeminiResumeClient,
} from '../../../src/services/ai/gemini';
import {
  InvalidResponseError,
  TimeoutError,
} from '../../../src/services/ai/provider.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';
import {
  createAISdkResumeClient,
  type AISdkResumeClient,
} from '../../../src/services/ai/aiSdkResumeGenerator';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

jest.mock('../../../src/services/ai/aiSdkResumeGenerator', () => ({
  createAISdkResumeClient: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn((options) => {
    return jest.fn((modelId: string) => ({
      provider: 'google',
      modelId,
      options,
    }));
  }),
}));

describe('createGeminiResumeClient', () => {
  const mockCreateAISdkResumeClient = createAISdkResumeClient as jest.MockedFunction<typeof createAISdkResumeClient>;
  const mockCreateGoogleGenerativeAI = createGoogleGenerativeAI as jest.MockedFunction<typeof createGoogleGenerativeAI>;

  const mockConfig: GeminiConfig = {
    apiKey: 'test-api-key',
    model: 'gemini-3.1-pro',
    temperature: 0.7,
    timeout: 30000,
  };

  const sampleResume: Resume = {
    personalInfo: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      location: 'San Francisco, CA',
    },
    experience: [
      {
        company: 'Test Corp',
        role: 'Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: ['Built web applications', 'Led team'],
      },
    ],
  };

  const sampleJobInfo: ParsedJobDescription = {
    keywords: ['React', 'TypeScript'],
    requiredSkills: ['JavaScript'],
    preferredSkills: ['Node.js'],
    requirements: [],
  };

  const reviewResponse = {
    reviewResult: {
      strengths: ['Strong technical skills'],
      weaknesses: ['Missing keywords'],
      opportunities: ['Add metrics'],
      prioritizedActions: [
        {
          type: 'enhance' as const,
          section: 'experience',
          priority: 'high' as const,
          reason: 'Improve keyword matching',
        },
      ],
      confidence: 0.85,
      reasoning: 'Good overall fit',
    },
    tokensUsed: 100,
    cost: 0,
  };

  const modifyResponse = {
    enhancedResume: {
      ...sampleResume,
      summary: 'Enhanced summary',
    },
    improvements: [],
    confidence: 0.9,
    tokensUsed: 150,
    cost: 0,
  };

  let mockGenerator: {
    reviewResume: jest.Mock;
    modifyResume: jest.Mock;
  };
  let provider: GeminiResumeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerator = {
      reviewResume: jest.fn().mockResolvedValue(reviewResponse),
      modifyResume: jest.fn().mockResolvedValue(modifyResponse),
    };
    mockCreateAISdkResumeClient.mockImplementation(() => mockGenerator as unknown as AISdkResumeClient);
    provider = createGeminiResumeClient(mockConfig);
  });

  describe('factory', () => {
    it('creates client with valid config and maps model to Google provider id', () => {
      expect(provider.reviewResume).toEqual(expect.any(Function));
      expect(provider.modifyResume).toEqual(expect.any(Function));
      expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
      expect(mockCreateAISdkResumeClient).toHaveBeenCalledWith({
        model: expect.objectContaining({
          modelId: 'gemini-3.1-pro-preview',
        }),
        temperature: 0.7,
        maxTokens: undefined,
        maxRetries: 0,
      });
    });

    it('maps gemini-3.5-flash to the Google provider model id', () => {
      createGeminiResumeClient({
        apiKey: 'test-api-key',
        model: 'gemini-3.5-flash',
      });

      expect(mockCreateAISdkResumeClient).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: 'gemini-3.5-flash',
          }),
        })
      );
    });

    it('throws error if API key is missing', () => {
      expect(() => {
        createGeminiResumeClient({
          apiKey: '',
          model: 'gemini-3.1-pro',
        });
      }).toThrow();
    });

    it('uses default config values', () => {
      const minimalConfig: GeminiConfig = {
        apiKey: 'test-key',
        model: 'gemini-3.1-pro',
      };
      const p = createGeminiResumeClient(minimalConfig);
      expect(p.reviewResume).toEqual(expect.any(Function));
      expect(mockCreateAISdkResumeClient).toHaveBeenLastCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: undefined,
        })
      );
    });
  });

  describe('getProviderInfo', () => {
    it('returns correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.name).toBe('gemini');
      expect(info.displayName).toBe('Google Gemini');
      expect(info.supportedModels).toContain('gemini-3.1-pro');
      expect(info.supportedModels).toContain('gemini-3.5-flash');
      expect(info.defaultModel).toBe('gemini-3.1-pro');
    });
  });

  describe('reviewResume', () => {
    it('calls the AI SDK generator and returns review response', async () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const result = await provider.reviewResume(request);

      expect(result.reviewResult.strengths).toHaveLength(1);
      expect(result.reviewResult.confidence).toBe(0.85);
      expect(mockGenerator.reviewResume).toHaveBeenCalledWith(request);
    });
  });

  describe('modifyResume', () => {
    it('requires reviewResult', async () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.modifyResume(request as any)).rejects.toThrow(InvalidResponseError);
    });

    it('calls the AI SDK generator and returns modify response', async () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: reviewResponse.reviewResult,
      };

      const result = await provider.modifyResume(request);

      expect(result.enhancedResume).toBeDefined();
      expect(result.improvements).toEqual([]);
      expect(mockGenerator.modifyResume).toHaveBeenCalledWith(request);
    });
  });

  describe('enhanceResume', () => {
    it('orchestrates review and modify', async () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const result = await provider.enhanceResume(request);

      expect(result.enhancedResume).toBeDefined();
      expect(result.tokensUsed).toBe(250);
      expect(mockGenerator.reviewResume).toHaveBeenCalledTimes(1);
      expect(mockGenerator.modifyResume).toHaveBeenCalledWith({
        ...request,
        reviewResult: reviewResponse.reviewResult,
      });
    });
  });

  describe('Error Handling', () => {
    it('handles rate limit errors', async () => {
      mockGenerator.reviewResume.mockRejectedValue(new Error('429 Rate limit exceeded'));

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.reviewResume(request)).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      const shortTimeoutProvider = createGeminiResumeClient({
        ...mockConfig,
        timeout: 1,
      });

      mockGenerator.reviewResume.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(reviewResponse), 100))
      );

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(shortTimeoutProvider.reviewResume(request)).rejects.toThrow(TimeoutError);
    });
  });
});
