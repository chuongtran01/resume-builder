/**
 * Prompt Builder
 *
 * Utility for building system and caller prompts from Markdown templates with
 * variable substitution, context management, caching, validation, and enhanced
 * prompt options.
 */

import type {
  PromptContext,
  PromptBuilderOptions,
} from './types';
import type { Resume } from '@resume-types/resume.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import type { ReviewResult } from '@services/ai/enhancement.types';
import { loadPromptTemplateText, renderPromptTemplate } from './templateLoader';
import { logger } from '@utils/logger';
import * as crypto from 'crypto';

/**
 * Prompt version
 */
const PROMPT_VERSION = '1.0.0';

export interface PromptMessages {
  system: string;
  prompt: string;
}

/**
 * Prompt cache entry
 */
interface PromptCacheEntry {
  messages: PromptMessages;
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
 * Build review prompt messages from templates (base implementation)
 */
function buildReviewPromptMessagesBase(
  context: PromptContext
): PromptMessages {
  const systemTemplate = loadPromptTemplateText('review.system.md');
  const promptTemplate = loadPromptTemplateText('review.prompt.md');

  return {
    system: `${systemTemplate}\n`,
    prompt: `${renderPromptTemplate(promptTemplate, {
      resumeJson: JSON.stringify(context.resume, null, 2),
      jobInfoJson: JSON.stringify(context.jobInfo, null, 2),
    })}\n`,
  };
}

/**
 * Build modify prompt messages from templates (base implementation)
 */
function buildModifyPromptMessagesBase(
  context: PromptContext
): PromptMessages {
  if (!context.reviewResult) {
    throw new Error('Review result is required for modify prompt');
  }

  const systemTemplate = loadPromptTemplateText('modify.system.md');
  const promptTemplate = loadPromptTemplateText('modify.prompt.md');

  return {
    system: `${systemTemplate}\n`,
    prompt: `${renderPromptTemplate(promptTemplate, {
      resumeJson: JSON.stringify(context.resume, null, 2),
      jobInfoJson: JSON.stringify(context.jobInfo, null, 2),
      reviewResultJson: JSON.stringify(context.reviewResult, null, 2),
    })}\n`,
  };
}

// ============================================================================
// Public API: Function Overloads
// ============================================================================

/**
 * Build review prompt messages from templates
 *
 * @overload
 * Basic usage with PromptContext
 */
export function buildReviewPromptMessages(
  context: PromptContext,
  options?: PromptBuilderOptions
): PromptMessages;

/**
 * @overload
 * Enhanced usage with Resume and ParsedJobDescription
 */
export function buildReviewPromptMessages(
  resume: Resume,
  jobInfo: ParsedJobDescription,
  options?: EnhancedPromptBuilderOptions
): PromptMessages;

/**
 * Implementation
 */
export function buildReviewPromptMessages(
  contextOrResume: PromptContext | Resume,
  optionsOrJobInfo?: PromptBuilderOptions | ParsedJobDescription | EnhancedPromptBuilderOptions,
  options?: EnhancedPromptBuilderOptions
): PromptMessages {
  let context: PromptContext;
  let enhancedOptions: EnhancedPromptBuilderOptions = {};

  if ('resume' in contextOrResume && 'jobInfo' in contextOrResume) {
    context = contextOrResume as PromptContext;
    enhancedOptions = (optionsOrJobInfo as PromptBuilderOptions) || {};
  } else {
    context = {
      resume: contextOrResume as Resume,
      jobInfo: optionsOrJobInfo as ParsedJobDescription,
      options: (options as Record<string, unknown>) || {},
    };
    enhancedOptions = options || {};
  }

  const {
    useCache = false,
    validate = false,
    tone = 'professional',
    focusAreas,
    version = PROMPT_VERSION,
  } = enhancedOptions;

  if (useCache) {
    const cacheKey = generateCacheKey('review', context.resume, context.jobInfo, enhancedOptions);
    const cached = promptCache.get(cacheKey);
    if (cached && isCacheValid(cached, version)) {
      logger.debug('Using cached review prompt');
      return cached.messages;
    }
  }

  let messages = buildReviewPromptMessagesBase(context);

  if (useCache || validate || tone !== 'professional' || focusAreas) {
    messages = applyMessageTone(messages, tone);

    if (focusAreas) {
      messages = {
        ...messages,
        system: filterFocusAreas(messages.system, focusAreas),
      };
    }

    const combinedPrompt = combinePromptMessages(messages);

    if (validate) {
      const validation = validatePrompt(combinedPrompt, 'review');
      if (!validation.valid) {
        logger.warn('Prompt validation failed:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        logger.warn('Prompt validation warnings:', validation.warnings);
      }
    }

    const tokenCount = estimatePromptTokens(combinedPrompt);

    if (useCache) {
      const cacheKey = generateCacheKey('review', context.resume, context.jobInfo, enhancedOptions);
      cachePrompt(cacheKey, messages, version, tokenCount);
    }
  }

  return messages;
}

/**
 * Build modify prompt messages from templates
 *
 * @overload
 * Basic usage with PromptContext
 */
export function buildModifyPromptMessages(
  context: PromptContext,
  options?: PromptBuilderOptions
): PromptMessages;

/**
 * @overload
 * Enhanced usage with Resume, ParsedJobDescription, and ReviewResult
 */
export function buildModifyPromptMessages(
  resume: Resume,
  jobInfo: ParsedJobDescription,
  reviewResult: ReviewResult,
  options?: EnhancedPromptBuilderOptions
): PromptMessages;

/**
 * Implementation
 */
export function buildModifyPromptMessages(
  contextOrResume: PromptContext | Resume,
  optionsOrJobInfo?: PromptBuilderOptions | ParsedJobDescription,
  reviewResultOrOptions?: ReviewResult | EnhancedPromptBuilderOptions,
  options?: EnhancedPromptBuilderOptions
): PromptMessages {
  let context: PromptContext;
  let enhancedOptions: EnhancedPromptBuilderOptions = {};

  if ('resume' in contextOrResume && 'jobInfo' in contextOrResume) {
    context = contextOrResume as PromptContext;
    enhancedOptions = (optionsOrJobInfo as PromptBuilderOptions) || {};
  } else {
    context = {
      resume: contextOrResume as Resume,
      jobInfo: optionsOrJobInfo as ParsedJobDescription,
      reviewResult: reviewResultOrOptions as ReviewResult,
      options: (options as Record<string, unknown>) || {},
    };
    enhancedOptions = options || {};
  }

  const {
    useCache = false,
    validate = false,
    tone = 'professional',
    focusAreas,
    version = PROMPT_VERSION,
  } = enhancedOptions;

  if (useCache) {
    const cacheKey = generateCacheKey('modify', context.resume, context.jobInfo, enhancedOptions, context.reviewResult);
    const cached = promptCache.get(cacheKey);
    if (cached && isCacheValid(cached, version)) {
      logger.debug('Using cached modify prompt');
      return cached.messages;
    }
  }

  let messages = buildModifyPromptMessagesBase(context);

  if (useCache || validate || tone !== 'professional' || focusAreas) {
    messages = applyMessageTone(messages, tone);

    if (focusAreas) {
      messages = {
        ...messages,
        system: filterFocusAreas(messages.system, focusAreas),
      };
    }

    const combinedPrompt = combinePromptMessages(messages);

    if (validate) {
      const validation = validatePrompt(combinedPrompt, 'modify');
      if (!validation.valid) {
        logger.warn('Prompt validation failed:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        logger.warn('Prompt validation warnings:', validation.warnings);
      }
    }

    const tokenCount = estimatePromptTokens(combinedPrompt);

    if (useCache) {
      const cacheKey = generateCacheKey('modify', context.resume, context.jobInfo, enhancedOptions, context.reviewResult);
      cachePrompt(cacheKey, messages, version, tokenCount);
    }
  }

  return messages;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function combinePromptMessages(messages: PromptMessages): string {
  return `${messages.system}\n\n${messages.prompt}`;
}

/**
 * Estimate token count for prompt
 * Rough estimation: 1 token ≈ 4 characters
 */
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
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

  if (type === 'modify') {
    if (!prompt.includes('REVIEW FINDINGS') && !prompt.includes('reviewResult')) {
      errors.push('Modify prompt missing review findings');
    }
    if (!prompt.includes('CRITICAL RULES') && !prompt.includes('NEVER')) {
      warnings.push('Modify prompt missing truthfulness rules');
    }
  }

  const tokenCount = estimatePromptTokens(prompt);
  if (tokenCount > 100000) {
    warnings.push(`Very large prompt (${tokenCount} tokens), may exceed model limits`);
  }

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
 * Apply tone adjustments to system instructions
 */
function applyMessageTone(messages: PromptMessages, tone: PromptTone): PromptMessages {
  return {
    ...messages,
    system: applyTone(messages.system, tone),
  };
}

function applyTone(prompt: string, tone: PromptTone): string {
  switch (tone) {
    case 'concise':
      return prompt
        .replace(/\n{3,}/g, '\n\n')
        .replace(/##\s+EXAMPLES[\s\S]*?(?=##|$)/g, '');

    case 'detailed':
      if (!prompt.includes('Please provide detailed')) {
        const taskDescIndex = prompt.indexOf('## OUTPUT FORMAT');
        if (taskDescIndex > 0) {
          const detailedNote = '\n\n**Note:** Please provide detailed analysis with specific examples and actionable recommendations.\n';
          return prompt.slice(0, taskDescIndex) + detailedNote + prompt.slice(taskDescIndex);
        }
      }
      return prompt;

    case 'friendly':
      return prompt.replace(/You are an expert/g, 'You are a friendly and helpful expert');

    case 'professional':
    default:
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

  if (filter.include && filter.include.length > 0) {
    filteredLines = filteredLines.filter(line => {
      const lowerLine = line.toLowerCase();
      return filter.include!.some(term => lowerLine.includes(term.toLowerCase()));
    });
  }

  if (filter.exclude && filter.exclude.length > 0) {
    filteredLines = filteredLines.filter(line => {
      const lowerLine = line.toLowerCase();
      return !filter.exclude!.some(term => lowerLine.includes(term.toLowerCase()));
    });
  }

  if (filter.maxAreas && filteredLines.length > filter.maxAreas) {
    filteredLines = filteredLines.slice(0, filter.maxAreas);
  }

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
      tone: options.tone,
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

  if (age > CACHE_TTL) {
    return false;
  }

  if (entry.version !== version) {
    return false;
  }

  return true;
}

/**
 * Cache prompt messages
 */
function cachePrompt(
  key: string,
  messages: PromptMessages,
  version: string,
  tokenCount: number
): void {
  if (promptCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(promptCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldestKey) {
      promptCache.delete(oldestKey);
    }
  }

  promptCache.set(key, {
    messages,
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
