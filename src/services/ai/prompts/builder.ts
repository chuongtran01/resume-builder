/**
 * Prompt Builder
 * 
 * Utility for building prompts from templates with variable substitution,
 * context management, optimization, caching, validation, and enhanced features.
 */

import type {
  PromptContext,
  PromptBuilderOptions,
} from './types';
import type { Resume } from '@resume-types/resume.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import type { ReviewResult } from '@services/ai/provider.types';
import { buildReviewPromptTemplate } from './review.template';
import { buildModifyPromptTemplate, getEnhancementAreasForMode } from './modify.template';
import { logger } from '@utils/logger';
import * as crypto from 'crypto';

/**
 * Prompt version
 */
const PROMPT_VERSION = '1.0.0';

/**
 * Prompt cache entry
 */
interface PromptCacheEntry {
  prompt: string;
  timestamp: number;
  version: string;
  tokenCount: number;
}

/**
 * Prompt cache (in-memory, can be replaced with Redis or similar)
 */
const promptCache = new Map<string, PromptCacheEntry>();

/**
 * Cache TTL in milliseconds (1 hour)
 */
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Maximum cache size
 */
const MAX_CACHE_SIZE = 100;

/**
 * Tone options for prompts
 */
export type PromptTone = 'professional' | 'concise' | 'detailed' | 'friendly';

/**
 * Focus area filter options
 */
export interface FocusAreaFilter {
  /** Include only specific focus areas */
  include?: string[];
  /** Exclude specific focus areas */
  exclude?: string[];
  /** Maximum number of focus areas to include */
  maxAreas?: number;
}

/**
 * Enhanced prompt builder options
 */
export interface EnhancedPromptBuilderOptions extends PromptBuilderOptions {
  /** Prompt tone */
  tone?: PromptTone;
  /** Focus area filtering */
  focusAreas?: FocusAreaFilter;
  /** Enable caching */
  useCache?: boolean;
  /** Prompt version */
  version?: string;
  /** Maximum tokens allowed */
  maxTokens?: number;
  /** Validate prompt before returning */
  validate?: boolean;
}

/**
 * Prompt validation result
 */
export interface PromptValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  tokenCount: number;
  sections: {
    systemMessage: boolean;
    context: boolean;
    taskDescription: boolean;
    outputFormat: boolean;
  };
}

// ============================================================================
// Base Prompt Building Functions (Core Logic)
// ============================================================================

/**
 * Build review prompt from template (base implementation)
 */
function buildReviewPromptBase(
  context: PromptContext,
  options: PromptBuilderOptions = {}
): string {
  const template = buildReviewPromptTemplate();
  const { includeExamples = true, maxContextLength, compress = false } = options;

  // Build system message
  let prompt = `${template.systemMessage}\n\n`;

  // Add task description
  prompt += `${template.taskDescription}\n\n`;

  // Add context section
  prompt += `## CONTEXT\n\n`;
  prompt += `### RESUME:\n${JSON.stringify(context.resume, null, 2)}\n\n`;
  prompt += `### JOB REQUIREMENTS:\n${JSON.stringify(context.jobInfo, null, 2)}\n\n`;

  // Add focus areas
  prompt += `## ANALYSIS FOCUS\n`;
  template.focusAreas.forEach((area, index) => {
    prompt += `${index + 1}. ${area}\n`;
  });
  prompt += `\n`;

  // Add few-shot examples if requested
  if (includeExamples && template.examples && template.examples.length > 0) {
    prompt += `## EXAMPLES\n\n`;
    template.examples.forEach((example, index) => {
      prompt += `### Example ${index + 1}:\n`;
      prompt += `Resume Snippet: ${example.resumeSnippet}\n`;
      prompt += `Job Requirements: ${example.jobSnippet}\n`;
      prompt += `Review Result: ${JSON.stringify(example.reviewResult, null, 2)}\n\n`;
    });
  }

  // Add output format
  prompt += `## OUTPUT FORMAT\n\n${template.outputFormat}\n`;

  // Compress if requested
  if (compress) {
    prompt = compressPrompt(prompt);
  }

  // Check context length
  if (maxContextLength && prompt.length > maxContextLength) {
    logger.warn(`Prompt length (${prompt.length}) exceeds max (${maxContextLength}), consider compression`);
  }

  return prompt;
}

