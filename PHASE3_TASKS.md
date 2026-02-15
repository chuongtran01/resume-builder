# Phase 3: Real AI Model Integration - Task Breakdown

## 📋 Overview

This document breaks down Phase 3 into detailed, actionable tasks organized by component and priority. Each task includes acceptance criteria and dependencies.

Phase 3 replaces the mock enhancement service (Phase 2) with Google Gemini AI model that uses extracted job description information to naturally modify resumes. The enhancement process follows a sequential two-step approach: **Review** (analyze resume against job requirements) → **Modify** (enhance resume based on review findings). The architecture is designed to support future upgrade to agent-based approach with tools for iterative refinement.

**Status Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⏸️ Blocked

---

## 🎯 Goals

- Integrate Google Gemini AI model for resume enhancement
- Use extracted job description information for natural language modifications
- Maintain truthfulness guarantee (no fabrication)
- Implement cost tracking and usage monitoring
- Provide quality assurance and validation
- Maintain backward compatibility with Phase 2 mock service with fallback mechanism

---

## 🤖 Task Group 16: AI Provider Abstraction

### Task 16.1: Design AI Provider Interface
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Create a unified interface for AI providers, designed for Gemini but extensible for future providers.

**Subtasks:**
- [x] Create `src/services/ai/provider.types.ts` with:
  - [x] `AIProvider` interface defining common methods
  - [x] `AIProviderConfig` interface for provider configuration
  - [x] `AIRequest` interface for enhancement requests
  - [x] `AIResponse` interface for provider responses
  - [x] `EnhancementPrompt` interface for structured prompts
  - [x] `ReviewRequest` and `ReviewResponse` interfaces for review phase
  - [x] `ReviewResult` and `PrioritizedAction` interfaces
  - [x] `ProviderInfo` interface
- [x] Define methods:
  - [x] `reviewResume(request: ReviewRequest): Promise<ReviewResponse>`
  - [x] `modifyResume(request: AIRequest): Promise<AIResponse>`
  - [x] `enhanceResume(request: AIRequest): Promise<AIResponse>`
  - [x] `validateResponse(response: AIResponse | ReviewResponse): boolean`
  - [x] `estimateCost(request: AIRequest | ReviewRequest): number`
  - [x] `getProviderInfo(): ProviderInfo`
- [x] Add error types:
  - [x] `AIProviderError` base class
  - [x] `RateLimitError` for rate limiting
  - [x] `InvalidResponseError` for malformed responses
  - [x] `CostLimitExceededError` for cost limits
  - [x] `NetworkError` for network issues
  - [x] `TimeoutError` for timeout issues
- [x] Add JSDoc comments for all interfaces
- [x] Create unit tests for type definitions

**Files to Create:**
- `src/services/ai/provider.types.ts`

**Key Interfaces:**
```typescript
interface AIProvider {
  enhanceResume(request: AIRequest): Promise<AIResponse>;
  validateResponse(response: AIResponse): boolean;
  estimateCost(request: AIRequest): number;
  getProviderInfo(): ProviderInfo;
}

interface AIRequest {
  resume: Resume;
  jobInfo: ParsedJobDescription;
  options?: EnhancementOptions;
  promptTemplate?: string;
}

interface AIResponse {
  enhancedResume: Resume;
  improvements: Improvement[];
  reasoning?: string;
  confidence?: number;
  tokensUsed?: number;
  cost?: number;
}
```

**Acceptance Criteria:**
- Interface is provider-agnostic
- All methods are well-defined with proper types
- Error handling is comprehensive
- TypeScript compilation passes
- Documentation is complete

**Dependencies:** Phase 2 Task 10.1 (Enhancement Types)

---

### Task 16.2: Implement AI Provider Registry
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 1.5 hours

**Description:**
Create a registry system to manage multiple AI providers and allow dynamic provider selection.

**Subtasks:**
- [x] Create `src/services/ai/providerRegistry.ts`
- [x] Implement `registerProvider(name: string, provider: AIProvider): void`
- [x] Implement `getProvider(name: string): AIProvider | undefined`
- [x] Implement `listProviders(): string[]`
- [x] Implement `getDefaultProvider(): AIProvider`
- [x] Add provider validation on registration
- [x] Add error handling for missing providers
- [x] Add logging for provider operations
- [x] Write unit tests
- [x] Add `getProviderOrThrow()` for error-throwing retrieval
- [x] Add `hasProvider()` for existence checking
- [x] Add `unregisterProvider()` for provider removal
- [x] Add `clearRegistry()` for clearing all providers
- [x] Add `getProviderCount()` for counting providers
- [x] Add `setDefaultProvider()` for setting default

