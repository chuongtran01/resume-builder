/**
 * Unit tests for Markdown prompt template loading.
 */

import {
  loadPromptTemplateText,
  renderPromptTemplate,
} from '../../../../src/services/ai/prompts/templateLoader';

describe('templateLoader', () => {
  it('loads prompt prose from markdown files', () => {
    const text = loadPromptTemplateText('review.role.md');

    expect(text).toContain('expert resume reviewer');
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
