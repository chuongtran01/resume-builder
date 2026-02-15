/**
 * Job description parser utility
 * Extracts keywords, requirements, and important information from job descriptions
 */

import { logger } from '@utils/logger';

/**
 * Parsed job description structure
 */
export interface ParsedJobDescription {
  /** Extracted keywords (technologies, skills, tools) */
  keywords: string[];
  /** Required skills and qualifications */
  requiredSkills: string[];
  /** Preferred skills (nice to have) */
  preferredSkills: string[];
  /** Experience level (e.g., "3-5 years", "Senior", "Entry-level") */
  experienceLevel?: string;
  /** Job title if found */
  jobTitle?: string;
  /** Company name if found */
  company?: string;
  /** List of requirement strings */
  requirements: string[];
}

/**
 * Common technology keywords to look for
 */
const TECHNOLOGY_KEYWORDS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash',
  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'HTML', 'CSS', 'SCSS', 'SASS',
  'Tailwind', 'Bootstrap', 'Webpack', 'Vite', 'Redux', 'MobX', 'Zustand',
  // Backend
  'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel',
  'Rails', 'GraphQL', 'REST', 'API', 'Microservices',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
  'SQLite', 'Oracle', 'SQL Server',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins',
  'CI/CD', 'GitHub Actions', 'GitLab CI', 'CircleCI',
  // Tools & Frameworks
  'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Slack', 'Agile', 'Scrum',
  'Machine Learning', 'AI', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
];

/**
 * Common skill keywords
 */
const SKILL_KEYWORDS = [
  'Problem Solving', 'Communication', 'Leadership', 'Teamwork', 'Agile', 'Scrum',
  'Project Management', 'Code Review', 'Testing', 'Debugging', 'Architecture',
  'System Design', 'Performance Optimization', 'Security', 'DevOps', 'CI/CD',
];

/**
 * Extract job title from text
 * Looks for patterns like "Job Title", "Position: Job Title", etc.
 */
function extractJobTitle(text: string): string | undefined {
  const patterns = [
    /^(?:Position|Role|Title|Job Title|Job)[:\s]+([A-Z][A-Za-z\s&]+?)(?:\n|$)/im,
    /^([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Analyst|Specialist|Architect|Lead|Senior|Junior|Designer|Programmer|Consultant))/m,
    /We are looking for (?:a|an) ([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Analyst|Specialist|Architect|Lead|Senior|Junior))/i,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Analyst|Specialist|Architect|Lead|Senior|Junior))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      // Filter out common false positives
      if (title.length > 3 && title.length < 100 && !title.match(/^(The|A|An|Our|We|This)/i)) {
        return title;
      }
    }
  }

  return undefined;
}

/**
 * Extract company name from text
 * Looks for patterns like "Company Name", "at Company Name", etc.
 */
function extractCompany(text: string): string | undefined {
  const patterns = [
    /(?:at|with|from|join)\s+([A-Z][A-Za-z0-9\s&.,-]+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Systems)?)/i,
    /^([A-Z][A-Za-z0-9\s&.,-]+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Systems)?)/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      // Filter out common false positives
      if (!company.match(/^(The|A|An|Our|We|This|Job|Position|Role)/i)) {
        return company;
      }
    }
  }

  return undefined;
}

/**
 * Extract experience level/requirements
 * Looks for patterns like "3-5 years", "Senior level", etc.
 */
function extractExperienceLevel(text: string): string | undefined {
  const patterns = [
    /(\d+[-+]?\s*(?:to|-)?\s*\d*)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:Senior|Mid-level|Mid|Junior|Entry-level|Entry|Lead|Principal)\s+(?:level\s+)?(?:engineer|developer|position|role)?/i,
    /(?:minimum|at least|minimum of)\s+(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:with|having)\s+(\d+[-+]?\s*(?:to|-)?\s*\d*)\s*(?:years?|yrs?)/i,
    /(Senior|Mid-level|Mid|Junior|Entry-level|Entry|Lead|Principal)\s+level/i,
    /(Entry-level|Senior|Junior|Mid-level)\s+position/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const level = match[0].trim();
      if (level.length > 0 && level.length < 100) {
        return level;
      }
    }
  }

  return undefined;
}

/**
 * Extract keywords from text
 * Looks for technology names, tools, and common skills
 */
function extractKeywords(text: string): string[] {
  const keywords: Set<string> = new Set();

  // Check for technology keywords (case-insensitive)
  for (const keyword of TECHNOLOGY_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      keywords.add(keyword);
    }
  }

  // Check for skill keywords
  for (const keyword of SKILL_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      keywords.add(keyword);
    }
  }

  // Extract common patterns like "X years of Y" or "proficient in Y"
  const proficiencyPatterns = [
    /(?:proficient|experienced|skilled|expert)\s+(?:in|with|using)\s+([A-Z][A-Za-z\s]+)/gi,
    /(?:knowledge|experience|familiarity)\s+(?:of|with|in)\s+([A-Z][A-Za-z\s]+)/gi,
  ];

  for (const pattern of proficiencyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const skill = match[1].trim();
        if (skill.length > 2 && skill.length < 50) {
          keywords.add(skill);
        }
      }
    }
  }

  return Array.from(keywords).sort();
}

