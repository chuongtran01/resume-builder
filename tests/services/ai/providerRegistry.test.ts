/**
 * Unit tests for AI Provider Registry
 */

import {
  registerProvider,
  getProvider,
  getProviderOrThrow,
  listProviders,
  getDefaultProvider,
  setDefaultProvider,
  hasProvider,
  unregisterProvider,
  clearRegistry,
  getProviderCount,
  ProviderNotFoundError,
  InvalidProviderError,
} from '../../../src/services/ai/providerRegistry';
import type {
  AIProvider,
  AIRequest,
  AIResponse,
  ReviewRequest,
  ReviewResponse,
  ProviderInfo,
} from '../../../src/services/ai/provider.types';

/**
 * Mock AI Provider for testing
 */
class MockAIProvider implements AIProvider {
  constructor(public readonly name: string) {}

  async reviewResume(_request: ReviewRequest): Promise<ReviewResponse> {
    return {
      reviewResult: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        prioritizedActions: [],
        confidence: 0.8,
      },
    };
  }

  async modifyResume(_request: AIRequest): Promise<AIResponse> {
    return {
      enhancedResume: {
        personalInfo: {
          name: 'Test',
          email: 'test@example.com',
          phone: '123-456-7890',
          location: 'Test',
        },
        experience: [],
      },
      improvements: [],
    };
  }

  async enhanceResume(_request: AIRequest): Promise<AIResponse> {
    return this.modifyResume(_request);
  }

  validateResponse(_response: AIResponse | ReviewResponse): boolean {
    return true;
  }

  estimateCost(_request: AIRequest | ReviewRequest): number {
    return 0.01;
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: `Mock ${this.name}`,
      supportedModels: ['test-model'],
      defaultModel: 'test-model',
    };
  }
}

