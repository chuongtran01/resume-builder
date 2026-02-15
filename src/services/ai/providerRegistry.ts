/**
 * AI Provider Registry
 * 
 * Manages registration and retrieval of AI providers.
 * Supports dynamic provider selection and default provider configuration.
 */

import type { AIProvider } from '@services/ai/provider.types';
import { logger } from '@utils/logger';

/**
 * Registry error for missing providers
 */
class ProviderNotFoundError extends Error {
  constructor(providerName: string) {
    super(`AI provider "${providerName}" is not registered`);
    this.name = 'ProviderNotFoundError';
    Object.setPrototypeOf(this, ProviderNotFoundError.prototype);
  }
}

/**
 * Registry error for invalid provider registration
 */
class InvalidProviderError extends Error {
  constructor(message: string) {
    super(`Invalid provider: ${message}`);
    this.name = 'InvalidProviderError';
    Object.setPrototypeOf(this, InvalidProviderError.prototype);
  }
}

/**
 * AI Provider Registry
 * 
 * Thread-safe registry for managing AI providers.
 * Uses a Map for O(1) lookup and maintains a default provider.
 */
class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderName: string | null = null;

  /**
   * Register an AI provider
   * 
   * @param name - Provider name (e.g., "gemini")
   * @param provider - AI provider instance
   * @throws {InvalidProviderError} If provider is invalid or name is already registered
   */
  registerProvider(name: string, provider: AIProvider): void {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new InvalidProviderError('Provider name must be a non-empty string');
    }

    if (!provider) {
      throw new InvalidProviderError('Provider instance is required');
    }

    // Validate provider implements required methods
    this.validateProvider(provider);

    const normalizedName = name.toLowerCase().trim();

    // Check if provider is already registered
    if (this.providers.has(normalizedName)) {
      logger.warn(`Provider "${normalizedName}" is already registered. Overwriting...`);
    }

    this.providers.set(normalizedName, provider);
    logger.info(`Registered AI provider: ${normalizedName}`);

    // Set as default if no default is set
    if (this.defaultProviderName === null) {
      this.setDefaultProvider(normalizedName);
      logger.debug(`Set "${normalizedName}" as default provider`);
    }
  }

  /**
   * Get a provider by name
   * 
   * @param name - Provider name
   * @returns Provider instance or undefined if not found
   */
  getProvider(name: string): AIProvider | undefined {
    if (!name || typeof name !== 'string') {
      return undefined;
    }

    const normalizedName = name.toLowerCase().trim();
    return this.providers.get(normalizedName);
  }

  /**
   * Get a provider by name, throwing if not found
   * 
   * @param name - Provider name
   * @returns Provider instance
   * @throws {ProviderNotFoundError} If provider is not registered
   */
  getProviderOrThrow(name: string): AIProvider {
    const provider = this.getProvider(name);
    if (!provider) {
      throw new ProviderNotFoundError(name);
    }
    return provider;
  }

  /**
   * List all registered provider names
   * 
   * @returns Array of provider names
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get the default provider
   * 
   * @returns Default provider instance
   * @throws {ProviderNotFoundError} If no default provider is set
   */
  getDefaultProvider(): AIProvider {
    if (this.defaultProviderName === null) {
      throw new ProviderNotFoundError('default (no providers registered)');
    }

    const provider = this.providers.get(this.defaultProviderName);
    if (!provider) {
      // This shouldn't happen, but handle it gracefully
      throw new ProviderNotFoundError(this.defaultProviderName);
    }

    return provider;
  }

  /**
   * Set the default provider
   * 
   * @param name - Provider name to set as default
   * @throws {ProviderNotFoundError} If provider is not registered
   */
  setDefaultProvider(name: string): void {
    const normalizedName = name.toLowerCase().trim();
    const provider = this.getProvider(normalizedName);

    if (!provider) {
      throw new ProviderNotFoundError(normalizedName);
    }

    this.defaultProviderName = normalizedName;
    logger.info(`Set default AI provider: ${normalizedName}`);
  }

  /**
   * Check if a provider is registered
   * 
   * @param name - Provider name
   * @returns True if provider is registered
   */
  hasProvider(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const normalizedName = name.toLowerCase().trim();
    return this.providers.has(normalizedName);
  }

  /**
   * Unregister a provider
   * 
   * @param name - Provider name to unregister
   * @returns True if provider was removed, false if not found
   */
  unregisterProvider(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const normalizedName = name.toLowerCase().trim();
    const removed = this.providers.delete(normalizedName);

    if (removed) {
      logger.info(`Unregistered AI provider: ${normalizedName}`);

      // If this was the default, clear default
      if (this.defaultProviderName === normalizedName) {
        this.defaultProviderName = null;
        logger.warn(`Default provider "${normalizedName}" was unregistered. No default provider set.`);

        // Set a new default if providers remain
        const remainingProviders = this.listProviders();
        if (remainingProviders.length > 0 && remainingProviders[0]) {
          this.setDefaultProvider(remainingProviders[0]);
          logger.info(`Set "${remainingProviders[0]}" as new default provider`);
        }
      }
    }

    return removed;
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    const count = this.providers.size;
    this.providers.clear();
    this.defaultProviderName = null;
    logger.info(`Cleared ${count} registered provider(s)`);
  }

  /**
   * Get the number of registered providers
   * 
   * @returns Number of registered providers
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Validate that a provider implements all required methods
   * 
   * @param provider - Provider to validate
   * @throws {InvalidProviderError} If provider is missing required methods
   */
  private validateProvider(provider: AIProvider): void {
    const requiredMethods: Array<keyof AIProvider> = [
      'reviewResume',
      'modifyResume',
      'enhanceResume',
      'validateResponse',
      'estimateCost',
      'getProviderInfo',
    ];

    const missingMethods: string[] = [];

    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        missingMethods.push(method);
      }
    }

    if (missingMethods.length > 0) {
      throw new InvalidProviderError(
        `Provider is missing required methods: ${missingMethods.join(', ')}`
      );
    }

    // Validate getProviderInfo returns valid structure
    try {
      const info = provider.getProviderInfo();
      if (!info || typeof info.name !== 'string' || typeof info.displayName !== 'string') {
        throw new InvalidProviderError('getProviderInfo() must return valid ProviderInfo');
      }
    } catch (error) {
      throw new InvalidProviderError(
        `getProviderInfo() failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Singleton instance
const providerRegistry = new ProviderRegistry();

/**
 * Register an AI provider
 * 
 * @param name - Provider name
 * @param provider - AI provider instance
 */
export function registerProvider(name: string, provider: AIProvider): void {
  providerRegistry.registerProvider(name, provider);
}

/**
 * Get an AI provider by name
 * 
 * @param name - Provider name
 * @returns Provider instance or undefined if not found
 */
export function getProvider(name: string): AIProvider | undefined {
  return providerRegistry.getProvider(name);
}

/**
 * Get an AI provider by name, throwing if not found
 * 
 * @param name - Provider name
 * @returns Provider instance
 * @throws {ProviderNotFoundError} If provider is not registered
 */
export function getProviderOrThrow(name: string): AIProvider {
  return providerRegistry.getProviderOrThrow(name);
}

/**
 * List all registered provider names
 * 
 * @returns Array of provider names
 */
export function listProviders(): string[] {
  return providerRegistry.listProviders();
}

/**
 * Get the default AI provider
 * 
 * @returns Default provider instance
 * @throws {ProviderNotFoundError} If no default provider is set
 */
export function getDefaultProvider(): AIProvider {
  return providerRegistry.getDefaultProvider();
}

/**
 * Set the default AI provider
 * 
 * @param name - Provider name to set as default
 * @throws {ProviderNotFoundError} If provider is not registered
 */
export function setDefaultProvider(name: string): void {
  providerRegistry.setDefaultProvider(name);
}

/**
 * Check if a provider is registered
 * 
 * @param name - Provider name
 * @returns True if provider is registered
 */
export function hasProvider(name: string): boolean {
  return providerRegistry.hasProvider(name);
}

/**
 * Unregister a provider
 * 
 * @param name - Provider name to unregister
 * @returns True if provider was removed, false if not found
 */
export function unregisterProvider(name: string): boolean {
  return providerRegistry.unregisterProvider(name);
}

/**
 * Clear all registered providers
 */
export function clearRegistry(): void {
  providerRegistry.clear();
}

/**
 * Get the number of registered providers
 * 
 * @returns Number of registered providers
 */
export function getProviderCount(): number {
  return providerRegistry.getProviderCount();
}

// Export error classes
export { ProviderNotFoundError, InvalidProviderError };
