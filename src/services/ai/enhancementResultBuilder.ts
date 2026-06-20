/**
 * Builds EnhancementResult metadata from AI review/modify responses.
 */

import type {
  EnhancementResult,
  Improvement,
  KeywordSuggestion,
  AtsScore,
  ChangeDetail,
} from '@resume-types/enhancement.types';
import type { Resume } from '@resume-types/resume.types';
import type { ParsedJobDescription } from '@utils/jobParser';
import type { AIResponse } from './enhancement.types';
import { validateAtsCompliance } from '@services/atsValidator';
import { logger } from '@utils/logger';

export function buildEnhancementResult(
  originalResume: Resume,
  response: AIResponse,
  parsedJob: ParsedJobDescription
): EnhancementResult {
  const enhancedResume = filterEnhancedResumeSections(
    originalResume,
    response.enhancedResume
  );

  const changes = trackChanges(originalResume, enhancedResume);
  const improvements = generateImprovements(changes, response.improvements);
  const keywordSuggestions = generateKeywordSuggestions(parsedJob, enhancedResume);
  const missingSkills = identifyMissingSkills(parsedJob.requiredSkills, enhancedResume);

  const atsScoreBefore = validateAtsCompliance(originalResume).score;
  const atsScoreAfter = validateAtsCompliance(enhancedResume).score;
  const atsScore: AtsScore = {
    before: atsScoreBefore,
    after: atsScoreAfter,
    improvement: atsScoreAfter - atsScoreBefore,
  };

  const recommendations = generateRecommendations(
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

export function filterEnhancedResumeSections(
  originalResume: Resume,
  enhancedResume: Resume
): Resume {
  const filtered: Resume = {
    personalInfo: enhancedResume.personalInfo,
    experience: enhancedResume.experience,
  };

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

  const originalSections = Object.keys(originalResume).filter(key => key !== 'personalInfo');
  const enhancedSections = Object.keys(enhancedResume).filter(key => key !== 'personalInfo');
  const filteredOut = enhancedSections.filter(section => !originalSections.includes(section));

  if (filteredOut.length > 0) {
    logger.warn(`Filtered out sections that were not in original resume: ${filteredOut.join(', ')}`);
  }

  return filtered;
}

export function trackChanges(original: Resume, enhanced: Resume): ChangeDetail[] {
  const changes: ChangeDetail[] = [];

  if (original.experience && enhanced.experience) {
    for (let i = 0; i < Math.max(original.experience.length, enhanced.experience.length); i++) {
      const origExp = original.experience[i];
      const enhExp = enhanced.experience[i];

      if (!origExp && enhExp) {
        logger.warn(`New experience added at index ${i}: ${enhExp.company}`);
        continue;
      }

      if (origExp && !enhExp) {
        logger.warn(`Experience removed at index ${i}: ${origExp.company}`);
        continue;
      }

      if (origExp && enhExp) {
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

  if (original.skills && enhanced.skills) {
    const origSkills = flattenSkills(original.skills);
    const enhSkills = flattenSkills(enhanced.skills);

    const origSkillsStr = origSkills.join(', ');
    const enhSkillsStr = enhSkills.join(', ');

    if (origSkillsStr !== enhSkillsStr) {
      changes.push({
        old: origSkillsStr,
        new: enhSkillsStr,
        section: 'skills',
        type: 'skill',
      });
    }
  }

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

export function flattenSkills(skills: Resume['skills']): string[] {
  if (!skills) return [];

  if (typeof skills === 'string' && skills.startsWith('file:')) {
    return [];
  }

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

export function generateImprovements(
  changes: ChangeDetail[],
  aiImprovements?: Improvement[]
): Improvement[] {
  const improvements: Improvement[] = [];

  if (aiImprovements && aiImprovements.length > 0) {
    return aiImprovements;
  }

  for (const change of changes) {
    improvements.push({
      type: change.type || 'bulletPoint',
      section: change.section || 'unknown',
      original: change.old,
      suggested: change.new,
      reason: 'Enhanced to better match job requirements',
      confidence: 0.8,
    });
  }

  return improvements;
}

export function generateKeywordSuggestions(
  parsedJob: ParsedJobDescription,
  enhancedResume: Resume
): KeywordSuggestion[] {
  const suggestions: KeywordSuggestion[] = [];

  for (const keyword of parsedJob.keywords) {
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

export function identifyMissingSkills(requiredSkills: string[], resume: Resume): string[] {
  if (!requiredSkills || requiredSkills.length === 0) {
    return [];
  }

  const resumeSkills = flattenSkills(resume.skills);
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());

  return requiredSkills.filter(skill => {
    const skillLower = skill.toLowerCase();
    return !resumeSkillsLower.some(rs => rs.includes(skillLower) || skillLower.includes(rs));
  });
}

export function generateRecommendations(
  original: Resume,
  enhanced: Resume,
  parsedJob: ParsedJobDescription,
  missingSkills: string[],
  aiReasoning?: string
): string[] {
  const recommendations: string[] = [];

  if (aiReasoning) {
    recommendations.push(aiReasoning);
  }

  if (missingSkills.length > 0) {
    recommendations.push(
      `Consider adding these skills to your resume: ${missingSkills.join(', ')}`
    );
  }

  const keywordSuggestions = generateKeywordSuggestions(parsedJob, enhanced);
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
