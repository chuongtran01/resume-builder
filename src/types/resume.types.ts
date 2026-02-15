/**
 * Type definitions for the Resume JSON schema
 * Supports both direct objects and file references (file:./path/to/file.json)
 */

/**
 * Personal information section
 */
export interface PersonalInfo {
  /** Full name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** Location (city, state, country) */
  location: string;
  /** LinkedIn profile URL (optional) */
  linkedin?: string;
  /** GitHub profile URL (optional) */
  github?: string;
  /** Personal website URL (optional) */
  website?: string;
}

/**
 * Work experience entry
 */
export interface Experience {
  /** Company name */
  company: string;
  /** Job title/role */
  role: string;
  /** Start date in YYYY-MM format */
  startDate: string;
  /** End date in YYYY-MM format or "Present" */
  endDate: string;
  /** Job location */
  location: string;
  /** List of achievement/description bullet points */
  bulletPoints: string[];
}

/**
 * Education entry
 */
export interface Education {
  /** Institution name */
  institution: string;
  /** Degree type (e.g., "Bachelor of Science") */
  degree: string;
  /** Field of study */
  field: string;
  /** Graduation date in YYYY-MM format */
  graduationDate: string;
  /** GPA (optional) */
  gpa?: string;
  /** Honors or distinctions (optional) */
  honors?: string[];
}

/**
 * Skill category with items
 */
export interface SkillCategory {
  /** Category name (e.g., "Programming Languages") */
  name: string;
  /** List of skills in this category */
  items: string[];
}

/**
 * Skills section with categorized skills
 */
export interface Skills {
  /** Array of skill categories */
  categories: SkillCategory[];
}

/**
 * Certification entry
 */
export interface Certification {
  /** Certification name */
  name: string;
  /** Issuing organization */
  issuer: string;
  /** Date obtained in YYYY-MM format */
  date: string;
  /** Expiration date in YYYY-MM format (optional) */
  expirationDate?: string;
  /** Credential ID or certificate number (optional) */
  credentialId?: string;
}

/**
 * Project entry
 */
export interface Project {
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** Technologies used */
  technologies?: string[];
  /** Project URL (optional) */
  url?: string;
  /** GitHub repository URL (optional) */
  github?: string;
  /** Date completed in YYYY-MM format (optional) */
  date?: string;
}

/**
 * Language proficiency entry
 */
export interface Language {
  /** Language name */
  name: string;
  /** Proficiency level (e.g., "Native", "Fluent", "Conversational") */
  proficiency: string;
}

/**
 * Award or recognition entry
 */
export interface Award {
  /** Award name */
  name: string;
  /** Issuing organization */
  issuer: string;
  /** Date received in YYYY-MM format */
  date: string;
  /** Description (optional) */
  description?: string;
}

/**
 * File reference type - supports loading sections from external JSON files
 * Format: "file:./path/to/file.json"
 */
export type FileReference = `file:${string}`;

/**
 * Union type for sections that can be either an object/array or a file reference
 */
export type SectionOrFile<T> = T | FileReference;

/**
 * Main Resume interface
 * All sections except personalInfo and experience are optional
 * Sections can be provided as objects/arrays or as file references
 */
export interface Resume {
  /** Personal information (required) */
  personalInfo: PersonalInfo;
  /** Professional summary (optional) */
  summary?: string;
  /** Work experience (required) */
  experience: Experience[];
  /** Education - can be single entry, array, or file reference (optional) */
  education?: SectionOrFile<Education | Education[]>;
  /** Skills - can be object or file reference (optional) */
  skills?: SectionOrFile<Skills>;
  /** Certifications - can be array or file reference (optional) */
  certifications?: SectionOrFile<Certification[]>;
  /** Projects - can be array or file reference (optional) */
  projects?: SectionOrFile<Project[]>;
  /** Languages - can be array or file reference (optional) */
  languages?: SectionOrFile<Language[]>;
  /** Awards - can be array or file reference (optional) */
  awards?: SectionOrFile<Award[]>;
}

/**
 * Type guard to check if a value is a file reference
 */
export function isFileReference(value: unknown): value is FileReference {
  return typeof value === 'string' && value.startsWith('file:');
}

/**
 * Type guard to check if education is a single Education object
 */
export function isSingleEducation(
  education: SectionOrFile<Education | Education[]>
): education is Education {
  return (
    typeof education === 'object' &&
    education !== null &&
    !Array.isArray(education) &&
    !isFileReference(education) &&
    'institution' in education
  );
}

/**
 * Type guard to check if education is an array of Education objects
 */
export function isEducationArray(
  education: SectionOrFile<Education | Education[]>
): education is Education[] {
  return (
    Array.isArray(education) &&
    education.length > 0 &&
    education[0] !== undefined &&
    'institution' in education[0]
  );
}
