/**
 * Resume enhancement service (mock/rules-based implementation)
 * Enhances resumes based on job descriptions using pattern matching and keyword injection
 * This is a mock implementation that can be easily replaced with AI later
 */

import type {
  ResumeEnhancementService,
  EnhancementResult,
  EnhancementOptions,
  KeywordSuggestion,
  AtsScore,
  ChangeDetail,
} from '@resume-types/enhancement.types';
import type { Resume, Skills } from '@resume-types/resume.types';
import { parseJobDescription } from '@utils/jobParser';
import { validateAtsCompliance } from '@services/atsValidator';
import { logger } from '@utils/logger';

/**
 * Mock resume enhancement service implementation
 */
export class MockResumeEnhancementService implements ResumeEnhancementService {
  /**
   * Enhance resume based on job description
   */
  async enhanceResume(
    resume: Resume,
    jobDescription: string,
    options?: EnhancementOptions
  ): Promise<EnhancementResult> {
    logger.debug('Starting resume enhancement...');

    // Parse job description
    const parsedJob = parseJobDescription(jobDescription);
    logger.debug(`Parsed job description: ${parsedJob.keywords.length} keywords found`);

    // Create a deep copy of the resume for enhancement
    const enhancedResume = JSON.parse(JSON.stringify(resume)) as Resume;

    // Track all changes
    const allChanges: ChangeDetail[] = [];

    // Enhance bullet points
    if (enhancedResume.experience) {
      for (let i = 0; i < enhancedResume.experience.length; i++) {
        const experience = enhancedResume.experience[i];
        if (!experience) continue;
        
        const bulletChanges = this.rewriteBulletPoints(
          experience.bulletPoints,
          parsedJob.keywords,
          parsedJob.requiredSkills
        );
        
        // Apply changes
        experience.bulletPoints = bulletChanges.map(change => change.new);
        
        // Track changes
        bulletChanges.forEach(change => {
          allChanges.push({
            ...change,
            section: `experience[${i}]`,
            type: 'bulletPoint',
          });
        });
      }
    }

    // Reorder skills
    if (enhancedResume.skills && typeof enhancedResume.skills === 'object') {
      const skillChanges = this.reorderSkills(enhancedResume.skills, parsedJob.keywords);
      allChanges.push(...skillChanges);
    }

    // Enhance summary if present
    if (enhancedResume.summary && options?.focusAreas?.includes('summary')) {
      const summaryChange = this.enhanceSummary(enhancedResume.summary, parsedJob.keywords);
      if (summaryChange) {
        enhancedResume.summary = summaryChange.new;
        allChanges.push({
          ...summaryChange,
          section: 'summary',
          type: 'summary',
        });
      }
    }

    // Generate improvements list
    const improvements = allChanges.map(change => ({
      type: change.type || 'bulletPoint',
      section: change.section || 'unknown',
      original: change.old,
      suggested: change.new,
      reason: `Enhanced to better match job requirements and include relevant keywords`,
      confidence: 0.7, // Mock confidence score
    }));

    // Generate keyword suggestions
    const keywordSuggestions = this.generateKeywordSuggestions(
      parsedJob.keywords,
      resume,
      enhancedResume
    );

    // Identify missing skills
    const missingSkills = this.identifyMissingSkills(parsedJob.requiredSkills, resume);

    // Calculate ATS scores
    const atsScoreBefore = validateAtsCompliance(resume).score;
    const atsScoreAfter = validateAtsCompliance(enhancedResume).score;
    const atsScore: AtsScore = {
      before: atsScoreBefore,
      after: atsScoreAfter,
      improvement: atsScoreAfter - atsScoreBefore,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      resume,
      enhancedResume,
      parsedJob,
      missingSkills
    );

    logger.debug(`Enhancement complete. ${allChanges.length} changes made. ATS score: ${atsScoreBefore} → ${atsScoreAfter}`);

    return {
      originalResume: resume,
      enhancedResume,
      improvements,
      keywordSuggestions,
      missingSkills,
      atsScore,
      recommendations,
    };
  }

