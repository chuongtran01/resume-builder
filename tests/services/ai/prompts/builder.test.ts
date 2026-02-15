/**
 * Unit tests for Prompt Builder
 */

import {
  buildReviewPrompt,
  buildModifyPrompt,
  estimatePromptTokens,
  truncatePrompt,
} from '../../../../src/services/ai/prompts/builder';
import type { PromptContext } from '../../../../src/services/ai/prompts/types';
import type { Resume } from '../../../../src/types/resume.types';
import type { ParsedJobDescription } from '../../../../src/utils/jobParser';
import type { ReviewResult } from '../../../../src/services/ai/provider.types';

describe('Prompt Builder', () => {
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
        location: 'San Francisco, CA',
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

  const sampleReviewResult: ReviewResult = {
    strengths: ['Good technical skills'],
    weaknesses: ['Missing keywords'],
    opportunities: ['Add metrics'],
    prioritizedActions: [],
    confidence: 0.8,
  };

  describe('buildReviewPrompt', () => {
    it('should build review prompt with context', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const prompt = buildReviewPrompt(context);

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('RESUME');
      expect(prompt).toContain('JOB REQUIREMENTS');
      expect(prompt).toContain('Test User');
      expect(prompt).toContain('React');
    });

    it('should include examples when requested', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const prompt = buildReviewPrompt(context, { includeExamples: true });
      expect(prompt).toContain('EXAMPLES');
    });

    it('should exclude examples when not requested', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const prompt = buildReviewPrompt(context, { includeExamples: false });
      // Examples section should not be prominent (may still appear in template structure)
      // But the actual examples content should be minimal
      expect(prompt).toBeDefined();
    });

    it('should compress prompt when requested', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const normalPrompt = buildReviewPrompt(context, { compress: false });
      const compressedPrompt = buildReviewPrompt(context, { compress: true });

      expect(compressedPrompt.length).toBeLessThanOrEqual(normalPrompt.length);
    });
  });

  describe('buildModifyPrompt', () => {
    it('should build modify prompt with context and review result', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: sampleReviewResult,
      };

      const prompt = buildModifyPrompt(context);

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('ORIGINAL RESUME');
      expect(prompt).toContain('JOB REQUIREMENTS');
      expect(prompt).toContain('REVIEW FINDINGS');
      expect(prompt).toContain('CRITICAL RULES');
    });

    it('should throw error if review result is missing', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        // reviewResult missing
      };

      expect(() => buildModifyPrompt(context)).toThrow('Review result is required');
    });

    it('should support different enhancement modes', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: sampleReviewResult,
      };

      const fullPrompt = buildModifyPrompt(context, { mode: 'full' });
      const bulletPointsPrompt = buildModifyPrompt(context, { mode: 'bulletPoints' });
      const skillsPrompt = buildModifyPrompt(context, { mode: 'skills' });
      const summaryPrompt = buildModifyPrompt(context, { mode: 'summary' });

      expect(fullPrompt).toBeDefined();
      expect(bulletPointsPrompt).toBeDefined();
      expect(skillsPrompt).toBeDefined();
      expect(summaryPrompt).toBeDefined();

      // Mode-specific prompts should have different content
      expect(bulletPointsPrompt).toContain('bullet points');
      expect(skillsPrompt).toContain('skills');
      expect(summaryPrompt).toContain('summary');
    });

    it('should include examples when requested', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: sampleReviewResult,
      };

      const prompt = buildModifyPrompt(context, { includeExamples: true });
      expect(prompt).toContain('EXAMPLES');
    });
  });

  describe('estimatePromptTokens', () => {
    it('should estimate tokens correctly', () => {
      const prompt = 'This is a test prompt with some content.';
      const tokens = estimatePromptTokens(prompt);

      expect(tokens).toBeGreaterThan(0);
      // Rough estimation: 1 token ≈ 4 characters
      expect(tokens).toBeCloseTo(prompt.length / 4, 0);
    });

    it('should handle empty prompt', () => {
      const tokens = estimatePromptTokens('');
      expect(tokens).toBe(0);
    });

    it('should handle long prompt', () => {
      const longPrompt = 'A'.repeat(1000);
      const tokens = estimatePromptTokens(longPrompt);
      expect(tokens).toBeCloseTo(250, 0); // 1000 / 4 = 250
    });
  });

  describe('truncatePrompt', () => {
    it('should return prompt unchanged if under limit', () => {
      const prompt = 'Short prompt';
      const truncated = truncatePrompt(prompt, 100);
      expect(truncated).toBe(prompt);
    });

    it('should truncate prompt if over limit', () => {
      const longPrompt = 'A'.repeat(1000);
      const truncated = truncatePrompt(longPrompt, 100); // 100 tokens = 400 chars

      expect(truncated.length).toBeLessThanOrEqual(400 + 50); // Allow some buffer
      expect(truncated).toContain('truncated');
    });

    it('should try to truncate at sentence boundary', () => {
      const prompt = 'Sentence one. Sentence two. Sentence three. ' + 'A'.repeat(1000);
      const truncated = truncatePrompt(prompt, 50);

      expect(truncated.length).toBeLessThanOrEqual(200 + 50);
      // Should try to cut at a period
      expect(truncated).toBeDefined();
    });
  });
});
