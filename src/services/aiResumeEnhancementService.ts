/**
 * AI Resume Enhancement Service
 * 
 * Main service that uses real AI models to enhance resumes using extracted job information.
 * Implements sequential two-step process: Review → Modify.
 */

import type {
  ResumeEnhancementService,
  EnhancementResult,
  EnhancementOptions,
  Improvement,
  KeywordSuggestion,
  AtsScore,
  ChangeDetail,
} from '@resume-types/enhancement.types';
import type { Resume } from '@resume-types/resume.types';
import type {
  AIProvider,
  ReviewRequest,
  ReviewResponse,
  AIRequest,
  AIResponse,
  ReviewResult,
} from '@services/ai/provider.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import { parseJobDescription } from '@utils/jobParser';
import { getProvider, getDefaultProvider } from '@services/ai/providerRegistry';
import { validateAtsCompliance } from '@services/atsValidator';
import { logger } from '@utils/logger';

/**
 * AI Resume Enhancement Service
 * 
 * Uses real AI models to enhance resumes through a sequential two-step process:
 * 1. Review: Analyze resume against job requirements
 * 2. Modify: Apply enhancements based on review findings
 */
export class AIResumeEnhancementService implements ResumeEnhancementService {
  private aiProvider: AIProvider;
  private providerName: string;

  /**
   * Create AI Resume Enhancement Service
   * 
   * @param providerName - Name of AI provider to use (e.g., "gemini"). If not provided, uses default provider.
   * @throws Error if AI provider cannot be initialized
   */
  constructor(providerName?: string) {
    this.providerName = providerName || '';

    // Get the AI provider
    if (this.providerName) {
      const provider = getProvider(this.providerName);
      if (!provider) {
        throw new Error(`Provider "${this.providerName}" not found`);
      }
      this.aiProvider = provider;
      logger.info(`Using AI provider: ${this.providerName}`);
    } else {
      const provider = getDefaultProvider();
      if (!provider) {
        throw new Error('No default AI provider available. Please configure an AI provider.');
      }
      this.aiProvider = provider;
      const info = this.aiProvider.getProviderInfo();
      this.providerName = info.name;
      logger.info(`Using default AI provider: ${this.providerName}`);
    }
  }

  /**
   * Enhance resume based on job description
   * 
   * Orchestrates the sequential two-step process:
   * 1. Review: Analyze resume against job requirements
   * 2. Modify: Apply enhancements based on review findings
   * 
   * @param resume - Original resume data
   * @param jobDescription - Job description to match against
   * @param options - Enhancement options
   * @returns Promise resolving to enhancement result
   */
  async enhanceResume(
    resume: Resume,
    jobDescription: string,
    options?: EnhancementOptions
  ): Promise<EnhancementResult> {
    logger.debug('Starting AI resume enhancement...');

    // Parse job description
    const parsedJob = parseJobDescription(jobDescription);
    logger.debug(`Parsed job description: ${parsedJob.keywords.length} keywords found`);

    // Step 1: Review phase
    const reviewResult = await this.reviewResume(resume, jobDescription, options);
    logger.debug(`Review complete. Found ${reviewResult.prioritizedActions.length} prioritized actions`);

    // Step 2: Modify phase
    const enhancementResult = await this.modifyResume(resume, reviewResult, parsedJob, options);
    logger.debug(`Modification complete. Made ${enhancementResult.improvements.length} improvements`);

    return enhancementResult;
  }

