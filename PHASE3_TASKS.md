# Phase 3: Real AI Model Integration - Task Breakdown

## 📋 Overview

This document breaks down Phase 3 into detailed, actionable tasks organized by component and priority. Each task includes acceptance criteria and dependencies.

Phase 3 implements Google Gemini AI model integration for resume enhancement. The enhancement process follows a sequential two-step approach: **Review** (analyze resume against job requirements) → **Modify** (enhance resume based on review findings). The architecture is designed to support future upgrade to agent-based approach with tools for iterative refinement.

**Intelligent Content Inference:** The AI can intelligently add related content based on what's already in the original resume. For example, if a resume mentions "Java", the AI can infer and add related terms like "backend development" or "server-side programming" since Java is commonly associated with backend work. This allows for natural enhancement while maintaining truthfulness - the AI only adds content that can be reasonably inferred from existing resume information.

**Status Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⏸️ Blocked

---

## 🎯 Goals

- Integrate Google Gemini AI model for resume enhancement
- Use extracted job description information for natural language modifications
- Enable intelligent content inference - AI can add related content based on existing resume information (e.g., Java → backend development)
- Maintain truthfulness guarantee (no fabrication, but allows reasonable inference from existing content)
- Implement cost tracking and usage monitoring
- Provide quality assurance and validation

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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 4 hours

**Description:**
Create structured prompt templates for two-step enhancement process: Review prompts and Modification prompts. Templates include extracted job information and guide AI to make natural, truthful enhancements.

**Subtasks:**
- [x] Create `src/services/ai/prompts/` directory
- [x] Create `src/services/ai/prompts/review.template.ts` (Step 1: Review)
  - [x] System message for resume analysis
  - [x] Context section (resume + job info)
  - [x] Analysis task description
  - [x] Output format for review (strengths, weaknesses, opportunities, actions)
- [x] Create `src/services/ai/prompts/modify.template.ts` (Step 2: Modify)
  - [x] System message with enhancement instructions
  - [x] Context section (resume + job info + review findings)
  - [x] Enhancement task description
  - [x] Output format specification (enhanced resume JSON)
  - [x] Truthfulness requirements
- [x] Design base prompt structure for both:
  - [x] System message with instructions
  - [x] Context section (resume + job info)
  - [x] Task description
  - [x] Output format specification
  - [x] Truthfulness requirements (for modify prompt)
- [x] Create prompt variants for modify:
  - [x] Full enhancement (bullet points + skills + summary)
  - [x] Bullet points only
  - [x] Skills reordering only
  - [x] Summary enhancement only
- [x] Add few-shot examples:
  - [x] Example of good review analysis
  - [x] Example of good enhancement
  - [x] Example of bad enhancement (to avoid)
- [x] Implement prompt variable substitution:
  - [x] Resume data injection
  - [x] Job information injection
  - [x] Review findings injection (for modify prompt)
  - [x] Options injection
- [x] Add prompt optimization:
  - [x] Token counting
  - [x] Context window management
  - [x] Prompt compression techniques
- [x] Write unit tests for prompt generation
- [x] Document prompt design decisions

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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create a utility to build and customize prompts dynamically for both review and modification phases.

**Subtasks:**
- [x] Create `src/services/ai/prompts/promptBuilder.ts`
- [x] Implement `buildReviewPrompt` function:
  - [x] Accept resume, job info, and options
  - [x] Select review prompt template
  - [x] Inject resume data
  - [x] Inject job information
  - [x] Return complete review prompt
- [x] Implement `buildModifyPrompt` function:
  - [x] Accept resume, job info, review result, and options
  - [x] Select modification prompt template
  - [x] Inject resume data
  - [x] Inject job information
  - [x] Inject review findings
  - [x] Apply focus areas filtering
  - [x] Apply tone adjustments
  - [x] Return complete modification prompt
- [x] Implement prompt validation:
  - [x] Check token limits
  - [x] Validate structure
  - [x] Ensure required sections present
- [x] Add prompt caching for similar requests
- [x] Add prompt versioning
- [x] Write unit tests

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
**Status:** 🔄 In Progress  
**Priority:** High  
**Estimated Time:** 6 hours

**Description:**
Create the main AI enhancement service that uses real AI models to enhance resumes using extracted job information. Implements sequential two-step process: Review → Modify. The AI can intelligently add related content based on existing resume information (e.g., if resume mentions Java, it can add "backend development" or related terms that can be reasonably inferred).

