/**
 * AI Configuration Management
 * 
 * Manages AI provider settings, API keys, and configuration options.
 * Supports loading from environment variables and config files.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { config as loadDotenv } from 'dotenv';
import { logger } from '@utils/logger';

// Load .env file and get parsed result (only from .env, not system env)
const envResult = loadDotenv();
const envVars = envResult.parsed || {};

/**
 * Gemini provider configuration
 */
export interface GeminiProviderConfig {
  /** API key for Google AI */
  apiKey: string;
  /** Model to use - supports latest models from official docs */
  model: 'gemini-2.5-pro' | 'gemini-3-flash-preview';
  /** Temperature (0-1) for creativity control */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay base in milliseconds */
  retryDelayBase?: number;
}

/**
 * AI configuration structure
 */
export interface AIConfig {
  /** Default provider to use */
  defaultProvider?: 'gemini';
  /** Provider-specific configurations */
  providers?: {
    gemini?: GeminiProviderConfig;
    // Future: other providers can be added here
  };
  /** Enhancement mode */
  enhancementMode?: 'sequential' | 'agent';
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration loading options
 */
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

/**
 * Environment variable names
 */
const ENV_VARS = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  DEFAULT_AI_PROVIDER: 'DEFAULT_AI_PROVIDER',
  GEMINI_MODEL: 'GEMINI_MODEL',
  GEMINI_TEMPERATURE: 'GEMINI_TEMPERATURE',
  GEMINI_MAX_TOKENS: 'GEMINI_MAX_TOKENS',
  GEMINI_TIMEOUT: 'GEMINI_TIMEOUT',
  GEMINI_MAX_RETRIES: 'GEMINI_MAX_RETRIES',
  ENHANCEMENT_MODE: 'ENHANCEMENT_MODE',
} as const;

/**
 * Get environment variable value from .env file only
 */
function getEnvVar(name: string): string | undefined {
  return envVars[name];
}

/**
 * Resolve environment variable value (supports ${VAR} syntax)
 */
