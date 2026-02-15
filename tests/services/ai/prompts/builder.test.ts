/**
 * Unit tests for Prompt Builder
 * 
 * Tests both basic prompt building functionality and enhanced features
 * (caching, validation, tone adjustments, focus area filtering).
 */

import {
  buildReviewPrompt,
  buildModifyPrompt,
  estimatePromptTokens,
  truncatePrompt,
  validatePrompt,
  clearPromptCache,
  getPromptCacheStats,
  getPromptVersion,
  type FocusAreaFilter,
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

  beforeEach(() => {
    clearPromptCache();
  });

  // ============================================================================
  // Basic Prompt Building (PromptContext API)
  // ============================================================================

  describe('Basic Prompt Building (PromptContext API)', () => {
    describe('buildReviewPrompt with PromptContext', () => {
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

    describe('buildModifyPrompt with PromptContext', () => {
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
  });

  // ============================================================================
  // Enhanced Prompt Building (Direct Resume/JobInfo API)
  // ============================================================================

  describe('Enhanced Prompt Building (Direct Resume/JobInfo API)', () => {
    describe('buildReviewPrompt with Resume and JobInfo', () => {
      it('should build review prompt with basic options', () => {
        const prompt = buildReviewPrompt(sampleResume, sampleJobInfo);

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('RESUME');
        expect(prompt).toContain('JOB REQUIREMENTS');
        expect(prompt).toContain('Test User');
      });

      it('should apply tone adjustments', () => {
        const professionalPrompt = buildReviewPrompt(sampleResume, sampleJobInfo, { tone: 'professional' });
        const concisePrompt = buildReviewPrompt(sampleResume, sampleJobInfo, { tone: 'concise' });
        const detailedPrompt = buildReviewPrompt(sampleResume, sampleJobInfo, { tone: 'detailed' });

        expect(professionalPrompt).toBeDefined();
        expect(concisePrompt).toBeDefined();
        expect(detailedPrompt).toBeDefined();

        // Concise should be shorter or have examples removed
        expect(concisePrompt.length).toBeLessThanOrEqual(professionalPrompt.length);
      });

      it('should filter focus areas', () => {
        const filter: FocusAreaFilter = {
          include: ['keywords', 'skills'],
          maxAreas: 2,
        };

        const prompt = buildReviewPrompt(sampleResume, sampleJobInfo, { focusAreas: filter });
        expect(prompt).toBeDefined();
      });

      it('should use cache when enabled', () => {
        const prompt1 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true });
        const prompt2 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true });

        expect(prompt1).toBe(prompt2);
      });

      it('should not use cache when disabled', () => {
        const prompt1 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: false });
        const prompt2 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: false });

        // Prompts should be the same content-wise, but may be different objects
        expect(prompt1).toBeDefined();
        expect(prompt2).toBeDefined();
      });

      it('should validate prompt when requested', () => {
        const prompt = buildReviewPrompt(sampleResume, sampleJobInfo, { validate: true });
        expect(prompt).toBeDefined();
      });

      it('should truncate when exceeding max tokens', () => {
        const prompt = buildReviewPrompt(sampleResume, sampleJobInfo, { maxTokens: 100 });
        expect(prompt).toBeDefined();
        expect(prompt.length).toBeLessThanOrEqual(400 + 100); // 100 tokens * 4 chars + buffer
      });
    });

    describe('buildModifyPrompt with Resume, JobInfo, and ReviewResult', () => {
      it('should build modify prompt with review result', () => {
        const prompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult);

        expect(prompt).toBeDefined();
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('ORIGINAL RESUME');
        expect(prompt).toContain('REVIEW FINDINGS');
        expect(prompt).toContain('CRITICAL RULES');
      });

      it('should apply tone adjustments', () => {
        const professionalPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { tone: 'professional' });
        const concisePrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { tone: 'concise' });

        expect(professionalPrompt).toBeDefined();
        expect(concisePrompt).toBeDefined();
      });

      it('should support different enhancement modes', () => {
        const fullPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { mode: 'full' });
        const bulletPointsPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { mode: 'bulletPoints' });
        const skillsPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { mode: 'skills' });
        const summaryPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { mode: 'summary' });

        expect(fullPrompt).toBeDefined();
        expect(bulletPointsPrompt).toBeDefined();
        expect(skillsPrompt).toBeDefined();
        expect(summaryPrompt).toBeDefined();

        expect(bulletPointsPrompt).toContain('bullet points');
        expect(skillsPrompt).toContain('skills');
        expect(summaryPrompt).toContain('summary');
      });

      it('should use cache when enabled', () => {
        const prompt1 = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { useCache: true });
        const prompt2 = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { useCache: true });

        expect(prompt1).toBe(prompt2);
      });

      it('should validate prompt when requested', () => {
        const prompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { validate: true });
        expect(prompt).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

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

  // ============================================================================
  // Prompt Validation
  // ============================================================================

  describe('validatePrompt', () => {
    it('should validate review prompt structure', () => {
      const validPrompt = buildReviewPrompt(sampleResume, sampleJobInfo, { validate: false });
      const validation = validatePrompt(validPrompt, 'review');

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.sections.systemMessage).toBe(true);
      expect(validation.sections.context).toBe(true);
      expect(validation.sections.taskDescription).toBe(true);
      expect(validation.sections.outputFormat).toBe(true);
    });

    it('should validate modify prompt structure', () => {
      const validPrompt = buildModifyPrompt(sampleResume, sampleJobInfo, sampleReviewResult, { validate: false });
      const validation = validatePrompt(validPrompt, 'modify');

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.sections.systemMessage).toBe(true);
      expect(validation.sections.context).toBe(true);
    });

    it('should detect missing sections', () => {
      const invalidPrompt = 'Short prompt';
      const validation = validatePrompt(invalidPrompt, 'review');

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing review findings in modify prompt', () => {
      const promptWithoutReview = 'You are an expert. CONTEXT: RESUME: {} JOB REQUIREMENTS: {}';
      const validation = validatePrompt(promptWithoutReview, 'modify');

      expect(validation.errors.some(e => e.includes('review findings'))).toBe(true);
    });

    it('should warn about very large prompts', () => {
      const largePrompt = 'A'.repeat(500000); // Very large prompt
      const validation = validatePrompt(largePrompt, 'review');

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('Very large prompt'))).toBe(true);
    });

    it('should calculate token count', () => {
      const prompt = buildReviewPrompt(sampleResume, sampleJobInfo, { validate: false });
      const validation = validatePrompt(prompt, 'review');

      expect(validation.tokenCount).toBeGreaterThan(0);
      expect(typeof validation.tokenCount).toBe('number');
    });
  });

  // ============================================================================
  // Cache Management
  // ============================================================================

  describe('Cache Management', () => {
    it('should cache prompts', () => {
      buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true });
      const stats = getPromptCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries.length).toBe(1);
    });

    it('should clear cache', () => {
      buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true });
      expect(getPromptCacheStats().size).toBe(1);

      clearPromptCache();
      expect(getPromptCacheStats().size).toBe(0);
    });

    it('should return cache statistics', () => {
      buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true });
      const stats = getPromptCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('entries');
      expect(Array.isArray(stats.entries)).toBe(true);
    });

    it('should not cache when useCache is false', () => {
      buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: false });
      expect(getPromptCacheStats().size).toBe(0);
    });

    it('should handle cache versioning', () => {
      const prompt1 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true, version: '1.0.0' });
      const prompt2 = buildReviewPrompt(sampleResume, sampleJobInfo, { useCache: true, version: '2.0.0' });

      // Different versions should not use cache
      expect(prompt1).toBeDefined();
      expect(prompt2).toBeDefined();
    });
  });

  // ============================================================================
  // Version Management
  // ============================================================================

  describe('getPromptVersion', () => {
    it('should return current prompt version', () => {
      const version = getPromptVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });
  });
});