  /**
   * Rewrite bullet points to include keywords (truthfully)
   * Only modifies existing content, never adds new experiences
   */
  rewriteBulletPoints(
    bulletPoints: string[],
    keywords: string[],
    requiredSkills: string[]
  ): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    for (let i = 0; i < bulletPoints.length; i++) {
      const original = bulletPoints[i];
      if (!original) continue;
      
      let enhanced = original;

      // Find keywords that are relevant to this bullet point
      const relevantKeywords = keywords.filter(keyword => {
        const lowerBullet = original.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        // Check if keyword is related (not already present, but related tech/skill)
        return !lowerBullet.includes(lowerKeyword) && this.isKeywordRelevant(keyword, original);
      });

      // If we have relevant keywords, try to incorporate them naturally
      if (relevantKeywords.length > 0) {
        // Try to add the most important keyword naturally
        const topKeyword = relevantKeywords[0];
        if (topKeyword) {
          enhanced = this.injectKeyword(original, topKeyword);
        }
      }

      // Also check for required skills that might be missing
      for (const skill of requiredSkills.slice(0, 2)) {
        // Only add if it makes sense and doesn't change the meaning
        if (!enhanced.toLowerCase().includes(skill.toLowerCase()) && this.canAddSkill(enhanced, skill)) {
          enhanced = this.injectKeyword(enhanced, skill);
        }
      }

      // Only track if actually changed
      if (enhanced !== original && enhanced.length > 0) {
        changes.push({
          old: original,
          new: enhanced,
        });
      }
    }

