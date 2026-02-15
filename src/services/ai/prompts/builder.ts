/**
 * Prompt Builder
 * 
 * Utility for building prompts from templates with variable substitution,
 * context management, and optimization.
 */

import type {
  PromptContext,
  PromptBuilderOptions,
} from './types';
import { buildReviewPromptTemplate } from './review.template';
import { buildModifyPromptTemplate, getEnhancementAreasForMode } from './modify.template';
import { logger } from '@utils/logger';

/**
 * Build review prompt from template
 */
export function buildReviewPrompt(
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
 * Build modify prompt from template
 */
export function buildModifyPrompt(
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

/**
 * Compress prompt by removing unnecessary whitespace and formatting
 */
function compressPrompt(prompt: string): string {
  // Remove extra blank lines
  let compressed = prompt.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace from lines
  compressed = compressed.split('\n').map(line => line.trim()).join('\n');
  
  // Remove markdown formatting if needed (optional)
  // compressed = compressed.replace(/##\s+/g, '').replace(/###\s+/g, '');
  
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
