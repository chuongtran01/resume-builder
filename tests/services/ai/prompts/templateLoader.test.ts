/**
 * Unit tests for Markdown prompt template loading.
 */

import { loadPromptTemplateText } from '../../../../src/services/ai/prompts/templateLoader';

describe('templateLoader', () => {
  it('loads prompt prose from markdown files', () => {
    const text = loadPromptTemplateText('review.system.md');

    expect(text).toContain('expert resume reviewer');
  });

  it('throws a clear error when a prompt template is missing', () => {
    expect(() => loadPromptTemplateText('missing.md')).toThrow(
      'Prompt template not found: missing.md'
    );
  });
});