/**
 * Build modify prompt from template (base implementation)
 */
function buildModifyPromptBase(
  context: PromptContext,
  options: PromptBuilderOptions = {}
): string {
  if (!context.reviewResult) {
    throw new Error('Review result is required for modify prompt');
  }

  const mode = options.mode || 'full';
  const template = buildModifyPromptTemplate(mode);
  const { includeExamples = true, maxContextLength, compress = false } = options;

  // Build system message
  let prompt = `${template.systemMessage}\n\n`;

  // Add task description
  prompt += `${template.taskDescription}\n\n`;

  // Add context section
  prompt += `## CONTEXT\n\n`;
  prompt += `### ORIGINAL RESUME:\n${JSON.stringify(context.resume, null, 2)}\n\n`;
  prompt += `### JOB REQUIREMENTS:\n${JSON.stringify(context.jobInfo, null, 2)}\n\n`;
  prompt += `### REVIEW FINDINGS:\n${JSON.stringify(context.reviewResult, null, 2)}\n\n`;

  // Add truthfulness rules
  prompt += `## CRITICAL RULES (MUST FOLLOW)\n\n`;
  template.truthfulnessRules.forEach((rule, index) => {
    prompt += `${index + 1}. ${rule}\n`;
  });
  prompt += `\n`;

  // Add enhancement areas (mode-specific)
  const enhancementAreas = mode !== 'full' 
    ? getEnhancementAreasForMode(mode)
    : template.enhancementAreas;
  
  prompt += `## ENHANCEMENT FOCUS\n`;
  enhancementAreas.forEach((area, index) => {
    prompt += `${index + 1}. ${area}\n`;
  });
  prompt += `\n`;

  // Add few-shot examples if requested
  if (includeExamples && template.examples && template.examples.length > 0) {
    prompt += `## EXAMPLES\n\n`;
    template.examples.forEach((example, index) => {
      prompt += `### Example ${index + 1}:\n`;
      prompt += `Original: ${example.original}\n`;
      prompt += `Enhanced: ${example.enhanced}\n`;
      prompt += `Explanation: ${example.explanation}\n\n`;
    });
  }

  // Add output format
  prompt += `## OUTPUT FORMAT\n\n${template.outputFormat}\n`;

  // Compress if requested
  if (compress) {
    prompt = compressPrompt(prompt);
  }

  // Check context length
  if (maxContextLength && prompt.length > maxContextLength) {
    logger.warn(`Prompt length (${prompt.length}) exceeds max (${maxContextLength}), consider compression`);
  }

  return prompt;
}

// ============================================================================
// Public API: Function Overloads
// ============================================================================

/**
 * Build review prompt from template
 * 
 * @overload
 * Basic usage with PromptContext
 */
export function buildReviewPrompt(
  context: PromptContext,
  options?: PromptBuilderOptions
): string;

/**
 * @overload
 * Enhanced usage with Resume and ParsedJobDescription
 */
export function buildReviewPrompt(
  resume: Resume,
  jobInfo: ParsedJobDescription,
  options?: EnhancedPromptBuilderOptions
): string;

/**
 * Implementation
 */