  /**
   * Review resume against job requirements (Step 1)
   * 
   * Analyzes the resume and identifies strengths, weaknesses, opportunities, and prioritized actions.
   * 
   * @param resume - Original resume data
   * @param jobDescription - Job description to match against
   * @param options - Enhancement options
   * @returns Promise resolving to review result
   */
  async reviewResume(
    resume: Resume,
    jobDescription: string,
    options?: EnhancementOptions
  ): Promise<ReviewResult> {
    logger.debug('Starting review phase...');

    // Parse job description
    const parsedJob = parseJobDescription(jobDescription);

    // Build review request
    const reviewRequest: ReviewRequest = {
      resume,
      jobInfo: parsedJob,
      options: options as Record<string, unknown> | undefined,
    };

    try {
      // Call AI provider for review
      const reviewResponse: ReviewResponse = await this.aiProvider.reviewResume(reviewRequest);
      
      // Parse and validate review response
      const reviewResult = this.parseReviewResponse(reviewResponse);
      
      logger.debug(`Review phase complete. Confidence: ${reviewResult.confidence}`);
      return reviewResult;
    } catch (error) {
      logger.error(`Review phase failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Modify resume based on review findings (Step 2)
   * 
   * Applies enhancements to the resume based on the review analysis.
   * 
   * @param resume - Original resume data
   * @param reviewResult - Review findings from Step 1
   * @param parsedJob - Parsed job description information
   * @param options - Enhancement options
   * @returns Promise resolving to enhancement result
   */
  async modifyResume(
    resume: Resume,
    reviewResult: ReviewResult,
    parsedJob: ParsedJobDescription,
    options?: EnhancementOptions
  ): Promise<EnhancementResult> {
    logger.debug('Starting modification phase...');

    // Build modification request
    const modifyRequest: AIRequest = {
      resume,
      jobInfo: parsedJob,
      reviewResult,
      options: options as Record<string, unknown> | undefined,
    };

    try {
      // Call AI provider for modification
      const aiResponse: AIResponse = await this.aiProvider.modifyResume(modifyRequest);
      
      // Parse and validate modification response
      const enhancementResult = this.parseModifyResponse(resume, aiResponse, parsedJob);
      
      logger.debug(`Modification phase complete. Enhanced resume generated`);
      return enhancementResult;
    } catch (error) {
      logger.error(`Modification phase failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Parse review response from AI provider
   * 
   * @param response - Review response from AI provider
   * @returns Parsed review result
   */
  private parseReviewResponse(response: ReviewResponse): ReviewResult {
    // Validate response structure
    if (!this.aiProvider || !this.aiProvider.validateResponse(response)) {
      throw new Error('Invalid review response structure');
    }

    const reviewResult = response.reviewResult;

    // Validate review result structure
    if (!reviewResult || !Array.isArray(reviewResult.strengths) || !Array.isArray(reviewResult.weaknesses)) {
      throw new Error('Invalid review result structure');
    }

    // Ensure all required fields are present
    return {
      strengths: reviewResult.strengths || [],
      weaknesses: reviewResult.weaknesses || [],
      opportunities: reviewResult.opportunities || [],
      prioritizedActions: reviewResult.prioritizedActions || [],
      confidence: reviewResult.confidence ?? 0.5,
      reasoning: reviewResult.reasoning,
    };
  }

  /**
   * Filter enhanced resume to only include sections that exist in the original resume
   * 
   * @param originalResume - Original resume
   * @param enhancedResume - Enhanced resume from AI
   * @returns Filtered enhanced resume with only original sections
   */
  private filterEnhancedResumeSections(
    originalResume: Resume,
    enhancedResume: Resume
  ): Resume {
    // Start with required fields
    const filtered: Resume = {
      personalInfo: enhancedResume.personalInfo, // Always required
      experience: enhancedResume.experience, // Always required
    };

    // Only include optional sections that exist in the original resume
    if ('summary' in originalResume && originalResume.summary !== undefined) {
      filtered.summary = enhancedResume.summary;
    }

    if ('education' in originalResume && originalResume.education !== undefined) {
      filtered.education = enhancedResume.education;
    }

    if ('skills' in originalResume && originalResume.skills !== undefined) {
      filtered.skills = enhancedResume.skills;
    }

    if ('projects' in originalResume && originalResume.projects !== undefined) {
      filtered.projects = enhancedResume.projects;
    }

    if ('certifications' in originalResume && originalResume.certifications !== undefined) {
      filtered.certifications = enhancedResume.certifications;
    }

    if ('languages' in originalResume && originalResume.languages !== undefined) {
      filtered.languages = enhancedResume.languages;
    }

    if ('awards' in originalResume && originalResume.awards !== undefined) {
      filtered.awards = enhancedResume.awards;
    }

    // Log if any sections were filtered out
    const originalSections = Object.keys(originalResume).filter(key => key !== 'personalInfo');
    const enhancedSections = Object.keys(enhancedResume).filter(key => key !== 'personalInfo');
    const filteredOut = enhancedSections.filter(section => !originalSections.includes(section));
    
    if (filteredOut.length > 0) {
      logger.warn(`Filtered out sections that were not in original resume: ${filteredOut.join(', ')}`);
    }

    return filtered;
  }

  /**
   * Parse modification response from AI provider
   * 
   * @param originalResume - Original resume before enhancement
   * @param response - AI response with enhanced resume
   * @param parsedJob - Parsed job description information
   * @returns Enhancement result with all metadata
   */
  private parseModifyResponse(
    originalResume: Resume,
    response: AIResponse,
    parsedJob: ParsedJobDescription
  ): EnhancementResult {
    // Validate response structure
    if (!this.aiProvider || !this.aiProvider.validateResponse(response)) {
      throw new Error('Invalid modification response structure');
    }

    let enhancedResume = response.enhancedResume;

    // Validate resume structure
    if (!enhancedResume || !enhancedResume.personalInfo || !enhancedResume.experience) {
      throw new Error('Invalid enhanced resume structure');
    }

    // Filter out sections that don't exist in the original resume
    enhancedResume = this.filterEnhancedResumeSections(originalResume, enhancedResume);

    // Track changes
    const changes = this.trackChanges(originalResume, enhancedResume);

    // Generate improvements from changes
    const improvements = this.generateImprovements(changes, response.improvements);

    // Generate keyword suggestions
    const keywordSuggestions = this.generateKeywordSuggestions(parsedJob, enhancedResume);

    // Identify missing skills
    const missingSkills = this.identifyMissingSkills(parsedJob.requiredSkills, enhancedResume);

    // Calculate ATS scores
    const atsScoreBefore = validateAtsCompliance(originalResume).score;
    const atsScoreAfter = validateAtsCompliance(enhancedResume).score;
    const atsScore: AtsScore = {
      before: atsScoreBefore,
      after: atsScoreAfter,
      improvement: atsScoreAfter - atsScoreBefore,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      originalResume,
      enhancedResume,
      parsedJob,
      missingSkills,
      response.reasoning
    );

    return {
      originalResume,
      enhancedResume,
      improvements,
      keywordSuggestions,
      missingSkills,
      atsScore,
      recommendations,
    };
  }

  /**
   * Track changes between original and enhanced resume
   * 
   * @param original - Original resume
   * @param enhanced - Enhanced resume
   * @returns Array of change details
   */
  private trackChanges(original: Resume, enhanced: Resume): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    // Track experience changes
    if (original.experience && enhanced.experience) {
      for (let i = 0; i < Math.max(original.experience.length, enhanced.experience.length); i++) {
        const origExp = original.experience[i];
        const enhExp = enhanced.experience[i];

        if (!origExp && enhExp) {
          // New experience added (should not happen, but track it)
          logger.warn(`New experience added at index ${i}: ${enhExp.company}`);
          continue;
        }

        if (origExp && !enhExp) {
          // Experience removed (should not happen, but track it)
          logger.warn(`Experience removed at index ${i}: ${origExp.company}`);
          continue;
        }

        if (origExp && enhExp) {
          // Compare bullet points
          const origBullets = origExp.bulletPoints || [];
          const enhBullets = enhExp.bulletPoints || [];

          for (let j = 0; j < Math.max(origBullets.length, enhBullets.length); j++) {
            const origBullet = origBullets[j];
            const enhBullet = enhBullets[j];

            if (origBullet !== enhBullet) {
              changes.push({
                old: origBullet || '',
                new: enhBullet || '',
                section: `experience[${i}].bulletPoints[${j}]`,
                type: 'bulletPoint',
              });
            }
          }

          // Compare role if changed
          if (origExp.role !== enhExp.role) {
            changes.push({
              old: origExp.role,
              new: enhExp.role || '',
              section: `experience[${i}].role`,
              type: 'bulletPoint',
            });
          }
        }
      }
    }

    // Track skills changes
    if (original.skills && enhanced.skills) {
      const origSkills = this.flattenSkills(original.skills);
      const enhSkills = this.flattenSkills(enhanced.skills);

      // Check for reordering or changes
      const origSkillsStr = origSkills.join(', ');
      const enhSkillsStr = enhSkills.join(', ');

      if (origSkillsStr !== enhSkillsStr) {
        // Skills were reordered or modified
        changes.push({
          old: origSkillsStr,
          new: enhSkillsStr,
          section: 'skills',
          type: 'skill',
        });
      }
    }

    // Track summary changes
    if (original.summary && enhanced.summary && original.summary !== enhanced.summary) {
      changes.push({
        old: original.summary,
        new: enhanced.summary,
        section: 'summary',
        type: 'summary',
      });
    }

    return changes;
  }

  /**
   * Flatten skills object into array of skill names
   */
  private flattenSkills(skills: Resume['skills']): string[] {
    if (!skills) return [];
    
    // Handle file references
    if (typeof skills === 'string' && skills.startsWith('file:')) {
      // File reference - can't flatten without loading the file
      // Return empty array for now
      return [];
    }
    
    // Handle Skills object with categories
    if (typeof skills === 'object' && skills !== null && 'categories' in skills) {
      const skillsObj = skills as { categories?: Array<{ items?: string[] }> };
      if (Array.isArray(skillsObj.categories)) {
        const allSkills: string[] = [];
        for (const category of skillsObj.categories) {
          if (category.items && Array.isArray(category.items)) {
            allSkills.push(...category.items);
          }
        }
        return allSkills;
      }
    }
    
    return [];
  }

  /**
   * Generate improvements list from changes and AI response
   * 
   * @param changes - Tracked changes
   * @param aiImprovements - Improvements from AI response
   * @returns Array of improvements
   */
  private generateImprovements(
    changes: ChangeDetail[],
    aiImprovements?: Improvement[]
  ): Improvement[] {
    const improvements: Improvement[] = [];

    // Use AI-provided improvements if available
    if (aiImprovements && aiImprovements.length > 0) {
      return aiImprovements;
    }

    // Otherwise, generate from changes
    for (const change of changes) {
      improvements.push({
        type: change.type || 'bulletPoint',
        section: change.section || 'unknown',
        original: change.old,
        suggested: change.new,
        reason: `Enhanced to better match job requirements`,
        confidence: 0.8,
      });
    }

    return improvements;
  }

  /**
   * Generate keyword suggestions based on job description
   * 
   * @param parsedJob - Parsed job description
   * @param enhancedResume - Enhanced resume
   * @returns Array of keyword suggestions
   */
  private generateKeywordSuggestions(
    parsedJob: ParsedJobDescription,
    enhancedResume: Resume
  ): KeywordSuggestion[] {
    const suggestions: KeywordSuggestion[] = [];

    for (const keyword of parsedJob.keywords) {
      // Check if keyword is already in resume
      const resumeText = JSON.stringify(enhancedResume).toLowerCase();
      const isPresent = resumeText.includes(keyword.toLowerCase());

      if (!isPresent) {
        suggestions.push({
          keyword,
          category: 'technical',
          suggestedPlacement: ['bulletPoints', 'summary'],
          importance: parsedJob.requiredSkills.includes(keyword) ? 'high' : 'medium',
        });
      }
    }

    return suggestions;
  }

  /**
   * Identify missing skills from job requirements
   * 
   * @param requiredSkills - Required skills from job description
   * @param resume - Resume to check
   * @returns Array of missing skill names
   */
  private identifyMissingSkills(requiredSkills: string[], resume: Resume): string[] {
    if (!requiredSkills || requiredSkills.length === 0) {
      return [];
    }

    const resumeSkills = this.flattenSkills(resume.skills);
    const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());

    return requiredSkills.filter(skill => {
      const skillLower = skill.toLowerCase();
      return !resumeSkillsLower.some(rs => rs.includes(skillLower) || skillLower.includes(rs));
    });
  }

  /**
   * Generate recommendations based on enhancement results
   * 
   * @param original - Original resume
   * @param enhanced - Enhanced resume
   * @param parsedJob - Parsed job description
   * @param missingSkills - Missing skills identified
   * @param aiReasoning - Reasoning from AI (if available)
   * @returns Array of recommendation strings
   */
  private generateRecommendations(
    original: Resume,
    enhanced: Resume,
    parsedJob: ParsedJobDescription,
    missingSkills: string[],
    aiReasoning?: string
  ): string[] {
    const recommendations: string[] = [];

    // Add AI reasoning if available
    if (aiReasoning) {
      recommendations.push(aiReasoning);
    }

    // Add missing skills recommendations
    if (missingSkills.length > 0) {
      recommendations.push(
        `Consider adding these skills to your resume: ${missingSkills.join(', ')}`
      );
    }

    // Add keyword recommendations
    const keywordSuggestions = this.generateKeywordSuggestions(parsedJob, enhanced);
    if (keywordSuggestions.length > 0) {
      const highPriorityKeywords = keywordSuggestions
        .filter(ks => ks.importance === 'high')
        .map(ks => ks.keyword);
      
      if (highPriorityKeywords.length > 0) {
        recommendations.push(
          `Incorporate these high-priority keywords: ${highPriorityKeywords.join(', ')}`
        );
      }
    }

    // Add ATS score recommendation
    const atsScoreBefore = validateAtsCompliance(original).score;
    const atsScoreAfter = validateAtsCompliance(enhanced).score;
    
    if (atsScoreAfter > atsScoreBefore) {
      recommendations.push(
        `ATS score improved from ${atsScoreBefore} to ${atsScoreAfter}`
      );
    } else if (atsScoreAfter < atsScoreBefore) {
      recommendations.push(
        `Warning: ATS score decreased from ${atsScoreBefore} to ${atsScoreAfter}. Review changes carefully.`
      );
    }

    return recommendations;
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
  buildEnhancementContext(
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
          } else if (this.isKeywordRelevant(keyword, bulletText)) {
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
    const resumeSkills = this.flattenSkills(resume.skills);
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
  private isKeywordRelevant(keyword: string, text: string): boolean {
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
  enhanceBulletPoints(
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
        return !bulletLower.includes(keywordLower) && this.isKeywordRelevant(keyword, bullet);
      });

      // Natural enhancement suggestions (for validation, not direct modification)
      // The AI should do the actual enhancement, this is for guidance
      if (relevantKeywords.length > 0) {
        // Check if we can naturally incorporate the most relevant keyword
        const topKeyword = relevantKeywords[0];
        if (topKeyword && this.canNaturallyIncorporate(bullet, topKeyword)) {
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
  private canNaturallyIncorporate(text: string, keyword: string): boolean {
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
  reorderSkills(
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
        score: this.calculateSkillRelevance(skill, jobInfo),
      }));

      // Sort by relevance (highest first)
      scoredSkills.sort((a, b) => b.score - a.score);

      // Update category with reordered skills
      category.items = scoredSkills.map(s => s.skill);
    }

    // Also reorder categories themselves by average relevance
    reorderedSkills.categories.sort((a, b) => {
      const aScore = this.calculateCategoryRelevance(a, jobInfo);
      const bScore = this.calculateCategoryRelevance(b, jobInfo);
      return bScore - aScore;
    });

    return reorderedSkills;
  }

  /**
   * Calculate skill relevance score
   */
  private calculateSkillRelevance(skill: string, jobInfo: ParsedJobDescription): number {
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
  private calculateCategoryRelevance(
    category: { name: string; items?: string[] },
    jobInfo: ParsedJobDescription
  ): number {
    if (!category.items || category.items.length === 0) {
      return 0;
    }

    const totalScore = category.items.reduce((sum, skill) => {
      return sum + this.calculateSkillRelevance(skill, jobInfo);
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
  enhanceSummary(summary: string, jobInfo: ParsedJobDescription): string {
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
  verifyMeaningPreserved(original: string, enhanced: string): boolean {
    if (!original || !enhanced) {
      return false;
    }

    // Check that key information is preserved
    const originalLower = original.toLowerCase();
    const enhancedLower = enhanced.toLowerCase();

    // Extract key terms (nouns, numbers, action verbs)
    const originalTerms = this.extractKeyTerms(originalLower);
    const enhancedTerms = this.extractKeyTerms(enhancedLower);

    // At least 70% of key terms should be preserved
    const preservedTerms = originalTerms.filter(term => enhancedTerms.includes(term));
    const preservationRatio = preservedTerms.length / originalTerms.length;

    return preservationRatio >= 0.7;
  }

  /**
   * Extract key terms from text
   */
  private extractKeyTerms(text: string): string[] {
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
  checkOverModification(original: string, enhanced: string): boolean {
    if (!original || !enhanced) {
      return false;
    }

    // Calculate similarity ratio
    const similarity = this.calculateSimilarity(original, enhanced);

    // If less than 30% similar, might be over-modified
    return similarity >= 0.3;
  }

  /**
   * Calculate text similarity (simple word overlap)
   */
  private calculateSimilarity(text1: string, text2: string): number {
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
  validateNaturalLanguageFlow(text: string): boolean {
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
}
