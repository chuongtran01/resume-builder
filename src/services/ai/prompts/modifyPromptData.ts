import type { EnhancementExample } from './types';

export type EnhancementMode = 'full' | 'bulletPoints' | 'skills' | 'summary';

export const TRUTHFULNESS_RULES = [
  'NEVER add experiences, companies, roles, or dates not present in the original resume',
  'NEVER add sections that do not exist in the original resume (e.g., do not add "summary" if it was not in the original)',
  'NEVER fabricate achievements, metrics, or accomplishments that cannot be reasonably inferred',
  'You CAN intelligently infer and add related content based on existing resume information',
  'You CAN add items WITHIN existing sections (e.g., add skills to the skills section, add bullet points to experience entries)',
  'Examples of allowed intelligent inference:',
  '  - If resume mentions "Java" → can add "backend development", "server-side programming", "enterprise applications"',
  '  - If resume mentions "React" → can add "frontend development", "user interface", "client-side applications"',
  '  - If resume mentions "Python" → can add "data science", "automation", "scripting", "backend development"',
  '  - If resume mentions "AWS" → can add "cloud infrastructure", "cloud services", "cloud deployment"',
  '  - If resume mentions "Docker" → can add "containerization", "container orchestration", "DevOps"',
  'Maintain truthfulness - all added content must be reasonably inferable from existing resume data',
  'Use natural language - avoid mechanical keyword stuffing',
  'Preserve the original meaning and context of all content',
  'Do not change dates, company names, or factual information',
  'Only enhance, reword, and intelligently expand - never invent completely unrelated content',
  'Match the exact section structure of the original resume - include only sections that were present in the original',
];

export const ENHANCEMENT_AREAS = [
  'Rewriting bullet points to naturally incorporate job-relevant keywords',
  'Intelligently inferring and adding related content based on existing resume information',
  'Reordering skills to prioritize job-relevant ones (only if skills section exists)',
  'Adding related skills that can be reasonably inferred (e.g., Java → backend, React → frontend) - only within existing skills section',
  'Enhancing summary to align with job requirements (only if summary section exists in original)',
  'Improving action verbs and impact language',
  'Maintaining professional tone and authenticity',
  'Ensuring ATS-friendly formatting and structure',
  'ONLY enhancing sections that exist in the original resume - do not add new sections',
];

export const ENHANCEMENT_EXAMPLES: EnhancementExample[] = [
  {
    original: 'Worked on web applications using JavaScript',
    enhanced: 'Developed responsive web applications using JavaScript, React, and modern frontend frameworks',
    explanation: 'Enhanced to include specific technologies mentioned in job requirements while maintaining truthfulness',
  },
  {
    original: 'Developed applications using Java',
    enhanced: 'Developed scalable backend applications using Java, implementing RESTful APIs and microservices architecture',
    explanation: 'Intelligently inferred "backend", "RESTful APIs", and "microservices" from Java, as Java is commonly used for backend development',
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
  {
    original: 'Worked with Python for data analysis',
    enhanced: 'Performed data analysis and automation using Python, leveraging pandas and NumPy for data processing and insights',
    explanation: 'Intelligently inferred "automation", "pandas", and "NumPy" from Python, as these are commonly associated with Python data science work',
  },
];

export function getEnhancementAreasForMode(mode: EnhancementMode): string[] {
  switch (mode) {
    case 'bulletPoints':
      return [
        'Focus ONLY on rewriting experience bullet points',
        'Incorporate job-relevant keywords naturally',
        'Intelligently infer and add related content (e.g., Java → backend, React → frontend)',
        'Use strong action verbs and quantifiable metrics',
        'Do not modify other sections',
      ];
    case 'skills':
      return [
        'Focus ONLY on reordering and enhancing skills section',
        'Prioritize skills mentioned in job requirements',
        'Intelligently add related skills that can be inferred (e.g., Java → backend, React → frontend)',
        'Group related skills together',
        'Do not modify other sections',
      ];
    case 'summary':
      return [
        'Focus ONLY on enhancing the summary/professional summary section (only if it exists in the original resume)',
        'Align summary with job requirements',
        'Incorporate key skills and experience highlights',
        'Do not modify other sections',
        'If summary does not exist in the original resume, do not add it',
      ];
    default:
      return ENHANCEMENT_AREAS;
  }
}