**Files to Create:**
- `src/services/ai/providerRegistry.ts`

**Key Functions:**
- `registerProvider(name, provider): void`
- `getProvider(name): AIProvider | undefined`
- `listProviders(): string[]`
- `getDefaultProvider(): AIProvider`

**Acceptance Criteria:**
- Providers can be registered and retrieved
- Default provider is configurable
- Missing providers return appropriate errors
- Registry is thread-safe
- Unit tests pass

**Dependencies:** Task 16.1

---

## 🔌 Task Group 17: AI Provider Implementation

### Task 17.1: Implement Google Gemini Integration
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 4 hours

**Description:**
Implement Google Gemini integration for resume enhancement.

**Subtasks:**
- [x] Install Google AI SDK: `npm install @google/generative-ai`
- [x] Create `src/services/ai/gemini.ts`
- [x] Implement `GeminiProvider` class implementing `AIProvider` interface
- [x] Add Google AI client initialization
- [x] Implement API key configuration
- [x] Implement `reviewResume` method (Step 1: Review)
- [x] Implement `modifyResume` method (Step 2: Modify)
- [x] Implement `enhanceResume` method (orchestrates review + modify):
  - [x] Build structured prompt with resume and job info
  - [x] Call Gemini API with proper parameters
  - [x] Parse JSON response from AI
  - [x] Validate response structure
- [ ] Handle streaming responses (optional - future enhancement)
- [x] Implement error handling:
  - [x] Rate limit errors
  - [x] API errors
  - [x] Network errors
  - [x] Invalid response errors
  - [x] Timeout errors
- [x] Implement cost estimation:
  - [x] Calculate tokens used
  - [x] Estimate cost based on model pricing (gemini-pro, gemini-1.5-pro, gemini-1.5-flash)
- [x] Add retry logic with exponential backoff
- [x] Add request timeout handling
- [x] Add logging for API calls
- [x] Write unit tests
- [ ] Write integration tests (with mocked API) - Unit tests cover mocked API scenarios

**Files to Create:**
- `src/services/ai/gemini.ts`

**Configuration:**
```typescript
interface GeminiConfig {
  apiKey: string;
  model: 'gemini-pro' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  temperature: number; // 0-1
  maxTokens: number;
  timeout: number;
}
```

**Acceptance Criteria:**
- Gemini API integration works correctly
- All error cases are handled
- Cost estimation is accurate
- Response validation works
- Unit and integration tests pass
- API keys are securely managed

**Dependencies:** Task 16.1, Task 16.2

---

### Task 18.1: Design Prompt Templates
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 4 hours

**Description:**
Create structured prompt templates for two-step enhancement process: Review prompts and Modification prompts. Templates include extracted job information and guide AI to make natural, truthful enhancements.

**Subtasks:**
- [ ] Create `src/services/ai/prompts/` directory
- [ ] Create `src/services/ai/prompts/review.template.ts` (Step 1: Review)
  - [ ] System message for resume analysis
  - [ ] Context section (resume + job info)
  - [ ] Analysis task description
  - [ ] Output format for review (strengths, weaknesses, opportunities, actions)
- [ ] Create `src/services/ai/prompts/modify.template.ts` (Step 2: Modify)
  - [ ] System message with enhancement instructions
  - [ ] Context section (resume + job info + review findings)
  - [ ] Enhancement task description
  - [ ] Output format specification (enhanced resume JSON)
  - [ ] Truthfulness requirements
- [ ] Design base prompt structure for both:
  - [ ] System message with instructions
  - [ ] Context section (resume + job info)
  - [ ] Task description
  - [ ] Output format specification
  - [ ] Truthfulness requirements (for modify prompt)
- [ ] Create prompt variants for modify:
  - [ ] Full enhancement (bullet points + skills + summary)
  - [ ] Bullet points only
  - [ ] Skills reordering only
  - [ ] Summary enhancement only
- [ ] Add few-shot examples:
  - [ ] Example of good review analysis
  - [ ] Example of good enhancement
  - [ ] Example of bad enhancement (to avoid)
- [ ] Implement prompt variable substitution:
  - [ ] Resume data injection
  - [ ] Job information injection
  - [ ] Review findings injection (for modify prompt)
  - [ ] Options injection
