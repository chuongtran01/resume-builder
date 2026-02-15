/**
 * Unit tests for Modify Prompt Template
 */

import {
  buildModifyPromptTemplate,
  getModifyPromptTemplate,
  getEnhancementAreasForMode,
} from '../../../../src/services/ai/prompts/modify.template';

describe('Modify Prompt Template', () => {
  describe('buildModifyPromptTemplate', () => {
    it('should create a modify prompt template with default mode', () => {
      const template = buildModifyPromptTemplate();

      expect(template).toBeDefined();
      expect(template.systemMessage).toBeDefined();
      expect(template.taskDescription).toBeDefined();
      expect(template.outputFormat).toBeDefined();
      expect(template.truthfulnessRules).toBeDefined();
      expect(Array.isArray(template.truthfulnessRules)).toBe(true);
      expect(template.mode).toBe('full');
    });

    it('should create template with specified mode', () => {
      const template = buildModifyPromptTemplate('bulletPoints');
      expect(template.mode).toBe('bulletPoints');
    });

    it('should have system message with expert role', () => {
      const template = buildModifyPromptTemplate();
      expect(template.systemMessage).toContain('expert resume writer');
      expect(template.systemMessage).toContain('ATS-optimized');
    });

    it('should have truthfulness rules', () => {
      const template = buildModifyPromptTemplate();
      expect(template.truthfulnessRules.length).toBeGreaterThan(0);
      expect(template.truthfulnessRules[0]).toContain('NEVER');
    });

    it('should have enhancement areas', () => {
      const template = buildModifyPromptTemplate();
      expect(template.enhancementAreas.length).toBeGreaterThan(0);
    });

    it('should include examples', () => {
      const template = buildModifyPromptTemplate();
      expect(template.examples).toBeDefined();
      if (template.examples) {
        expect(template.examples.length).toBeGreaterThan(0);
        expect(template.examples[0]).toHaveProperty('original');
        expect(template.examples[0]).toHaveProperty('enhanced');
        expect(template.examples[0]).toHaveProperty('explanation');
      }
    });
  });

  describe('getModifyPromptTemplate', () => {
    it('should return template with default mode', () => {
      const template = getModifyPromptTemplate();
      expect(template.mode).toBe('full');
    });

    it('should return template with specified mode', () => {
      const template = getModifyPromptTemplate('skills');
      expect(template.mode).toBe('skills');
    });
  });

  describe('getEnhancementAreasForMode', () => {
    it('should return full enhancement areas for full mode', () => {
      const areas = getEnhancementAreasForMode('full');
      expect(areas.length).toBeGreaterThan(0);
    });

    it('should return bullet points specific areas for bulletPoints mode', () => {
      const areas = getEnhancementAreasForMode('bulletPoints');
      expect(areas.length).toBeGreaterThan(0);
      expect(areas[0]).toContain('bullet points');
    });

    it('should return skills specific areas for skills mode', () => {
      const areas = getEnhancementAreasForMode('skills');
      expect(areas.length).toBeGreaterThan(0);
      expect(areas[0]).toContain('skills');
    });

    it('should return summary specific areas for summary mode', () => {
      const areas = getEnhancementAreasForMode('summary');
      expect(areas.length).toBeGreaterThan(0);
      expect(areas[0]).toContain('summary');
    });
  });
});
