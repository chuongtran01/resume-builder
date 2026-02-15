/**
 * Unit tests for Review Prompt Template
 */

import { buildReviewPromptTemplate, getReviewPromptTemplate } from '../../../../src/services/ai/prompts/review.template';

describe('Review Prompt Template', () => {
  describe('buildReviewPromptTemplate', () => {
    it('should create a review prompt template', () => {
      const template = buildReviewPromptTemplate();

      expect(template).toBeDefined();
      expect(template.systemMessage).toBeDefined();
      expect(template.taskDescription).toBeDefined();
      expect(template.outputFormat).toBeDefined();
      expect(template.focusAreas).toBeDefined();
      expect(Array.isArray(template.focusAreas)).toBe(true);
    });

    it('should have system message with expert role', () => {
      const template = buildReviewPromptTemplate();
      expect(template.systemMessage).toContain('expert resume reviewer');
      expect(template.systemMessage).toContain('ATS');
    });

    it('should have task description', () => {
      const template = buildReviewPromptTemplate();
      expect(template.taskDescription).toContain('Analyze');
      expect(template.taskDescription).toContain('resume');
      expect(template.taskDescription).toContain('job requirements');
    });

    it('should have output format with JSON structure', () => {
      const template = buildReviewPromptTemplate();
      expect(template.outputFormat).toContain('JSON');
      expect(template.outputFormat).toContain('strengths');
      expect(template.outputFormat).toContain('weaknesses');
      expect(template.outputFormat).toContain('prioritizedActions');
    });

    it('should have focus areas', () => {
      const template = buildReviewPromptTemplate();
      expect(template.focusAreas.length).toBeGreaterThan(0);
      expect(template.focusAreas[0]).toBeDefined();
    });

    it('should include examples', () => {
      const template = buildReviewPromptTemplate();
      expect(template.examples).toBeDefined();
      if (template.examples) {
        expect(template.examples.length).toBeGreaterThan(0);
        expect(template.examples[0]).toHaveProperty('resumeSnippet');
        expect(template.examples[0]).toHaveProperty('jobSnippet');
        expect(template.examples[0]).toHaveProperty('reviewResult');
      }
    });
  });

  describe('getReviewPromptTemplate', () => {
    it('should return the same template as buildReviewPromptTemplate', () => {
      const template1 = buildReviewPromptTemplate();
      const template2 = getReviewPromptTemplate();

      expect(template1.systemMessage).toBe(template2.systemMessage);
      expect(template1.taskDescription).toBe(template2.taskDescription);
      expect(template1.outputFormat).toBe(template2.outputFormat);
    });
  });
});
