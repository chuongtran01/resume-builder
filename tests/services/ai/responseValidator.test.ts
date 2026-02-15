/**
 * Unit tests for response format validator
 */

import {
  validateResponseFormat,
  validateResumeStructureOnly,
  validateImprovementsOnly,
} from '../../../src/services/ai/responseValidator';
import type { AIResponse, ReviewResponse } from '../../../src/services/ai/provider.types';
import type { Resume } from '../../../src/types/resume.types';
import type { Improvement } from '../../../src/types/enhancement.types';

describe('ResponseValidator', () => {
  const baseResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      location: 'San Francisco, CA',
    },
    experience: [
      {
        company: 'Tech Corp',
        role: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2022-12',
        location: 'San Francisco, CA',
        bulletPoints: [
          'Developed web applications using React and TypeScript',
          'Improved performance by 30%',
        ],
      },
    ],
  };

  const validImprovements: Improvement[] = [
    {
      type: 'bulletPoint',
      section: 'experience',
      original: 'Developed applications',
      suggested: 'Developed scalable web applications using React and TypeScript',
      reason: 'Added relevant technologies',
      confidence: 0.9,
    },
  ];

  describe('validateResponseFormat', () => {
    describe('AI Response validation', () => {
      it('should validate a valid AI response', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
          reasoning: 'Enhanced resume with relevant keywords',
          confidence: 0.85,
        };

        const result = validateResponseFormat(response, 'ai');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate AI response from JSON string', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
        };

        const jsonString = JSON.stringify(response);
        const result = validateResponseFormat(jsonString, 'ai');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing enhancedResume', () => {
        const response = {
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai');
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('enhancedResume'))).toBe(true);
      });

      it('should detect missing improvements', () => {
        const response = {
          enhancedResume: baseResume,
        };

        const result = validateResponseFormat(response, 'ai', { attemptRecovery: false });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('improvements'))).toBe(true);
      });

      it('should detect invalid confidence score', () => {
        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          improvements: validImprovements,
          confidence: 1.5, // Invalid: > 1
        };

        const result = validateResponseFormat(response, 'ai');
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('confidence'))).toBe(true);
      });

      it('should validate optional fields', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
          reasoning: 'Test reasoning',
          confidence: 0.8,
          tokensUsed: 1500,
          cost: 0.05,
        };

        const result = validateResponseFormat(response, 'ai');
        expect(result.isValid).toBe(true);
      });
    });

    describe('Review Response validation', () => {
      it('should validate a valid review response', () => {
        const response: ReviewResponse = {
          reviewResult: {
            strengths: ['Strong technical skills', 'Relevant experience'],
            weaknesses: ['Missing some keywords'],
            opportunities: ['Can add more metrics'],
            prioritizedActions: [
              {
                type: 'enhance',
                section: 'experience',
                priority: 'high',
                reason: 'Add relevant keywords',
              },
            ],
            confidence: 0.9,
            reasoning: 'Good foundation',
          },
        };

        const result = validateResponseFormat(response, 'review');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing reviewResult', () => {
        const response = {};

        const result = validateResponseFormat(response, 'review', { attemptRecovery: false });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('reviewResult'))).toBe(true);
      });

      it('should detect missing strengths', () => {
        const response = {
          reviewResult: {
            weaknesses: [],
            opportunities: [],
            prioritizedActions: [],
            confidence: 0.8,
          },
        } as unknown as ReviewResponse;

        const result = validateResponseFormat(response, 'review', { attemptRecovery: false });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('strengths'))).toBe(true);
      });

      it('should detect invalid confidence score', () => {
        const response = {
          reviewResult: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            prioritizedActions: [],
            confidence: -0.5, // Invalid: < 0
          },
        } as unknown as ReviewResponse;

        const result = validateResponseFormat(response, 'review');
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('confidence'))).toBe(true);
      });

      it('should warn about missing optional fields', () => {
        const response: ReviewResponse = {
          reviewResult: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            prioritizedActions: [],
            confidence: 0.8,
            // Missing reasoning (optional)
          },
        };

        const result = validateResponseFormat(response, 'review');
        expect(result.isValid).toBe(true);
        // Should not have errors for missing optional fields
      });
    });

    describe('JSON recovery', () => {
      it('should recover JSON from markdown code block', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
        };

        const jsonString = JSON.stringify(response);
        const markdownResponse = `\`\`\`json\n${jsonString}\n\`\`\``;

        const result = validateResponseFormat(markdownResponse, 'ai', { attemptRecovery: true });
        expect(result.isValid).toBe(true);
        expect(result.recoveryAttempted).toBe(true);
        expect(result.warnings.some(w => w.includes('recovered'))).toBe(true);
      });

      it('should recover JSON from text with JSON object', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
        };

        const jsonString = JSON.stringify(response);
        const textResponse = `Here is the response:\n${jsonString}\nEnd of response`;

        const result = validateResponseFormat(textResponse, 'ai', { attemptRecovery: true });
        expect(result.isValid).toBe(true);
        expect(result.recoveryAttempted).toBe(true);
      });

      it('should fail if JSON recovery is disabled', () => {
        const invalidJson = '{ invalid json }';

        const result = validateResponseFormat(invalidJson, 'ai', { attemptRecovery: false });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Structure recovery', () => {
      it('should recover review response with missing arrays', () => {
        const response: Partial<ReviewResponse> = {
          reviewResult: {
            strengths: ['Test'],
            // Missing weaknesses, opportunities, prioritizedActions
            confidence: 0.8,
          } as any,
        };

        const result = validateResponseFormat(response, 'review', { attemptRecovery: true });
        expect(result.isValid).toBe(true);
        expect(result.recoveryAttempted).toBe(true);
        expect(result.recoveredResponse).toBeDefined();
      });

      it('should recover AI response with missing improvements', () => {
        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          // Missing improvements
        };

        const result = validateResponseFormat(response, 'ai', { attemptRecovery: true });
        expect(result.isValid).toBe(true);
        expect(result.recoveryAttempted).toBe(true);
        expect(result.recoveredResponse).toBeDefined();
      });

      it('should fail recovery if enhancedResume is missing', () => {
        const response: Partial<AIResponse> = {
          improvements: validImprovements,
          // Missing enhancedResume
        };

        const result = validateResponseFormat(response, 'ai', { attemptRecovery: true });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('enhancedResume'))).toBe(true);
      });
    });

    describe('Resume validation', () => {
      it('should validate resume structure in AI response', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai', { strictResumeValidation: true });
        expect(result.isValid).toBe(true);
      });

      it('should detect invalid resume structure', () => {
        const invalidResume = {
          // Missing personalInfo
          experience: [],
        };

        const response: Partial<AIResponse> = {
          enhancedResume: invalidResume as unknown as Resume,
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai', { strictResumeValidation: true });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('personalInfo'))).toBe(true);
      });

      it('should warn about resume issues in non-strict mode', () => {
        const invalidResume = {
          // Missing personalInfo
          experience: [],
        };

        const response: Partial<AIResponse> = {
          enhancedResume: invalidResume as unknown as Resume,
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai', { strictResumeValidation: false });
        // In non-strict mode, resume errors become warnings
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('Improvements validation', () => {
      it('should validate improvements array', () => {
        const response: AIResponse = {
          enhancedResume: baseResume,
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai', { validateImprovements: true });
        expect(result.isValid).toBe(true);
      });

      it('should detect invalid improvement type', () => {
        const invalidImprovements = [
          {
            type: 'invalidType',
            section: 'experience',
            original: 'test',
            suggested: 'test',
            reason: 'test',
            confidence: 0.8,
          },
        ];

        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          improvements: invalidImprovements as Improvement[],
        };

        const result = validateResponseFormat(response, 'ai', { validateImprovements: true });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('type'))).toBe(true);
      });

      it('should detect missing improvement fields', () => {
        const invalidImprovements = [
          {
            type: 'bulletPoint',
            // Missing section, original, suggested, reason, confidence
          },
        ];

        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          improvements: invalidImprovements as Improvement[],
        };

        const result = validateResponseFormat(response, 'ai', { validateImprovements: true });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should detect invalid confidence in improvement', () => {
        const invalidImprovements = [
          {
            type: 'bulletPoint',
            section: 'experience',
            original: 'test',
            suggested: 'test',
            reason: 'test',
            confidence: 1.5, // Invalid: > 1
          },
        ];

        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          improvements: invalidImprovements as Improvement[],
        };

        const result = validateResponseFormat(response, 'ai', { validateImprovements: true });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('confidence'))).toBe(true);
      });

      it('should skip improvements validation if disabled', () => {
        const invalidImprovements = [
          {
            type: 'invalidType',
            section: 'experience',
            original: 'test',
            suggested: 'test',
            reason: 'test',
            confidence: 0.8,
          },
        ];

        const response: Partial<AIResponse> = {
          enhancedResume: baseResume,
          improvements: invalidImprovements as Improvement[],
        };

        const result = validateResponseFormat(response, 'ai', { validateImprovements: false });
        // Should still validate JSON structure, but not improvements
        expect(result.errors.some(e => e.includes('improvements') && e.includes('type'))).toBe(false);
      });
    });

    describe('Suggestions generation', () => {
      it('should generate suggestions for JSON errors', () => {
        const invalidJson = '{ invalid }';

        const result = validateResponseFormat(invalidJson, 'ai');
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions.some(s => s.includes('JSON'))).toBe(true);
      });

      it('should generate suggestions for missing fields', () => {
        const response = {
          // Missing enhancedResume and improvements
        };

        const result = validateResponseFormat(response, 'ai');
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions.some(s => s.includes('enhancedResume'))).toBe(true);
      });

      it('should generate suggestions for resume validation errors', () => {
        const invalidResume = {
          // Missing personalInfo
          experience: [],
        };

        const response: Partial<AIResponse> = {
          enhancedResume: invalidResume as unknown as Resume,
          improvements: validImprovements,
        };

        const result = validateResponseFormat(response, 'ai', { strictResumeValidation: true });
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions.some(s => s.includes('personalInfo') || s.includes('required'))).toBe(true);
      });
    });
  });

  describe('validateResumeStructureOnly', () => {
    it('should return true for valid resume', () => {
      const result = validateResumeStructureOnly(baseResume, true);
      expect(result).toBe(true);
    });

    it('should return false for invalid resume in strict mode', () => {
      const invalidResume = {
        // Missing personalInfo
        experience: [],
      };

      const result = validateResumeStructureOnly(invalidResume, true);
      expect(result).toBe(false);
    });

    it('should return true for invalid resume in non-strict mode', () => {
      const invalidResume = {
        // Missing personalInfo
        experience: [],
      };

      const result = validateResumeStructureOnly(invalidResume, false);
      // Non-strict mode doesn't fail, just warns
      expect(result).toBe(true);
    });
  });

  describe('validateImprovementsOnly', () => {
    it('should return true for valid improvements', () => {
      const result = validateImprovementsOnly(validImprovements);
      expect(result).toBe(true);
    });

    it('should return false for invalid improvements', () => {
      const invalidImprovements = [
        {
          type: 'invalidType',
          section: 'experience',
          original: 'test',
          suggested: 'test',
          reason: 'test',
          confidence: 0.8,
        },
      ];

      const result = validateImprovementsOnly(invalidImprovements);
      expect(result).toBe(false);
    });

    it('should return false for non-array', () => {
      const result = validateImprovementsOnly('not an array');
      expect(result).toBe(false);
    });
  });
});