- [ ] Add prompt optimization:
  - [ ] Token counting
  - [ ] Context window management
  - [ ] Prompt compression techniques
- [ ] Write unit tests for prompt generation
- [ ] Document prompt design decisions

**Files to Create:**
- `src/services/ai/prompts/review.template.ts` - Review phase prompts
- `src/services/ai/prompts/modify.template.ts` - Modification phase prompts
- `src/services/ai/prompts/promptBuilder.ts` - Builder for both prompt types

**Review Prompt Structure:**
```
System: You are an expert resume reviewer...
Context:
- Resume: {resume_json}
- Job Requirements: {job_info_json}
Task: Analyze the resume against job requirements...
Output Format: JSON with analysis (strengths, weaknesses, opportunities, prioritized actions)
```

**Modify Prompt Structure:**
```
System: You are an expert resume writer...
Context:
- Resume: {resume_json}
- Job Requirements: {job_info_json}
- Review Findings: {review_result_json}
Task: Enhance the resume based on review findings...
Output Format: JSON with enhanced resume structure...
Constraints:
- Never add experiences not in original
- Maintain truthfulness
- Use natural language
- Follow prioritized actions from review
```

**Acceptance Criteria:**
- Review and modify prompts are well-structured and clear
- Job information is properly integrated in both phases
- Review prompts generate actionable analysis
- Modify prompts incorporate review findings
- Truthfulness requirements are emphasized in modify prompts
- Output formats are unambiguous
- Prompts work with Gemini API
- Token usage is optimized

**Dependencies:** Task 16.1, Phase 2 Task 10.2 (Job Parser)

---

### Task 18.2: Implement Prompt Builder
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create a utility to build and customize prompts dynamically for both review and modification phases.

**Subtasks:**
- [ ] Create `src/services/ai/prompts/promptBuilder.ts`
- [ ] Implement `buildReviewPrompt` function:
  - [ ] Accept resume, job info, and options
  - [ ] Select review prompt template
  - [ ] Inject resume data
  - [ ] Inject job information
  - [ ] Return complete review prompt
- [ ] Implement `buildModifyPrompt` function:
  - [ ] Accept resume, job info, review result, and options
  - [ ] Select modification prompt template
  - [ ] Inject resume data
  - [ ] Inject job information
  - [ ] Inject review findings
  - [ ] Apply focus areas filtering
  - [ ] Apply tone adjustments
  - [ ] Return complete modification prompt
- [ ] Implement prompt validation:
  - [ ] Check token limits
  - [ ] Validate structure
  - [ ] Ensure required sections present
