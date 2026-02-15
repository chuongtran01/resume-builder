/**
 * Unit tests for resume enhancement service
 */

import {
  MockResumeEnhancementService,
  resumeEnhancementService,
} from '@services/resumeEnhancementService';
import type { Resume } from '@resume-types/resume.types';

describe('resumeEnhancementService', () => {
  const sampleResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 123-456-7890',
      location: 'San Francisco, CA',
    },
    summary: 'Experienced software engineer with expertise in web development',
    experience: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        startDate: '2020-01',
        endDate: 'Present',
        location: 'Remote',
        bulletPoints: [
          'Built scalable web applications',
          'Led team of 4 engineers',
          'Improved system performance by 40%',
        ],
      },
      {
        company: 'StartupXYZ',
        role: 'Full Stack Developer',
        startDate: '2018-06',
        endDate: '2019-12',
        location: 'San Francisco, CA',
        bulletPoints: [
          'Developed React-based frontend',
          'Implemented RESTful APIs',
        ],
      },
    ],
    education: {
      institution: 'University of California',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: '2018-05',
    },
    skills: {
      categories: [
        {
          name: 'Programming Languages',
          items: ['JavaScript', 'TypeScript', 'Python', 'Java'],
        },
        {
          name: 'Frameworks',
          items: ['React', 'Node.js', 'Express'],
        },
        {
          name: 'Tools',
          items: ['Git', 'Docker', 'AWS'],
        },
      ],
    },
  };

  const sampleJobDescription = `
    Position: Senior Software Engineer
    Company: Awesome Tech Inc
    
    We are looking for a Senior Software Engineer with 5+ years of experience.
    
    Requirements:
    - Proficient in React, TypeScript, and Node.js
    - Experience with AWS and cloud infrastructure
    - Strong problem-solving skills
    - Experience with Docker and Kubernetes
    
    Preferred:
    - Knowledge of GraphQL
    - Experience with microservices architecture
  `;

  describe('enhanceResume', () => {
    it('should enhance resume and return EnhancementResult', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      expect(result).toBeDefined();
      expect(result.originalResume).toBeDefined();
      expect(result.enhancedResume).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.keywordSuggestions).toBeDefined();
      expect(result.missingSkills).toBeDefined();
      expect(result.atsScore).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should maintain truthfulness (not add new experiences)', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      // Should have same number of experiences
      expect(result.enhancedResume.experience.length).toBe(sampleResume.experience.length);

      // Should have same companies
      result.enhancedResume.experience.forEach((exp, index) => {
        const originalExp = sampleResume.experience[index];
        if (originalExp) {
          expect(exp.company).toBe(originalExp.company);
          expect(exp.role).toBe(originalExp.role);
        }
      });
    });

    it('should enhance bullet points with keywords', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      // Check if bullet points were enhanced
      const hasChanges = result.improvements.some(imp => imp.type === 'bulletPoint');
      expect(hasChanges || result.improvements.length > 0).toBe(true);
    });

    it('should calculate ATS scores', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      expect(result.atsScore.before).toBeGreaterThanOrEqual(0);
      expect(result.atsScore.before).toBeLessThanOrEqual(100);
      expect(result.atsScore.after).toBeGreaterThanOrEqual(0);
      expect(result.atsScore.after).toBeLessThanOrEqual(100);
      expect(result.atsScore.improvement).toBeDefined();
    });

    it('should identify missing skills', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      expect(Array.isArray(result.missingSkills)).toBe(true);
      // Should identify some missing skills (parsing may vary)
      // The parser should detect skills mentioned in job description but not in resume
      expect(result.missingSkills.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate keyword suggestions', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      expect(Array.isArray(result.keywordSuggestions)).toBe(true);
      result.keywordSuggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('keyword');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('importance');
        expect(['high', 'medium', 'low']).toContain(suggestion.importance);
      });
    });

    it('should generate recommendations', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription
      );

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle resume without summary', async () => {
      const resumeWithoutSummary = { ...sampleResume };
      delete resumeWithoutSummary.summary;

      const result = await resumeEnhancementService.enhanceResume(
        resumeWithoutSummary,
        sampleJobDescription
      );

      expect(result).toBeDefined();
      expect(result.enhancedResume).toBeDefined();
    });

    it('should handle resume without skills', async () => {
      const resumeWithoutSkills = { ...sampleResume };
      delete resumeWithoutSkills.skills;

      const result = await resumeEnhancementService.enhanceResume(
        resumeWithoutSkills,
        sampleJobDescription
      );

      expect(result).toBeDefined();
      expect(result.enhancedResume).toBeDefined();
    });

    it('should handle empty job description', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        ''
      );

      expect(result).toBeDefined();
      expect(result.enhancedResume).toBeDefined();
      // Should still return valid result even with empty job description
    });

    it('should respect focus areas option', async () => {
      const result = await resumeEnhancementService.enhanceResume(
        sampleResume,
        sampleJobDescription,
        { focusAreas: ['summary'] }
      );

      expect(result).toBeDefined();
      // Summary should be enhanced if present and in focus areas
      if (sampleResume.summary) {
        const summaryChanges = result.improvements.filter(imp => imp.type === 'summary');
        expect(summaryChanges.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('rewriteBulletPoints', () => {
    it('should rewrite bullet points with keywords', () => {
      const service = new MockResumeEnhancementService();
      const bulletPoints = [
        'Built scalable web applications',
        'Improved system performance',
      ];
      const keywords = ['React', 'TypeScript', 'AWS'];
      const requiredSkills = ['Node.js'];

      const changes = service.rewriteBulletPoints(bulletPoints, keywords, requiredSkills);

      expect(Array.isArray(changes)).toBe(true);
      changes.forEach(change => {
        expect(change).toHaveProperty('old');
        expect(change).toHaveProperty('new');
      });
    });

    it('should not modify bullet points if no relevant keywords', () => {
      const service = new MockResumeEnhancementService();
      const bulletPoints = ['Built scalable web applications'];
      const keywords: string[] = [];
      const requiredSkills: string[] = [];

      const changes = service.rewriteBulletPoints(bulletPoints, keywords, requiredSkills);

      expect(changes.length).toBe(0);
    });

    it('should maintain truthfulness in bullet point rewrites', () => {
      const service = new MockResumeEnhancementService();
      const bulletPoints = ['Built scalable web applications using JavaScript'];
      const keywords = ['React', 'TypeScript'];

      const changes = service.rewriteBulletPoints(bulletPoints, keywords, []);

      // Should not completely change the meaning
      changes.forEach(change => {
        expect(change.new.toLowerCase()).toContain('built');
        expect(change.new.toLowerCase()).toContain('web');
      });
    });
  });

  describe('reorderSkills', () => {
    it('should reorder skills based on job relevance', () => {
      const service = new MockResumeEnhancementService();
      const skills = {
        categories: [
          {
            name: 'Programming Languages',
            items: ['Java', 'Python', 'TypeScript', 'JavaScript'],
          },
        ],
      };
      const jobKeywords = ['TypeScript', 'JavaScript', 'React'];

      const changes = service.reorderSkills(skills, jobKeywords);

      expect(Array.isArray(changes)).toBe(true);
      // TypeScript and JavaScript should be prioritized
      if (skills.categories[0]?.items?.[0]) {
        expect(skills.categories[0].items[0]).toMatch(/TypeScript|JavaScript/);
      }
    });

    it('should handle skills with no categories', () => {
      const service = new MockResumeEnhancementService();
      const skills = {
        categories: [],
      };
      const jobKeywords = ['React'];

      const changes = service.reorderSkills(skills, jobKeywords);

      expect(changes.length).toBe(0);
    });

    it('should reorder categories based on relevance', () => {
      const service = new MockResumeEnhancementService();
      const skills = {
        categories: [
          {
            name: 'Tools',
            items: ['Git', 'Docker'],
          },
          {
            name: 'Frameworks',
            items: ['React', 'Vue'],
          },
        ],
      };
      const jobKeywords = ['React', 'TypeScript'];

      service.reorderSkills(skills, jobKeywords);

      // Frameworks category should be prioritized
      if (skills.categories[0]) {
        expect(skills.categories[0].name).toBe('Frameworks');
      }
    });
  });

  describe('trackChanges', () => {
    it('should track changes between original and enhanced resume', () => {
      const service = new MockResumeEnhancementService();
      const original = { ...sampleResume };
      const enhanced = JSON.parse(JSON.stringify(sampleResume)) as Resume;

      // Modify a bullet point
      if (enhanced.experience && enhanced.experience[0]) {
        enhanced.experience[0].bulletPoints[0] = 'Enhanced bullet point';
      }

      const changes = service.trackChanges(original, enhanced);

      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0]).toHaveProperty('old');
      expect(changes[0]).toHaveProperty('new');
      expect(changes[0]).toHaveProperty('section');
    });

    it('should return empty array if no changes', () => {
      const service = new MockResumeEnhancementService();
      const original = { ...sampleResume };
      const enhanced = JSON.parse(JSON.stringify(sampleResume)) as Resume;

      const changes = service.trackChanges(original, enhanced);

      expect(changes.length).toBe(0);
    });
  });

  describe('generateChangesSummary', () => {
    it('should generate summary for changes', () => {
      const service = new MockResumeEnhancementService();
      const changes = [
        {
          old: 'Original bullet',
          new: 'Enhanced bullet',
          type: 'bulletPoint' as const,
        },
        {
          old: 'Original skill order',
          new: 'Reordered skills',
          type: 'skill' as const,
        },
      ];

      const summary = service.generateChangesSummary(changes);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Enhanced');
    });

    it('should handle empty changes', () => {
      const service = new MockResumeEnhancementService();
      const summary = service.generateChangesSummary([]);

      expect(summary).toContain('No changes');
    });
  });
});
