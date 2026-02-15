/**
 * Markdown report generator service
 * Generates human-readable Markdown reports summarizing resume enhancements
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import type { EnhancedResumeOutput, ChangeDetail } from '@resume-types/enhancement.types';
import type { PersonalInfo } from '@resume-types/resume.types';
import { logger } from '@utils/logger';

/**
 * Error thrown when Markdown file cannot be written
 */
export class MarkdownWriteError extends Error {
  constructor(message: string, public readonly filePath: string) {
    super(message);
    this.name = 'MarkdownWriteError';
  }
}

/**
 * Generate a human-readable Markdown report from enhanced resume output
 * @param enhancedOutput - Enhanced resume output with change tracking
 * @returns Markdown report as string
 */
export function generateMarkdownReport(enhancedOutput: EnhancedResumeOutput): string {
  const { updatedResume, highlightedSkills, changesDetail, changesSummary, suggestions } = enhancedOutput;

  const sections: string[] = [];

  // Header with name
  const name = updatedResume.personalInfo.name;
  sections.push(`# ${name} — Enhanced Resume Report\n`);

  // Contact information
  sections.push(formatContactInfo(updatedResume.personalInfo));

  // Highlighted Skills
  if (highlightedSkills.length > 0) {
    sections.push('## Highlighted Skills\n');
    highlightedSkills.forEach(skill => {
      sections.push(`- ${skill}`);
    });
    sections.push(''); // Empty line
  }

  // Experience Changes
  const experienceChanges = changesDetail.filter(change => change.type === 'bulletPoint');
  if (experienceChanges.length > 0) {
    sections.push(formatExperienceChanges(experienceChanges));
  }

  // Changes Summary
  sections.push('## Changes Summary\n');
  sections.push(changesSummary);
  sections.push(''); // Empty line

  // Changes Detail Table
  if (changesDetail.length > 0) {
    sections.push(formatChangesTable(changesDetail));
  }

  // Suggestions
  if (suggestions.length > 0) {
    sections.push('## Suggestions\n');
    suggestions.forEach(suggestion => {
      sections.push(`- ${suggestion}`);
    });
    sections.push(''); // Empty line
  }

  return sections.join('\n');
}

/**
 * Format contact information section
 * @param personalInfo - Personal information object
 * @returns Formatted contact info as Markdown
 */
export function formatContactInfo(personalInfo: PersonalInfo): string {
  const lines: string[] = ['## Contact\n'];

  if (personalInfo.email) {
    lines.push(`- Email: ${personalInfo.email}`);
  }
  if (personalInfo.phone) {
    lines.push(`- Phone: ${personalInfo.phone}`);
  }
  if (personalInfo.location) {
    lines.push(`- Location: ${personalInfo.location}`);
  }
  if (personalInfo.linkedin) {
    lines.push(`- LinkedIn: ${personalInfo.linkedin}`);
  }
  if (personalInfo.github) {
    lines.push(`- GitHub: ${personalInfo.github}`);
  }
  if (personalInfo.website) {
    lines.push(`- Website: ${personalInfo.website}`);
  }

  lines.push(''); // Empty line after contact section
  return lines.join('\n');
}

/**
 * Format experience changes section
 * @param changesDetail - Array of change details (filtered for experience)
 * @returns Formatted experience changes as Markdown
 */
export function formatExperienceChanges(changesDetail: ChangeDetail[]): string {
  const sections: string[] = ['## Experience Changes\n'];

  changesDetail.forEach((change, index) => {
    if (change.type === 'bulletPoint') {
      sections.push(`### Change ${index + 1}${change.section ? ` (${change.section})` : ''}\n`);
      sections.push(`- **Original:** ${escapeMarkdown(change.old)}`);
      sections.push(`- **Enhanced:** ${escapeMarkdown(change.new)}`);
      sections.push(''); // Empty line between changes
    }
  });

  return sections.join('\n');
}

/**
 * Format changes detail as a Markdown table
 * @param changesDetail - Array of all change details
 * @returns Formatted changes table as Markdown
 */
export function formatChangesTable(changesDetail: ChangeDetail[]): string {
  const sections: string[] = ['## Changes Detail\n'];

  if (changesDetail.length === 0) {
    sections.push('No changes were made.\n');
    return sections.join('\n');
  }

  // Create table header
  sections.push('| Original | Enhanced | Section | Type |');
  sections.push('|----------|----------|---------|------|');

  // Add table rows
  changesDetail.forEach(change => {
    const original = escapeMarkdownTableCell(change.old);
    const enhanced = escapeMarkdownTableCell(change.new);
    const section = change.section || '-';
    const type = change.type || '-';
    sections.push(`| ${original} | ${enhanced} | ${section} | ${type} |`);
  });

  sections.push(''); // Empty line after table
  return sections.join('\n');
}

/**
 * Escape Markdown special characters for regular text
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\*/g, '\\*')
    .replace(/#/g, '\\#')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Escape Markdown special characters for table cells
 * @param text - Text to escape
 * @returns Escaped text safe for table cells
 */
function escapeMarkdownTableCell(text: string): string {
  // For table cells, we need to escape pipes and newlines
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .trim();
}

/**
 * Write Markdown report to file system
 * @param content - Markdown content to write
 * @param filePath - Path where Markdown file should be written
 * @returns Promise that resolves when file is written
 */
export async function writeMarkdownReport(content: string, filePath: string): Promise<void> {
  try {
    // Resolve absolute path
    const absolutePath = path.resolve(filePath);
    const outputDir = path.dirname(absolutePath);

    // Ensure output directory exists
    logger.debug(`Ensuring output directory exists: ${outputDir}`);
    await fs.ensureDir(outputDir);

    // Validate that we can write to the directory
    try {
      await fs.access(outputDir, fs.constants.W_OK);
    } catch (error) {
      throw new MarkdownWriteError(
        `Cannot write to output directory: ${outputDir}`,
        outputDir
      );
    }

    // Write Markdown file
    logger.debug(`Writing Markdown report to: ${absolutePath}`);
    await fs.writeFile(absolutePath, content, 'utf8');

    logger.info(`Markdown report written successfully to: ${absolutePath}`);
  } catch (error) {
    if (error instanceof MarkdownWriteError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new MarkdownWriteError(
      `Failed to write Markdown report: ${errorMessage}`,
      filePath
    );
  }
}

/**
 * Generate and write Markdown report in one step
 * @param enhancedOutput - Enhanced resume output with change tracking
 * @param filePath - Path where Markdown file should be written
 * @returns Promise that resolves when file is written
 */
export async function generateAndWriteMarkdownReport(
  enhancedOutput: EnhancedResumeOutput,
  filePath: string
): Promise<void> {
  const markdown = generateMarkdownReport(enhancedOutput);
  await writeMarkdownReport(markdown, filePath);
}
