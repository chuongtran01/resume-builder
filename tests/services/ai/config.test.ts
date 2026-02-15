/**
 * Unit tests for AI configuration management
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  loadAIConfig,
  getGeminiConfig,
  getDefaultProvider,
  validateAPIKey,
  getProviderConfig,
  createDefaultConfig,
  type AIConfig,
} from '../../../src/services/ai/config';

describe('AI Configuration Management', () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    // Create temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-config-test-'));
    configPath = path.join(tempDir, 'ai.config.json');
    
    // Clear environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEFAULT_AI_PROVIDER;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_TEMPERATURE;
    delete process.env.GEMINI_MAX_TOKENS;
    delete process.env.GEMINI_TIMEOUT;
    delete process.env.GEMINI_MAX_RETRIES;
    delete process.env.FALLBACK_TO_MOCK;
    delete process.env.ENHANCEMENT_MODE;
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  describe('loadAIConfig', () => {
    it('should load default configuration when no sources are available', async () => {
      const config = await loadAIConfig({
        loadFromEnv: false,
        loadFromFile: false,
      });

      expect(config.defaultProvider).toBe('gemini');
      expect(config.enhancementMode).toBe('sequential');
    });

    it('should load configuration from environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key-123';
      process.env.DEFAULT_AI_PROVIDER = 'gemini';
      process.env.GEMINI_MODEL = 'gemini-2.5-pro';
      process.env.GEMINI_TEMPERATURE = '0.8';
      process.env.GEMINI_MAX_TOKENS = '3000';
      process.env.ENHANCEMENT_MODE = 'sequential';

      const config = await loadAIConfig({
        loadFromFile: false,
      });

      expect(config.defaultProvider).toBe('gemini');
      expect(config.providers?.gemini?.apiKey).toBe('test-api-key-123');
      expect(config.providers?.gemini?.model).toBe('gemini-2.5-pro');
      expect(config.providers?.gemini?.temperature).toBe(0.8);
      expect(config.providers?.gemini?.maxTokens).toBe(3000);
      expect(config.enhancementMode).toBe('sequential');
    });

    it('should load configuration from JSON file', async () => {
      const configContent: AIConfig = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'file-api-key-456',
            model: 'gemini-3-flash-preview',
            temperature: 0.6,
            maxTokens: 1500,
          },
        },
        enhancementMode: 'sequential',
      };

      await fs.writeJSON(configPath, configContent);

      const config = await loadAIConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config.defaultProvider).toBe('gemini');
      expect(config.providers?.gemini?.apiKey).toBe('file-api-key-456');
      expect(config.providers?.gemini?.model).toBe('gemini-3-flash-preview');
      expect(config.providers?.gemini?.temperature).toBe(0.6);
      expect(config.providers?.gemini?.maxTokens).toBe(1500);
    });

    it('should resolve environment variable references in config file', async () => {
      process.env.GEMINI_API_KEY = 'env-resolved-key';
      
      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: '${GEMINI_API_KEY}',
            model: 'gemini-2.5-pro',
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      const config = await loadAIConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config.providers?.gemini?.apiKey).toBe('env-resolved-key');
    });

    it('should throw error if environment variable reference is not set', async () => {
      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: '${MISSING_VAR}',
            model: 'gemini-2.5-pro',
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      await expect(
        loadAIConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow('Environment variable MISSING_VAR is not set');
    });

    it('should merge environment and file config (file takes precedence)', async () => {
      process.env.GEMINI_API_KEY = 'env-key';
      process.env.DEFAULT_AI_PROVIDER = 'gemini';
      process.env.GEMINI_MODEL = 'gemini-2.5-pro';

      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'file-key',
            model: 'gemini-2.5-pro',
            temperature: 0.9,
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      const config = await loadAIConfig({
        configPath,
      });

      // File config takes precedence
      expect(config.providers?.gemini?.apiKey).toBe('file-key');
      expect(config.providers?.gemini?.model).toBe('gemini-2.5-pro');
      expect(config.providers?.gemini?.temperature).toBe(0.9);
    });

    it('should validate configuration and throw on invalid config', async () => {
      const configContent = {
        defaultProvider: 'invalid-provider',
        providers: {
          gemini: {
            apiKey: 'test-key',
            model: 'invalid-model',
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      await expect(
        loadAIConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow('Configuration validation failed');
    });

    it('should validate Gemini API key is required', async () => {
      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            model: 'gemini-2.5-pro',
            // Missing apiKey
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      await expect(
        loadAIConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow(/Gemini API key is required|Gemini provider is selected but no configuration found/);
    });

    it('should validate temperature range', async () => {
      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'test-key',
            model: 'gemini-2.5-pro',
            temperature: 1.5, // Invalid: > 1
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      await expect(
        loadAIConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow('temperature must be a number between 0 and 1');
    });

    it('should validate maxTokens is positive', async () => {
      const configContent = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'test-key',
            model: 'gemini-2.5-pro',
            maxTokens: -100, // Invalid: negative
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      await expect(
        loadAIConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow('maxTokens must be a positive number');
    });

    it('should handle missing config file gracefully', async () => {
      const config = await loadAIConfig({
        configPath: path.join(tempDir, 'nonexistent.json'),
        loadFromEnv: false,
      });

      // Should return default config
      expect(config.defaultProvider).toBe('gemini');
    });

    it('should handle invalid JSON in config file', async () => {
      await fs.writeFile(configPath, 'invalid json content');

      // The function catches JSON errors and logs a warning, returning default config
      // So we check that it doesn't throw and returns a valid config
      const config = await loadAIConfig({
        configPath,
        loadFromEnv: false,
      });

      // Should return default config when JSON is invalid
      expect(config.defaultProvider).toBe('gemini');
    });

    it('should skip validation when validate is false', async () => {
      const configContent = {
        defaultProvider: 'invalid-provider',
        providers: {
          gemini: {
            model: 'invalid-model',
            // Missing apiKey
          },
        },
      };

      await fs.writeJSON(configPath, configContent);

      const config = await loadAIConfig({
        configPath,
        loadFromEnv: false,
        validate: false,
      });

      // Should load without validation
      expect(config.defaultProvider).toBe('invalid-provider');
    });
  });

  describe('getGeminiConfig', () => {
    it('should return Gemini configuration when present', () => {
      const config: AIConfig = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'test-key',
            model: 'gemini-2.5-pro',
          },
        },
      };

      const geminiConfig = getGeminiConfig(config);
      expect(geminiConfig).toBeDefined();
      expect(geminiConfig?.apiKey).toBe('test-key');
      expect(geminiConfig?.model).toBe('gemini-2.5-pro');
    });

    it('should return undefined when Gemini config is not present', () => {
      const config: AIConfig = {
        defaultProvider: 'gemini',
        providers: {},
      };

      const geminiConfig = getGeminiConfig(config);
      expect(geminiConfig).toBeUndefined();
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider from config', () => {
      const config: AIConfig = {
        defaultProvider: 'gemini',
        providers: {},
      };

      expect(getDefaultProvider(config)).toBe('gemini');
    });

    it('should return gemini when default provider is not set', () => {
      const config: AIConfig = {
        providers: {},
      };

      expect(getDefaultProvider(config)).toBe('gemini');
    });
  });

  describe('validateAPIKey', () => {
    it('should validate Gemini API key format', () => {
      expect(validateAPIKey('valid-api-key-12345', 'gemini')).toBe(true);
      expect(validateAPIKey('', 'gemini')).toBe(false);
      expect(validateAPIKey('short', 'gemini')).toBe(false);
    });
  });

  describe('getProviderConfig', () => {
    it('should return provider configuration', () => {
      const config: AIConfig = {
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'test-key',
            model: 'gemini-2.5-pro',
          },
        },
      };

      const providerConfig = getProviderConfig(config, 'gemini');
      expect(providerConfig).toBeDefined();
      expect(providerConfig?.apiKey).toBe('test-key');
    });

    it('should return undefined for non-existent provider', () => {
      const config: AIConfig = {
        defaultProvider: 'gemini',
        providers: {},
      };

      const providerConfig = getProviderConfig(config, 'gemini');
      expect(providerConfig).toBeUndefined();
    });
  });

  describe('createDefaultConfig', () => {
    it('should create default configuration', () => {
      const config = createDefaultConfig();

      expect(config.defaultProvider).toBe('gemini');
      expect(config.enhancementMode).toBe('sequential');
      expect(config.providers).toEqual({});
    });
  });

  describe('Environment variable parsing', () => {
    it('should parse numeric environment variables correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.GEMINI_TEMPERATURE = '0.75';
      process.env.GEMINI_MAX_TOKENS = '2500';
      process.env.GEMINI_TIMEOUT = '45000';
      process.env.GEMINI_MAX_RETRIES = '5';

      const config = await loadAIConfig({
        loadFromFile: false,
      });

      expect(config.providers?.gemini?.temperature).toBe(0.75);
      expect(config.providers?.gemini?.maxTokens).toBe(2500);
      expect(config.providers?.gemini?.timeout).toBe(45000);
      expect(config.providers?.gemini?.maxRetries).toBe(5);
    });

    it('should ignore invalid numeric environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.GEMINI_TEMPERATURE = 'invalid';
      process.env.GEMINI_MAX_TOKENS = '-100';
      process.env.GEMINI_TIMEOUT = '0';

      const config = await loadAIConfig({
        loadFromFile: false,
      });

      // Should use defaults or not set invalid values
      expect(config.providers?.gemini?.temperature).toBeUndefined();
      expect(config.providers?.gemini?.maxTokens).toBeUndefined();
      expect(config.providers?.gemini?.timeout).toBeUndefined();
    });

    it('should handle boolean environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const config = await loadAIConfig({
        loadFromFile: false,
      });

      expect(config.defaultProvider).toBe('gemini');
    });
  });
});
