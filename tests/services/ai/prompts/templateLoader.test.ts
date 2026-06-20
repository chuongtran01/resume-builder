/**
 * Unit tests for Markdown prompt template loading.
 */

import {
  loadPromptTemplateText,
  renderPromptTemplate,
} from '../../../../src/services/ai/prompts/templateLoader';

describe('templateLoader', () => {
  it('loads prompt prose from system markdown files', () => {
    const text = loadPromptTemplateText('review.system.md');

    expect(text).toContain('expert resume reviewer');
    expect(text).toContain('OUTPUT FORMAT');
  });

  it('throws a clear error when a prompt template is missing', () => {
    expect(() => loadPromptTemplateText('missing.md')).toThrow(
      'Prompt template not found: missing.md'
    );
  });

  it('renders markdown templates with named placeholders', () => {
    const rendered = renderPromptTemplate('{{greeting}}, {{name}}. {{json}}', {
      greeting: 'Hello',
      name: 'Codex',
      json: '{"brace": true}',
    });

    expect(rendered).toBe('Hello, Codex. {"brace": true}');
  });
});