export function buildReviewPrompt(
  contextOrResume: PromptContext | Resume,
  optionsOrJobInfo?: PromptBuilderOptions | ParsedJobDescription | EnhancedPromptBuilderOptions,
  options?: EnhancedPromptBuilderOptions
): string {
  // Determine which overload is being used
  let context: PromptContext;
  let enhancedOptions: EnhancedPromptBuilderOptions = {};

  if ('resume' in contextOrResume && 'jobInfo' in contextOrResume) {
    // First overload: PromptContext
    context = contextOrResume as PromptContext;
    enhancedOptions = (optionsOrJobInfo as PromptBuilderOptions) || {};
  } else {
    // Second overload: Resume + ParsedJobDescription
    context = {
      resume: contextOrResume as Resume,
      jobInfo: optionsOrJobInfo as ParsedJobDescription,
      options: (options as Record<string, unknown>) || {},
    };
    enhancedOptions = options || {};
  }

  const {
    useCache = false, // Default to false for backward compatibility
    validate = false,
    maxTokens,
    tone = 'professional',
    focusAreas,
    version = PROMPT_VERSION,
    ...baseOptions
  } = enhancedOptions;

  // Check cache (only if enhanced options are used)
  if (useCache) {
    const cacheKey = generateCacheKey('review', context.resume, context.jobInfo, enhancedOptions);
    const cached = promptCache.get(cacheKey);
    if (cached && isCacheValid(cached, version)) {
      logger.debug('Using cached review prompt');
      return cached.prompt;
    }
  }

  // Build base prompt
  let prompt = buildReviewPromptBase(context, baseOptions);

  // Apply enhanced features if requested
  if (useCache || validate || maxTokens || tone !== 'professional' || focusAreas) {
    // Apply tone adjustments
    prompt = applyTone(prompt, tone);

    // Apply focus area filtering
    if (focusAreas) {
      prompt = filterFocusAreas(prompt, focusAreas);
    }

    // Validate if requested
    if (validate) {
      const validation = validatePrompt(prompt, 'review');
      if (!validation.valid) {
        logger.warn('Prompt validation failed:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        logger.warn('Prompt validation warnings:', validation.warnings);
      }
    }

    // Check token limits
    const tokenCount = estimatePromptTokens(prompt);
    if (maxTokens && tokenCount > maxTokens) {
      logger.warn(`Prompt tokens (${tokenCount}) exceed max (${maxTokens}), truncating`);
      prompt = truncatePrompt(prompt, maxTokens);
    }

    // Cache result
    if (useCache) {
      const cacheKey = generateCacheKey('review', context.resume, context.jobInfo, enhancedOptions);
      cachePrompt(cacheKey, prompt, version, tokenCount);
    }
  }

  return prompt;
}

/**
 * Build modify prompt from template
 * 
 * @overload
 * Basic usage with PromptContext
 */
export function buildModifyPrompt(
  context: PromptContext,
  options?: PromptBuilderOptions
): string;

/**
 * @overload
 * Enhanced usage with Resume, ParsedJobDescription, and ReviewResult
 */
export function buildModifyPrompt(
  resume: Resume,
  jobInfo: ParsedJobDescription,
  reviewResult: ReviewResult,
  options?: EnhancedPromptBuilderOptions
): string;

/**
 * Implementation
 */
export function buildModifyPrompt(
  contextOrResume: PromptContext | Resume,
  optionsOrJobInfo?: PromptBuilderOptions | ParsedJobDescription,
  reviewResultOrOptions?: ReviewResult | EnhancedPromptBuilderOptions,
  options?: EnhancedPromptBuilderOptions
): string {
  // Determine which overload is being used
  let context: PromptContext;
  let enhancedOptions: EnhancedPromptBuilderOptions = {};

  if ('resume' in contextOrResume && 'jobInfo' in contextOrResume) {
    // First overload: PromptContext
    context = contextOrResume as PromptContext;
    enhancedOptions = (optionsOrJobInfo as PromptBuilderOptions) || {};
  } else {
    // Second overload: Resume + ParsedJobDescription + ReviewResult
    context = {
      resume: contextOrResume as Resume,
      jobInfo: optionsOrJobInfo as ParsedJobDescription,
      reviewResult: reviewResultOrOptions as ReviewResult,
      options: (options as Record<string, unknown>) || {},
    };
    enhancedOptions = options || {};
  }

  const {
    useCache = false, // Default to false for backward compatibility
    validate = false,
    maxTokens,
    tone = 'professional',
    focusAreas,
    version = PROMPT_VERSION,
    ...baseOptions
  } = enhancedOptions;

  // Check cache (only if enhanced options are used)
  if (useCache) {
    const cacheKey = generateCacheKey('modify', context.resume, context.jobInfo, enhancedOptions, context.reviewResult);
    const cached = promptCache.get(cacheKey);
    if (cached && isCacheValid(cached, version)) {
      logger.debug('Using cached modify prompt');
      return cached.prompt;
    }
  }

  // Build base prompt
  let prompt = buildModifyPromptBase(context, baseOptions);

  // Apply enhanced features if requested
  if (useCache || validate || maxTokens || tone !== 'professional' || focusAreas) {
    // Apply tone adjustments
    prompt = applyTone(prompt, tone);

    // Apply focus area filtering
    if (focusAreas) {
      prompt = filterFocusAreas(prompt, focusAreas);
    }

    // Validate if requested
    if (validate) {
      const validation = validatePrompt(prompt, 'modify');
      if (!validation.valid) {
        logger.warn('Prompt validation failed:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        logger.warn('Prompt validation warnings:', validation.warnings);
      }
    }

    // Check token limits
    const tokenCount = estimatePromptTokens(prompt);
    if (maxTokens && tokenCount > maxTokens) {
      logger.warn(`Prompt tokens (${tokenCount}) exceed max (${maxTokens}), truncating`);
      prompt = truncatePrompt(prompt, maxTokens);
    }

    // Cache result
    if (useCache) {
      const cacheKey = generateCacheKey('modify', context.resume, context.jobInfo, enhancedOptions, context.reviewResult);
      cachePrompt(cacheKey, prompt, version, tokenCount);
    }
  }

  return prompt;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compress prompt by removing unnecessary whitespace and formatting
 */
function compressPrompt(prompt: string): string {
  // Remove extra blank lines
  let compressed = prompt.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace from lines
  compressed = compressed.split('\n').map(line => line.trim()).join('\n');
  
  return compressed;
}

/**
 * Estimate token count for prompt
 * Rough estimation: 1 token ≈ 4 characters
 */
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}

/**
 * Truncate prompt if it exceeds max tokens
 */
export function truncatePrompt(prompt: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (prompt.length <= maxChars) {
    return prompt;
  }

  logger.warn(`Truncating prompt from ${prompt.length} chars to ${maxChars} chars`);
  
  // Try to truncate at a sentence boundary
  const truncated = prompt.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxChars * 0.8) {
    return truncated.substring(0, cutPoint + 1) + '\n\n[Content truncated due to length limit]';
  }
  
  return truncated + '\n\n[Content truncated due to length limit]';
}

/**
 * Validate prompt structure and content
 */
export function validatePrompt(
  prompt: string,
  type: 'review' | 'modify'
): PromptValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = {
    systemMessage: false,
    context: false,
    taskDescription: false,
    outputFormat: false,
  };

  // Check for required sections
  if (prompt.includes('You are an expert') || prompt.includes('System:')) {
    sections.systemMessage = true;
  } else {
    errors.push('Missing system message');
  }

  if (prompt.includes('CONTEXT') || prompt.includes('RESUME') || prompt.includes('JOB REQUIREMENTS')) {
    sections.context = true;
  } else {
    errors.push('Missing context section');
  }

  if (prompt.includes('Analyze') || prompt.includes('Enhance') || prompt.includes('Task:')) {
    sections.taskDescription = true;
  } else {
    errors.push('Missing task description');
  }

  if (prompt.includes('OUTPUT FORMAT') || prompt.includes('JSON')) {
    sections.outputFormat = true;
  } else {
    errors.push('Missing output format specification');
  }

  // Type-specific checks
  if (type === 'modify') {
    if (!prompt.includes('REVIEW FINDINGS') && !prompt.includes('reviewResult')) {
      errors.push('Modify prompt missing review findings');
    }
    if (!prompt.includes('CRITICAL RULES') && !prompt.includes('NEVER')) {
      warnings.push('Modify prompt missing truthfulness rules');
    }
  }

  // Check token count
  const tokenCount = estimatePromptTokens(prompt);
  if (tokenCount > 100000) {
    warnings.push(`Very large prompt (${tokenCount} tokens), may exceed model limits`);
  }

  // Check for empty sections
  if (prompt.length < 100) {
    errors.push('Prompt is too short, may be incomplete');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tokenCount,
    sections,
  };
}