- [ ] Add prompt caching for similar requests
- [ ] Add prompt versioning
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/prompts/promptBuilder.ts`

**Key Functions:**
- `buildReviewPrompt(resume, jobInfo, options?): string` - Build review phase prompt
- `buildModifyPrompt(resume, jobInfo, reviewResult, options?): string` - Build modification phase prompt
- `validatePrompt(prompt): boolean`
- `estimateTokens(prompt): number`

**Acceptance Criteria:**
- Prompts are built correctly
- All variables are properly substituted
- Token limits are respected
- Validation works correctly
- Unit tests pass

**Dependencies:** Task 18.1

---

## 🧠 Task Group 19: AI Enhancement Service

### Task 19.1: Implement AI Resume Enhancement Service
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 6 hours

**Description:**
Create the main AI enhancement service that uses real AI models to enhance resumes using extracted job information. Implements sequential two-step process: Review → Modify.

**Subtasks:**
- [ ] Create `src/services/aiResumeEnhancementService.ts`
- [ ] Implement `AIResumeEnhancementService` class:
  - [ ] Implement `ResumeEnhancementService` interface
  - [ ] Accept AI provider in constructor
  - [ ] Integrate job description parser
  - [ ] Integrate prompt builder
- [ ] Implement `reviewResume` method (Step 1):
  - [ ] Parse job description
  - [ ] Extract job information
  - [ ] Build review prompt
  - [ ] Call AI provider for review
  - [ ] Parse review response (strengths, weaknesses, opportunities, prioritized actions)
  - [ ] Return `ReviewResult`
- [ ] Implement `modifyResume` method (Step 2):
  - [ ] Accept resume and review result
  - [ ] Build modification prompt based on review
  - [ ] Call AI provider for modification
  - [ ] Parse enhanced resume from response
  - [ ] Validate response structure
- [ ] Implement `enhanceResume` method (orchestrates review + modify):
  - [ ] Call `reviewResume` first
  - [ ] Call `modifyResume` with review result
  - [ ] Track changes (old → new)
  - [ ] Generate improvements list
  - [ ] Calculate ATS scores
  - [ ] Generate recommendations
- [ ] Implement response parsing:
  - [ ] Parse JSON from AI responses (review + modify)
  - [ ] Validate resume structure
  - [ ] Extract improvements
  - [ ] Extract reasoning (if available)
- [ ] Implement change tracking:
  - [ ] Compare original vs enhanced resume
  - [ ] Generate ChangeDetail array
  - [ ] Track all modifications
- [ ] Design interfaces compatible with future agent mode:
  - [ ] Abstract review/modify methods
  - [ ] Support for tool-based approach (future)
- [ ] Add error handling:
  - [ ] AI provider errors
  - [ ] Parsing errors
  - [ ] Validation errors
  - [ ] Fallback to mock service
- [ ] Add logging for debugging
- [ ] Write unit tests
- [ ] Write integration tests

**Files to Create:**
- `src/services/aiResumeEnhancementService.ts`

**Key Methods:**
- `reviewResume(resume, jobDescription, options?): Promise<ReviewResult>` - Step 1: Analysis
- `modifyResume(resume, review, options?): Promise<EnhancementResult>` - Step 2: Enhancement
- `enhanceResume(resume, jobDescription, options?): Promise<EnhancementResult>` - Orchestrates both steps
- `parseReviewResponse(response): ReviewResult`
- `parseModifyResponse(response): EnhancementResult`
- `trackChanges(original, enhanced): ChangeDetail[]`

**Acceptance Criteria:**
- Service implements the interface correctly
- Review phase produces actionable analysis
- Modify phase uses review findings effectively
- Sequential workflow (review → modify) works correctly
- AI responses are properly parsed for both phases
- Change tracking is accurate
- Error handling is comprehensive
- Fallback mechanism works
- Architecture supports future agent upgrade
- Unit and integration tests pass

**Dependencies:** Task 16.1, Task 17.1, Task 18.2, Phase 2 Task 11.1

---

### Task 19.2: Implement Natural Language Enhancement Logic
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Implement logic to ensure AI makes natural, contextually appropriate modifications using extracted job information.

**Subtasks:**
- [ ] Create enhancement context builder:
  - [ ] Combine resume and job info
  - [ ] Highlight relevant sections
  - [ ] Identify enhancement opportunities
- [ ] Implement bullet point enhancement:
  - [ ] Use job keywords naturally
  - [ ] Maintain original meaning
  - [ ] Preserve achievements and metrics
  - [ ] Avoid mechanical keyword insertion
- [ ] Implement skill reordering:
  - [ ] Prioritize job-relevant skills
  - [ ] Maintain skill categories
  - [ ] Preserve all original skills
- [ ] Implement summary enhancement:
  - [ ] Align with job requirements
  - [ ] Maintain professional tone
  - [ ] Preserve core message
- [ ] Add context preservation checks:
  - [ ] Verify meaning is maintained
  - [ ] Check for over-modification
  - [ ] Validate natural language flow
- [ ] Write unit tests

**Files to Create/Modify:**
- `src/services/aiResumeEnhancementService.ts` (add methods)

**Key Functions:**
- `buildEnhancementContext(resume, jobInfo): EnhancementContext`
- `enhanceBulletPoints(bullets, jobInfo): string[]`
- `reorderSkills(skills, jobInfo): Skills`
- `enhanceSummary(summary, jobInfo): string`

**Acceptance Criteria:**
- Enhancements are natural and contextual
- Original meaning is preserved
- Job information is used intelligently
- No mechanical keyword stuffing
- Unit tests pass

**Dependencies:** Task 19.1

---

## ✅ Task Group 20: Quality Assurance & Validation

### Task 20.1: Implement Truthfulness Validator
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create a validator that ensures AI enhancements never add content not present in the original resume.

**Subtasks:**
- [ ] Create `src/services/ai/truthfulnessValidator.ts`
- [ ] Implement experience validation:
  - [ ] Verify no new experiences added
  - [ ] Verify company names match
  - [ ] Verify dates match
  - [ ] Verify roles match
- [ ] Implement skills validation:
  - [ ] Verify all skills exist in original
  - [ ] Verify no new skills added
  - [ ] Allow reordering only
- [ ] Implement education validation:
  - [ ] Verify institutions match
  - [ ] Verify degrees match
  - [ ] Verify dates match
- [ ] Implement bullet point validation:
  - [ ] Verify achievements are truthful
  - [ ] Verify metrics are not fabricated
  - [ ] Verify technologies mentioned are in skills
- [ ] Implement summary validation:
  - [ ] Verify claims match experience
  - [ ] Verify years of experience match
- [ ] Add validation error reporting
- [ ] Add automatic correction suggestions
- [ ] Write comprehensive unit tests

**Files to Create:**
- `src/services/ai/truthfulnessValidator.ts`

**Key Functions:**
- `validateTruthfulness(original, enhanced): ValidationResult`
- `validateExperiences(original, enhanced): boolean`
- `validateSkills(original, enhanced): boolean`
- `validateBulletPoints(original, enhanced): boolean`

**Acceptance Criteria:**
- All validation checks work correctly
- False positives are minimized
- Error messages are clear
- Validation is fast and efficient
- Unit tests have high coverage

**Dependencies:** Task 19.1

---

### Task 20.2: Implement Response Format Validator
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:**
Validate that AI responses match the expected format and structure.

**Subtasks:**
- [ ] Create `src/services/ai/responseValidator.ts`
- [ ] Implement JSON structure validation:
  - [ ] Verify response is valid JSON
  - [ ] Verify required fields present
  - [ ] Verify field types are correct
- [ ] Implement resume schema validation:
  - [ ] Use existing resume validator
  - [ ] Verify enhanced resume is valid
  - [ ] Check for missing required fields
- [ ] Implement improvements validation:
  - [ ] Verify improvements array structure
  - [ ] Verify each improvement has required fields
  - [ ] Verify improvement types are valid
- [ ] Add validation error recovery:
  - [ ] Attempt to fix common issues
  - [ ] Provide helpful error messages
  - [ ] Suggest corrections
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/responseValidator.ts`

