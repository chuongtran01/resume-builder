/**
 * Review Prompt Template
 * 
 * Structured prompt template for Step 1: Review phase.
 * Analyzes resume against job requirements and provides structured feedback.
 */

import type { ReviewPromptTemplate, ReviewExample } from './types';

/**
 * System message for resume review
 */
const SYSTEM_MESSAGE = `You are an expert resume reviewer and career advisor with deep knowledge of ATS (Applicant Tracking System) requirements and hiring best practices. Your role is to analyze resumes objectively and provide actionable feedback to help candidates improve their job application success.`;

/**
 * Task description for review
 */
const TASK_DESCRIPTION = `Analyze the provided resume against the job requirements. Identify strengths, weaknesses, opportunities for improvement, and prioritize specific actions that would enhance the resume's alignment with the job posting.

IMPORTANT: Only suggest actions for sections that exist in the original resume. Do NOT suggest adding new sections (e.g., do not suggest adding a "summary" section if it doesn't exist in the original resume). You can only add items WITHIN existing sections (e.g., adding skills to the skills section, adding bullet points to experience entries).`;

/**
 * Output format specification
 */
const OUTPUT_FORMAT = `Provide your analysis as a JSON object with the following structure:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "opportunities": ["opportunity1", "opportunity2", ...],
  "prioritizedActions": [
    {
      "type": "enhance" | "reorder" | "add" | "remove" | "rewrite",
      "section": "section identifier (e.g., 'experience[0]' for first experience, 'experience' for all experiences, 'skills', 'summary' if it exists in original)",
      "priority": "high" | "medium" | "low",
      "reason": "explanation of why this action is needed",
      "suggestedChange": "optional specific suggestion"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "overall analysis summary"
}

IMPORTANT: Only use sections that exist in the original resume. The "add" type should only be used for adding items WITHIN existing sections (e.g., adding skills to the skills section), NOT for adding new sections to the resume.`;

/**
 * Focus areas for review
 */
const FOCUS_AREAS = [
  'How well the resume matches the job requirements',
  'Missing keywords or skills from the job description',
  'Opportunities to intelligently infer and add related content (e.g., Java → backend, React → frontend)',
  'Areas where the resume could be strengthened through intelligent inference',
  'Prioritized actions to enhance ATS compatibility',
  'Content quality and professional presentation',
  'Keyword density and relevance',
  'Experience alignment with job requirements',
  'ONLY suggest improvements for sections that exist in the original resume - do not suggest adding new sections',
];

/**
 * Few-shot examples for review
 */
const REVIEW_EXAMPLES: ReviewExample[] = [
  {
    resumeSnippet: JSON.stringify({
      experience: [
        {
          company: 'Tech Corp',
          role: 'Software Engineer',
          bulletPoints: [
            'Worked on web applications',
            'Fixed bugs',
            'Attended meetings',
          ],
        },
      ],
    }),
    jobSnippet: JSON.stringify({
      keywords: ['React', 'TypeScript', 'Node.js'],
      requiredSkills: ['JavaScript', 'React'],
    }),
    reviewResult: {
      strengths: ['Has relevant software engineering experience'],
      weaknesses: [
        'Missing specific technologies mentioned in job (React, TypeScript)',
        'Bullet points are too generic and lack impact',
      ],
      opportunities: [
        'Can enhance bullet points to highlight React/TypeScript experience',
        'Can add metrics and quantifiable achievements',
      ],
      prioritizedActions: [
        {
          type: 'enhance',
          section: 'experience[0]',
          priority: 'high',
          reason: 'Bullet points need to incorporate job-relevant keywords naturally',
          suggestedChange: 'Rewrite bullet points to mention React and TypeScript specifically',
        },
      ],
      confidence: 0.85,
      reasoning: 'Good foundation but needs keyword optimization and stronger impact statements',
    },
  },
  // Example: Intelligent inference opportunity
  {
    resumeSnippet: JSON.stringify({
      experience: [
        {
          company: 'Enterprise Solutions',
          role: 'Software Developer',
          bulletPoints: [
            'Developed applications using Java',
            'Worked with databases',
            'Collaborated with team members',
          ],
        },
      ],
      skills: {
        categories: [
          {
            name: 'Programming Languages',
            items: ['Java', 'SQL'],
          },
        ],
      },
    }),
    jobSnippet: JSON.stringify({
      keywords: ['backend development', 'RESTful APIs', 'microservices', 'server-side'],
      requiredSkills: ['Java', 'backend development', 'API development'],
    }),
    reviewResult: {
      strengths: [
        'Has Java experience which is relevant for backend development',
        'Has database experience (SQL)',
      ],
      weaknesses: [
        'Missing explicit mention of backend development, APIs, or microservices',
        'Bullet points don\'t highlight backend-specific work',
      ],
      opportunities: [
        'Can intelligently infer "backend development" and "server-side programming" from Java experience',
        'Can add "RESTful APIs" and "microservices" as these are commonly associated with Java backend work',
        'Can enhance bullet points to explicitly mention backend architecture and API development',
      ],
      prioritizedActions: [
        {
          type: 'enhance',
          section: 'experience[0]',
          priority: 'high',
          reason: 'Java experience can be enhanced with backend-related terms that are reasonably inferable',
          suggestedChange: 'Add "backend development", "RESTful APIs", and "microservices" to bullet points based on Java experience',
        },
        {
          type: 'add',
          section: 'skills',
          priority: 'medium',
          reason: 'Can intelligently add related skills: "backend development", "API development", "server-side programming"',
          suggestedChange: 'Add inferred skills: backend development, RESTful APIs, microservices architecture',
        },
      ],
      confidence: 0.9,
      reasoning: 'Strong Java foundation allows for intelligent inference of backend-related terms. These additions are truthful and reasonably inferable from existing Java experience.',
    },
  },
];

/**
 * Build review prompt template
 */
export function buildReviewPromptTemplate(): ReviewPromptTemplate {
  return {
    systemMessage: SYSTEM_MESSAGE,
    context: {
      resume: {} as any, // Will be filled by builder
      jobInfo: {} as any, // Will be filled by builder
    },
    taskDescription: TASK_DESCRIPTION,
    outputFormat: OUTPUT_FORMAT,
    focusAreas: FOCUS_AREAS,
    examples: REVIEW_EXAMPLES,
  };
}

/**
 * Get review prompt template (for direct use)
 */
export function getReviewPromptTemplate(): ReviewPromptTemplate {
  return buildReviewPromptTemplate();
}
