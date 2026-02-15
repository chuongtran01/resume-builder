/**
 * Enhanced resume JSON generator service
 * Combines enhanced resume with change tracking metadata into final JSON output
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import type { EnhancementResult, EnhancedResumeOutput, ChangeDetail } from '@resume-types/enhancement.types';
import { logger } from '@utils/logger';
import { MockResumeEnhancementService } from '@services/resumeEnhancementService';

/**
 * Error thrown when output directory cannot be created
 */
export class OutputDirectoryError extends Error {
  constructor(message: string, public readonly directory: string) {
    super(message);
    this.name = 'OutputDirectoryError';
  }
}

/**
 * Error thrown when JSON file cannot be written
 */
export class JsonWriteError extends Error {
  constructor(message: string, public readonly filePath: string) {
    super(message);
    this.name = 'JsonWriteError';
  }
}

/**
 * Options for generating enhanced resume output
 */
export interface EnhancedResumeGeneratorOptions {
  /** Output directory for generated files */
  outputDir?: string;
  /** Base name for output files (default: 'enhancedResume') */
  baseName?: string;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<EnhancedResumeGeneratorOptions> = {
  outputDir: './output',
  baseName: 'enhancedResume',
};

/**
 * Generate enhanced resume output structure from enhancement result
 * @param result - Enhancement result from enhancement service
 * @param options - Generator options
 * @returns Enhanced resume output with all metadata
 */
export function generateEnhancedResumeOutput(
  result: EnhancementResult,
  options: EnhancedResumeGeneratorOptions = {}
): EnhancedResumeOutput {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Ensure output directory exists
  const outputDir = path.resolve(opts.outputDir);
  
  // Generate output file paths
  const pdfPath = path.join(outputDir, `${opts.baseName}.pdf`);
  const mdPath = path.join(outputDir, `${opts.baseName}.md`);
  
  // Generate change details from improvements
  const changesDetail: ChangeDetail[] = result.improvements.map(improvement => ({
    old: improvement.original,
    new: improvement.suggested,
    section: improvement.section,
    type: improvement.type,
  }));

  // Generate changes summary
  const enhancementService = new MockResumeEnhancementService();
  const changesSummary = enhancementService.generateChangesSummary(changesDetail);

  // Generate suggestions from recommendations
  const suggestions = result.recommendations;

  // Identify highlighted skills from keyword suggestions and resume
  const highlightedSkills = identifyHighlightedSkills(
    result.keywordSuggestions,
    result.enhancedResume
  );

  logger.debug(`Generated enhanced resume output structure with ${changesDetail.length} changes`);

  return {
    updatedResume: result.enhancedResume,
    suggestions,
    highlightedSkills,
    changesSummary,
    changesDetail,
    pdfPath,
    mdPath,
  };
}

/**
 * Identify highlighted skills from keyword suggestions and resume
 */
function identifyHighlightedSkills(
  keywordSuggestions: EnhancementResult['keywordSuggestions'],
  resume: EnhancementResult['enhancedResume']
): string[] {
  const highlighted: string[] = [];
  const resumeText = JSON.stringify(resume).toLowerCase();

  // Add keywords that are in the resume and have high importance
  for (const suggestion of keywordSuggestions) {
    if (suggestion.importance === 'high' && resumeText.includes(suggestion.keyword.toLowerCase())) {
      highlighted.push(suggestion.keyword);
    }
  }

  // Also check for skills in the resume that match keywords
  if (resume.skills && typeof resume.skills === 'object' && resume.skills.categories) {
    for (const category of resume.skills.categories) {
      if (category.items) {
        for (const item of category.items) {
          // Check if this skill matches any high-importance keyword
          const matchesKeyword = keywordSuggestions.some(
            ks => ks.importance === 'high' && 
            item.toLowerCase().includes(ks.keyword.toLowerCase())
          );
          if (matchesKeyword && !highlighted.includes(item)) {
            highlighted.push(item);
          }
        }
      }
    }
  }

  return highlighted.slice(0, 15); // Limit to top 15
}

/**
 * Write enhanced resume JSON to file system
 * @param output - Enhanced resume output to write
 * @param filePath - Path where JSON file should be written
 * @returns Promise that resolves when file is written
 */
export async function writeEnhancedResumeJson(
  output: EnhancedResumeOutput,
  filePath: string
): Promise<void> {
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
      throw new OutputDirectoryError(
        `Cannot write to output directory: ${outputDir}`,
        outputDir
      );
    }

    // Prepare JSON data with proper formatting
    const jsonData = JSON.stringify(output, null, 2);

    // Write JSON file
    logger.debug(`Writing enhanced resume JSON to: ${absolutePath}`);
    await fs.writeFile(absolutePath, jsonData, 'utf8');

    logger.info(`Enhanced resume JSON written successfully to: ${absolutePath}`);
  } catch (error) {
    if (error instanceof OutputDirectoryError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new JsonWriteError(
      `Failed to write enhanced resume JSON: ${errorMessage}`,
      filePath
    );
  }
}

/**
 * Generate and write enhanced resume JSON in one step
 * @param result - Enhancement result from enhancement service
 * @param options - Generator options
 * @returns Promise resolving to the written file path
 */
export async function generateAndWriteEnhancedResume(
  result: EnhancementResult,
  options: EnhancedResumeGeneratorOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const outputDir = path.resolve(opts.outputDir);
  
  // Generate output structure
  const output = generateEnhancedResumeOutput(result, options);
  
  // Generate JSON file path
  const jsonPath = path.join(outputDir, `${opts.baseName}.json`);
  
  // Write JSON file
  await writeEnhancedResumeJson(output, jsonPath);
  
  return jsonPath;
}
