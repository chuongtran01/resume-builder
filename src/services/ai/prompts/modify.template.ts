/**
 * Modify Prompt Template
 * 
 * Structured prompt template for Step 2: Modify phase.
 * Enhances resume based on review findings while maintaining truthfulness.
 */

import type { ModifyPromptTemplate, EnhancementExample } from './types';

/**
 * System message for resume enhancement
 */
const SYSTEM_MESSAGE = `You are an expert resume writer specializing in ATS-optimized resumes. Your expertise includes natural language enhancement, keyword integration, and professional writing that maintains authenticity while improving job match scores.`;

/**
 * Task description for modification
 */
const TASK_DESCRIPTION = `Enhance the provided resume based on the review findings and job requirements. Your goal is to improve the resume's alignment with the job posting while maintaining complete truthfulness and authenticity.`;

/**
 * Output format specification
 */
const OUTPUT_FORMAT = `Provide the enhanced resume as a JSON object matching the original resume structure:
{
  "personalInfo": { ... },
  "summary": "enhanced summary text",
  "experience": [
    {
      "company": "...",
      "role": "...",
      "bulletPoints": ["enhanced bullet point 1", ...],
      ...
    }
  ],
  "education": { ... },
  "skills": { ... },
  ...
}

Ensure the JSON is valid and complete.`;

/**
 * Truthfulness requirements
 */
const TRUTHFULNESS_RULES = [
  'NEVER add experiences, skills, or achievements not present in the original resume',
  'Only enhance and reword existing content - do not fabricate anything',
  'Maintain truthfulness - all claims must be supported by original resume data',
  'Use natural language - avoid mechanical keyword stuffing',
  'Preserve the original meaning and context of all content',
  'Do not change dates, company names, or factual information',
  'Only reword and restructure - never invent new accomplishments',
];

/**
 * Enhancement focus areas
 */
const ENHANCEMENT_AREAS = [
  'Rewriting bullet points to naturally incorporate job-relevant keywords',
  'Reordering skills to prioritize job-relevant ones',
  'Enhancing summary to align with job requirements',
  'Improving action verbs and impact language',
  'Maintaining professional tone and authenticity',
  'Ensuring ATS-friendly formatting and structure',
];

/**
 * Few-shot examples for enhancement
 */
const ENHANCEMENT_EXAMPLES: EnhancementExample[] = [
  {
    original: 'Worked on web applications using JavaScript',
    enhanced: 'Developed responsive web applications using JavaScript, React, and modern frontend frameworks',
    explanation: 'Enhanced to include specific technologies mentioned in job requirements while maintaining truthfulness',
  },
  {
    original: 'Managed team projects',
    enhanced: 'Led cross-functional team of 5 developers to deliver 3 major product releases, improving deployment efficiency by 40%',
    explanation: 'Added quantifiable metrics and stronger action verb while preserving original meaning',
  },
  {
    original: 'Responsible for database maintenance',
    enhanced: 'Optimized PostgreSQL database performance, reducing query time by 30% through indexing and query optimization',
    explanation: 'Transformed passive language into active achievements with specific technical details',
  },
];

/**
 * Build modify prompt template
 */
export function buildModifyPromptTemplate(
  mode: 'full' | 'bulletPoints' | 'skills' | 'summary' = 'full'
): ModifyPromptTemplate {
  return {
    systemMessage: SYSTEM_MESSAGE,
    context: {
      resume: {} as any, // Will be filled by builder
      jobInfo: {} as any, // Will be filled by builder
      reviewResult: undefined, // Will be filled by builder
    },
    taskDescription: TASK_DESCRIPTION,
    outputFormat: OUTPUT_FORMAT,
    truthfulnessRules: TRUTHFULNESS_RULES,
    enhancementAreas: ENHANCEMENT_AREAS,
    examples: ENHANCEMENT_EXAMPLES,
    mode,
  };
}

/**
 * Get modify prompt template (for direct use)
 */
export function getModifyPromptTemplate(
  mode: 'full' | 'bulletPoints' | 'skills' | 'summary' = 'full'
): ModifyPromptTemplate {
  return buildModifyPromptTemplate(mode);
}

/**
 * Get mode-specific enhancement areas
 */
export function getEnhancementAreasForMode(
  mode: 'full' | 'bulletPoints' | 'skills' | 'summary'
): string[] {
  switch (mode) {
    case 'bulletPoints':
      return [
        'Focus ONLY on rewriting experience bullet points',
        'Incorporate job-relevant keywords naturally',
        'Use strong action verbs and quantifiable metrics',
        'Do not modify other sections',
      ];
    case 'skills':
      return [
        'Focus ONLY on reordering and enhancing skills section',
        'Prioritize skills mentioned in job requirements',
        'Group related skills together',
        'Do not modify other sections',
      ];
    case 'summary':
      return [
        'Focus ONLY on enhancing the summary/professional summary section',
        'Align summary with job requirements',
        'Incorporate key skills and experience highlights',
        'Do not modify other sections',
      ];
    default:
      return ENHANCEMENT_AREAS;
  }
}