**Subtasks:**
- [x] Create `src/services/aiResumeEnhancementService.ts`
- [x] Implement `AIResumeEnhancementService` class:
  - [x] Implement `ResumeEnhancementService` interface
  - [x] Accept AI provider in constructor
  - [x] Integrate job description parser
  - [x] Integrate prompt builder (through AI provider)
- [x] Implement `reviewResume` method (Step 1):
  - [x] Parse job description
  - [x] Extract job information
  - [x] Build review prompt
  - [x] Call AI provider for review
  - [x] Parse review response (strengths, weaknesses, opportunities, prioritized actions)
  - [x] Return `ReviewResult`
- [x] Implement `modifyResume` method (Step 2):
  - [x] Accept resume and review result
  - [x] Build modification prompt based on review
  - [x] Call AI provider for modification
  - [x] Parse enhanced resume from response
  - [x] Validate response structure
- [x] Implement `enhanceResume` method (orchestrates review + modify):
  - [x] Call `reviewResume` first
  - [x] Call `modifyResume` with review result
  - [x] Track changes (old → new)
  - [x] Generate improvements list
  - [x] Calculate ATS scores
  - [x] Generate recommendations
- [x] Implement response parsing:
  - [x] Parse JSON from AI responses (review + modify)
  - [x] Validate resume structure
  - [x] Extract improvements
  - [x] Extract reasoning (if available)
- [x] Implement change tracking:
  - [x] Compare original vs enhanced resume
  - [x] Generate ChangeDetail array
  - [x] Track all modifications
- [x] Design interfaces compatible with future agent mode:
  - [x] Abstract review/modify methods
  - [x] Support for tool-based approach (future)
- [x] Add error handling:
  - [x] AI provider errors
  - [x] Parsing errors
  - [x] Validation errors
- [x] Add logging for debugging
- [x] Write unit tests
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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Implement logic to ensure AI makes natural, contextually appropriate modifications using extracted job information. The AI can intelligently infer and add related content based on existing resume information (e.g., Java → backend, React → frontend, Python → data science/automation). This allows for natural enhancement while maintaining truthfulness through reasonable inference.

**Subtasks:**
- [x] Create enhancement context builder:
  - [x] Combine resume and job info
  - [x] Highlight relevant sections
  - [x] Identify enhancement opportunities
- [x] Implement bullet point enhancement:
  - [x] Use job keywords naturally
  - [x] Maintain original meaning
  - [x] Preserve achievements and metrics
  - [x] Avoid mechanical keyword insertion
  - [x] Enable intelligent inference (e.g., Java → backend, React → frontend)
- [x] Implement skill reordering:
  - [x] Prioritize job-relevant skills
  - [x] Maintain skill categories
  - [x] Preserve all original skills
- [x] Implement summary enhancement:
  - [x] Align with job requirements
  - [x] Maintain professional tone
  - [x] Preserve core message
- [x] Add context preservation checks:
  - [x] Verify meaning is maintained
  - [x] Check for over-modification
  - [x] Validate natural language flow
- [x] Write unit tests

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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create a validator that ensures AI enhancements maintain truthfulness while allowing intelligent inference. The validator should allow the AI to add related content that can be reasonably inferred from existing resume information (e.g., Java → backend development, React → frontend development, Python → data science). However, it should prevent fabrication of completely unrelated content.

**Subtasks:**
- [x] Create `src/services/ai/truthfulnessValidator.ts`
- [x] Implement experience validation:
  - [x] Verify no new experiences added
  - [x] Verify company names match
  - [x] Verify dates match
  - [x] Verify roles match
- [x] Implement skills validation:
  - [x] Allow skills that can be reasonably inferred from existing skills (e.g., Java → backend, React → frontend)
  - [x] Verify inferred skills are logically related to original skills
  - [x] Prevent completely unrelated skills from being added
  - [x] Allow reordering and intelligent expansion
- [x] Implement education validation:
  - [x] Verify institutions match
  - [x] Verify degrees match
  - [x] Verify dates match
- [x] Implement bullet point validation:
  - [x] Verify achievements are truthful
  - [x] Verify metrics are not fabricated
  - [x] Verify technologies mentioned are in skills or can be reasonably inferred
  - [x] Allow related terms to be added (e.g., "Java" → can add "backend development", "server-side")
- [x] Implement summary validation:
  - [x] Verify claims match experience
  - [x] Verify years of experience match
- [x] Add validation error reporting
- [x] Add automatic correction suggestions
- [x] Write comprehensive unit tests

**Files Created:**
- `src/services/ai/truthfulnessValidator.ts` ✅
- `tests/services/ai/truthfulnessValidator.test.ts` ✅

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
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:**
Validate that AI responses match the expected format and structure.

