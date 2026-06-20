/**
 * Unit tests for AI provider factory helpers.
 */

import { createAIProvider, createGeminiProvider } from '../../../src/services/ai/providerFactory';
import { GeminiProvider } from '../../../src/services/ai/gemini';
import type { AIConfig } from '../../../src/services/ai/config';

jest.mock('../../../src/services/ai/gemini', () => ({
  GeminiProvider: jest.fn().mockImplementation((config) => ({
    config,
    getProviderInfo: jest.fn(() => ({
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-3-flash-preview', 'gemini-2.5-pro'],
      defaultModel: 'gemini-3-flash-preview',
    })),
  })),
}));

describe('providerFactory', () => {
  const baseConfig: AIConfig = {
    defaultProvider: 'gemini',
    providers: {
      gemini: {
        apiKey: 'test-key',
        model: 'gemini-3-flash-preview',
        temperature: 0.4,
        maxTokens: 1000,
        timeout: 30000,
        maxRetries: 2,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a Gemini provider with config defaults', () => {
    const result = createGeminiProvider(baseConfig);

    expect(result.providerName).toBe('gemini');
    expect(result.provider).toBeDefined();
    expect(result.config).toEqual(baseConfig.providers?.gemini);
    expect(GeminiProvider).toHaveBeenCalledWith(baseConfig.providers?.gemini);
  });

  it('applies request overrides when creating a Gemini provider', () => {
    const result = createAIProvider(baseConfig, 'gemini', {
      model: 'gemini-2.5-pro',
      temperature: 0.9,
      maxTokens: 500,
    });

    expect(result.config).toEqual(
      expect.objectContaining({
        apiKey: 'test-key',
        model: 'gemini-2.5-pro',
        temperature: 0.9,
        maxTokens: 500,
        timeout: 30000,
        maxRetries: 2,
      })
    );
  });

  it('throws for missing Gemini API key', () => {
    expect(() =>
      createGeminiProvider({
        providers: {
          gemini: {
            apiKey: '',
            model: 'gemini-3-flash-preview',
          },
        },
      })
    ).toThrow('Gemini API key not configured');
  });

  it('throws for unsupported providers', () => {
    expect(() =>
      createAIProvider(baseConfig, 'openai' as 'gemini')
    ).toThrow('Only "gemini" is currently supported');
  });
});
