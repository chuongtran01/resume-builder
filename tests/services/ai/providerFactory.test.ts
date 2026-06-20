/**
 * Unit tests for AI provider factory helpers.
 */

import { createAIProvider, createGeminiProvider } from '../../../src/services/ai/providerFactory';
import { createGeminiResumeClient } from '../../../src/services/ai/gemini';
import type { AIConfig } from '../../../src/services/ai/config';

jest.mock('../../../src/services/ai/gemini', () => ({
  createGeminiResumeClient: jest.fn().mockImplementation((config) => ({
    config,
    getProviderInfo: jest.fn(() => ({
      name: 'gemini',
      displayName: 'Google Gemini',
      supportedModels: ['gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-3-flash-preview'],
      defaultModel: 'gemini-3.1-pro',
    })),
  })),
}));

describe('providerFactory', () => {
  const baseConfig: AIConfig = {
    defaultProvider: 'gemini',
    providers: {
      gemini: {
        apiKey: 'test-key',
        model: 'gemini-3.1-pro',
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
    expect(createGeminiResumeClient).toHaveBeenCalledWith(baseConfig.providers?.gemini);
  });

  it('applies runtime overrides when creating a Gemini provider', () => {
    const result = createAIProvider(baseConfig, 'gemini', {
      temperature: 0.9,
      maxTokens: 500,
    });

    expect(result.config).toEqual(
      expect.objectContaining({
        apiKey: 'test-key',
        model: 'gemini-3.1-pro',
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
            model: 'gemini-3.1-pro',
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
