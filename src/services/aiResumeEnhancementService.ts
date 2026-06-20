/**
 * AI Resume Enhancement Service
 * 
 * Main service that uses real AI models to enhance resumes using extracted job information.
 * Implements sequential two-step process: Review → Modify.
 */

import type {
  EnhancementResult,
  EnhancementOptions,
} from '@resume-types/enhancement.types';
import type { Resume } from '@resume-types/resume.types';
import type {
  ReviewResponse,
  AIResponse,
  ReviewResult,
  ResumeAIClient,
} from '@services/ai/enhancement.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import { parseJobDescription } from '@utils/jobParser';
import {
  flattenSkills,
} from '@services/ai/enhancementResultBuilder';
import {
  buildModifyRequest,
  buildReviewRequest,
} from '@services/ai/enhancementRequestBuilder';
import {
  parseModifyResponse,
  parseReviewResponse,
} from '@services/ai/enhancementResponseParser';
import { logger } from '@utils/logger';

export interface EnhanceResumeInput {
  resume: Resume;
  jobDescription: string;
  options?: EnhancementOptions;
  aiClient: ResumeAIClient;
}

export interface ReviewResumeInput {
  resume: Resume;
  jobDescription: string;
  options?: EnhancementOptions;
  aiClient: ResumeAIClient;
}

export interface ModifyResumeInput {
  resume: Resume;
  reviewResult: ReviewResult;
  parsedJob: ParsedJobDescription;
  options?: EnhancementOptions;
  aiClient: ResumeAIClient;
}

/**
 * Enhance resume based on job description.
 */
export async function enhanceResume(input: EnhanceResumeInput): Promise<EnhancementResult> {
  const { resume, jobDescription, options, aiClient } = input;

  logger.debug('Starting AI resume enhancement...');

  const parsedJob = parseJobDescription(jobDescription);
  logger.debug(`Parsed job description: ${parsedJob.keywords.length} keywords found`);

  const reviewResult = await reviewResume({
    resume,
    jobDescription,
    options,
    aiClient,
  });
  logger.debug(`Review complete. Found ${reviewResult.prioritizedActions.length} prioritized actions`);

  const enhancementResult = await modifyResume({
    resume,
    reviewResult,
    parsedJob,
    options,
    aiClient,
  });
  logger.debug(`Modification complete. Made ${enhancementResult.improvements.length} improvements`);

  return enhancementResult;
}

/**
 * Review resume against job requirements.
 */
