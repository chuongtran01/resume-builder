/**
 * Unit tests for Google Gemini AI Provider.
 */

import { GeminiProvider, type GeminiConfig } from '../../../src/services/ai/gemini';
import {
  InvalidResponseError,
  TimeoutError,
} from '../../../src/services/ai/provider.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';
import { AISdkResumeGenerator } from '../../../src/services/ai/aiSdkResumeGenerator';

jest.mock('../../../src/services/ai/aiSdkResumeGenerator', () => ({
  AISdkResumeGenerator: jest.fn(),
}));

describe('GeminiProvider', () => {
  const MockAISdkResumeGenerator = AISdkResumeGenerator as jest.MockedClass<typeof AISdkResumeGenerator>;

  const mockConfig: GeminiConfig = {
    apiKey: 'test-api-key',
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 2000,
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
  let provider: GeminiProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerator = {
      reviewResume: jest.fn().mockResolvedValue(reviewResponse),
      modifyResume: jest.fn().mockResolvedValue(modifyResponse),
    };
    MockAISdkResumeGenerator.mockImplementation(() => mockGenerator as unknown as AISdkResumeGenerator);
    provider = new GeminiProvider(mockConfig);
  });

  describe('Constructor', () => {
    it('creates provider with valid config and maps model to AI SDK gateway id', () => {
      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(MockAISdkResumeGenerator).toHaveBeenCalledWith({
        model: 'google/gemini-2.5-pro',
        temperature: 0.7,
        maxTokens: 2000,
        maxRetries: 0,
      });
    });

    it('maps gemini-3-flash-preview to the AI SDK gateway model id', () => {
      new GeminiProvider({
        apiKey: 'test-api-key',
        model: 'gemini-3-flash-preview',
      });

      expect(MockAISdkResumeGenerator).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: 'google/gemini-3-flash',
        })
      );
    });

    it('throws error if API key is missing', () => {
      expect(() => {
        new GeminiProvider({
          apiKey: '',
          model: 'gemini-2.5-pro',
        });
      }).toThrow();
    });

    it('uses default config values', () => {
      const minimalConfig: GeminiConfig = {
        apiKey: 'test-key',
        model: 'gemini-2.5-pro',
      };
      const p = new GeminiProvider(minimalConfig);
      expect(p).toBeInstanceOf(GeminiProvider);
      expect(MockAISdkResumeGenerator).toHaveBeenLastCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 2000,
        })
      );
    });
  });

  describe('getProviderInfo', () => {
    it('returns correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.name).toBe('gemini');
      expect(info.displayName).toBe('Google Gemini');
      expect(info.supportedModels).toContain('gemini-2.5-pro');
      expect(info.supportedModels).toContain('gemini-3-flash-preview');
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
      mockGenerator.reviewResume.mockRejectedValueOnce(new Error('429 Rate limit exceeded'));

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.reviewResume(request)).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      const shortTimeoutProvider = new GeminiProvider({
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