**Key Functions:**
- `validateResponseFormat(response): ValidationResult`
- `validateResumeStructure(resume): boolean`
- `validateImprovements(improvements): boolean`

**Acceptance Criteria:**
- Response format validation works correctly
- Error messages are helpful
- Recovery mechanisms work
- Unit tests pass

**Dependencies:** Task 19.1, Phase 1 Task 3.1 (Resume Validator)

---

### Task 20.3: Implement Quality Scoring
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2.5 hours

**Description:**
Create a quality scoring system to evaluate AI enhancement quality.

**Subtasks:**
- [ ] Create `src/services/ai/qualityScorer.ts`
- [ ] Implement quality metrics:
  - [ ] Keyword relevance score
  - [ ] Natural language score
  - [ ] Truthfulness score
  - [ ] ATS compliance score
  - [ ] Overall quality score
- [ ] Implement scoring algorithms:
  - [ ] Calculate keyword match percentage
  - [ ] Analyze language naturalness
  - [ ] Check truthfulness violations
  - [ ] Verify ATS compliance
- [ ] Add quality thresholds:
  - [ ] Define minimum acceptable scores
  - [ ] Add quality warnings
  - [ ] Add quality recommendations
- [ ] Generate quality report
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/qualityScorer.ts`

**Key Functions:**
- `scoreEnhancement(original, enhanced, jobInfo): QualityScore`
- `calculateKeywordRelevance(enhanced, jobInfo): number`
- `calculateNaturalness(enhanced): number`

**Acceptance Criteria:**
- Quality scoring is accurate
- Scores are meaningful
- Thresholds are appropriate
- Reports are useful
- Unit tests pass

**Dependencies:** Task 19.1, Task 20.1

---

## 💰 Task Group 21: Cost Tracking & Monitoring

### Task 21.1: Implement Cost Tracking
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2.5 hours

**Description:**
Implement cost tracking for AI API usage to monitor expenses.

**Subtasks:**
- [ ] Create `src/services/ai/costTracker.ts`
- [ ] Implement cost calculation:
  - [ ] Track tokens used per request
  - [ ] Calculate cost based on model pricing
  - [ ] Support different pricing models
  - [ ] Handle input/output token pricing
- [ ] Implement cost storage:
  - [ ] Store costs per request
  - [ ] Aggregate costs by provider
  - [ ] Track costs over time
  - [ ] Support cost limits
- [ ] Implement cost reporting:
  - [ ] Generate cost summaries
  - [ ] Export cost data
  - [ ] Provide cost breakdowns
- [ ] Add cost limits:
  - [ ] Set daily/monthly limits
  - [ ] Enforce limits
  - [ ] Provide warnings
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/costTracker.ts`

