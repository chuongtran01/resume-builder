/**
 * Unit tests for AI Resume Enhancement Service
 */

import { AIResumeEnhancementService } from '../../src/services/aiResumeEnhancementService';
import type { Resume } from '../../src/types/resume.types';
import type {
  AIProvider,
  ReviewResponse,
  AIResponse,
  ReviewResult,
} from '../../src/services/ai/provider.types';
import type { ParsedJobDescription } from '../../src/utils/jobParser';
import type { EnhancementOptions } from '../../src/types/enhancement.types';

// Mock dependencies
jest.mock('../../src/utils/jobParser', () => ({
  parseJobDescription: jest.fn(),
}));

jest.mock('../../src/services/ai/providerRegistry', () => ({
  getProvider: jest.fn(),
  getDefaultProvider: jest.fn(),
}));

jest.mock('../../src/services/atsValidator', () => ({
  validateAtsCompliance: jest.fn(),
}));

import { parseJobDescription } from '../../src/utils/jobParser';
import { getProvider, getDefaultProvider } from '../../src/services/ai/providerRegistry';
import { validateAtsCompliance } from '../../src/services/atsValidator';

describe('AIResumeEnhancementService', () => {
  const sampleResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 123-456-7890',
      location: 'San Francisco, CA',
    },
    summary: 'Experienced software engineer',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: [
          'Built scalable web applications',
          'Led team of 4 engineers',
        ],
      },
    ],
    skills: {
      categories: [
        {
          name: 'Programming Languages',
          items: ['JavaScript', 'TypeScript', 'Python'],
        },
      ],
    },
  };

  const sampleJobDescription = `
    Position: Senior Software Engineer
    Requirements: React, TypeScript, Node.js
  `;

  const sampleParsedJob: ParsedJobDescription = {
    keywords: ['React', 'TypeScript', 'Node.js'],
    requiredSkills: ['JavaScript', 'React'],
    preferredSkills: ['Node.js'],
    requirements: [],
  };

  const sampleReviewResult: ReviewResult = {
    strengths: ['Strong technical background'],
    weaknesses: ['Missing some keywords'],
    opportunities: ['Add more metrics'],
    prioritizedActions: [
      {
        type: 'rewrite',
        section: 'bulletPoints',
        priority: 'high',
        reason: 'Include React and TypeScript keywords',
      },
    ],
    confidence: 0.8,
  };

  const sampleReviewResponse: ReviewResponse = {
    reviewResult: sampleReviewResult,
    tokensUsed: 500,
    cost: 0.001,
  };

  const sampleAIResponse: AIResponse = {
    enhancedResume: {
      ...sampleResume,
      experience: [
        {
          company: sampleResume.experience[0]!.company,
          role: sampleResume.experience[0]!.role,
          startDate: sampleResume.experience[0]!.startDate,
          endDate: sampleResume.experience[0]!.endDate,
          location: sampleResume.experience[0]!.location,
          bulletPoints: [
            'Built scalable React and TypeScript web applications',
            'Led team of 4 engineers using Node.js',
          ],
        },
      ],
    },
    improvements: [
      {
        type: 'bulletPoint',
        section: 'experience[0].bulletPoints[0]',
        original: 'Built scalable web applications',
        suggested: 'Built scalable React and TypeScript web applications',
        reason: 'Added relevant keywords',
        confidence: 0.9,
      },
    ],
    reasoning: 'Enhanced bullet points to include job-relevant keywords',
    confidence: 0.85,
    tokensUsed: 1000,
    cost: 0.002,
  };

  let mockAIProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AI Provider
    mockAIProvider = {
      reviewResume: jest.fn(),
      modifyResume: jest.fn(),
      enhanceResume: jest.fn(),
      validateResponse: jest.fn(),
      estimateCost: jest.fn(),
      getProviderInfo: jest.fn(() => ({
        name: 'gemini',
        displayName: 'Google Gemini',
        supportedModels: ['gemini-pro'],
        defaultModel: 'gemini-pro',
      })),
    } as unknown as jest.Mocked<AIProvider>;

    // Mock job parser
    (parseJobDescription as jest.Mock).mockReturnValue(sampleParsedJob);

    // Mock provider registry
    (getProvider as jest.Mock).mockReturnValue(mockAIProvider);
    (getDefaultProvider as jest.Mock).mockReturnValue(mockAIProvider);

    // Mock ATS validator
    (validateAtsCompliance as jest.Mock).mockReturnValue({ score: 75 });
  });

  describe('Constructor', () => {
    it('should create service with provider name', () => {
      const service = new AIResumeEnhancementService('gemini');
      expect(service).toBeInstanceOf(AIResumeEnhancementService);
      expect(getProvider).toHaveBeenCalledWith('gemini');
    });

    it('should create service with default provider when no name provided', () => {
      const service = new AIResumeEnhancementService();
      expect(service).toBeInstanceOf(AIResumeEnhancementService);
      expect(getDefaultProvider).toHaveBeenCalled();
    });

    it('should throw error when provider not found', () => {
      (getProvider as jest.Mock).mockReturnValue(undefined);
      expect(() => {
        new AIResumeEnhancementService('nonexistent');
      }).toThrow('Provider "nonexistent" not found');
    });

    it('should throw error when default provider not available', () => {
      (getDefaultProvider as jest.Mock).mockReturnValue(null);
      expect(() => {
        new AIResumeEnhancementService();
      }).toThrow('No default AI provider available');
    });
  });

  describe('enhanceResume', () => {
    it('should enhance resume using AI provider', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.enhanceResume(sampleResume, sampleJobDescription);

      expect(result).toBeDefined();
      expect(result.originalResume).toEqual(sampleResume);
      expect(result.enhancedResume).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.atsScore).toBeDefined();
      expect(mockAIProvider.reviewResume).toHaveBeenCalled();
      expect(mockAIProvider.modifyResume).toHaveBeenCalled();
    });

    it('should throw error when AI provider fails', async () => {
      mockAIProvider.reviewResume.mockRejectedValue(new Error('API Error'));

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.enhanceResume(sampleResume, sampleJobDescription)
      ).rejects.toThrow('API Error');
    });

    it('should pass options to enhancement process', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const options: EnhancementOptions = {
        focusAreas: ['bulletPoints'],
        tone: 'professional',
      };

      const service = new AIResumeEnhancementService('gemini');
      await service.enhanceResume(sampleResume, sampleJobDescription, options);

      expect(mockAIProvider.reviewResume).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.any(Object),
        })
      );
    });
  });

  describe('reviewResume', () => {
    it('should review resume and return ReviewResult', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.reviewResume(sampleResume, sampleJobDescription);

      expect(result).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.opportunities).toBeDefined();
      expect(result.prioritizedActions).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(mockAIProvider.reviewResume).toHaveBeenCalled();
    });

    it('should throw error when AI provider is not available', async () => {
      (getProvider as jest.Mock).mockReturnValue(undefined);
      const service = new AIResumeEnhancementService('nonexistent');

      await expect(
        service.reviewResume(sampleResume, sampleJobDescription)
      ).rejects.toThrow('AI provider not available');
    });

    it('should throw error when review fails', async () => {
      mockAIProvider.reviewResume.mockRejectedValue(new Error('Review failed'));

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.reviewResume(sampleResume, sampleJobDescription)
      ).rejects.toThrow('Review failed');
    });

    it('should parse job description before review', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await service.reviewResume(sampleResume, sampleJobDescription);

      expect(parseJobDescription).toHaveBeenCalledWith(sampleJobDescription);
    });

    it('should validate review response', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await service.reviewResume(sampleResume, sampleJobDescription);

      expect(mockAIProvider.validateResponse).toHaveBeenCalledWith(sampleReviewResponse);
    });

    it('should throw error when review response is invalid', async () => {
      mockAIProvider.reviewResume.mockResolvedValue(sampleReviewResponse);
      mockAIProvider.validateResponse.mockReturnValue(false);

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.reviewResume(sampleResume, sampleJobDescription)
      ).rejects.toThrow('Invalid review response structure');
    });
  });

  describe('modifyResume', () => {
    it('should modify resume based on review result', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result).toBeDefined();
      expect(result.originalResume).toEqual(sampleResume);
      expect(result.enhancedResume).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(mockAIProvider.modifyResume).toHaveBeenCalled();
    });

    it('should throw error when AI provider is not available', async () => {
      (getProvider as jest.Mock).mockReturnValue(undefined);
      const service = new AIResumeEnhancementService('nonexistent');

      await expect(
        service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob)
      ).rejects.toThrow('AI provider not available');
    });

    it('should throw error when modification fails', async () => {
      mockAIProvider.modifyResume.mockRejectedValue(new Error('Modification failed'));

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob)
      ).rejects.toThrow('Modification failed');
    });

    it('should validate modification response', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob);

      expect(mockAIProvider.validateResponse).toHaveBeenCalledWith(sampleAIResponse);
    });

    it('should throw error when modification response is invalid', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(false);

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob)
      ).rejects.toThrow('Invalid modification response structure');
    });

    it('should track changes between original and enhanced resume', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.improvements.length).toBeGreaterThan(0);
    });

    it('should calculate ATS scores', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);
      (validateAtsCompliance as jest.Mock)
        .mockReturnValueOnce({ score: 70 }) // Before
        .mockReturnValueOnce({ score: 80 }); // After

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.atsScore).toBeDefined();
      expect(result.atsScore.before).toBe(70);
      expect(result.atsScore.after).toBe(80);
      expect(result.atsScore.improvement).toBe(10);
    });

    it('should generate keyword suggestions', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.keywordSuggestions).toBeDefined();
      expect(Array.isArray(result.keywordSuggestions)).toBe(true);
    });

    it('should identify missing skills', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const jobWithMissingSkills: ParsedJobDescription = {
        ...sampleParsedJob,
        requiredSkills: ['JavaScript', 'React', 'Vue.js'], // Vue.js not in resume
      };

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        jobWithMissingSkills
      );

      expect(result.missingSkills).toBeDefined();
      expect(Array.isArray(result.missingSkills)).toBe(true);
    });

    it('should generate recommendations', async () => {
      mockAIProvider.modifyResume.mockResolvedValue(sampleAIResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Change Tracking', () => {
    it('should track bullet point changes', async () => {
      const enhancedResume: Resume = {
        ...sampleResume,
        experience: [
          {
            company: sampleResume.experience[0]!.company,
            role: sampleResume.experience[0]!.role,
            startDate: sampleResume.experience[0]!.startDate,
            endDate: sampleResume.experience[0]!.endDate,
            location: sampleResume.experience[0]!.location,
            bulletPoints: [
              'Built scalable React web applications', // Changed
              'Led team of 4 engineers', // Same
            ],
          },
        ],
      };

      const aiResponse: AIResponse = {
        ...sampleAIResponse,
        enhancedResume,
      };

      mockAIProvider.modifyResume.mockResolvedValue(aiResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.improvements.length).toBeGreaterThan(0);
      const bulletPointImprovement = result.improvements.find(
        (imp: { type: string }) => imp.type === 'bulletPoint'
      );
      expect(bulletPointImprovement).toBeDefined();
    });

    it('should track skills changes', async () => {
      const enhancedResume: Resume = {
        ...sampleResume,
        skills: {
          categories: [
            {
              name: 'Programming Languages',
              items: ['TypeScript', 'JavaScript', 'Python'], // Reordered
            },
          ],
        },
      };

      const aiResponse: AIResponse = {
        ...sampleAIResponse,
        enhancedResume,
      };

      mockAIProvider.modifyResume.mockResolvedValue(aiResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.improvements).toBeDefined();
    });

    it('should track summary changes', async () => {
      const firstExp = sampleResume.experience[0]!;
      const enhancedResume: Resume = {
        ...sampleResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: firstExp.bulletPoints,
          },
        ],
        summary: 'Experienced software engineer with React and TypeScript expertise',
      };

      const aiResponse: AIResponse = {
        ...sampleAIResponse,
        enhancedResume,
        improvements: [
          {
            type: 'summary',
            section: 'summary',
            original: sampleResume.summary || '',
            suggested: enhancedResume.summary || '',
            reason: 'Enhanced summary with keywords',
            confidence: 0.9,
          },
        ],
      };

      mockAIProvider.modifyResume.mockResolvedValue(aiResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        sampleResume,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result.improvements).toBeDefined();
      const summaryImprovement = result.improvements.find((imp: { type: string }) => imp.type === 'summary');
      expect(summaryImprovement).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid review response structure', async () => {
      const invalidResponse: ReviewResponse = {
        reviewResult: {
          strengths: 'not an array' as unknown as string[],
          weaknesses: [],
          opportunities: [],
          prioritizedActions: [],
          confidence: 0.8,
        },
      };

      mockAIProvider.reviewResume.mockResolvedValue(invalidResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.reviewResume(sampleResume, sampleJobDescription)
      ).rejects.toThrow('Invalid review result structure');
    });

    it('should handle invalid modification response structure', async () => {
      const invalidResponse: AIResponse = {
        enhancedResume: null as unknown as Resume,
        improvements: [],
      };

      mockAIProvider.modifyResume.mockResolvedValue(invalidResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob)
      ).rejects.toThrow('Invalid enhanced resume structure');
    });

    it('should handle missing resume fields in enhanced resume', async () => {
      const invalidResponse: AIResponse = {
        enhancedResume: {
          personalInfo: sampleResume.personalInfo,
          // Missing experience
        } as Resume,
        improvements: [],
      };

      mockAIProvider.modifyResume.mockResolvedValue(invalidResponse);
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      await expect(
        service.modifyResume(sampleResume, sampleReviewResult, sampleParsedJob)
      ).rejects.toThrow('Invalid enhanced resume structure');
    });
  });

  describe('Skills Handling', () => {
    it('should handle resume without skills', async () => {
      const resumeWithoutSkills: Resume = {
        ...sampleResume,
        skills: undefined,
      };

      mockAIProvider.modifyResume.mockResolvedValue({
        ...sampleAIResponse,
        enhancedResume: resumeWithoutSkills,
      });
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        resumeWithoutSkills,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result).toBeDefined();
      expect(result.missingSkills).toBeDefined();
    });

    it('should handle file reference skills', async () => {
      const resumeWithFileRef: Resume = {
        ...sampleResume,
        skills: 'file:./skills.json' as any,
      };

      mockAIProvider.modifyResume.mockResolvedValue({
        ...sampleAIResponse,
        enhancedResume: resumeWithFileRef,
      });
      mockAIProvider.validateResponse.mockReturnValue(true);

      const service = new AIResumeEnhancementService('gemini');
      const result = await service.modifyResume(
        resumeWithFileRef,
        sampleReviewResult,
        sampleParsedJob
      );

      expect(result).toBeDefined();
      // Should handle file reference gracefully
      expect(result.missingSkills).toBeDefined();
    });
  });
});