export async function reviewResume(input: ReviewResumeInput): Promise<ReviewResult> {
  const { resume, jobDescription, options, aiClient } = input;

  logger.debug('Starting review phase...');

  const parsedJob = parseJobDescription(jobDescription);
  const reviewRequest = buildReviewRequest({
    resume,
    jobInfo: parsedJob,
    options,
  });

  try {
    const reviewResponse: ReviewResponse = await aiClient.reviewResume(reviewRequest);
    const reviewResult = parseReviewResponse(reviewResponse);

    logger.debug(`Review phase complete. Confidence: ${reviewResult.confidence}`);
    return reviewResult;
  } catch (error) {
    logger.error(`Review phase failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Modify resume based on review findings.
 */
export async function modifyResume(input: ModifyResumeInput): Promise<EnhancementResult> {
  const { resume, reviewResult, parsedJob, options, aiClient } = input;

  logger.debug('Starting modification phase...');

  const modifyRequest = buildModifyRequest({
    resume,
    jobInfo: parsedJob,
    reviewResult,
    options,
  });

  try {
    const aiResponse: AIResponse = await aiClient.modifyResume(modifyRequest);
    const enhancementResult = parseModifyResponse(resume, aiResponse, parsedJob);

    logger.debug('Modification phase complete. Enhanced resume generated');
    return enhancementResult;
  } catch (error) {
    logger.error(`Modification phase failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// ============================================================================
// Natural Language Enhancement Logic
// ============================================================================

  /**
   * Build enhancement context from resume and job info
   * 
   * Identifies relevant sections and enhancement opportunities for natural language processing.
   * 
   * @param resume - Original resume
   * @param jobInfo - Parsed job description
   * @returns Enhancement context with relevant sections and opportunities
   */
export function buildEnhancementContext(
  resume: Resume,
  jobInfo: ParsedJobDescription
): {
    resume: Resume;
    jobInfo: ParsedJobDescription;
    relevantSections: {
      experience: Array<{ index: number; relevance: number; keywords: string[] }>;
      skills: { relevance: number; missing: string[] };
      summary: { relevance: number; keywords: string[] };
    };
    opportunities: Array<{
      type: 'bulletPoint' | 'skill' | 'summary';
      section: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
} {
    const context: {
      resume: Resume;
      jobInfo: ParsedJobDescription;
      relevantSections: {
        experience: Array<{ index: number; relevance: number; keywords: string[] }>;
        skills: { relevance: number; missing: string[] };
        summary: { relevance: number; keywords: string[] };
      };
      opportunities: Array<{
        type: 'bulletPoint' | 'skill' | 'summary';
        section: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }>;
    } = {
      resume,
      jobInfo,
      relevantSections: {
        experience: [],
        skills: { relevance: 0, missing: [] },
        summary: { relevance: 0, keywords: [] },
      },
      opportunities: [],
    };

    // Analyze experience sections
    if (resume.experience) {
      for (let i = 0; i < resume.experience.length; i++) {
        const exp = resume.experience[i];
        if (!exp) continue;

        const bulletText = exp.bulletPoints.join(' ').toLowerCase();
        const matchingKeywords: string[] = [];
        let relevanceScore = 0;

        // Check keyword matches
        for (const keyword of jobInfo.keywords) {
          const keywordLower = keyword.toLowerCase();
          if (bulletText.includes(keywordLower)) {
            matchingKeywords.push(keyword);
            relevanceScore += 2;
          } else if (isKeywordRelevant(keyword, bulletText)) {
            relevanceScore += 1;
          }
        }

        // Check required skills
        for (const skill of jobInfo.requiredSkills) {
          if (bulletText.includes(skill.toLowerCase())) {
            relevanceScore += 3;
          }
        }

        context.relevantSections.experience.push({
          index: i,
          relevance: relevanceScore,
          keywords: matchingKeywords,
        });

        // Identify enhancement opportunities
        if (relevanceScore < 5 && jobInfo.keywords.length > 0) {
          context.opportunities.push({
            type: 'bulletPoint',
            section: `experience[${i}]`,
            reason: 'Low keyword relevance - can naturally incorporate job-relevant terms',
            priority: relevanceScore < 2 ? 'high' : 'medium',
          });
        }
      }
    }

    // Analyze skills
    const resumeSkills = flattenSkills(resume.skills);
    const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
    
    const missingSkills: string[] = [];
    let skillsRelevance = 0;

    for (const requiredSkill of jobInfo.requiredSkills) {
      const skillLower = requiredSkill.toLowerCase();
      if (resumeSkillsLower.some(rs => rs.includes(skillLower) || skillLower.includes(rs))) {
        skillsRelevance += 3;
      } else {
        missingSkills.push(requiredSkill);
      }
    }

    for (const keyword of jobInfo.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (resumeSkillsLower.some(rs => rs.includes(keywordLower))) {
        skillsRelevance += 1;
      }
    }

    context.relevantSections.skills = {
      relevance: skillsRelevance,
      missing: missingSkills,
    };

    if (missingSkills.length > 0) {
      context.opportunities.push({
        type: 'skill',
        section: 'skills',
        reason: `Missing required skills: ${missingSkills.join(', ')}`,
        priority: 'high',
      });
    }

    // Analyze summary
    if (resume.summary) {
      const summaryLower = resume.summary.toLowerCase();
      const summaryKeywords: string[] = [];
      let summaryRelevance = 0;

      for (const keyword of jobInfo.keywords) {
        if (summaryLower.includes(keyword.toLowerCase())) {
          summaryKeywords.push(keyword);
          summaryRelevance += 2;
        }
      }

      context.relevantSections.summary = {
        relevance: summaryRelevance,
        keywords: summaryKeywords,
      };

      if (summaryRelevance < jobInfo.keywords.length * 0.3) {
        context.opportunities.push({
          type: 'summary',
          section: 'summary',
          reason: 'Summary can better align with job requirements',
          priority: 'medium',
        });
      }
    }

    return context;
  }

  /**
   * Check if keyword is relevant to a text snippet
   */
function isKeywordRelevant(keyword: string, text: string): boolean {
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();

    // Direct match
    if (textLower.includes(keywordLower)) {
      return true;
    }

    // Related technology/skill patterns
    const relatedPatterns: Record<string, string[]> = {
      'react': ['javascript', 'frontend', 'ui', 'component'],
      'typescript': ['javascript', 'types', 'compiler'],
      'node.js': ['javascript', 'backend', 'server'],
      'python': ['scripting', 'data', 'automation'],
      'aws': ['cloud', 'infrastructure', 'deployment'],
      'docker': ['container', 'deployment', 'devops'],
    };

    const patterns = relatedPatterns[keywordLower];
    if (patterns) {
      return patterns.some(pattern => textLower.includes(pattern));
    }

    return false;
  }

  /**
   * Enhance bullet points naturally with job keywords
   * 
   * Provides guidance for natural keyword integration while preserving meaning.
   * This is used for validation and context building, not direct modification.
   * 
   * @param bullets - Original bullet points
   * @param jobInfo - Parsed job description
   * @returns Enhanced bullet points (for validation/guidance)
   */
export function enhanceBulletPoints(
  bullets: string[],
  jobInfo: ParsedJobDescription
): string[] {
    const enhanced: string[] = [];

    for (const bullet of bullets) {
      if (!bullet) {
        enhanced.push('');
        continue;
      }

      let enhancedBullet = bullet;
      const bulletLower = bullet.toLowerCase();

      // Find relevant keywords that aren't already present
      const relevantKeywords = jobInfo.keywords.filter(keyword => {
        const keywordLower = keyword.toLowerCase();
        return !bulletLower.includes(keywordLower) && isKeywordRelevant(keyword, bullet);
      });

      // Natural enhancement suggestions (for validation, not direct modification)
      // The AI should do the actual enhancement, this is for guidance
      if (relevantKeywords.length > 0) {
        // Check if we can naturally incorporate the most relevant keyword
        const topKeyword = relevantKeywords[0];
        if (topKeyword && canNaturallyIncorporate(bullet, topKeyword)) {
          // This is a suggestion - actual enhancement should be done by AI
          // We're just validating that natural incorporation is possible
          enhancedBullet = bullet; // Keep original, AI will enhance
        }
      }

      enhanced.push(enhancedBullet);
    }

    return enhanced;
  }

  /**
   * Check if a keyword can be naturally incorporated into text
   */
function canNaturallyIncorporate(text: string, keyword: string): boolean {
    // Check if keyword fits naturally in the context
    const textLower = text.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    // Don't add if already present
    if (textLower.includes(keywordLower)) {
      return false;
    }

    // Check for natural insertion points
    const insertionPatterns = [
      /using\s+/i,           // "using React"
      /with\s+/i,            // "with TypeScript"
      /built\s+with\s+/i,    // "built with Node.js"
      /developed\s+using\s+/i, // "developed using Python"
      /implemented\s+with\s+/i, // "implemented with AWS"
    ];

    return insertionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Reorder skills to prioritize job-relevant ones
   * 
   * Maintains skill categories while prioritizing job-relevant skills.
   * 
   * @param skills - Original skills object
   * @param jobInfo - Parsed job description
   * @returns Reordered skills (for validation/guidance)
   */
export function reorderSkills(
  skills: Resume['skills'],
  jobInfo: ParsedJobDescription
): Resume['skills'] {
    if (!skills || typeof skills === 'string') {
      return skills; // File reference or undefined
    }

    if (!('categories' in skills) || !Array.isArray(skills.categories)) {
      return skills;
    }

    // Create a copy to avoid mutating original
    const reorderedSkills = JSON.parse(JSON.stringify(skills)) as typeof skills;

    // Reorder categories and items within categories
    for (const category of reorderedSkills.categories) {
      if (!category.items || !Array.isArray(category.items)) {
        continue;
      }

      // Score each skill based on job relevance
      const scoredSkills = category.items.map(skill => ({
        skill,
        score: calculateSkillRelevance(skill, jobInfo),
      }));

      // Sort by relevance (highest first)
      scoredSkills.sort((a, b) => b.score - a.score);

      // Update category with reordered skills
      category.items = scoredSkills.map(s => s.skill);
    }

    // Also reorder categories themselves by average relevance
    reorderedSkills.categories.sort((a, b) => {
      const aScore = calculateCategoryRelevance(a, jobInfo);
      const bScore = calculateCategoryRelevance(b, jobInfo);
      return bScore - aScore;
    });

    return reorderedSkills;
  }

  /**
   * Calculate skill relevance score
   */
function calculateSkillRelevance(skill: string, jobInfo: ParsedJobDescription): number {
    const skillLower = skill.toLowerCase();
    let score = 0;

    // Check required skills (highest priority)
    for (const required of jobInfo.requiredSkills) {
      if (skillLower.includes(required.toLowerCase()) || required.toLowerCase().includes(skillLower)) {
        score += 10;
      }
    }

    // Check preferred skills
    for (const preferred of jobInfo.preferredSkills) {
      if (skillLower.includes(preferred.toLowerCase()) || preferred.toLowerCase().includes(skillLower)) {
        score += 5;
      }
    }

    // Check keywords
    for (const keyword of jobInfo.keywords) {
      if (skillLower.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(skillLower)) {
        score += 2;
      }
    }

    return score;
  }

  /**
   * Calculate category relevance score
   */
function calculateCategoryRelevance(
  category: { name: string; items?: string[] },
  jobInfo: ParsedJobDescription
): number {
    if (!category.items || category.items.length === 0) {
      return 0;
    }

    const totalScore = category.items.reduce((sum, skill) => {
      return sum + calculateSkillRelevance(skill, jobInfo);
    }, 0);

    return totalScore / category.items.length;
  }

  /**
   * Enhance summary to align with job requirements naturally
   * 
   * Provides guidance for natural summary enhancement while maintaining professional tone.
   * 
   * @param summary - Original summary text
   * @param jobInfo - Parsed job description
   * @returns Enhanced summary (for validation/guidance)
   */
export function enhanceSummary(summary: string, jobInfo: ParsedJobDescription): string {
    if (!summary) {
      return '';
    }

    // This method provides validation/guidance
    // Actual enhancement should be done by AI based on prompts
    // We're checking if natural enhancement is possible

    const summaryLower = summary.toLowerCase();
    const missingKeywords: string[] = [];

    // Identify missing high-priority keywords
    for (const keyword of jobInfo.keywords.slice(0, 5)) {
      if (!summaryLower.includes(keyword.toLowerCase())) {
        missingKeywords.push(keyword);
      }
    }

    // If many keywords are missing, suggest enhancement
    // But don't modify directly - let AI do it naturally
    if (missingKeywords.length > 0) {
      // Return original - AI will enhance based on prompts
      return summary;
    }

    return summary;
  }

  /**
   * Verify that meaning is maintained in enhanced content
   * 
   * @param original - Original text
   * @param enhanced - Enhanced text
   * @returns True if meaning is preserved, false otherwise
   */
export function verifyMeaningPreserved(original: string, enhanced: string): boolean {
    if (!original || !enhanced) {
      return false;
    }

    // Check that key information is preserved
    const originalLower = original.toLowerCase();
    const enhancedLower = enhanced.toLowerCase();

    // Extract key terms (nouns, numbers, action verbs)
    const originalTerms = extractKeyTerms(originalLower);
    const enhancedTerms = extractKeyTerms(enhancedLower);

    // At least 70% of key terms should be preserved
    const preservedTerms = originalTerms.filter(term => enhancedTerms.includes(term));
    const preservationRatio = preservedTerms.length / originalTerms.length;

    return preservationRatio >= 0.7;
  }

  /**
   * Extract key terms from text
   */
function extractKeyTerms(text: string): string[] {
    // Extract numbers, technical terms, and important nouns
    const terms: string[] = [];

    // Numbers (metrics, years, etc.)
    const numbers = text.match(/\d+/g);
    if (numbers) {
      terms.push(...numbers);
    }

    // Technical terms (capitalized words, common tech terms)
    const techTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (techTerms) {
      terms.push(...techTerms.map(t => t.toLowerCase()));
    }

    // Action verbs (common resume verbs)
    const actionVerbs = ['led', 'built', 'developed', 'implemented', 'managed', 'created', 'designed'];
    for (const verb of actionVerbs) {
      if (text.includes(verb)) {
        terms.push(verb);
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Check for over-modification
   * 
   * @param original - Original text
   * @param enhanced - Enhanced text
   * @returns True if modification is reasonable, false if over-modified
   */
export function checkOverModification(original: string, enhanced: string): boolean {
    if (!original || !enhanced) {
      return false;
    }

    // Calculate similarity ratio
    const similarity = calculateSimilarity(original, enhanced);

    // If less than 30% similar, might be over-modified
    return similarity >= 0.3;
  }

  /**
   * Calculate text similarity (simple word overlap)
   */
function calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w: string) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Validate natural language flow
   * 
   * @param text - Text to validate
   * @returns True if text flows naturally, false otherwise
   */
export function validateNaturalLanguageFlow(text: string): boolean {
    if (!text) {
      return false;
    }

    // Check for mechanical patterns (keyword stuffing)
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Check for excessive repetition (potential keyword stuffing)
    for (const [word, count] of wordCounts.entries()) {
      if (count > words.length * 0.2 && word.length > 3) {
        // A single word appears more than 20% of the time
        return false;
      }
    }

    // Check for natural sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      return false;
    }

    // Check average sentence length (should be reasonable)
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    if (avgLength < 10 || avgLength > 200) {
      return false; // Too short or too long
    }

    return true;
  }
