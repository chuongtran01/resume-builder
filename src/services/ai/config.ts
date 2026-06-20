/**
 * Gemini configuration management.
 *
 * Loads Gemini settings from .env and optional JSON config files.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { config as loadDotenv } from 'dotenv';
import { logger } from '@utils/logger';

const envResult = loadDotenv();
const envVars = envResult.parsed || {};

export interface GeminiProviderConfig {
  /** API key for Google AI */
  apiKey: string;
  /** Model to use */
  model: 'gemini-3.1-pro' | 'gemini-3.5-flash';
  /** Temperature (0-1) for creativity control */
  temperature?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay base in milliseconds */
  retryDelayBase?: number;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigLoadOptions {
  /** Config file path (optional - only used if loadFromFile is true, .env is preferred) */
  configPath?: string;
  /** Whether to load from .env file (default: true) */
  loadFromEnv?: boolean;
  /** Whether to load from JSON config file (default: false - use .env instead) */
  loadFromFile?: boolean;
  /** Whether to validate configuration (default: true) */
  validate?: boolean;
}

const ENV_VARS = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GEMINI_MODEL: 'GEMINI_MODEL',
  GEMINI_TEMPERATURE: 'GEMINI_TEMPERATURE',
  GEMINI_TIMEOUT: 'GEMINI_TIMEOUT',
  GEMINI_MAX_RETRIES: 'GEMINI_MAX_RETRIES',
} as const;

function getEnvVar(name: string): string | undefined {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }
  return envVars[name];
}

function resolveEnvVar(value: string): string {
  const envMatch = value.match(/^\$\{([^}]+)\}$/);
  if (envMatch && envMatch[1]) {
    const envVar = envMatch[1];
    const envValue = getEnvVar(envVar);
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set in .env file`);
    }
    return envValue;
  }
  return value;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = parseInt(value, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : undefined;
}

function loadFromEnvironment(): Partial<GeminiProviderConfig> | undefined {
  const apiKey = getEnvVar(ENV_VARS.GEMINI_API_KEY);
  if (!apiKey) {
    return undefined;
  }

  const config: Partial<GeminiProviderConfig> = {
    apiKey,
    model: (getEnvVar(ENV_VARS.GEMINI_MODEL) as GeminiProviderConfig['model']) || 'gemini-3.1-pro',
  };

  const temperature = getEnvVar(ENV_VARS.GEMINI_TEMPERATURE);
  if (temperature) {
    const parsed = parseFloat(temperature);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      config.temperature = parsed;
    }
  }

  const timeout = parsePositiveInteger(getEnvVar(ENV_VARS.GEMINI_TIMEOUT));
  if (timeout !== undefined) {
    config.timeout = timeout;
  }

  const maxRetriesEnv = getEnvVar(ENV_VARS.GEMINI_MAX_RETRIES);
  if (maxRetriesEnv) {
    const maxRetries = parseInt(maxRetriesEnv, 10);
    if (!isNaN(maxRetries) && maxRetries >= 0) {
      config.maxRetries = maxRetries;
    }
  }

  return config;
}

async function loadFromFile(configPath: string): Promise<Partial<GeminiProviderConfig> | undefined> {
  const fullPath = path.resolve(configPath);
  const exists = await fs.pathExists(fullPath);
  if (!exists) {
    logger.debug(`Config file not found: ${fullPath}`);
    return undefined;
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<GeminiProviderConfig> & {
      gemini?: Partial<GeminiProviderConfig>;
    };
    const config: Partial<GeminiProviderConfig> | undefined = parsed.gemini ?? parsed;

    if (config?.apiKey) {
      config.apiKey = resolveEnvVar(config.apiKey);
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

function mergeConfigs(
  envConfig: Partial<GeminiProviderConfig> | undefined,
  fileConfig: Partial<GeminiProviderConfig> | undefined
): GeminiProviderConfig | undefined {
  if (!envConfig && !fileConfig) {
    return undefined;
  }

  return {
    ...envConfig,
    ...fileConfig,
    apiKey: fileConfig?.apiKey || envConfig?.apiKey || '',
    model: (fileConfig?.model || envConfig?.model || 'gemini-3.1-pro') as GeminiProviderConfig['model'],
  };
}

function validateConfig(config: GeminiProviderConfig | undefined): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    warnings.push('Gemini configuration not found. API key will be required at runtime.');
    return { valid: true, errors, warnings };
  }

  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('Gemini API key is required');
  }

  const validModels = ['gemini-3.1-pro', 'gemini-3.5-flash'];
  if (config.model && !validModels.includes(config.model)) {
    errors.push(`Invalid Gemini model: ${config.model}. Must be one of: ${validModels.join(', ')}`);
  }

  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
      errors.push('Gemini temperature must be a number between 0 and 1');
    }
  }

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      errors.push('Gemini timeout must be a positive number');
    }
  }

  if (config.maxRetries !== undefined) {
    if (typeof config.maxRetries !== 'number' || config.maxRetries < 0) {
      errors.push('Gemini maxRetries must be a non-negative number');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export async function loadGeminiConfig(
  options: ConfigLoadOptions = {}
): Promise<GeminiProviderConfig | undefined> {
  const {
    configPath,
    loadFromEnv = true,
    loadFromFile: shouldLoadFromFile,
    validate = true,
  } = options;

  const shouldLoadFromFileAuto = shouldLoadFromFile ?? (configPath !== undefined);

  logger.debug('Loading Gemini configuration');

  let envConfig: Partial<GeminiProviderConfig> | undefined;
  if (loadFromEnv) {
    try {
      envConfig = loadFromEnvironment();
      logger.debug('Gemini configuration loaded from environment variables');
    } catch (error) {
      logger.warn(`Failed to load Gemini configuration from environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  let fileConfig: Partial<GeminiProviderConfig> | undefined;
  if (shouldLoadFromFileAuto) {
    if (!configPath) {
      throw new Error('configPath is required when loadFromFile is true');
    }

    try {
      fileConfig = await loadFromFile(configPath);
      logger.debug(`Gemini configuration loaded from file: ${configPath}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Environment variable')) {
        throw error;
      }
      logger.warn(`Failed to load Gemini configuration from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const mergedConfig = mergeConfigs(envConfig, fileConfig);

  if (validate) {
    const validation = validateConfig(mergedConfig);
    if (!validation.valid) {
      throw new Error(
        `Configuration validation failed:\n${validation.errors.join('\n')}`
      );
    }
    if (validation.warnings.length > 0) {
      logger.warn(`Configuration warnings:\n${validation.warnings.join('\n')}`);
    }
  }

  logger.debug('Gemini configuration loaded.');

  return mergedConfig;
}

export function validateAPIKey(apiKey: string): boolean {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }

  return apiKey.length > 10;
}