describe('Provider Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      expect(hasProvider('test')).toBe(true);
      expect(getProviderCount()).toBe(1);
    });

    it('should set first provider as default', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      const defaultProvider = getDefaultProvider();
      expect(defaultProvider).toBe(provider);
    });

    it('should normalize provider names to lowercase', () => {
      const provider = new MockAIProvider('test');
      registerProvider('TEST', provider);

      expect(hasProvider('test')).toBe(true);
      expect(hasProvider('TEST')).toBe(true);
      expect(getProvider('test')).toBe(provider);
    });

    it('should overwrite existing provider with same name', () => {
      const provider1 = new MockAIProvider('test1');
      const provider2 = new MockAIProvider('test2');

      registerProvider('test', provider1);
      registerProvider('test', provider2);

      expect(getProvider('test')).toBe(provider2);
      expect(getProviderCount()).toBe(1);
    });

    it('should throw error for empty provider name', () => {
      const provider = new MockAIProvider('test');
      expect(() => registerProvider('', provider)).toThrow(InvalidProviderError);
      expect(() => registerProvider('   ', provider)).toThrow(InvalidProviderError);
    });

    it('should throw error for null provider', () => {
      expect(() => registerProvider('test', null as unknown as AIProvider)).toThrow(
        InvalidProviderError
      );
    });

    it('should validate provider implements required methods', () => {
      const invalidProvider = {} as AIProvider;
      expect(() => registerProvider('test', invalidProvider)).toThrow(InvalidProviderError);
    });

    it('should validate getProviderInfo returns valid structure', () => {
      const invalidProvider = {
        reviewResume: async () => ({} as ReviewResponse),
        modifyResume: async () => ({} as AIResponse),
        enhanceResume: async () => ({} as AIResponse),
        validateResponse: () => true,
        estimateCost: () => 0,
        getProviderInfo: () => ({} as ProviderInfo), // Invalid structure
      } as AIProvider;

      expect(() => registerProvider('test', invalidProvider)).toThrow(InvalidProviderError);
    });
  });

  describe('getProvider', () => {
    it('should retrieve registered provider', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      const retrieved = getProvider('test');
      expect(retrieved).toBe(provider);
    });

    it('should return undefined for non-existent provider', () => {
      expect(getProvider('nonexistent')).toBeUndefined();
    });

    it('should return undefined for invalid name', () => {
      expect(getProvider('')).toBeUndefined();
      expect(getProvider(null as unknown as string)).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      expect(getProvider('TEST')).toBe(provider);
      expect(getProvider('Test')).toBe(provider);
    });
  });

  describe('getProviderOrThrow', () => {
    it('should return provider if found', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      const retrieved = getProviderOrThrow('test');
      expect(retrieved).toBe(provider);
    });

    it('should throw ProviderNotFoundError if not found', () => {
      expect(() => getProviderOrThrow('nonexistent')).toThrow(ProviderNotFoundError);
      expect(() => getProviderOrThrow('nonexistent')).toThrow('is not registered');
    });
  });

  describe('listProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(listProviders()).toEqual([]);
    });

    it('should return all registered provider names', () => {
      registerProvider('provider1', new MockAIProvider('provider1'));
      registerProvider('provider2', new MockAIProvider('provider2'));
      registerProvider('provider3', new MockAIProvider('provider3'));

      const providers = listProviders();
      expect(providers).toHaveLength(3);
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
      expect(providers).toContain('provider3');
    });

    it('should return names in lowercase', () => {
      registerProvider('PROVIDER', new MockAIProvider('provider'));
      const providers = listProviders();
      expect(providers).toContain('provider');
      expect(providers).not.toContain('PROVIDER');
    });
  });

  describe('getDefaultProvider', () => {
    it('should return default provider', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      const defaultProvider = getDefaultProvider();
      expect(defaultProvider).toBe(provider);
    });

    it('should throw error when no providers registered', () => {
      expect(() => getDefaultProvider()).toThrow(ProviderNotFoundError);
    });

    it('should return provider set as default', () => {
      const provider1 = new MockAIProvider('provider1');
      const provider2 = new MockAIProvider('provider2');

      registerProvider('provider1', provider1);
      registerProvider('provider2', provider2);
      setDefaultProvider('provider2');

      expect(getDefaultProvider()).toBe(provider2);
    });
  });

  describe('setDefaultProvider', () => {
    it('should set default provider', () => {
      const provider1 = new MockAIProvider('provider1');
      const provider2 = new MockAIProvider('provider2');

      registerProvider('provider1', provider1);
      registerProvider('provider2', provider2);

      setDefaultProvider('provider2');
      expect(getDefaultProvider()).toBe(provider2);
    });

    it('should throw error if provider not registered', () => {
      expect(() => setDefaultProvider('nonexistent')).toThrow(ProviderNotFoundError);
    });

    it('should be case-insensitive', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      setDefaultProvider('TEST');
      expect(getDefaultProvider()).toBe(provider);
    });
  });

  describe('hasProvider', () => {
    it('should return true for registered provider', () => {
      registerProvider('test', new MockAIProvider('test'));
      expect(hasProvider('test')).toBe(true);
    });

    it('should return false for non-existent provider', () => {
      expect(hasProvider('nonexistent')).toBe(false);
    });

    it('should return false for invalid name', () => {
      expect(hasProvider('')).toBe(false);
      expect(hasProvider(null as unknown as string)).toBe(false);
    });

    it('should be case-insensitive', () => {
      registerProvider('test', new MockAIProvider('test'));
      expect(hasProvider('TEST')).toBe(true);
      expect(hasProvider('Test')).toBe(true);
    });
  });

  describe('unregisterProvider', () => {
    it('should remove registered provider', () => {
      registerProvider('test', new MockAIProvider('test'));
      expect(hasProvider('test')).toBe(true);

      const removed = unregisterProvider('test');
      expect(removed).toBe(true);
      expect(hasProvider('test')).toBe(false);
    });

    it('should return false for non-existent provider', () => {
      expect(unregisterProvider('nonexistent')).toBe(false);
    });

    it('should clear default if unregistering default provider', () => {
      const provider = new MockAIProvider('test');
      registerProvider('test', provider);

      unregisterProvider('test');
      expect(() => getDefaultProvider()).toThrow(ProviderNotFoundError);
    });

    it('should set new default if default was unregistered and others exist', () => {
      const provider1 = new MockAIProvider('provider1');
      const provider2 = new MockAIProvider('provider2');

      registerProvider('provider1', provider1);
      registerProvider('provider2', provider2);
      setDefaultProvider('provider1');

      unregisterProvider('provider1');

      // Should have provider2 as new default
      expect(getDefaultProvider()).toBe(provider2);
    });

    it('should be case-insensitive', () => {
      registerProvider('test', new MockAIProvider('test'));
      expect(unregisterProvider('TEST')).toBe(true);
      expect(hasProvider('test')).toBe(false);
    });
  });

  describe('clearRegistry', () => {
    it('should remove all providers', () => {
      registerProvider('provider1', new MockAIProvider('provider1'));
      registerProvider('provider2', new MockAIProvider('provider2'));

      clearRegistry();

      expect(getProviderCount()).toBe(0);
      expect(listProviders()).toEqual([]);
    });

    it('should clear default provider', () => {
      registerProvider('test', new MockAIProvider('test'));
      clearRegistry();

      expect(() => getDefaultProvider()).toThrow(ProviderNotFoundError);
    });
  });

  describe('getProviderCount', () => {
    it('should return 0 when no providers registered', () => {
      expect(getProviderCount()).toBe(0);
    });

    it('should return correct count', () => {
      registerProvider('provider1', new MockAIProvider('provider1'));
      expect(getProviderCount()).toBe(1);

      registerProvider('provider2', new MockAIProvider('provider2'));
      expect(getProviderCount()).toBe(2);

      unregisterProvider('provider1');
      expect(getProviderCount()).toBe(1);
    });
  });

  describe('Thread Safety', () => {
    it('should handle concurrent registrations', () => {
      const providers = Array.from({ length: 10 }, (_, i) => ({
        name: `provider${i}`,
        instance: new MockAIProvider(`provider${i}`),
      }));

      // Register all providers
      providers.forEach(({ name, instance }) => {
        registerProvider(name, instance);
      });

      expect(getProviderCount()).toBe(10);

      // All should be retrievable
      providers.forEach(({ name, instance }) => {
        expect(getProvider(name)).toBe(instance);
      });
    });
  });
});
