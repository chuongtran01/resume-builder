/**
 * Factory helpers for constructing AI providers from configuration.
 */

import type { GeminiConfig } from '@services/ai/gemini';
import { GeminiProvider } from '@services/ai/gemini';
import type { AIConfig } from '@services/ai/config';
import { getGeminiConfig } from '@services/ai/config';
import type { AIProvider } from '@services/ai/provider.types';

export type SupportedAIProvider = 'gemini';

export interface ProviderOverrides {
  model?: GeminiConfig['model'];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface ProviderCreationResult {
  providerName: SupportedAIProvider;
  provider: AIProvider;
  config: GeminiConfig;
}

export function createAIProvider(
  aiConfig: AIConfig,
  providerName: SupportedAIProvider = 'gemini',
  overrides: ProviderOverrides = {}
): ProviderCreationResult {
  if (providerName !== 'gemini') {
    throw new Error(`Provider "${providerName}" is not supported. Only "gemini" is currently supported.`);
  }

  return createGeminiProvider(aiConfig, overrides);
}

export function createGeminiProvider(
  aiConfig: AIConfig,
  overrides: ProviderOverrides = {}
): ProviderCreationResult {
  const geminiConfig = getGeminiConfig(aiConfig);
  if (!geminiConfig || !geminiConfig.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const finalConfig: GeminiConfig = {
    ...geminiConfig,
    model: overrides.model || geminiConfig.model || 'gemini-3-flash-preview',
    temperature: overrides.temperature !== undefined
      ? overrides.temperature
      : (geminiConfig.temperature ?? 0.7),
    maxTokens: overrides.maxTokens !== undefined
      ? overrides.maxTokens
      : geminiConfig.maxTokens,
    timeout: overrides.timeout !== undefined
      ? overrides.timeout
      : geminiConfig.timeout,
    maxRetries: overrides.maxRetries !== undefined
      ? overrides.maxRetries
      : geminiConfig.maxRetries,
  };

  return {
    providerName: 'gemini',
    provider: new GeminiProvider(finalConfig),
    config: finalConfig,
  };
}
