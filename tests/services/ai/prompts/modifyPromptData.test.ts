/**
 * Unit tests for modify prompt data.
 */

import {
  ENHANCEMENT_AREAS,
  ENHANCEMENT_EXAMPLES,
  MODIFY_OUTPUT_FORMAT,
  MODIFY_SYSTEM_MESSAGE,
  MODIFY_TASK_DESCRIPTION,
  TRUTHFULNESS_RULES,
  getEnhancementAreasForMode,
} from '../../../../src/services/ai/prompts/modifyPromptData';

describe('Modify Prompt Data', () => {
  it('loads the modify role, task, and output format text', () => {
    expect(MODIFY_SYSTEM_MESSAGE).toContain('expert resume writer');
    expect(MODIFY_SYSTEM_MESSAGE).toContain('ATS-optimized');
    expect(MODIFY_TASK_DESCRIPTION).toContain('Enhance');
    expect(MODIFY_OUTPUT_FORMAT).toContain('JSON');
    expect(MODIFY_OUTPUT_FORMAT).toContain('enhancedResume');
  });

  it('defines truthfulness rules, enhancement areas, and examples', () => {
    expect(TRUTHFULNESS_RULES.length).toBeGreaterThan(0);
    expect(TRUTHFULNESS_RULES[0]).toContain('NEVER');
    expect(ENHANCEMENT_AREAS.length).toBeGreaterThan(0);
    expect(ENHANCEMENT_EXAMPLES.length).toBeGreaterThan(0);
    expect(ENHANCEMENT_EXAMPLES[0]).toHaveProperty('original');
    expect(ENHANCEMENT_EXAMPLES[0]).toHaveProperty('enhanced');
    expect(ENHANCEMENT_EXAMPLES[0]).toHaveProperty('explanation');
  });

  it('returns mode-specific enhancement areas', () => {
    expect(getEnhancementAreasForMode('full')).toBe(ENHANCEMENT_AREAS);
    expect(getEnhancementAreasForMode('bulletPoints')[0]).toContain('bullet points');
    expect(getEnhancementAreasForMode('skills')[0]).toContain('skills');
    expect(getEnhancementAreasForMode('summary')[0]).toContain('summary');
  });
});