/**
 * Extract required skills
 * Looks for sections like "Requirements:", "Must have:", etc.
 */
function extractRequiredSkills(text: string): string[] {
  const requiredSkills: Set<string> = new Set();

  // Find requirements section
  const requirementsPatterns = [
    /(?:requirements?|must\s+have|required|qualifications?)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/gis,
    /(?:you\s+must|must|required\s+to)\s+(?:have|be|know|understand)\s+(.*?)(?:\.|$)/gi,
  ];

  for (const pattern of requirementsPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const requirementsText = match[1];
        // Extract individual requirements (bullet points, numbered lists, etc.)
        const items = requirementsText.split(/[•\-\*]\s*|\d+\.\s*/).filter(item => item.trim().length > 0);
        for (const item of items) {
          const trimmed = item.trim();
          if (trimmed.length > 5 && trimmed.length < 200) {
            requiredSkills.add(trimmed);
          }
        }
      }
    }
  }

  // Also extract from keywords that appear in requirements context
  const keywords = extractKeywords(text);
  const requirementsSection = text.match(/(?:requirements?|must\s+have|required|qualifications?)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/is);
  if (requirementsSection) {
    for (const keyword of keywords) {
      if (requirementsSection[1]?.toLowerCase().includes(keyword.toLowerCase())) {
        requiredSkills.add(keyword);
      }
    }
  }

  return Array.from(requiredSkills);
}

/**
 * Extract preferred skills
 * Looks for sections like "Nice to have:", "Preferred:", etc.
 */
function extractPreferredSkills(text: string): string[] {
  const preferredSkills: Set<string> = new Set();

  // Find preferred section
  const preferredPatterns = [
    /(?:preferred|nice\s+to\s+have|bonus|plus|advantage)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/gis,
    /(?:would\s+be\s+great|it's\s+a\s+plus|bonus\s+points)\s+(?:if\s+you\s+)?(?:have|know|are)\s+(.*?)(?:\.|$)/gi,
  ];

  for (const pattern of preferredPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const preferredText = match[1];
        // Extract individual items
        const items = preferredText.split(/[•\-\*]\s*|\d+\.\s*/).filter(item => item.trim().length > 0);
        for (const item of items) {
          const trimmed = item.trim();
          if (trimmed.length > 5 && trimmed.length < 200) {
            preferredSkills.add(trimmed);
          }
        }
      }
    }
  }

  // Also extract from keywords that appear in preferred context
  const keywords = extractKeywords(text);
  const preferredSection = text.match(/(?:preferred|nice\s+to\s+have|bonus|plus|advantage)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/is);
  if (preferredSection) {
    for (const keyword of keywords) {
      if (preferredSection[1]?.toLowerCase().includes(keyword.toLowerCase())) {
        preferredSkills.add(keyword);
      }
    }
  }

  return Array.from(preferredSkills);
}

/**
 * Extract all requirements as text
 */
function extractRequirements(text: string): string[] {
  const requirements: string[] = [];

  // Extract from requirements section
  const requirementsMatch = text.match(/(?:requirements?|must\s+have|required|qualifications?)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/is);
  if (requirementsMatch && requirementsMatch[1]) {
    const items = requirementsMatch[1]
      .split(/[•\-\*]\s*|\d+\.\s*/)
      .map(item => item.trim())
      .filter(item => item.length > 5 && item.length < 500);
    requirements.push(...items);
  }

  // Extract from preferred section
  const preferredMatch = text.match(/(?:preferred|nice\s+to\s+have|bonus|plus|advantage)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)/is);
  if (preferredMatch && preferredMatch[1]) {
    const items = preferredMatch[1]
      .split(/[•\-\*]\s*|\d+\.\s*/)
      .map(item => item.trim())
      .filter(item => item.length > 5 && item.length < 500);
    requirements.push(...items);
  }

  return requirements;
}

/**
 * Parse job description text and extract structured information
 * @param text - Job description text to parse
 * @returns Parsed job description with extracted information
 */
export function parseJobDescription(text: string): ParsedJobDescription {
  if (!text || typeof text !== 'string') {
    logger.warn('Invalid job description text provided');
    return {
      keywords: [],
      requiredSkills: [],
      preferredSkills: [],
      requirements: [],
    };
  }

  if (text.trim().length === 0) {
    logger.warn('Empty job description text provided');
    return {
      keywords: [],
      requiredSkills: [],
      preferredSkills: [],
      requirements: [],
    };
  }

  try {
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const jobTitle = extractJobTitle(normalizedText);
    const company = extractCompany(normalizedText);
    const experienceLevel = extractExperienceLevel(normalizedText);
    const keywords = extractKeywords(normalizedText);
    const requiredSkills = extractRequiredSkills(normalizedText);
    const preferredSkills = extractPreferredSkills(normalizedText);
    const requirements = extractRequirements(normalizedText);

    logger.debug(`Parsed job description: title=${jobTitle}, company=${company}, keywords=${keywords.length}`);

    return {
      keywords,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      jobTitle,
      company,
      requirements,
    };
  } catch (error) {
    logger.error('Error parsing job description:', error);
    // Return partial results if possible
    return {
      keywords: extractKeywords(text),
      requiredSkills: [],
      preferredSkills: [],
      requirements: [],
    };
  }
}
