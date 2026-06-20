/**
 * Unit tests for Gemini configuration management.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  loadGeminiConfig,
  validateAPIKey,
  type GeminiProviderConfig,
} from '../../../src/services/ai/config';

describe('Gemini Configuration Management', () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-config-test-'));
    configPath = path.join(tempDir, 'gemini.config.json');

    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_TEMPERATURE;
    delete process.env.GEMINI_TIMEOUT;
    delete process.env.GEMINI_MAX_RETRIES;
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  describe('loadGeminiConfig', () => {
    it('returns undefined when no configuration sources are available', async () => {
      const config = await loadGeminiConfig({
        loadFromEnv: false,
        loadFromFile: false,
      });

      expect(config).toBeUndefined();
    });

    it('loads configuration from environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key-123';
      process.env.GEMINI_MODEL = 'gemini-3.5-flash';
      process.env.GEMINI_TEMPERATURE = '0.8';

      const config = await loadGeminiConfig({
        loadFromFile: false,
      });

      expect(config?.apiKey).toBe('test-api-key-123');
      expect(config?.model).toBe('gemini-3.5-flash');
      expect(config?.temperature).toBe(0.8);
    });

    it('accepts gemini-3.5-flash from environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key-123';
      process.env.GEMINI_MODEL = 'gemini-3.5-flash';

      const config = await loadGeminiConfig({
        loadFromFile: false,
      });

      expect(config?.model).toBe('gemini-3.5-flash');
    });

    it('loads configuration from a flat JSON file', async () => {
      const configContent: GeminiProviderConfig = {
        apiKey: 'file-api-key-456',
        model: 'gemini-3.5-flash',
        temperature: 0.6,
      };

      await fs.writeJSON(configPath, configContent);

      const config = await loadGeminiConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config?.apiKey).toBe('file-api-key-456');
      expect(config?.model).toBe('gemini-3.5-flash');
      expect(config?.temperature).toBe(0.6);
    });

    it('loads configuration from a legacy nested JSON file', async () => {
      await fs.writeJSON(configPath, {
        gemini: {
          apiKey: 'nested-api-key',
          model: 'gemini-3.1-pro',
        },
      });

      const config = await loadGeminiConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config?.apiKey).toBe('nested-api-key');
      expect(config?.model).toBe('gemini-3.1-pro');
    });

    it('resolves environment variable references in config files', async () => {
      process.env.GEMINI_API_KEY = 'env-resolved-key';

      await fs.writeJSON(configPath, {
        apiKey: '${GEMINI_API_KEY}',
        model: 'gemini-3.5-flash',
      });

      const config = await loadGeminiConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config?.apiKey).toBe('env-resolved-key');
    });

    it('throws if an environment variable reference is not set', async () => {
      await fs.writeJSON(configPath, {
        apiKey: '${MISSING_VAR}',
        model: 'gemini-3.5-flash',
      });

      await expect(
        loadGeminiConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow(/Environment variable.*MISSING_VAR/);
    });

    it('merges environment and file config with file taking precedence', async () => {
      process.env.GEMINI_API_KEY = 'env-key';
      process.env.GEMINI_MODEL = 'gemini-3.5-flash';

      await fs.writeJSON(configPath, {
        apiKey: 'file-key',
        model: 'gemini-3.1-pro',
        temperature: 0.9,
      });

      const config = await loadGeminiConfig({ configPath });

      expect(config?.apiKey).toBe('file-key');
      expect(config?.model).toBe('gemini-3.1-pro');
      expect(config?.temperature).toBe(0.9);
    });

    it('validates Gemini model names', async () => {
      await fs.writeJSON(configPath, {
        apiKey: 'test-key',
        model: 'invalid-model',
      });

      await expect(
        loadGeminiConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow('Configuration validation failed');
    });

    it('validates Gemini API key is required', async () => {
      await fs.writeJSON(configPath, {
        model: 'gemini-3.5-flash',
      });

      await expect(
        loadGeminiConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow(/Gemini API key is required/);
    });

    it('validates temperature range', async () => {
      await fs.writeJSON(configPath, {
        apiKey: 'test-key',
        model: 'gemini-3.5-flash',
        temperature: 1.5,
      });

      await expect(
        loadGeminiConfig({
          configPath,
          loadFromEnv: false,
        })
      ).rejects.toThrow(/temperature must be a number between 0 and 1/);
    });

    it('handles missing config files gracefully', async () => {
      const config = await loadGeminiConfig({
        configPath: path.join(tempDir, 'nonexistent.json'),
        loadFromEnv: false,
      });

      expect(config).toBeUndefined();
    });

    it('handles invalid JSON in config files gracefully', async () => {
      await fs.writeFile(configPath, 'invalid json content');

      const config = await loadGeminiConfig({
        configPath,
        loadFromEnv: false,
      });

      expect(config).toBeUndefined();
    });

    it('skips validation when validate is false', async () => {
      await fs.writeJSON(configPath, {
        model: 'invalid-model',
      });

      const config = await loadGeminiConfig({
        configPath,
        loadFromEnv: false,
        validate: false,
      });

      expect(config?.model).toBe('invalid-model');
    });

    it('uses gemini-3.1-pro when GEMINI_MODEL is not set', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.GEMINI_TEMPERATURE = '0.75';
      process.env.GEMINI_TIMEOUT = '45000';
      process.env.GEMINI_MAX_RETRIES = '5';

      const config = await loadGeminiConfig({
        loadFromFile: false,
      });

      expect(config?.model).toBe('gemini-3.1-pro');
      expect(config?.temperature).toBe(0.75);
      expect(config?.timeout).toBe(45000);
      expect(config?.maxRetries).toBe(5);
    });

    it('ignores invalid numeric environment variables', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.GEMINI_TEMPERATURE = 'invalid';
      process.env.GEMINI_TIMEOUT = '0';

      const config = await loadGeminiConfig({
        loadFromFile: false,
      });

      expect(config?.temperature).toBeUndefined();
      expect(config?.timeout).toBeUndefined();
    });
  });

  describe('validateAPIKey', () => {
    it('validates Gemini API key format', () => {
      expect(validateAPIKey('valid-api-key-12345')).toBe(true);
      expect(validateAPIKey('')).toBe(false);
      expect(validateAPIKey('short')).toBe(false);
    });
  });
});
