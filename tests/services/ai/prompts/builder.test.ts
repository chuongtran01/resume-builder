/**
 * Unit tests for Prompt Builder
 */

import {
  buildReviewPromptMessages,
  buildModifyPromptMessages,
  combinePromptMessages,
  estimatePromptTokens,
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

  describe('buildReviewPromptMessages', () => {
    it('builds separate system and caller prompts with context', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const messages = buildReviewPromptMessages(context);

      expect(messages.system).toContain('expert resume reviewer');
      expect(messages.system).toContain('ANALYSIS FOCUS');
      expect(messages.system).toContain('OUTPUT FORMAT');
      expect(messages.prompt).toContain('RESUME');
      expect(messages.prompt).toContain('JOB REQUIREMENTS');
      expect(messages.prompt).toContain('Test User');
      expect(messages.prompt).toContain('React');
      expect(messages.system).not.toContain('Test User');
    });

    it('loads examples from the review system prompt', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      const messages = buildReviewPromptMessages(context);

      expect(messages.system).toContain('EXAMPLES');
      expect(messages.system).toContain('Resume Snippet');
    });

    it('supports direct Resume and JobInfo arguments', () => {
      const messages = buildReviewPromptMessages(sampleResume, sampleJobInfo);

      expect(messages.prompt).toContain('Test User');
      expect(messages.prompt).toContain('React');
    });

    it('applies tone adjustments to the system prompt', () => {
      const professional = buildReviewPromptMessages(sampleResume, sampleJobInfo, { tone: 'professional' });
      const concise = buildReviewPromptMessages(sampleResume, sampleJobInfo, { tone: 'concise' });
      const detailed = buildReviewPromptMessages(sampleResume, sampleJobInfo, { tone: 'detailed' });

      expect(concise.system.length).toBeLessThanOrEqual(professional.system.length);
      expect(detailed.system).toContain('Please provide detailed analysis');
      expect(concise.prompt).toBe(professional.prompt);
    });

    it('filters focus areas in the system prompt', () => {
      const filter: FocusAreaFilter = {
        include: ['keywords', 'skills'],
        maxAreas: 2,
      };

      const messages = buildReviewPromptMessages(sampleResume, sampleJobInfo, { focusAreas: filter });

      expect(messages.system).toContain('ANALYSIS FOCUS');
      expect(messages.prompt).toContain('Test User');
    });
  });

  describe('buildModifyPromptMessages', () => {
    it('builds separate system and caller prompts with review findings', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
        reviewResult: sampleReviewResult,
      };

      const messages = buildModifyPromptMessages(context);

      expect(messages.system).toContain('expert resume writer');
      expect(messages.system).toContain('CRITICAL RULES');
      expect(messages.system).toContain('ENHANCEMENT FOCUS');
      expect(messages.prompt).toContain('ORIGINAL RESUME');
      expect(messages.prompt).toContain('JOB REQUIREMENTS');
      expect(messages.prompt).toContain('REVIEW FINDINGS');
      expect(messages.prompt).toContain('Missing keywords');
      expect(messages.system).not.toContain('Test User');
    });

    it('throws when review result is missing', () => {
      const context: PromptContext = {
        resume: sampleResume,
        jobInfo: sampleJobInfo,
      };

      expect(() => buildModifyPromptMessages(context)).toThrow('Review result is required');
    });

    it('loads examples from the modify system prompt', () => {
      const messages = buildModifyPromptMessages(sampleResume, sampleJobInfo, sampleReviewResult);

      expect(messages.system).toContain('EXAMPLES');
      expect(messages.system).toContain('Original:');
    });
  });

  describe('combinePromptMessages', () => {
    it('combines system and caller prompts for diagnostics', () => {
      const messages = buildReviewPromptMessages(sampleResume, sampleJobInfo);
      const combined = combinePromptMessages(messages);

      expect(combined).toContain(messages.system);
      expect(combined).toContain(messages.prompt);
    });
  });

  describe('estimatePromptTokens', () => {
    it('estimates tokens from character count', () => {
      const prompt = 'This is a test prompt with some content.';
      const tokens = estimatePromptTokens(prompt);

      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeCloseTo(prompt.length / 4, 0);
    });

    it('handles empty and long prompts', () => {
      expect(estimatePromptTokens('')).toBe(0);
      expect(estimatePromptTokens('A'.repeat(1000))).toBeCloseTo(250, 0);
    });
  });

  describe('validatePrompt', () => {
    it('validates review prompt structure', () => {
      const prompt = combinePromptMessages(
        buildReviewPromptMessages(sampleResume, sampleJobInfo, { validate: false })
      );
      const validation = validatePrompt(prompt, 'review');

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.sections.systemMessage).toBe(true);
      expect(validation.sections.context).toBe(true);
      expect(validation.sections.taskDescription).toBe(true);
      expect(validation.sections.outputFormat).toBe(true);
    });

    it('validates modify prompt structure', () => {
      const prompt = combinePromptMessages(
        buildModifyPromptMessages(sampleResume, sampleJobInfo, sampleReviewResult, { validate: false })
      );
      const validation = validatePrompt(prompt, 'modify');

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.sections.systemMessage).toBe(true);
      expect(validation.sections.context).toBe(true);
    });

    it('detects missing sections', () => {
      const validation = validatePrompt('Short prompt', 'review');

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('detects missing review findings in modify prompt', () => {
      const promptWithoutReview = 'You are an expert. CONTEXT: RESUME: {} JOB REQUIREMENTS: {}';
      const validation = validatePrompt(promptWithoutReview, 'modify');

      expect(validation.errors.some(error => error.includes('review findings'))).toBe(true);
    });

    it('warns about very large prompts and reports token count', () => {
      const largePrompt = 'A'.repeat(500000);
      const validation = validatePrompt(largePrompt, 'review');

      expect(validation.warnings.some(warning => warning.includes('Very large prompt'))).toBe(true);
      expect(validation.tokenCount).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    it('caches prompt messages when enabled', () => {
      const prompt1 = buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: true });
      const prompt2 = buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: true });
      const stats = getPromptCacheStats();

      expect(prompt1).toBe(prompt2);
      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
    });

    it('does not cache when disabled', () => {
      buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: false });

      expect(getPromptCacheStats().size).toBe(0);
    });

    it('clears cache', () => {
      buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: true });
      expect(getPromptCacheStats().size).toBe(1);

      clearPromptCache();
      expect(getPromptCacheStats().size).toBe(0);
    });

    it('separates cached entries by version', () => {
      const prompt1 = buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: true, version: '1.0.0' });
      const prompt2 = buildReviewPromptMessages(sampleResume, sampleJobInfo, { useCache: true, version: '2.0.0' });

      expect(prompt1).toBeDefined();
      expect(prompt2).toBeDefined();
      expect(getPromptCacheStats().size).toBe(2);
    });
  });

  describe('getPromptVersion', () => {
    it('returns current prompt version', () => {
      const version = getPromptVersion();

      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
