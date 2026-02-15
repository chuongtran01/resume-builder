"use strict";
/**
 * Unit tests for AI Provider Interface Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
const provider_types_1 = require("@services/ai/provider.types");
describe('AI Provider Types', () => {
    describe('Error Classes', () => {
        describe('AIProviderError', () => {
            it('should create error with provider and code', () => {
                const error = new provider_types_1.AIProviderError('Test error', 'gemini', 'TEST_CODE');
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error.message).toBe('Test error');
                expect(error.provider).toBe('gemini');
                expect(error.code).toBe('TEST_CODE');
                expect(error.name).toBe('AIProviderError');
            });
            it('should create error without code', () => {
                const error = new provider_types_1.AIProviderError('Test error', 'gemini');
                expect(error.provider).toBe('gemini');
                expect(error.code).toBeUndefined();
            });
        });
        describe('RateLimitError', () => {
            it('should create rate limit error with retry after', () => {
                const error = new provider_types_1.RateLimitError('Rate limited', 'gemini', 60);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error).toBeInstanceOf(provider_types_1.RateLimitError);
                expect(error.message).toBe('Rate limited');
                expect(error.provider).toBe('gemini');
                expect(error.code).toBe('RATE_LIMIT');
                expect(error.retryAfter).toBe(60);
                expect(error.name).toBe('RateLimitError');
            });
            it('should create rate limit error without retry after', () => {
                const error = new provider_types_1.RateLimitError('Rate limited', 'gemini');
                expect(error.retryAfter).toBeUndefined();
            });
        });
        describe('InvalidResponseError', () => {
            it('should create invalid response error with response', () => {
                const response = { invalid: 'data' };
                const error = new provider_types_1.InvalidResponseError('Invalid response', 'gemini', response);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error).toBeInstanceOf(provider_types_1.InvalidResponseError);
                expect(error.message).toBe('Invalid response');
                expect(error.provider).toBe('gemini');
                expect(error.code).toBe('INVALID_RESPONSE');
                expect(error.response).toBe(response);
                expect(error.name).toBe('InvalidResponseError');
            });
        });
        describe('CostLimitExceededError', () => {
            it('should create cost limit error with cost and limit', () => {
                const error = new provider_types_1.CostLimitExceededError('Cost limit exceeded', 'gemini', 100.5, 50.0);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error).toBeInstanceOf(provider_types_1.CostLimitExceededError);
                expect(error.estimatedCost).toBe(100.5);
                expect(error.limit).toBe(50.0);
                expect(error.code).toBe('COST_LIMIT_EXCEEDED');
                expect(error.name).toBe('CostLimitExceededError');
            });
        });
        describe('NetworkError', () => {
            it('should create network error with original error', () => {
                const originalError = new Error('Connection failed');
                const error = new provider_types_1.NetworkError('Network error', 'gemini', originalError);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error).toBeInstanceOf(provider_types_1.NetworkError);
                expect(error.originalError).toBe(originalError);
                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.name).toBe('NetworkError');
            });
        });
        describe('TimeoutError', () => {
            it('should create timeout error with timeout value', () => {
                const error = new provider_types_1.TimeoutError('Request timeout', 'gemini', 30000);
                expect(error).toBeInstanceOf(provider_types_1.AIProviderError);
                expect(error).toBeInstanceOf(provider_types_1.TimeoutError);
                expect(error.timeout).toBe(30000);
                expect(error.code).toBe('TIMEOUT');
                expect(error.name).toBe('TimeoutError');
            });
        });
    });
    describe('Type Definitions', () => {
        describe('ProviderInfo', () => {
            it('should have correct structure', () => {
                const info = {
                    name: 'gemini',
                    displayName: 'Google Gemini',
                    supportedModels: ['gemini-pro', 'gemini-1.5-pro'],
                    defaultModel: 'gemini-pro',
                    version: '1.0.0',
                };
                expect(info.name).toBe('gemini');
                expect(info.supportedModels).toHaveLength(2);
                expect(info.version).toBe('1.0.0');
            });
            it('should work without optional version', () => {
                const info = {
                    name: 'gemini',
                    displayName: 'Google Gemini',
                    supportedModels: ['gemini-pro'],
                    defaultModel: 'gemini-pro',
                };
                expect(info.version).toBeUndefined();
            });
        });
        describe('AIProviderConfig', () => {
            it('should have required fields', () => {
                const config = {
                    apiKey: 'test-key',
                    model: 'gemini-pro',
                };
                expect(config.apiKey).toBe('test-key');
                expect(config.model).toBe('gemini-pro');
            });
            it('should support optional fields', () => {
                const config = {
                    apiKey: 'test-key',
                    model: 'gemini-pro',
                    temperature: 0.7,
                    maxTokens: 2000,
                    timeout: 30000,
                    enableStreaming: false,
                };
                expect(config.temperature).toBe(0.7);
                expect(config.maxTokens).toBe(2000);
                expect(config.timeout).toBe(30000);
                expect(config.enableStreaming).toBe(false);
            });
            it('should support additional provider-specific options', () => {
                const config = {
                    apiKey: 'test-key',
                    model: 'gemini-pro',
                    customOption: 'value',
                };
                expect(config.customOption).toBe('value');
            });
        });
        describe('ReviewResult', () => {
            it('should have correct structure', () => {
                const action = {
                    type: 'enhance',
                    section: 'experience',
                    priority: 'high',
                    reason: 'Improve keyword matching',
                    suggestedChange: 'Add React keywords',
                };
                const result = {
                    strengths: ['Strong technical skills', 'Relevant experience'],
                    weaknesses: ['Missing keywords', 'Weak summary'],
                    opportunities: ['Add more metrics', 'Highlight achievements'],
                    prioritizedActions: [action],
                    confidence: 0.85,
                    reasoning: 'Overall good fit with minor improvements needed',
                };
                expect(result.strengths).toHaveLength(2);
                expect(result.prioritizedActions).toHaveLength(1);
                expect(result.confidence).toBe(0.85);
            });
        });
        describe('PrioritizedAction', () => {
            it('should support all action types', () => {
                const actions = [
                    { type: 'enhance', section: 'experience', priority: 'high', reason: 'Test' },
                    { type: 'reorder', section: 'skills', priority: 'medium', reason: 'Test' },
                    { type: 'add', section: 'summary', priority: 'low', reason: 'Test' },
                    { type: 'remove', section: 'experience', priority: 'high', reason: 'Test' },
                    { type: 'rewrite', section: 'bulletPoints', priority: 'medium', reason: 'Test' },
                ];
                expect(actions).toHaveLength(5);
                expect(actions[0].type).toBe('enhance');
            });
            it('should support optional suggestedChange', () => {
                const action = {
                    type: 'enhance',
                    section: 'experience',
                    priority: 'high',
                    reason: 'Test',
                };
                expect(action.suggestedChange).toBeUndefined();
            });
        });
        describe('EnhancementPrompt', () => {
            it('should have required fields', () => {
                const prompt = {
                    systemMessage: 'You are an expert resume writer',
                    userPrompt: 'Enhance this resume',
                };
                expect(prompt.systemMessage).toBe('You are an expert resume writer');
                expect(prompt.userPrompt).toBe('Enhance this resume');
            });
            it('should support optional examples', () => {
                const prompt = {
                    systemMessage: 'You are an expert',
                    userPrompt: 'Enhance this',
                    examples: [
                        { input: 'Original', output: 'Enhanced' },
                    ],
                };
                expect(prompt.examples).toHaveLength(1);
            });
            it('should support optional context', () => {
                const prompt = {
                    systemMessage: 'You are an expert',
                    userPrompt: 'Enhance this',
                    context: {
                        jobTitle: 'Software Engineer',
                        company: 'Tech Corp',
                    },
                };
                expect(prompt.context).toBeDefined();
                expect(prompt.context.jobTitle).toBe('Software Engineer');
            });
        });
    });
    describe('Request/Response Types', () => {
        it('should support AIRequest structure', () => {
            const request = {
                resume: {
                    personalInfo: {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '123-456-7890',
                        location: 'San Francisco, CA',
                    },
                    experience: [],
                },
                jobInfo: {
                    keywords: ['React', 'TypeScript'],
                    requiredSkills: ['JavaScript'],
                    preferredSkills: ['Node.js'],
                    requirements: [],
                },
            };
            expect(request.resume).toBeDefined();
            expect(request.jobInfo.keywords).toHaveLength(2);
        });
        it('should support ReviewRequest structure', () => {
            const request = {
                resume: {
                    personalInfo: {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '123-456-7890',
                        location: 'San Francisco, CA',
                    },
                    experience: [],
                },
                jobInfo: {
                    keywords: ['React'],
                    requiredSkills: [],
                    preferredSkills: [],
                    requirements: [],
                },
            };
            expect(request.resume).toBeDefined();
            expect(request.jobInfo).toBeDefined();
        });
        it('should support AIResponse structure', () => {
            const response = {
                enhancedResume: {
                    personalInfo: {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '123-456-7890',
                        location: 'San Francisco, CA',
                    },
                    experience: [],
                },
                improvements: [],
                confidence: 0.9,
                tokensUsed: 1500,
                cost: 0.05,
            };
            expect(response.enhancedResume).toBeDefined();
            expect(response.confidence).toBe(0.9);
            expect(response.tokensUsed).toBe(1500);
            expect(response.cost).toBe(0.05);
        });
        it('should support ReviewResponse structure', () => {
            const response = {
                reviewResult: {
                    strengths: ['Good skills'],
                    weaknesses: [],
                    opportunities: [],
                    prioritizedActions: [],
                    confidence: 0.8,
                },
                tokensUsed: 800,
                cost: 0.02,
            };
            expect(response.reviewResult).toBeDefined();
            expect(response.reviewResult.confidence).toBe(0.8);
        });
    });
});
//# sourceMappingURL=provider.types.test.js.map