/**
 * Apply tone adjustments to prompt
 */
function applyTone(prompt: string, tone: PromptTone): string {
  switch (tone) {
    case 'concise':
      // Remove extra explanations, keep it brief
      return prompt
        .replace(/\n{3,}/g, '\n\n')
        .replace(/##\s+EXAMPLES[\s\S]*?(?=##|$)/g, ''); // Remove examples for concise tone

    case 'detailed':
      // Add more context and explanations
      if (!prompt.includes('Please provide detailed')) {
        const taskDescIndex = prompt.indexOf('## OUTPUT FORMAT');
        if (taskDescIndex > 0) {
          const detailedNote = '\n\n**Note:** Please provide detailed analysis with specific examples and actionable recommendations.\n';
          return prompt.slice(0, taskDescIndex) + detailedNote + prompt.slice(taskDescIndex);
        }
      }
      return prompt;

    case 'friendly':
      // Use more conversational language
      return prompt.replace(/You are an expert/g, 'You are a friendly and helpful expert');

    case 'professional':
    default:
      // Keep as-is (already professional)
      return prompt;
  }
}

/**
 * Filter focus areas based on options
 */
function filterFocusAreas(prompt: string, filter: FocusAreaFilter): string {
  const focusSectionMatch = prompt.match(/## (ANALYSIS FOCUS|ENHANCEMENT FOCUS)\n([\s\S]*?)(?=\n##|$)/);
  if (!focusSectionMatch) {
    return prompt;
  }

  const focusSection = focusSectionMatch[0];
  const focusLines = focusSection.split('\n').filter(line => line.trim() && /^\d+\./.test(line.trim()));

  let filteredLines = focusLines;

  // Apply include filter
  if (filter.include && filter.include.length > 0) {
    filteredLines = filteredLines.filter(line => {
      const lowerLine = line.toLowerCase();
      return filter.include!.some(term => lowerLine.includes(term.toLowerCase()));
    });
  }

  // Apply exclude filter
  if (filter.exclude && filter.exclude.length > 0) {
    filteredLines = filteredLines.filter(line => {
      const lowerLine = line.toLowerCase();
      return !filter.exclude!.some(term => lowerLine.includes(term.toLowerCase()));
    });
  }

  // Apply max areas limit
  if (filter.maxAreas && filteredLines.length > filter.maxAreas) {
    filteredLines = filteredLines.slice(0, filter.maxAreas);
  }

  // Rebuild focus section
  const newFocusSection = focusSectionMatch[1] + '\n' + filteredLines.join('\n') + '\n';
  return prompt.replace(focusSectionMatch[0], newFocusSection);
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Generate cache key from inputs
 */
function generateCacheKey(
  type: 'review' | 'modify',
  resume: Resume,
  jobInfo: ParsedJobDescription,
  options: EnhancedPromptBuilderOptions,
  reviewResult?: ReviewResult
): string {
  const keyData = {
    type,
    resume: JSON.stringify(resume),
    jobInfo: JSON.stringify(jobInfo),
    options: JSON.stringify({
      mode: options.mode,
      tone: options.tone,
      includeExamples: options.includeExamples,
    }),
    reviewResult: reviewResult ? JSON.stringify(reviewResult) : undefined,
    version: options.version || PROMPT_VERSION,
  };

  const keyString = JSON.stringify(keyData);
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Check if cache entry is valid
 */
function isCacheValid(entry: PromptCacheEntry, version: string): boolean {
  const now = Date.now();
  const age = now - entry.timestamp;

  // Check TTL
  if (age > CACHE_TTL) {
    return false;
  }

  // Check version
  if (entry.version !== version) {
    return false;
  }

  return true;
}

/**
 * Cache a prompt
 */
function cachePrompt(
  key: string,
  prompt: string,
  version: string,
  tokenCount: number
): void {
  // Evict old entries if cache is full
  if (promptCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(promptCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldestKey) {
      promptCache.delete(oldestKey);
    }
  }

  promptCache.set(key, {
    prompt,
    timestamp: Date.now(),
    version,
    tokenCount,
  });
}

/**
 * Clear prompt cache
 */
export function clearPromptCache(): void {
  promptCache.clear();
  logger.info('Prompt cache cleared');
}

/**
 * Get cache statistics
 */
export function getPromptCacheStats(): {
  size: number;
  maxSize: number;
  entries: Array<{ key: string; age: number; tokens: number }>;
} {
  const now = Date.now();
  const entries = Array.from(promptCache.entries()).map(([key, entry]) => ({
    key,
    age: now - entry.timestamp,
    tokens: entry.tokenCount,
  }));

  return {
    size: promptCache.size,
    maxSize: MAX_CACHE_SIZE,
    entries,
  };
}

/**
 * Get current prompt version
 */
export function getPromptVersion(): string {
  return PROMPT_VERSION;
}