    return changes;
  }

  /**
   * Check if a keyword is relevant to a bullet point
   */
  private isKeywordRelevant(keyword: string, bulletPoint: string): boolean {
    const lowerBullet = bulletPoint.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Check for related terms
    const relatedTerms: Record<string, string[]> = {
      'react': ['frontend', 'ui', 'component', 'javascript', 'typescript'],
      'node.js': ['backend', 'server', 'api', 'javascript'],
      'python': ['data', 'script', 'backend', 'api'],
      'aws': ['cloud', 'infrastructure', 'deploy', 'server'],
      'docker': ['container', 'deploy', 'infrastructure'],
      'kubernetes': ['container', 'orchestration', 'deploy'],
    };

    // Check if keyword category matches bullet point context
    for (const [key, terms] of Object.entries(relatedTerms)) {
      if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
        return terms.some(term => lowerBullet.includes(term));
      }
    }

    // Default: consider relevant if not already present
    return true;
  }

  /**
   * Inject a keyword into a bullet point naturally
   */
  private injectKeyword(bulletPoint: string, keyword: string): string {
    // Don't modify if keyword already present
    if (bulletPoint.toLowerCase().includes(keyword.toLowerCase())) {
      return bulletPoint;
    }

    // Try different injection strategies
    const strategies = [
      // Strategy 1: Add at the beginning with context
      () => {
        if (bulletPoint.match(/^(Built|Developed|Created|Implemented|Designed)/i)) {
          return bulletPoint.replace(/^(Built|Developed|Created|Implemented|Designed)/i, (match) => {
            return `${match} using ${keyword}`;
          });
        }
        return null;
      },
      // Strategy 2: Add before technology mentions
      () => {
        const techPattern = /\b(React|Vue|Angular|Node\.js|Python|Java|TypeScript|JavaScript)\b/i;
        if (techPattern.test(bulletPoint)) {
          return bulletPoint.replace(techPattern, `${keyword} and $&`);
        }
        return null;
      },
      // Strategy 3: Add in the middle if there's a comma
      () => {
        if (bulletPoint.includes(',')) {
          const parts = bulletPoint.split(',');
          if (parts.length >= 2) {
            parts[1] = ` ${keyword}${parts[1]}`;
            return parts.join(',');
          }
        }
        return null;
      },
      // Strategy 4: Add at the end if it makes sense
      () => {
        if (!bulletPoint.endsWith('.') && !bulletPoint.endsWith('!')) {
          return `${bulletPoint} using ${keyword}`;
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result && result !== bulletPoint && result.length < bulletPoint.length + 50) {
        return result;
      }
    }

    // Fallback: return original if no good injection point found
    return bulletPoint;
  }

  /**
   * Check if a skill can be added to a bullet point
   */
  private canAddSkill(bulletPoint: string, skill: string): boolean {
    // Don't add if already present
    if (bulletPoint.toLowerCase().includes(skill.toLowerCase())) {
      return false;
    }

    // Don't add if bullet point is too long
    if (bulletPoint.length > 120) {
      return false;
    }

    // Check if skill is technical and bullet point is technical
    const technicalSkills = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'];
    const isTechnical = technicalSkills.some(ts => skill.includes(ts));
    const hasTechnicalContext = /(built|developed|implemented|created|designed|architected)/i.test(bulletPoint);

    return isTechnical === hasTechnicalContext;
  }

  /**
   * Reorder skills to prioritize job-relevant ones
   */
  reorderSkills(skills: Skills, jobKeywords: string[]): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    if (!skills.categories || skills.categories.length === 0) {
      return changes;
    }

    // Reorder categories and items within categories
    for (const category of skills.categories) {
      if (!category.items || category.items.length === 0) {
        continue;
      }

      // Score each skill based on job relevance
      const scoredSkills = category.items.map(skill => ({
        skill,
        score: this.calculateSkillRelevance(skill, jobKeywords),
      }));

      // Sort by relevance (highest first)
      scoredSkills.sort((a, b) => b.score - a.score);

      const originalOrder = [...category.items];
      const newOrder = scoredSkills.map(s => s.skill);

      // Check if order changed
      if (JSON.stringify(originalOrder) !== JSON.stringify(newOrder)) {
        category.items = newOrder;

        // Track changes for skills that moved significantly
        originalOrder.forEach((skill, oldIndex) => {
          const newIndex = newOrder.indexOf(skill);
          if (newIndex !== oldIndex && Math.abs(newIndex - oldIndex) >= 2) {
            changes.push({
              old: `Position ${oldIndex + 1} in ${category.name}`,
              new: `Position ${newIndex + 1} in ${category.name}`,
              section: `skills.${category.name}`,
              type: 'skill',
            });
          }
        });
      }
    }

    // Also reorder categories themselves
    const scoredCategories = skills.categories.map(category => ({
      category,
      score: category.items?.reduce((sum, item) => sum + this.calculateSkillRelevance(item, jobKeywords), 0) || 0,
    }));

    scoredCategories.sort((a, b) => b.score - a.score);
    const originalCategoryOrder = skills.categories.map(c => c.name);
    const newCategoryOrder = scoredCategories.map(c => c.category.name);

    if (JSON.stringify(originalCategoryOrder) !== JSON.stringify(newCategoryOrder)) {
      skills.categories = scoredCategories.map(c => c.category);
      changes.push({
        old: `Category order: ${originalCategoryOrder.join(', ')}`,
        new: `Category order: ${newCategoryOrder.join(', ')}`,
        section: 'skills',
        type: 'skill',
      });
    }

    return changes;
  }

  /**
   * Calculate how relevant a skill is to the job
   */
  private calculateSkillRelevance(skill: string, jobKeywords: string[]): number {
    const lowerSkill = skill.toLowerCase();
    let score = 0;

    for (const keyword of jobKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Exact match
      if (lowerSkill === lowerKeyword) {
        score += 10;
      }
      // Contains match
      else if (lowerSkill.includes(lowerKeyword) || lowerKeyword.includes(lowerSkill)) {
        score += 5;
      }
      // Partial match (word boundary)
      else if (new RegExp(`\\b${lowerKeyword}\\b`).test(lowerSkill)) {
        score += 3;
      }
    }

    return score;
  }

  /**
   * Enhance summary to include keywords
   */
  private enhanceSummary(summary: string, keywords: string[]): ChangeDetail | null {
    let enhanced = summary;

    // Find the most relevant keyword not already in summary
    const relevantKeywords = keywords.filter(k => !summary.toLowerCase().includes(k.toLowerCase()));
    
    if (relevantKeywords.length === 0) {
      return null;
    }

    // Try to add the top keyword naturally
    const topKeyword = relevantKeywords[0];
    
    // Add at the end if there's room
    if (summary.length < 200) {
      enhanced = `${summary} Specialized in ${topKeyword} and related technologies.`;
    } else {
      // Try to replace a generic term
      enhanced = summary.replace(/\btechnologies\b/i, `${topKeyword} and other technologies`);
    }

    if (enhanced !== summary) {
      return {
        old: summary,
        new: enhanced,
      };
    }

    return null;
  }

  /**
   * Track changes between original and enhanced resume
   */
  trackChanges(original: Resume, enhanced: Resume): ChangeDetail[] {
    const changes: ChangeDetail[] = [];

    // Compare experience bullet points
    if (original.experience && enhanced.experience) {
      for (let i = 0; i < Math.min(original.experience.length, enhanced.experience.length); i++) {
        const origExp = original.experience[i];
        const enhExp = enhanced.experience[i];
        
        if (!origExp || !enhExp) continue;

        if (origExp.bulletPoints && enhExp.bulletPoints) {
          for (let j = 0; j < Math.min(origExp.bulletPoints.length, enhExp.bulletPoints.length); j++) {
            const origBullet = origExp.bulletPoints[j];
            const enhBullet = enhExp.bulletPoints[j];
            
            if (origBullet && enhBullet && origBullet !== enhBullet) {
              changes.push({
                old: origBullet,
                new: enhBullet,
                section: `experience[${i}].bulletPoints[${j}]`,
                type: 'bulletPoint',
              });
            }
          }
        }
      }
    }

    // Compare summary
    if (original.summary !== enhanced.summary) {
      changes.push({
        old: original.summary || '',
        new: enhanced.summary || '',
        section: 'summary',
        type: 'summary',
      });
    }

    return changes;
  }

  /**
   * Generate human-readable summary of changes
   */
  generateChangesSummary(changes: ChangeDetail[]): string {
    if (changes.length === 0) {
      return 'No changes were made to the resume.';
    }

    const bulletPointChanges = changes.filter(c => c.type === 'bulletPoint').length;
    const skillChanges = changes.filter(c => c.type === 'skill').length;
    const summaryChanges = changes.filter(c => c.type === 'summary').length;

    const parts: string[] = [];

    if (bulletPointChanges > 0) {
      parts.push(`${bulletPointChanges} bullet point${bulletPointChanges > 1 ? 's' : ''} ${bulletPointChanges > 1 ? 'were' : 'was'} enhanced`);
    }

    if (skillChanges > 0) {
      parts.push(`skills were reordered to prioritize job-relevant technologies`);
    }

    if (summaryChanges > 0) {
      parts.push(`summary was updated to include relevant keywords`);
    }

    return `Enhanced resume with ${changes.length} total change${changes.length > 1 ? 's' : ''}. ${parts.join(', ')}.`;
  }

  /**
   * Generate keyword suggestions
   */
  private generateKeywordSuggestions(
    jobKeywords: string[],
    _originalResume: Resume,
    enhancedResume: Resume
  ): KeywordSuggestion[] {
    const suggestions: KeywordSuggestion[] = [];

    // Find keywords that are in job description but not prominently in resume
    for (const keyword of jobKeywords.slice(0, 10)) {
      const keywordLower = keyword.toLowerCase();
      let foundInResume = false;

      // Check if keyword appears in resume
      const resumeText = JSON.stringify(enhancedResume).toLowerCase();
      if (resumeText.includes(keywordLower)) {
        foundInResume = true;
      }

      if (!foundInResume) {
        // Determine category
        const category = this.categorizeKeyword(keyword);
        
        // Determine importance
        let importance: 'high' | 'medium' | 'low' = 'medium';
        if (jobKeywords.indexOf(keyword) < 3) {
          importance = 'high';
        } else if (jobKeywords.indexOf(keyword) > 7) {
          importance = 'low';
        }

        suggestions.push({
          keyword,
          category,
          suggestedPlacement: ['summary', 'skills', 'experience'],
          importance,
        });
      }
    }

    return suggestions;
  }

  /**
   * Categorize a keyword
   */
  private categorizeKeyword(keyword: string): string {
    const lower = keyword.toLowerCase();

    if (['react', 'vue', 'angular', 'svelte'].some(k => lower.includes(k))) {
      return 'Frontend Framework';
    }
    if (['node.js', 'express', 'django', 'flask', 'spring'].some(k => lower.includes(k))) {
      return 'Backend Framework';
    }
    if (['aws', 'azure', 'gcp', 'docker', 'kubernetes'].some(k => lower.includes(k))) {
      return 'Cloud/DevOps';
    }
    if (['javascript', 'typescript', 'python', 'java', 'c++'].some(k => lower.includes(k))) {
      return 'Programming Language';
    }
    if (['postgresql', 'mysql', 'mongodb', 'redis'].some(k => lower.includes(k))) {
      return 'Database';
    }

    return 'Technology';
  }

  /**
   * Identify missing skills that are in job requirements but not in resume
   */
  private identifyMissingSkills(requiredSkills: string[], resume: Resume): string[] {
    const missing: string[] = [];
    const resumeText = JSON.stringify(resume).toLowerCase();

    for (const skill of requiredSkills) {
      const skillLower = skill.toLowerCase();
      if (!resumeText.includes(skillLower)) {
        // Check if it's a meaningful skill (not too generic)
        if (skill.length > 3 && skill.length < 50) {
          missing.push(skill);
        }
      }
    }

    return missing.slice(0, 10); // Limit to top 10
  }


  /**
   * Generate recommendations
   */
  private generateRecommendations(
    _originalResume: Resume,
    enhancedResume: Resume,
    parsedJob: ReturnType<typeof parseJobDescription>,
    missingSkills: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Missing skills recommendations
    if (missingSkills.length > 0) {
      recommendations.push(
        `Consider highlighting experience with: ${missingSkills.slice(0, 3).join(', ')}`
      );
    }

    // ATS recommendations
    if (!_originalResume.summary) {
      recommendations.push('Add a professional summary to improve ATS score');
    }

    if (_originalResume.experience && _originalResume.experience.length > 0) {
      const longBullets = _originalResume.experience.flatMap((exp) =>
        exp.bulletPoints.filter((bp: string) => bp.length > 150)
      );
      if (longBullets.length > 0) {
        recommendations.push(`Consider shortening ${longBullets.length} bullet point${longBullets.length > 1 ? 's' : ''} to improve readability`);
      }
    }

    // Keyword optimization
    if (parsedJob.keywords.length > 0) {
      const keywordCoverage = this.calculateKeywordCoverage(parsedJob.keywords, enhancedResume);
      if (keywordCoverage < 0.5) {
        recommendations.push('Consider adding more job-relevant keywords throughout the resume');
      }
    }

    return recommendations;
  }

  /**
   * Calculate keyword coverage (0-1)
   */
  private calculateKeywordCoverage(keywords: string[], resume: Resume): number {
    const resumeText = JSON.stringify(resume).toLowerCase();
    let found = 0;

    for (const keyword of keywords.slice(0, 20)) {
      if (resumeText.includes(keyword.toLowerCase())) {
        found++;
      }
    }

    const total = Math.min(keywords.length, 20);
    return total > 0 ? found / total : 0;
  }
}

/**
 * Default instance of the enhancement service
 */
export const resumeEnhancementService = new MockResumeEnhancementService();