**Subtasks:**
- [x] Create `src/services/ai/responseValidator.ts`
- [x] Implement JSON structure validation:
  - [x] Verify response is valid JSON
  - [x] Verify required fields present
  - [x] Verify field types are correct
- [x] Implement resume schema validation:
  - [x] Use existing resume validator
  - [x] Verify enhanced resume is valid
  - [x] Check for missing required fields
- [x] Implement improvements validation:
  - [x] Verify improvements array structure
  - [x] Verify each improvement has required fields
  - [x] Verify improvement types are valid
- [x] Add validation error recovery:
  - [x] Attempt to fix common issues
  - [x] Provide helpful error messages
  - [x] Suggest corrections
- [x] Write unit tests

**Files Created:**
- `src/services/ai/responseValidator.ts` ✅
- `tests/services/ai/responseValidator.test.ts` ✅

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
**Estimated Time:** 3.5 hours

**Description:**
Create a hybrid quality scoring system to evaluate AI enhancement quality. Uses rule-based scoring first (fast, free), then optionally uses AI review for low-scoring enhancements to provide detailed feedback and enable iterative improvement.

**Subtasks:**
- [ ] Create `src/services/ai/qualityScorer.ts`
- [ ] Implement rule-based quality metrics (Phase 1 - Fast):
  - [ ] Keyword relevance score (percentage of job keywords found)
  - [ ] Natural language score (using existing validation)
  - [ ] Truthfulness score (using truthfulness validator)
  - [ ] ATS compliance score (using ATS validator)
  - [ ] Overall quality score (weighted average)
- [ ] Implement scoring algorithms:
  - [ ] Calculate keyword match percentage
  - [ ] Analyze language naturalness
  - [ ] Check truthfulness violations
  - [ ] Verify ATS compliance
- [ ] Implement AI-based quality review (Phase 2 - Optional):
  - [ ] Create AI quality review prompt template
  - [ ] Trigger AI review when score < threshold (e.g., 70%)
  - [ ] AI provides detailed feedback and recommendation
  - [ ] AI returns "needs improvement" or "acceptable" verdict
- [ ] Add quality thresholds:
  - [ ] Define minimum acceptable scores
  - [ ] Define AI review trigger threshold
  - [ ] Add quality warnings
  - [ ] Add quality recommendations
- [ ] Implement iterative enhancement support:
  - [ ] Track enhancement iterations (max 2-3 to control cost)
  - [ ] Provide feedback for next iteration
  - [ ] Compare scores across iterations
- [ ] Generate quality report
- [ ] Write unit tests

**Files to Create:**
- `src/services/ai/qualityScorer.ts`
- `src/services/ai/prompts/qualityReview.template.ts` (optional - for AI review)

**Key Functions:**
- `scoreEnhancement(original, enhanced, jobInfo, options?): QualityScore`
- `calculateKeywordRelevance(enhanced, jobInfo): number`
- `calculateNaturalness(enhanced): number`
- `reviewQualityWithAI(original, enhanced, jobInfo, qualityScore): Promise<AIQualityReview>`
- `shouldTriggerAIReview(qualityScore, threshold?): boolean`
- `canIterateEnhancement(iterationCount, maxIterations?): boolean`

**Quality Score Structure:**
```typescript
interface QualityScore {
  overall: number; // 0-100
  keywordRelevance: number; // 0-100
  naturalLanguage: number; // 0-100
  truthfulness: number; // 0-100
  atsCompliance: number; // 0-100
  aiReview?: AIQualityReview; // Optional AI review result
  needsImprovement: boolean;
  recommendations: string[];
  iteration?: number; // Current iteration count
}
```

**AI Review Structure:**
```typescript
interface AIQualityReview {
  verdict: 'acceptable' | 'needs_improvement';
  score: number; // 0-100
  detailedFeedback: string[];
  specificIssues: string[];
  improvementSuggestions: string[];
  confidence: number; // 0-1
}
```

**Acceptance Criteria:**
- Rule-based scoring is fast and accurate
- AI review is triggered only when needed (score < threshold)
- Scores are meaningful and actionable
- Thresholds are appropriate
- Iterative enhancement is controlled (max iterations)
- Reports are useful
- Unit tests pass

**Dependencies:** Task 19.1, Task 20.1, Task 17.1 (for AI review)

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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 2.5 hours

**Description:**
Create a configuration system for managing AI provider settings, API keys, and options.

**Subtasks:**
- [x] Create `src/services/ai/config.ts`
- [x] Implement configuration loading:
  - [x] Load from environment variables
  - [x] Load from config file
  - [x] Support multiple config sources
  - [x] Validate configuration