**Key Functions:**
- `trackCost(provider, model, tokens): CostRecord`
- `calculateCost(provider, model, tokens): number`
- `getTotalCost(period): number`
- `checkCostLimit(): boolean`

**Acceptance Criteria:**
- Cost tracking is accurate
- All providers are supported
- Cost limits work correctly
- Reports are useful
- Unit tests pass

**Dependencies:** Task 16.1

---

### Task 21.2: Implement Usage Monitoring
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:**
Implement usage monitoring to track API calls, errors, and performance metrics.

**Subtasks:**
- [ ] Create `src/services/ai/usageMonitor.ts`
- [ ] Implement usage tracking:
  - [ ] Track API calls per provider
  - [ ] Track success/failure rates
  - [ ] Track response times
  - [ ] Track token usage
- [ ] Implement metrics collection:
  - [ ] Average response time
  - [ ] Success rate
  - [ ] Error rate by type
  - [ ] Token usage statistics
- [ ] Implement usage reporting:
  - [ ] Generate usage reports
  - [ ] Export usage data
  - [ ] Provide usage dashboards (CLI)
- [ ] Add performance monitoring:
  - [ ] Track slow requests
  - [ ] Identify bottlenecks
  - [ ] Monitor provider health
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/usageMonitor.ts`

**Key Functions:**
- `trackUsage(provider, request, response, duration): void`
- `getUsageStats(period): UsageStats`
- `getProviderHealth(provider): HealthStatus`

**Acceptance Criteria:**
- Usage tracking is comprehensive
- Metrics are accurate
- Reports are useful
- Performance monitoring works
- Unit tests pass

**Dependencies:** Task 16.1

---

## ⚙️ Task Group 22: Configuration & Management

### Task 22.1: Implement Configuration Management
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2.5 hours

**Description:**
Create a configuration system for managing AI provider settings, API keys, and options.

**Subtasks:**
- [ ] Create `src/services/ai/config.ts`
- [ ] Implement configuration loading:
  - [ ] Load from environment variables
  - [ ] Load from config file
  - [ ] Support multiple config sources
  - [ ] Validate configuration
- [ ] Implement API key management:
  - [ ] Secure key storage
  - [ ] Key rotation support
  - [ ] Key validation
  - [ ] Support for multiple keys
- [ ] Implement provider configuration:
  - [ ] Default provider selection
  - [ ] Provider-specific settings
  - [ ] Model selection
  - [ ] Temperature and other parameters
- [ ] Implement cost limit configuration:
  - [ ] Daily limits
  - [ ] Monthly limits
  - [ ] Per-provider limits
- [ ] Add configuration validation
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/config.ts`
- `src/config/ai.config.example.json`

**Configuration Format:**
```json
{
  "defaultProvider": "gemini",
  "providers": {
    "gemini": {
      "apiKey": "${GEMINI_API_KEY}",
      "model": "gemini-pro",
      "temperature": 0.7,
      "maxTokens": 2000
    }
  },
  "costLimits": {
    "daily": 10.00,
    "monthly": 300.00
  }
}
```

**Acceptance Criteria:**
- Configuration loading works correctly
- API keys are securely managed
- Validation is comprehensive
- Gemini provider is configurable
- Unit tests pass

**Dependencies:** Task 16.1

---

### Task 22.2: Implement Fallback Mechanism
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Implement automatic fallback to Phase 2 mock service when AI providers fail.

**Subtasks:**
- [ ] Create `src/services/ai/fallbackManager.ts`
- [ ] Implement fallback logic:
  - [ ] Detect Gemini provider failures
  - [ ] Fallback to mock service as last resort
  - [ ] Log fallback events
- [ ] Implement fallback conditions:
  - [ ] API errors
  - [ ] Rate limit errors
  - [ ] Network errors
  - [ ] Invalid response errors
- [ ] Implement retry logic:
  - [ ] Retry failed requests
  - [ ] Exponential backoff
  - [ ] Max retry attempts
