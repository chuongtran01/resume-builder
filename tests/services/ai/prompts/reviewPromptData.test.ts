/**
 * Unit tests for review prompt data.
 */

import {
  REVIEW_EXAMPLES,
  REVIEW_FOCUS_AREAS,
} from '../../../../src/services/ai/prompts/reviewPromptData';

describe('Review Prompt Data', () => {
  it('defines review focus areas and examples', () => {
    expect(REVIEW_FOCUS_AREAS.length).toBeGreaterThan(0);
    expect(REVIEW_FOCUS_AREAS.some(area => area.includes('sections that exist'))).toBe(true);
    expect(REVIEW_EXAMPLES.length).toBeGreaterThan(0);
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('resumeSnippet');
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('jobSnippet');
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('reviewResult');
  });
});
