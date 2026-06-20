/**
 * Unit tests for review prompt data.
 */

import {
  REVIEW_EXAMPLES,
  REVIEW_FOCUS_AREAS,
  REVIEW_OUTPUT_FORMAT,
  REVIEW_SYSTEM_MESSAGE,
  REVIEW_TASK_DESCRIPTION,
} from '../../../../src/services/ai/prompts/reviewPromptData';

describe('Review Prompt Data', () => {
  it('loads the review role, task, and output format text', () => {
    expect(REVIEW_SYSTEM_MESSAGE).toContain('expert resume reviewer');
    expect(REVIEW_SYSTEM_MESSAGE).toContain('ATS');
    expect(REVIEW_TASK_DESCRIPTION).toContain('Analyze');
    expect(REVIEW_TASK_DESCRIPTION).toContain('job requirements');
    expect(REVIEW_OUTPUT_FORMAT).toContain('JSON');
    expect(REVIEW_OUTPUT_FORMAT).toContain('prioritizedActions');
  });

  it('defines review focus areas and examples', () => {
    expect(REVIEW_FOCUS_AREAS.length).toBeGreaterThan(0);
    expect(REVIEW_FOCUS_AREAS.some(area => area.includes('sections that exist'))).toBe(true);
    expect(REVIEW_EXAMPLES.length).toBeGreaterThan(0);
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('resumeSnippet');
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('jobSnippet');
    expect(REVIEW_EXAMPLES[0]).toHaveProperty('reviewResult');
  });
});