- [ ] Add fallback notifications:
  - [ ] Warn when using fallback
  - [ ] Log fallback reasons
  - [ ] Report fallback statistics
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/fallbackManager.ts`

**Key Functions:**
- `handleFailure(error, provider): AIProvider | null`
- `getNextProvider(currentProvider): AIProvider | null`
- `shouldFallbackToMock(error): boolean`

**Acceptance Criteria:**
- Fallback works correctly
- Provider priority is respected
- Retry logic is effective
- Notifications are clear
- Unit tests pass

**Dependencies:** Task 16.2, Phase 2 Task 11.1

---

## 🔗 Task Group 23: Integration & Updates

### Task 23.1: Update CLI to Support AI Providers
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Update the CLI `enhanceResume` command to support AI provider selection and configuration.

**Subtasks:**
- [ ] Update `src/cli/index.ts`:
  - [ ] Add `--ai-provider` option (gemini, mock)
  - [ ] Add `--ai-model` option (gemini-pro, gemini-1.5-pro, gemini-1.5-flash)
  - [ ] Add `--ai-temperature` option (0-1)
  - [ ] Add `--use-ai` flag to enable AI (default: mock)
  - [ ] Add `--fallback` option (enable/disable fallback)
- [ ] Implement provider selection logic:
  - [ ] Load provider from config or CLI option
  - [ ] Initialize selected provider
  - [ ] Handle provider errors
- [ ] Update help text and documentation
- [ ] Add provider status display
- [ ] Add cost display (if enabled)
- [ ] Write integration tests

**Files to Modify:**
- `src/cli/index.ts`

**Command Usage:**
```bash
enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --use-ai \
  --ai-provider gemini \
  --ai-model gemini-pro \
  --output ./output