function resolveEnvVar(value: string): string {
  // Check if value is an environment variable reference
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

/**
 * Load configuration from .env file only (not system environment variables)
 */
function loadFromEnvironment(): Partial<AIConfig> {
  const config: Partial<AIConfig> = {
    providers: {},
  };

  // Default provider
  const defaultProviderEnv = getEnvVar(ENV_VARS.DEFAULT_AI_PROVIDER);
  if (defaultProviderEnv) {
    const provider = defaultProviderEnv as 'gemini';
    if (provider === 'gemini') {
      config.defaultProvider = provider;
    }
  }

  // Gemini configuration
  const geminiApiKey = getEnvVar(ENV_VARS.GEMINI_API_KEY);
  if (geminiApiKey) {
    config.providers!.gemini = {
      apiKey: geminiApiKey,
      model: (getEnvVar(ENV_VARS.GEMINI_MODEL) as 'gemini-2.5-pro' | 'gemini-3-flash-preview') || 'gemini-2.5-pro',
    };

    // Optional Gemini settings
    const tempEnv = getEnvVar(ENV_VARS.GEMINI_TEMPERATURE);
    if (tempEnv && config.providers?.gemini) {
      const temp = parseFloat(tempEnv);
      if (!isNaN(temp) && temp >= 0 && temp <= 1) {
        config.providers.gemini.temperature = temp;
      }
    }

    const maxTokensEnv = getEnvVar(ENV_VARS.GEMINI_MAX_TOKENS);
    if (maxTokensEnv && config.providers?.gemini) {
      const maxTokens = parseInt(maxTokensEnv, 10);
      if (!isNaN(maxTokens) && maxTokens > 0) {
        config.providers.gemini.maxTokens = maxTokens;
      }
    }

    const timeoutEnv = getEnvVar(ENV_VARS.GEMINI_TIMEOUT);
    if (timeoutEnv && config.providers?.gemini) {
      const timeout = parseInt(timeoutEnv, 10);
      if (!isNaN(timeout) && timeout > 0) {
        config.providers.gemini.timeout = timeout;
      }
    }

    const maxRetriesEnv = getEnvVar(ENV_VARS.GEMINI_MAX_RETRIES);
    if (maxRetriesEnv && config.providers?.gemini) {
      const maxRetries = parseInt(maxRetriesEnv, 10);
      if (!isNaN(maxRetries) && maxRetries >= 0) {
        config.providers.gemini.maxRetries = maxRetries;
      }
    }
  }

  // Enhancement mode
  const enhancementModeEnv = getEnvVar(ENV_VARS.ENHANCEMENT_MODE);
  if (enhancementModeEnv) {
    const mode = enhancementModeEnv as 'sequential' | 'agent';
    if (mode === 'sequential' || mode === 'agent') {
      config.enhancementMode = mode;
    }
  }

  return config;
}

/**
 * Load configuration from JSON file
 */
async function loadFromFile(configPath: string): Promise<Partial<AIConfig>> {
  const fullPath = path.resolve(configPath);
  
  // Check if file exists
  const exists = await fs.pathExists(fullPath);
  if (!exists) {
    logger.debug(`Config file not found: ${fullPath}`);
    return {};
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    const config = JSON.parse(content) as Partial<AIConfig>;

    // Resolve environment variable references in API keys
    if (config.providers?.gemini?.apiKey) {
      try {
        config.providers.gemini.apiKey = resolveEnvVar(config.providers.gemini.apiKey);
      } catch (error) {
        // Re-throw env var resolution errors so they can be caught by caller
        throw error;
      }
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Merge configurations (file config takes precedence over env config)
 */
function mergeConfigs(
  envConfig: Partial<AIConfig>,
  fileConfig: Partial<AIConfig>
): AIConfig {
  // Deep merge gemini config
  let geminiConfig: GeminiProviderConfig | undefined;
  if (envConfig.providers?.gemini || fileConfig.providers?.gemini) {
    const envGemini = envConfig.providers?.gemini;
    const fileGemini = fileConfig.providers?.gemini;
    
    // If either has apiKey, merge them (file takes precedence)
    if (envGemini?.apiKey || fileGemini?.apiKey) {
      geminiConfig = {
        ...envGemini,
        ...fileGemini,
        // Ensure apiKey is present (required field)
        apiKey: fileGemini?.apiKey || envGemini?.apiKey || '',
        // Ensure model is present (required field)
        model: fileGemini?.model || envGemini?.model || 'gemini-2.5-pro',
      };
    }
  }

  const merged: AIConfig = {
    defaultProvider: fileConfig.defaultProvider ?? envConfig.defaultProvider ?? 'gemini',
    providers: {
      ...envConfig.providers,
      ...fileConfig.providers,
      gemini: geminiConfig,
    },
    enhancementMode: fileConfig.enhancementMode ?? envConfig.enhancementMode ?? 'sequential',
  };

  return merged;
}

/**
 * Validate configuration
 */
function validateConfig(config: AIConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate default provider
  if (config.defaultProvider && config.defaultProvider !== 'gemini') {
    errors.push(`Invalid defaultProvider: ${config.defaultProvider}. Must be 'gemini'`);
  }

  // Validate Gemini configuration if provider is gemini
  if (config.defaultProvider === 'gemini' || config.providers?.gemini) {
    const geminiConfig = config.providers?.gemini;
    
    if (!geminiConfig) {
      errors.push('Gemini provider is selected but no configuration found');
    } else {
      // Validate API key
      if (!geminiConfig.apiKey || geminiConfig.apiKey.trim() === '') {
        errors.push('Gemini API key is required');
      }

      // Validate model
      const validModels = ['gemini-2.5-pro', 'gemini-3-flash-preview'];
      if (geminiConfig.model && !validModels.includes(geminiConfig.model)) {
        errors.push(`Invalid Gemini model: ${geminiConfig.model}. Must be one of: ${validModels.join(', ')}`);
      }

      // Validate temperature
      if (geminiConfig.temperature !== undefined) {
        if (typeof geminiConfig.temperature !== 'number' || geminiConfig.temperature < 0 || geminiConfig.temperature > 1) {
          errors.push('Gemini temperature must be a number between 0 and 1');
        }
      }

      // Validate maxTokens
      if (geminiConfig.maxTokens !== undefined) {
        if (typeof geminiConfig.maxTokens !== 'number' || geminiConfig.maxTokens <= 0) {
          errors.push('Gemini maxTokens must be a positive number');
        }
      }

      // Validate timeout
      if (geminiConfig.timeout !== undefined) {
        if (typeof geminiConfig.timeout !== 'number' || geminiConfig.timeout <= 0) {
          errors.push('Gemini timeout must be a positive number');
        }
      }

      // Validate maxRetries
      if (geminiConfig.maxRetries !== undefined) {
        if (typeof geminiConfig.maxRetries !== 'number' || geminiConfig.maxRetries < 0) {
          errors.push('Gemini maxRetries must be a non-negative number');
        }
      }
    }
  }

  // Validate enhancement mode
  if (config.enhancementMode && config.enhancementMode !== 'sequential' && config.enhancementMode !== 'agent') {
    errors.push(`Invalid enhancementMode: ${config.enhancementMode}. Must be 'sequential' or 'agent'`);
  }

  // Warnings
  if (config.defaultProvider === 'gemini' && !config.providers?.gemini?.apiKey) {
    warnings.push('Gemini is selected as default provider but no API key is configured');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Load AI configuration
 * 
 * @param options - Configuration loading options
 * @returns Loaded and validated configuration
 * @throws {Error} If configuration is invalid
 */
export async function loadAIConfig(
  options: ConfigLoadOptions = {}
): Promise<AIConfig> {
  const {
    configPath,
    loadFromEnv = true,
    loadFromFile: shouldLoadFromFile = false, // Default to false - prefer .env
    validate = true,
  } = options;

  logger.debug('Loading AI configuration');

  // Load from environment variables
  let envConfig: Partial<AIConfig> = {};
  if (loadFromEnv) {
    try {
      envConfig = loadFromEnvironment();
      logger.debug('Configuration loaded from environment variables');
    } catch (error) {
      logger.warn(`Failed to load configuration from environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load from config file (optional - only if explicitly enabled)
  let fileConfig: Partial<AIConfig> = {};
  if (shouldLoadFromFile) {
    if (!configPath) {
      throw new Error('configPath is required when loadFromFile is true');
    }
    try {
      const loadedConfig = await loadFromFile(configPath);
      fileConfig = loadedConfig;
      logger.debug(`Configuration loaded from file: ${configPath}`);
    } catch (error) {
      // Re-throw errors from env var resolution (they indicate configuration issues)
      if (error instanceof Error && error.message.includes('Environment variable')) {
        throw error;
      }
      logger.warn(`Failed to load configuration from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Merge configurations (file takes precedence)
  const mergedConfig = mergeConfigs(envConfig, fileConfig);

  // Validate configuration
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

  logger.debug(`AI configuration loaded. Default provider: ${mergedConfig.defaultProvider}`);

  return mergedConfig;
}

/**
 * Get Gemini provider configuration
 * 
 * @param config - AI configuration
 * @returns Gemini provider configuration or undefined
 */
export function getGeminiConfig(config: AIConfig): GeminiProviderConfig | undefined {
  return config.providers?.gemini;
}

/**
 * Get default provider name
 * 
 * @param config - AI configuration
 * @returns Default provider name
 */
export function getDefaultProvider(config: AIConfig): 'gemini' {
  return config.defaultProvider || 'gemini';
}

/**
 * Validate API key format (basic validation)
 */
export function validateAPIKey(apiKey: string, provider: 'gemini'): boolean {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }

  // Basic format validation
  if (provider === 'gemini') {
    // Gemini API keys typically start with specific patterns
    // This is a basic check - actual validation happens when using the key
    return apiKey.length > 10;
  }

  return true;
}

/**
 * Get configuration for a specific provider
 * 
 * @param config - AI configuration
 * @param provider - Provider name
 * @returns Provider configuration
 */
export function getProviderConfig(
  config: AIConfig,
  provider: 'gemini'
): GeminiProviderConfig | undefined {
  if (provider === 'gemini') {
    return config.providers?.gemini;
  }
  return undefined;
}

/**
 * Create default configuration
 * 
 * @returns Default configuration
 */
export function createDefaultConfig(): AIConfig {
  return {
    defaultProvider: 'gemini',
    providers: {},
    enhancementMode: 'sequential',
  };
}
