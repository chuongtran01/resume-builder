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
const TASK_DESCRIPTION = `Analyze the provided resume against the job requirements. Identify strengths, weaknesses, opportunities for improvement, and prioritize specific actions that would enhance the resume's alignment with the job posting.`;

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
      "section": "section name (e.g., 'experience', 'skills', 'summary')",
      "priority": "high" | "medium" | "low",
      "reason": "explanation of why this action is needed",
      "suggestedChange": "optional specific suggestion"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "overall analysis summary"
}`;

/**
 * Focus areas for review
 */
const FOCUS_AREAS = [
  'How well the resume matches the job requirements',
  'Missing keywords or skills from the job description',
  'Areas where the resume could be strengthened',
  'Prioritized actions to enhance ATS compatibility',
  'Content quality and professional presentation',
  'Keyword density and relevance',
  'Experience alignment with job requirements',
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
          section: 'experience',
          priority: 'high',
          reason: 'Bullet points need to incorporate job-relevant keywords naturally',
          suggestedChange: 'Rewrite bullet points to mention React and TypeScript specifically',
        },
      ],
      confidence: 0.85,
      reasoning: 'Good foundation but needs keyword optimization and stronger impact statements',
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