```

**Acceptance Criteria:**
- CLI options work correctly
- Provider selection works
- Error handling is good
- Help text is clear
- Integration tests pass

**Dependencies:** Task 19.1, Task 22.1

---

### Task 23.2: Update API to Support AI Providers
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Update the API `/api/enhanceResume` endpoint to support AI provider selection and configuration.

**Subtasks:**
- [ ] Update `src/api/routes.ts`:
  - [ ] Add `aiProvider` to request body schema
  - [ ] Add `aiModel` to request body schema
  - [ ] Add `aiOptions` to request body schema
  - [ ] Update validation schema
- [ ] Implement provider selection:
  - [ ] Load provider from request or config
  - [ ] Initialize selected provider
  - [ ] Handle provider errors
- [ ] Update response format:
  - [ ] Include provider used
  - [ ] Include cost information (if enabled)
  - [ ] Include quality scores (if enabled)
- [ ] Add error handling for provider failures
- [ ] Update API documentation
- [ ] Write integration tests

**Files to Modify:**
- `src/api/routes.ts`
- `src/api/middleware.ts`

**Request Example:**
```json
{
  "resume": { ... },
  "jobDescription": "...",
  "options": {
    "focusAreas": ["bulletPoints"]
  },
  "aiProvider": "gemini",
  "aiModel": "gemini-pro",
  "aiOptions": {
    "temperature": 0.7
  }
}
```

**Acceptance Criteria:**
- API accepts AI provider options
- Provider selection works
- Response includes provider info
- Error handling is comprehensive
- Integration tests pass

**Dependencies:** Task 19.1, Task 22.1

---

## 📊 Task Group 24: Testing & Documentation

### Task 24.1: Write Comprehensive Unit Tests
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 4 hours

**Description:**
Write comprehensive unit tests for all AI-related components.

**Subtasks:**
- [ ] Test AI provider interface implementations
- [ ] Test prompt building and validation
- [ ] Test AI enhancement service
- [ ] Test truthfulness validator
- [ ] Test response format validator
- [ ] Test quality scorer
- [ ] Test cost tracker
- [ ] Test usage monitor
- [ ] Test configuration management
- [ ] Test fallback mechanism
- [ ] Achieve >80% code coverage
- [ ] Test error scenarios
- [ ] Test edge cases

**Files to Create:**
- `tests/services/ai/*.test.ts` (multiple test files)

**Acceptance Criteria:**
- All components have unit tests
- Code coverage >80%
- All error cases are tested
- Tests are maintainable
- Tests run fast

**Dependencies:** All previous tasks

---

### Task 24.2: Write Integration Tests
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 3 hours

**Description:**
Write integration tests for the complete AI enhancement workflow.

**Subtasks:**
- [ ] Create `tests/integration/aiEnhancement.test.ts`
- [ ] Test end-to-end enhancement with mocked AI:
  - [ ] Test Gemini integration
- [ ] Test fallback scenarios:
  - [ ] Test provider failure fallback
  - [ ] Test mock service fallback
- [ ] Test error handling:
  - [ ] Test API errors
  - [ ] Test network errors
  - [ ] Test invalid responses
- [ ] Test cost tracking integration
- [ ] Test usage monitoring integration
- [ ] Test CLI integration
- [ ] Test API integration

**Files to Create:**
- `tests/integration/aiEnhancement.test.ts`

**Acceptance Criteria:**
- Integration tests cover main workflows
- All providers are tested
- Fallback scenarios are tested
- Error scenarios are tested
- Tests use mocked AI responses

**Dependencies:** Task 24.1

---

### Task 24.3: Update Documentation
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:**
Update project documentation to include Phase 3 AI integration features.

**Subtasks:**
- [ ] Update `README.md`:
  - [ ] Add AI provider selection examples
  - [ ] Add configuration instructions
  - [ ] Add cost tracking information
  - [ ] Add troubleshooting for AI issues
- [ ] Update `API.md`:
  - [ ] Document AI provider options
  - [ ] Add AI-specific request/response examples
  - [ ] Document cost tracking in responses
  - [ ] Document quality scores
- [ ] Create `GEMINI_SETUP.md`:
  - [ ] Document Gemini setup instructions
  - [ ] Document model selection (gemini-pro, gemini-1.5-pro, gemini-1.5-flash)
  - [ ] Document pricing information
  - [ ] Document best practices
- [ ] Update `PROJECT_PLAN.md` (already done, verify)
- [ ] Add examples of AI-enhanced resumes

**Files to Create/Modify:**
- `GEMINI_SETUP.md` (new)
- `README.md` (update)
- `API.md` (update)

**Acceptance Criteria:**
- Documentation is comprehensive
- Examples are clear
- Setup instructions are accurate
- Troubleshooting is helpful
- Gemini setup is fully documented

**Dependencies:** Task 23.1, Task 23.2

---

## 📊 Task Summary

### By Priority

**High Priority (Must Have):**
- Task Group 16: AI Provider Abstraction (2 tasks)
- Task Group 17: AI Provider Implementation (1 task - Gemini)
- Task Group 18: Prompt Engineering (2 tasks)
- Task Group 19: AI Enhancement Service (2 tasks)
- Task Group 20: Quality Assurance (2 tasks)
- Task Group 22: Configuration & Management (2 tasks)
- Task Group 23: Integration & Updates (2 tasks)
- Task Group 24: Testing (1 task)

**Medium Priority (Should Have):**
- Task Group 20: Quality Scoring (1 task)
- Task Group 21: Cost Tracking & Monitoring (2 tasks)
- Task Group 24: Integration Tests & Documentation (2 tasks)

### Estimated Total Time
- High Priority: ~22 hours
- Medium Priority: ~9.5 hours
- **Total: ~31.5 hours**

### Task Dependencies Graph

```
16.1 (Provider Interface)
  ├─> 16.2 (Provider Registry)
  │   └─> 17.1 (Gemini) ──┐
  │                       │
18.1 (Prompts) ──> 18.2 (Builder) ──┼─> 19.1 (AI Service)
  │
  └─> 19.1 ──> 19.2 (Natural Language)
              │
              ├─> 20.1 (Truthfulness)
              ├─> 20.2 (Response Validation)
              └─> 20.3 (Quality Scoring)

21.1 (Cost Tracking) ──> 21.2 (Usage Monitoring)
22.1 (Config) ──> 22.2 (Fallback)

19.1 ──> 23.1 (CLI Update)
19.1 ──> 23.2 (API Update)

All ──> 24.1 (Unit Tests)
All ──> 24.2 (Integration Tests)
All ──> 24.3 (Documentation)
```

---

## ✅ Phase 3 Completion Checklist

Before marking Phase 3 as complete, verify:

- [ ] Gemini AI provider is fully integrated and working
- [ ] AI enhancement produces natural, high-quality results
- [ ] Truthfulness validation prevents fabrication
- [ ] Fallback to mock service works reliably
- [ ] Cost tracking and monitoring are functional
- [ ] CLI and API support AI provider selection
- [ ] Configuration management is secure and flexible
- [ ] All unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation is complete and accurate
- [ ] Examples demonstrate AI enhancement quality

---

*This document will be updated as Phase 3 tasks are completed.*
