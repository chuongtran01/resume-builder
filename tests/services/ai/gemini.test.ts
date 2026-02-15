/**
 * Unit tests for Google Gemini AI Provider
 */

import { GeminiProvider, type GeminiConfig } from '../../../src/services/ai/gemini';
import {
  RateLimitError,
  InvalidResponseError,
  TimeoutError,
  NetworkError,
} from '../../../src/services/ai/provider.types';
import type { Resume } from '../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../src/utils/jobParser';

// Mock @google/generative-ai
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));
const mockGoogleGenerativeAI = jest.fn(() => ({
  getGenerativeModel: mockGetGenerativeModel,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

describe('GeminiProvider', () => {
  const mockConfig: GeminiConfig = {
    apiKey: 'test-api-key',
    model: 'gemini-pro',
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

  let provider: GeminiProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to return default response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: jest.fn(() => '{"strengths":[],"weaknesses":[],"opportunities":[],"prioritizedActions":[],"confidence":0.8}'),
      },
    });
    provider = new GeminiProvider(mockConfig);
  });

  describe('Constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeInstanceOf(GeminiProvider);
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new GeminiProvider({
          apiKey: '',
          model: 'gemini-pro',
        });
      }).toThrow();
    });

    it('should use default config values', () => {
      const minimalConfig: GeminiConfig = {
        apiKey: 'test-key',
        model: 'gemini-pro',
      };
      const p = new GeminiProvider(minimalConfig);
      expect(p).toBeInstanceOf(GeminiProvider);
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.name).toBe('gemini');
      expect(info.displayName).toBe('Google Gemini');
      expect(info.supportedModels).toContain('gemini-pro');
      expect(info.supportedModels).toContain('gemini-1.5-pro');
      expect(info.supportedModels).toContain('gemini-1.5-flash');
    });
  });

  describe('validateResponse', () => {
    it('should validate ReviewResponse correctly', () => {
      const validReviewResponse = {
        reviewResult: {
          strengths: ['Good'],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.8,
        },
      };

      expect(provider.validateResponse(validReviewResponse)).toBe(true);
    });

    it('should validate AIResponse correctly', () => {
      const validAIResponse = {
        enhancedResume: sampleResume,
        improvements: [],
        confidence: 0.9,
      };

      expect(provider.validateResponse(validAIResponse)).toBe(true);
    });

    it('should reject invalid ReviewResponse', () => {
      const invalidResponse = {
        reviewResult: {
          strengths: 'not an array' as unknown as string[],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.8,
        },
      };

      expect(provider.validateResponse(invalidResponse as any)).toBe(false);
    });

    it('should reject invalid AIResponse', () => {
      const invalidResponse = {
        enhancedResume: undefined as unknown as Resume,
        improvements: [],
      };

      expect(provider.validateResponse(invalidResponse as any)).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for review request', () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const cost = provider.estimateCost(request);
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should estimate cost for modify request', () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.8,
        },
      };

      const cost = provider.estimateCost(request);
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reviewResume', () => {
    it('should call Gemini API and parse response', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() =>
            JSON.stringify({
              strengths: ['Strong technical skills'],
              weaknesses: ['Missing keywords'],
              opportunities: ['Add metrics'],
              prioritizedActions: [
                {
                  type: 'enhance',
                  section: 'experience',
                  priority: 'high',
                  reason: 'Improve keyword matching',
                },
              ],
              confidence: 0.85,
              reasoning: 'Good overall fit',
            })
          ),
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockResponse);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const result = await provider.reviewResume(request);

      expect(result.reviewResult).toBeDefined();
      expect(result.reviewResult.strengths).toHaveLength(1);
      expect(result.reviewResult.confidence).toBe(0.85);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => ''),
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockResponse);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.reviewResume(request)).rejects.toThrow(InvalidResponseError);
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => 'Not valid JSON'),
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockResponse);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.reviewResume(request)).rejects.toThrow(InvalidResponseError);
    });
  });

  describe('modifyResume', () => {
    it('should require reviewResult', async () => {
      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        // reviewResult missing
      };

      await expect(provider.modifyResume(request as any)).rejects.toThrow(InvalidResponseError);
    });

    it('should call Gemini API and parse response', async () => {
      const enhancedResume = {
        ...sampleResume,
        summary: 'Enhanced summary',
      };

      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify(enhancedResume)),
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockResponse);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.8,
        },
      };

      const result = await provider.modifyResume(request);

      expect(result.enhancedResume).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(Array.isArray(result.improvements)).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('enhanceResume', () => {
    it('should orchestrate review and modify', async () => {
      // Mock review response
      const reviewResponse = {
        response: {
          text: jest.fn(() =>
            JSON.stringify({
              strengths: ['Good'],
              weaknesses: [],
              opportunities: [],
              prioritizedActions: [],
              confidence: 0.8,
            })
          ),
        },
      };

      // Mock modify response
      const modifyResponse = {
        response: {
          text: jest.fn(() => JSON.stringify(sampleResume)),
        },
      };

      mockGenerateContent
        .mockResolvedValueOnce(reviewResponse)
        .mockResolvedValueOnce(modifyResponse);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const result = await provider.enhanceResume(request);

      expect(result.enhancedResume).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('429 Rate limit exceeded');
      mockGenerateContent.mockRejectedValueOnce(rateLimitError);

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(provider.reviewResume(request)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      // Create a provider with very short timeout
      const shortTimeoutProvider = new GeminiProvider({
        ...mockConfig,
        timeout: 1, // 1ms timeout
      });

      // Mock a slow response
      mockGenerateContent.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ response: { text: () => '{}' } }), 100))
      );

      const request = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      await expect(shortTimeoutProvider.reviewResume(request)).rejects.toThrow(TimeoutError);
    });
  });
});
