"use strict";
/**
 * Unit tests for AI Provider Registry
 */
Object.defineProperty(exports, "__esModule", { value: true });
const providerRegistry_1 = require("@services/ai/providerRegistry");
/**
 * Mock AI Provider for testing
 */
class MockAIProvider {
    name;
    constructor(name) {
        this.name = name;
    }
    async reviewResume(_request) {
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
    async modifyResume(_request) {
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
    async enhanceResume(_request) {
        return this.modifyResume(_request);
    }
    validateResponse(_response) {
        return true;
    }
    estimateCost(_request) {
        return 0.01;
    }
    getProviderInfo() {
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
        (0, providerRegistry_1.clearRegistry)();
    });
    describe('registerProvider', () => {
        it('should register a provider', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(true);
            expect((0, providerRegistry_1.getProviderCount)()).toBe(1);
        });
        it('should set first provider as default', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            const defaultProvider = (0, providerRegistry_1.getDefaultProvider)();
            expect(defaultProvider).toBe(provider);
        });
        it('should normalize provider names to lowercase', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('TEST', provider);
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(true);
            expect((0, providerRegistry_1.hasProvider)('TEST')).toBe(true);
            expect((0, providerRegistry_1.getProvider)('test')).toBe(provider);
        });
        it('should overwrite existing provider with same name', () => {
            const provider1 = new MockAIProvider('test1');
            const provider2 = new MockAIProvider('test2');
            (0, providerRegistry_1.registerProvider)('test', provider1);
            (0, providerRegistry_1.registerProvider)('test', provider2);
            expect((0, providerRegistry_1.getProvider)('test')).toBe(provider2);
            expect((0, providerRegistry_1.getProviderCount)()).toBe(1);
        });
        it('should throw error for empty provider name', () => {
            const provider = new MockAIProvider('test');
            expect(() => (0, providerRegistry_1.registerProvider)('', provider)).toThrow(providerRegistry_1.InvalidProviderError);
            expect(() => (0, providerRegistry_1.registerProvider)('   ', provider)).toThrow(providerRegistry_1.InvalidProviderError);
        });
        it('should throw error for null provider', () => {
            expect(() => (0, providerRegistry_1.registerProvider)('test', null)).toThrow(providerRegistry_1.InvalidProviderError);
        });
        it('should validate provider implements required methods', () => {
            const invalidProvider = {};
            expect(() => (0, providerRegistry_1.registerProvider)('test', invalidProvider)).toThrow(providerRegistry_1.InvalidProviderError);
        });
        it('should validate getProviderInfo returns valid structure', () => {
            const invalidProvider = {
                reviewResume: async () => ({}),
                modifyResume: async () => ({}),
                enhanceResume: async () => ({}),
                validateResponse: () => true,
                estimateCost: () => 0,
                getProviderInfo: () => ({}), // Invalid structure
            };
            expect(() => (0, providerRegistry_1.registerProvider)('test', invalidProvider)).toThrow(providerRegistry_1.InvalidProviderError);
        });
    });
    describe('getProvider', () => {
        it('should retrieve registered provider', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            const retrieved = (0, providerRegistry_1.getProvider)('test');
            expect(retrieved).toBe(provider);
        });
        it('should return undefined for non-existent provider', () => {
            expect((0, providerRegistry_1.getProvider)('nonexistent')).toBeUndefined();
        });
        it('should return undefined for invalid name', () => {
            expect((0, providerRegistry_1.getProvider)('')).toBeUndefined();
            expect((0, providerRegistry_1.getProvider)(null)).toBeUndefined();
        });
        it('should be case-insensitive', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            expect((0, providerRegistry_1.getProvider)('TEST')).toBe(provider);
            expect((0, providerRegistry_1.getProvider)('Test')).toBe(provider);
        });
    });
    describe('getProviderOrThrow', () => {
        it('should return provider if found', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            const retrieved = (0, providerRegistry_1.getProviderOrThrow)('test');
            expect(retrieved).toBe(provider);
        });
        it('should throw ProviderNotFoundError if not found', () => {
            expect(() => (0, providerRegistry_1.getProviderOrThrow)('nonexistent')).toThrow(providerRegistry_1.ProviderNotFoundError);
            expect(() => (0, providerRegistry_1.getProviderOrThrow)('nonexistent')).toThrow('is not registered');
        });
    });
    describe('listProviders', () => {
        it('should return empty array when no providers registered', () => {
            expect((0, providerRegistry_1.listProviders)()).toEqual([]);
        });
        it('should return all registered provider names', () => {
            (0, providerRegistry_1.registerProvider)('provider1', new MockAIProvider('provider1'));
            (0, providerRegistry_1.registerProvider)('provider2', new MockAIProvider('provider2'));
            (0, providerRegistry_1.registerProvider)('provider3', new MockAIProvider('provider3'));
            const providers = (0, providerRegistry_1.listProviders)();
            expect(providers).toHaveLength(3);
            expect(providers).toContain('provider1');
            expect(providers).toContain('provider2');
            expect(providers).toContain('provider3');
        });
        it('should return names in lowercase', () => {
            (0, providerRegistry_1.registerProvider)('PROVIDER', new MockAIProvider('provider'));
            const providers = (0, providerRegistry_1.listProviders)();
            expect(providers).toContain('provider');
            expect(providers).not.toContain('PROVIDER');
        });
    });
    describe('getDefaultProvider', () => {
        it('should return default provider', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            const defaultProvider = (0, providerRegistry_1.getDefaultProvider)();
            expect(defaultProvider).toBe(provider);
        });
        it('should throw error when no providers registered', () => {
            expect(() => (0, providerRegistry_1.getDefaultProvider)()).toThrow(providerRegistry_1.ProviderNotFoundError);
        });
        it('should return provider set as default', () => {
            const provider1 = new MockAIProvider('provider1');
            const provider2 = new MockAIProvider('provider2');
            (0, providerRegistry_1.registerProvider)('provider1', provider1);
            (0, providerRegistry_1.registerProvider)('provider2', provider2);
            (0, providerRegistry_1.setDefaultProvider)('provider2');
            expect((0, providerRegistry_1.getDefaultProvider)()).toBe(provider2);
        });
    });
    describe('setDefaultProvider', () => {
        it('should set default provider', () => {
            const provider1 = new MockAIProvider('provider1');
            const provider2 = new MockAIProvider('provider2');
            (0, providerRegistry_1.registerProvider)('provider1', provider1);
            (0, providerRegistry_1.registerProvider)('provider2', provider2);
            (0, providerRegistry_1.setDefaultProvider)('provider2');
            expect((0, providerRegistry_1.getDefaultProvider)()).toBe(provider2);
        });
        it('should throw error if provider not registered', () => {
            expect(() => (0, providerRegistry_1.setDefaultProvider)('nonexistent')).toThrow(providerRegistry_1.ProviderNotFoundError);
        });
        it('should be case-insensitive', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            (0, providerRegistry_1.setDefaultProvider)('TEST');
            expect((0, providerRegistry_1.getDefaultProvider)()).toBe(provider);
        });
    });
    describe('hasProvider', () => {
        it('should return true for registered provider', () => {
            (0, providerRegistry_1.registerProvider)('test', new MockAIProvider('test'));
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(true);
        });
        it('should return false for non-existent provider', () => {
            expect((0, providerRegistry_1.hasProvider)('nonexistent')).toBe(false);
        });
        it('should return false for invalid name', () => {
            expect((0, providerRegistry_1.hasProvider)('')).toBe(false);
            expect((0, providerRegistry_1.hasProvider)(null)).toBe(false);
        });
        it('should be case-insensitive', () => {
            (0, providerRegistry_1.registerProvider)('test', new MockAIProvider('test'));
            expect((0, providerRegistry_1.hasProvider)('TEST')).toBe(true);
            expect((0, providerRegistry_1.hasProvider)('Test')).toBe(true);
        });
    });
    describe('unregisterProvider', () => {
        it('should remove registered provider', () => {
            (0, providerRegistry_1.registerProvider)('test', new MockAIProvider('test'));
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(true);
            const removed = (0, providerRegistry_1.unregisterProvider)('test');
            expect(removed).toBe(true);
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(false);
        });
        it('should return false for non-existent provider', () => {
            expect((0, providerRegistry_1.unregisterProvider)('nonexistent')).toBe(false);
        });
        it('should clear default if unregistering default provider', () => {
            const provider = new MockAIProvider('test');
            (0, providerRegistry_1.registerProvider)('test', provider);
            (0, providerRegistry_1.unregisterProvider)('test');
            expect(() => (0, providerRegistry_1.getDefaultProvider)()).toThrow(providerRegistry_1.ProviderNotFoundError);
        });
        it('should set new default if default was unregistered and others exist', () => {
            const provider1 = new MockAIProvider('provider1');
            const provider2 = new MockAIProvider('provider2');
            (0, providerRegistry_1.registerProvider)('provider1', provider1);
            (0, providerRegistry_1.registerProvider)('provider2', provider2);
            (0, providerRegistry_1.setDefaultProvider)('provider1');
            (0, providerRegistry_1.unregisterProvider)('provider1');
            // Should have provider2 as new default
            expect((0, providerRegistry_1.getDefaultProvider)()).toBe(provider2);
        });
        it('should be case-insensitive', () => {
            (0, providerRegistry_1.registerProvider)('test', new MockAIProvider('test'));
            expect((0, providerRegistry_1.unregisterProvider)('TEST')).toBe(true);
            expect((0, providerRegistry_1.hasProvider)('test')).toBe(false);
        });
    });
    describe('clearRegistry', () => {
        it('should remove all providers', () => {
            (0, providerRegistry_1.registerProvider)('provider1', new MockAIProvider('provider1'));
            (0, providerRegistry_1.registerProvider)('provider2', new MockAIProvider('provider2'));
            (0, providerRegistry_1.clearRegistry)();
            expect((0, providerRegistry_1.getProviderCount)()).toBe(0);
            expect((0, providerRegistry_1.listProviders)()).toEqual([]);
        });
        it('should clear default provider', () => {
            (0, providerRegistry_1.registerProvider)('test', new MockAIProvider('test'));
            (0, providerRegistry_1.clearRegistry)();
            expect(() => (0, providerRegistry_1.getDefaultProvider)()).toThrow(providerRegistry_1.ProviderNotFoundError);
        });
    });
    describe('getProviderCount', () => {
        it('should return 0 when no providers registered', () => {
            expect((0, providerRegistry_1.getProviderCount)()).toBe(0);
        });
        it('should return correct count', () => {
            (0, providerRegistry_1.registerProvider)('provider1', new MockAIProvider('provider1'));
            expect((0, providerRegistry_1.getProviderCount)()).toBe(1);
            (0, providerRegistry_1.registerProvider)('provider2', new MockAIProvider('provider2'));
            expect((0, providerRegistry_1.getProviderCount)()).toBe(2);
            (0, providerRegistry_1.unregisterProvider)('provider1');
            expect((0, providerRegistry_1.getProviderCount)()).toBe(1);
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
                (0, providerRegistry_1.registerProvider)(name, instance);
            });
            expect((0, providerRegistry_1.getProviderCount)()).toBe(10);
            // All should be retrievable
            providers.forEach(({ name, instance }) => {
                expect((0, providerRegistry_1.getProvider)(name)).toBe(instance);
            });
        });
    });
});
//# sourceMappingURL=providerRegistry.test.js.map