- [x] Implement API key management:
  - [x] Secure key storage
  - [x] Key rotation support
  - [x] Key validation
  - [x] Support for multiple keys
- [x] Implement provider configuration:
  - [x] Default provider selection
  - [x] Provider-specific settings
  - [x] Model selection
  - [x] Temperature and other parameters
- [ ] Implement cost limit configuration:
  - [ ] Daily limits
  - [ ] Monthly limits
  - [ ] Per-provider limits
  - **Note:** Delayed per user request
- [x] Add configuration validation
- [x] Write unit tests

**Files Created:**
- ✅ `src/services/ai/config.ts`
- ✅ `src/config/ai.config.example.json`

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
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Implement fallback mechanism for AI provider failures. When the primary AI provider fails, the system should handle errors gracefully and provide clear feedback to users.

**Subtasks:**
- [x] Create `src/services/ai/fallbackManager.ts`
- [x] Implement fallback logic:
  - [x] Detect Gemini provider failures
  - [x] Log failure events
- [x] Implement fallback conditions:
  - [x] API errors
  - [x] Rate limit errors
  - [x] Network errors
  - [x] Invalid response errors
- [x] Implement retry logic:
  - [x] Retry failed requests
  - [x] Exponential backoff
  - [x] Max retry attempts
- [x] Add error notifications:
  - [x] Clear error messages
  - [x] Log error reasons
  - [x] Report error statistics
- [x] Write unit tests

**Files to Create:**
- `src/services/ai/fallbackManager.ts`

**Key Functions:**
- `handleFailure(error, provider): AIProvider | null`
- `getNextProvider(currentProvider): AIProvider | null`

**Acceptance Criteria:**
- Error handling works correctly
- Provider priority is respected
- Retry logic is effective
- Error messages are clear
- Unit tests pass

**Dependencies:** Task 16.2, Phase 2 Task 11.1

---

## 🔗 Task Group 23: Integration & Updates

### Task 23.1: Update CLI to Support AI Providers
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Time:** 2 hours

**Description:**
Update the CLI `enhanceResume` command to support AI provider selection and configuration.

**Subtasks:**
- [x] Update `src/cli/index.ts`:
  - [x] Add `--ai-provider` option (gemini)
  - [x] Add `--ai-model` option (gemini-2.5-pro, gemini-3-flash-preview)
  - [x] Add `--ai-temperature` option (0-1)
  - [x] Remove mock service references
- [x] Implement provider selection logic:
  - [x] Load provider from config or CLI option
  - [x] Initialize selected provider
  - [x] Handle provider errors
- [x] Update help text and documentation
- [x] Add provider status display
- [x] Add error handling for AI provider failures
- [ ] Write integration tests

**Files to Modify:**
- `src/cli/index.ts`

**Command Usage:**
```bash
enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --ai-provider gemini \
  --ai-model gemini-2.5-pro \
  --ai-temperature 0.7 \
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
- [x] Test truthfulness validator ✅
- [x] Test response format validator ✅
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
  - [ ] Test error scenarios:
  - [ ] Test provider failure handling
  - [ ] Test error recovery
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
- Task Group 16: AI Provider Abstraction (2 tasks) ✅
- Task Group 17: AI Provider Implementation (1 task - Gemini) ✅
- Task Group 18: Prompt Engineering (2 tasks) ✅
- Task Group 19: AI Enhancement Service (2 tasks) ✅
- Task Group 20: Quality Assurance (2 tasks completed)
- Task Group 22: Configuration & Management (2 tasks)
- Task Group 23: Integration & Updates (2 tasks)
- Task Group 24: Testing (1 task)

**Medium Priority (Should Have):**
- Task Group 20: Quality Scoring (1 task - hybrid approach)
- Task Group 21: Cost Tracking & Monitoring (2 tasks)
- Task Group 24: Integration Tests & Documentation (2 tasks)

### Estimated Total Time
- High Priority: ~22 hours
- Medium Priority: ~10 hours (updated: Task 20.3 increased from 2.5h to 3.5h for hybrid approach)
- **Total: ~32 hours**

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

- [x] Gemini AI provider is fully integrated and working
- [x] AI enhancement produces natural, high-quality results
- [x] Truthfulness validation prevents fabrication
- [ ] Cost tracking and monitoring are functional
- [ ] CLI and API support AI provider selection
- [ ] Configuration management is secure and flexible
- [ ] All unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation is complete and accurate
- [ ] Examples demonstrate AI enhancement quality

---

*This document will be updated as Phase 3 tasks are completed.*
