/**
 * Unit tests for truthfulness validator
 */

import {
  validateTruthfulness,
  validateExperiencesOnly,
  validateSkillsOnly,
  validateBulletPointsOnly,
} from '../../../src/services/ai/truthfulnessValidator';
import type { Resume } from '../../../src/types/resume.types';

describe('TruthfulnessValidator', () => {
  const baseResume: Resume = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      location: 'San Francisco, CA',
    },
    experience: [
      {
        company: 'Tech Corp',
        role: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2022-12',
        location: 'San Francisco, CA',
        bulletPoints: [
          'Developed web applications using React and TypeScript',
          'Improved performance by 30%',
          'Collaborated with team of 5 developers',
        ],
      },
    ],
    education: [
      {
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        graduationDate: '2019-05',
      },
    ],
    skills: {
      categories: [
        {
          name: 'Programming Languages',
          items: ['Java', 'JavaScript', 'TypeScript'],
        },
        {
          name: 'Frameworks',
          items: ['React', 'Node.js'],
        },
      ],
    },
    summary: 'Experienced software engineer with 3 years of experience in web development.',
  };

  describe('validateTruthfulness', () => {
    it('should return truthful for identical resumes', () => {
      const result = validateTruthfulness(baseResume, baseResume);
      expect(result.isTruthful).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect new experiences as fabrication', () => {
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          ...baseResume.experience,
          {
            company: 'New Company',
            role: 'Senior Engineer',
            startDate: '2023-01',
            endDate: 'Present',
            location: 'New York, NY',
            bulletPoints: ['Led a team'],
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.details.experiences.newExperiencesDetected).toBe(1);
    });

    it('should detect company name changes', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: 'Different Corp',
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: firstExp.bulletPoints,
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.experiences.mismatchedCompanies.length).toBeGreaterThan(0);
    });

    it('should detect role changes', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: 'Senior Software Engineer',
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: firstExp.bulletPoints,
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.experiences.mismatchedRoles.length).toBeGreaterThan(0);
    });

    it('should detect date changes', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: '2019-01',
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: firstExp.bulletPoints,
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.experiences.mismatchedDates.length).toBeGreaterThan(0);
    });

    it('should allow inferred skills (Java → backend)', () => {
      const enhanced: Resume = {
        ...baseResume,
        skills: {
          categories: [
            {
              name: 'Programming Languages',
              items: ['Java', 'JavaScript', 'TypeScript'],
            },
            {
              name: 'Frameworks',
              items: ['React', 'Node.js'],
            },
            {
              name: 'Backend',
              items: ['backend development', 'server-side programming'],
            },
          ],
        },
      };

      const result = validateTruthfulness(baseResume, enhanced, { allowInference: true });
      expect(result.details.skills.inferredSkills.length).toBeGreaterThan(0);
      expect(result.details.skills.unrelatedSkills).toHaveLength(0);
      // With inference allowed, this should be valid
      expect(result.isTruthful).toBe(true);
    });

    it('should reject unrelated skills', () => {
      if (!baseResume.skills || typeof baseResume.skills === 'string') {
        return; // Skip if skills is a file reference
      }
      
      const enhanced: Resume = {
        ...baseResume,
        skills: {
          categories: [
            ...baseResume.skills.categories,
            {
              name: 'Unrelated',
              items: ['Quantum Computing', 'Blockchain'],
            },
          ],
        },
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.skills.unrelatedSkills.length).toBeGreaterThan(0);
    });

    it('should detect education institution changes', () => {
      const educationArray = Array.isArray(baseResume.education) 
        ? baseResume.education.filter((e): e is { institution: string; degree: string; field: string; graduationDate: string } => 
            typeof e !== 'string' && e !== undefined
          )
        : (baseResume.education && typeof baseResume.education !== 'string' 
            ? [baseResume.education] 
            : []);
      
      if (educationArray.length === 0 || !educationArray[0]) return;
      
      const firstEdu = educationArray[0];
      const enhanced: Resume = {
        ...baseResume,
        education: [
          {
            institution: 'Different University',
            degree: firstEdu.degree,
            field: firstEdu.field,
            graduationDate: firstEdu.graduationDate,
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.education.mismatchedInstitutions.length).toBeGreaterThan(0);
    });

    it('should detect education degree changes', () => {
      const educationArray = Array.isArray(baseResume.education) 
        ? baseResume.education.filter((e): e is typeof baseResume.education[0] & { degree: string } => 
            typeof e !== 'string' && e !== undefined
          )
        : (baseResume.education && typeof baseResume.education !== 'string' 
            ? [baseResume.education] 
            : []);
      
      if (educationArray.length === 0 || !educationArray[0]) return;
      
      const firstEdu = educationArray[0];
      const enhanced: Resume = {
        ...baseResume,
        education: [
          {
            institution: firstEdu.institution,
            degree: 'Master of Science',
            field: firstEdu.field,
            graduationDate: firstEdu.graduationDate,
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.education.mismatchedDegrees.length).toBeGreaterThan(0);
    });

    it('should allow inferred technologies in bullet points', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: [
              'Developed web applications using React and TypeScript',
              'Built backend services using Java and RESTful APIs',
              'Improved performance by 30%',
            ],
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced, { allowInference: true });
      // Java is in skills, so "RESTful APIs" can be inferred
      expect(result.details.bulletPoints.inferredTechnologies.length).toBeGreaterThan(0);
      expect(result.details.bulletPoints.unrelatedTechnologies).toHaveLength(0);
    });

    it('should detect fabricated metrics', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: [
              'Developed web applications using React and TypeScript',
              'Improved performance by 30%',
              'Increased revenue by 50%', // New metric not in original
            ],
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced, { strictness: 'moderate' });
      expect(result.details.bulletPoints.fabricatedMetrics.length).toBeGreaterThan(0);
      expect(result.isTruthful).toBe(false);
    });

    it('should detect mismatched summary claims', () => {
      const enhanced: Resume = {
        ...baseResume,
        summary: 'Experienced software engineer with 10 years of experience in web development.',
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.details.summary.mismatchedClaims.length).toBeGreaterThan(0);
      expect(result.isTruthful).toBe(false);
    });

    it('should generate correction suggestions', () => {
      if (!baseResume.skills || typeof baseResume.skills === 'string') {
        return; // Skip if skills is a file reference
      }
      
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: 'Different Corp',
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: firstExp.bulletPoints,
          },
        ],
        skills: {
          categories: [
            ...baseResume.skills.categories,
            {
              name: 'Unrelated',
              items: ['Quantum Computing'],
            },
          ],
        },
      };

      const result = validateTruthfulness(baseResume, enhanced, { generateSuggestions: true });
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should respect strictness levels', () => {
      if (!baseResume.skills || typeof baseResume.skills === 'string') {
        return; // Skip if skills is a file reference
      }
      
      const enhanced: Resume = {
        ...baseResume,
        skills: {
          categories: [
            ...baseResume.skills.categories,
            {
              name: 'Backend',
              items: ['backend development'],
            },
          ],
        },
      };

      const strictResult = validateTruthfulness(baseResume, enhanced, {
        allowInference: true,
        strictness: 'strict',
      });
      expect(strictResult.warnings.length).toBeGreaterThan(0);

      const lenientResult = validateTruthfulness(baseResume, enhanced, {
        allowInference: true,
        strictness: 'lenient',
      });
      // Lenient mode should have fewer warnings
      expect(lenientResult.warnings.length).toBeLessThanOrEqual(strictResult.warnings.length);
    });

    it('should handle missing sections gracefully', () => {
      const resumeWithoutSkills: Resume = {
        ...baseResume,
        skills: undefined,
      };

      const result = validateTruthfulness(resumeWithoutSkills, resumeWithoutSkills);
      expect(result.isTruthful).toBe(true);
    });

    it('should handle file references in skills', () => {
      const resumeWithFileRef: Resume = {
        ...baseResume,
        skills: 'file:./skills.json',
      };

      const result = validateTruthfulness(resumeWithFileRef, resumeWithFileRef);
      expect(result.isTruthful).toBe(true);
    });
  });

  describe('validateExperiencesOnly', () => {
    it('should return true for valid experiences', () => {
      const result = validateExperiencesOnly(baseResume, baseResume);
      expect(result).toBe(true);
    });

    it('should return false for new experiences', () => {
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          ...baseResume.experience,
          {
            company: 'New Company',
            role: 'Engineer',
            startDate: '2023-01',
            endDate: 'Present',
            location: 'NYC',
            bulletPoints: [],
          },
        ],
      };

      const result = validateExperiencesOnly(baseResume, enhanced);
      expect(result).toBe(false);
    });
  });

  describe('validateSkillsOnly', () => {
    it('should return true for valid skills', () => {
      const result = validateSkillsOnly(baseResume, baseResume);
      expect(result).toBe(true);
    });

    it('should return false for unrelated skills', () => {
      if (!baseResume.skills || typeof baseResume.skills === 'string') {
        return; // Skip if skills is a file reference
      }
      
      const enhanced: Resume = {
        ...baseResume,
        skills: {
          categories: [
            ...baseResume.skills.categories,
            {
              name: 'Unrelated',
              items: ['Quantum Computing'],
            },
          ],
        },
      };

      const result = validateSkillsOnly(baseResume, enhanced);
      expect(result).toBe(false);
    });

    it('should return true for inferred skills when inference is allowed', () => {
      if (!baseResume.skills || typeof baseResume.skills === 'string') {
        return; // Skip if skills is a file reference
      }
      
      const enhanced: Resume = {
        ...baseResume,
        skills: {
          categories: [
            ...baseResume.skills.categories,
            {
              name: 'Backend',
              items: ['backend development'],
            },
          ],
        },
      };

      const result = validateSkillsOnly(baseResume, enhanced, { allowInference: true });
      expect(result).toBe(true);
    });
  });

  describe('validateBulletPointsOnly', () => {
    it('should return true for valid bullet points', () => {
      const result = validateBulletPointsOnly(baseResume, baseResume);
      expect(result).toBe(true);
    });

    it('should return false for unrelated technologies', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: [
              'Developed applications using Quantum Computing',
            ],
          },
        ],
      };

      const result = validateBulletPointsOnly(baseResume, enhanced);
      expect(result).toBe(false);
    });

    it('should return true for inferred technologies when inference is allowed', () => {
      const firstExp = baseResume.experience[0];
      if (!firstExp) return;
      
      const enhanced: Resume = {
        ...baseResume,
        experience: [
          {
            company: firstExp.company,
            role: firstExp.role,
            startDate: firstExp.startDate,
            endDate: firstExp.endDate,
            location: firstExp.location,
            bulletPoints: [
              'Developed backend services using Java and RESTful APIs',
            ],
          },
        ],
      };

      const result = validateBulletPointsOnly(baseResume, enhanced, { allowInference: true });
      expect(result).toBe(true);
    });
  });

  describe('inference patterns', () => {
    it('should infer backend terms from Java', () => {
      const original: Resume = {
        ...baseResume,
        skills: {
          categories: [
            {
              name: 'Programming Languages',
              items: ['Java'],
            },
          ],
        },
      };

      const enhanced: Resume = {
        ...original,
        skills: {
          categories: [
            {
              name: 'Programming Languages',
              items: ['Java'],
            },
            {
              name: 'Backend',
              items: ['backend development', 'server-side programming'],
            },
          ],
        },
      };

      const result = validateTruthfulness(original, enhanced, { allowInference: true });
      expect(result.details.skills.inferredSkills).toContain('backend development');
      expect(result.isTruthful).toBe(true);
    });

    it('should infer frontend terms from React', () => {
      const original: Resume = {
        ...baseResume,
        skills: {
          categories: [
            {
              name: 'Frameworks',
              items: ['React'],
            },
          ],
        },
      };

      const enhanced: Resume = {
        ...original,
        skills: {
          categories: [
            {
              name: 'Frameworks',
              items: ['React'],
            },
            {
              name: 'Frontend',
              items: ['frontend development', 'user interface'],
            },
          ],
        },
      };

      const result = validateTruthfulness(original, enhanced, { allowInference: true });
      expect(result.details.skills.inferredSkills.length).toBeGreaterThan(0);
      expect(result.isTruthful).toBe(true);
    });

    it('should infer cloud terms from AWS', () => {
      const original: Resume = {
        ...baseResume,
        skills: {
          categories: [
            {
              name: 'Cloud',
              items: ['AWS'],
            },
          ],
        },
      };

      const enhanced: Resume = {
        ...original,
        skills: {
          categories: [
            {
              name: 'Cloud',
              items: ['AWS'],
            },
            {
              name: 'DevOps',
              items: ['cloud infrastructure', 'cloud deployment'],
            },
          ],
        },
      };

      const result = validateTruthfulness(original, enhanced, { allowInference: true });
      expect(result.details.skills.inferredSkills.length).toBeGreaterThan(0);
      expect(result.isTruthful).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty experience arrays', () => {
      const emptyResume: Resume = {
        ...baseResume,
        experience: [],
      };

      const result = validateTruthfulness(emptyResume, emptyResume);
      expect(result.isTruthful).toBe(true);
    });

    it('should handle missing summary', () => {
      const resumeWithoutSummary: Resume = {
        ...baseResume,
        summary: undefined,
      };

      const result = validateTruthfulness(resumeWithoutSummary, resumeWithoutSummary);
      expect(result.isTruthful).toBe(true);
    });

    it('should handle education as single object', () => {
      const educationArray = Array.isArray(baseResume.education) 
        ? baseResume.education 
        : (baseResume.education ? [baseResume.education] : []);
      
      if (educationArray.length === 0) {
        return; // Skip if no education
      }
      
      const resumeWithSingleEdu: Resume = {
        ...baseResume,
        education: educationArray[0],
      };

      const result = validateTruthfulness(resumeWithSingleEdu, resumeWithSingleEdu);
      expect(result.isTruthful).toBe(true);
    });

    it('should handle new education entries', () => {
      const educationArray = Array.isArray(baseResume.education) 
        ? baseResume.education.filter((e): e is typeof baseResume.education[0] & { institution: string } => 
            typeof e !== 'string' && e !== undefined
          )
        : (baseResume.education && typeof baseResume.education !== 'string' 
            ? [baseResume.education] 
            : []);
      
      const enhanced: Resume = {
        ...baseResume,
        education: [
          ...educationArray,
          {
            institution: 'New University',
            degree: 'Master',
            field: 'CS',
            graduationDate: '2023-05',
          },
        ],
      };

      const result = validateTruthfulness(baseResume, enhanced);
      expect(result.isTruthful).toBe(false);
      expect(result.details.education.errors.length).toBeGreaterThan(0);
    });
  });
});
