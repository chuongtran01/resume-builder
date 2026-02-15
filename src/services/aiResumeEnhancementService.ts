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
import { MockResumeEnhancementService } from '@services/resumeEnhancementService';
import { logger } from '@utils/logger';

/**
 * AI Resume Enhancement Service
 * 
 * Uses real AI models to enhance resumes through a sequential two-step process:
 * 1. Review: Analyze resume against job requirements
 * 2. Modify: Apply enhancements based on review findings
 */
export class AIResumeEnhancementService implements ResumeEnhancementService {
  private aiProvider: AIProvider | null;
  private fallbackService: MockResumeEnhancementService;
  private providerName: string | null;

  /**
   * Create AI Resume Enhancement Service
   * 
   * @param providerName - Name of AI provider to use (e.g., "gemini"). If not provided, uses default provider.
   * @param fallbackToMock - Whether to fallback to mock service on errors (default: true)
   */
  constructor(providerName?: string, private fallbackToMock: boolean = true) {
    this.providerName = providerName || null;
    this.fallbackService = new MockResumeEnhancementService();
    this.aiProvider = null;

    // Try to get the AI provider
    try {
      if (this.providerName) {
        const provider = getProvider(this.providerName);
        if (provider) {
          this.aiProvider = provider;
          logger.info(`Using AI provider: ${this.providerName}`);
        } else {
          throw new Error(`Provider "${this.providerName}" not found`);
        }
      } else {
        try {
          this.aiProvider = getDefaultProvider();
          const info = this.aiProvider.getProviderInfo();
          this.providerName = info.name;
          logger.info(`Using default AI provider: ${this.providerName}`);
        } catch (error) {
          throw new Error('No default provider available');
        }
      }
    } catch (error) {
      logger.warn(`Failed to initialize AI provider: ${error instanceof Error ? error.message : String(error)}`);
      if (!this.fallbackToMock) {
        throw error;
      }
      logger.info('Falling back to mock service');
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

    // If no AI provider available, fallback to mock service
    if (!this.aiProvider) {
      logger.warn('No AI provider available, using mock service');
      return this.fallbackService.enhanceResume(resume, jobDescription, options);
    }

    try {
      // Step 1: Review phase
      const reviewResult = await this.reviewResume(resume, jobDescription, options);
      logger.debug(`Review complete. Found ${reviewResult.prioritizedActions.length} prioritized actions`);

      // Step 2: Modify phase
      const enhancementResult = await this.modifyResume(resume, reviewResult, parsedJob, options);
      logger.debug(`Modification complete. Made ${enhancementResult.improvements.length} improvements`);

      return enhancementResult;
    } catch (error) {
      logger.error(`AI enhancement failed: ${error instanceof Error ? error.message : String(error)}`);
      
      if (this.fallbackToMock) {
        logger.warn('Falling back to mock service');
        return this.fallbackService.enhanceResume(resume, jobDescription, options);
      }
      
      throw error;
    }
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
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

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
    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

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

    const enhancedResume = response.enhancedResume;

    // Validate resume structure
    if (!enhancedResume || !enhancedResume.personalInfo || !enhancedResume.experience) {
      throw new Error('Invalid enhanced resume structure');
    }

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
}
