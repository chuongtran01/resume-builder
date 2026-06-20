/**
 * Unit tests for modify prompt data.
 */

import {
  ENHANCEMENT_AREAS,
  ENHANCEMENT_EXAMPLES,
  TRUTHFULNESS_RULES,
  getEnhancementAreasForMode,
} from '../../../../src/services/ai/prompts/modifyPromptData';

describe('Modify Prompt Data', () => {
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
