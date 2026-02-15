#!/usr/bin/env node
/**
 * CLI entry point for resume builder
 */

import { Command } from 'commander';
import { logger } from '../utils/logger';
import packageJson from '../../package.json';

const program = new Command();

// Set up program metadata
program
  .name('resume-builder')
  .description('A modular, ATS-friendly resume generator')
  .version(packageJson.version || '1.0.0');

// Configure logger verbose mode (will be set per command)

// Generate resume command (will be implemented in Task 8.2)
program
  .command('generate')
  .description('Generate a resume from JSON input')
  .alias('gen')
  .option('-i, --input <path>', 'Path to resume.json file (required)')
  .option('-o, --output <path>', 'Path for output file (required)')
  .option('-t, --template <name>', 'Template name (modern, classic)', 'classic')
  .option('-f, --format <format>', 'Output format (pdf, html)', 'pdf')
  .option('--validate', 'Run ATS validation', false)
  .option('--spacing <mode>', 'Spacing mode: auto (default), compact, normal', 'auto')
  .option('--compact', 'Use compact spacing (shorthand for --spacing compact)', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      // Set verbose mode if requested
      if (options.verbose) {
        logger.setVerbose(true);
      }

      // Import templates to ensure they are registered
      await import('../templates');

      // Import here to avoid circular dependencies
      const { generateResumeFromFile } = await import('../services/resumeGenerator');
      
      // Validate required options
      if (!options.input) {
        logger.error('Error: --input is required');
        program.help();
        process.exit(1);
      }

      if (!options.output) {
        logger.error('Error: --output is required');
        program.help();
        process.exit(1);
      }

      // Validate format
      if (!['pdf', 'html'].includes(options.format.toLowerCase())) {
        logger.error(`Error: Invalid format "${options.format}". Must be "pdf" or "html"`);
        process.exit(1);
      }

      // Determine spacing mode
      let spacing: 'auto' | 'compact' | 'normal' = options.compact ? 'compact' : (options.spacing as 'auto' | 'compact' | 'normal' || 'auto');
      if (!['auto', 'compact', 'normal'].includes(spacing)) {
        logger.error(`Error: Invalid spacing mode "${spacing}". Must be "auto", "compact", or "normal"`);
        process.exit(1);
      }

      // Validate template (will be checked by generator service)
      
      logger.info('Starting resume generation...');
      
      const result = await generateResumeFromFile(
        options.input,
        options.output,
        {
          template: options.template,
          format: options.format.toLowerCase() as 'pdf' | 'html',
          validate: options.validate,
          templateOptions: {
            spacing: spacing as 'auto' | 'compact' | 'normal',
          },
        }
      );

      // Display results
      logger.success(`\n✅ Resume generated successfully!`);
      logger.info(`   Output: ${result.outputPath}`);
      logger.info(`   Format: ${result.format.toUpperCase()}`);
      logger.info(`   Template: ${result.template}`);
      logger.info(`   Size: ${(result.fileSize / 1024).toFixed(2)} KB`);

      // Display ATS validation results if enabled
      if (result.atsValidation) {
        logger.info(`\n📊 ATS Validation Results:`);
        logger.info(`   Score: ${result.atsValidation.score}/100`);
        logger.info(`   Status: ${result.atsValidation.isCompliant ? '✅ Compliant' : '⚠️  Needs Improvement'}`);
        
        if (result.atsValidation.errors.length > 0) {
          logger.warn(`\n   Errors (${result.atsValidation.errors.length}):`);
          result.atsValidation.errors.forEach((error) => {
            logger.warn(`   - ${error}`);
          });
        }

        if (result.atsValidation.warnings.length > 0) {
          logger.warn(`\n   Warnings (${result.atsValidation.warnings.length}):`);
          result.atsValidation.warnings.forEach((warning) => {
            logger.warn(`   - ${warning}`);
          });
        }
      }

      // Display warnings
      if (result.warnings.length > 0) {
        logger.warn(`\n⚠️  Warnings:`);
        result.warnings.forEach((warning) => {
          logger.warn(`   - ${warning}`);
        });
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`\n❌ Error: ${error.message}`);
        if (logger.isVerbose()) {
          logger.error(`\nStack trace:\n${error.stack}`);
        }
      } else {
        logger.error(`\n❌ Unknown error occurred`);
        if (logger.isVerbose()) {
          logger.error(String(error));
        }
      }
      process.exit(1);
    }
  });

// List templates command
program
  .command('templates')
  .description('List available resume templates')
  .alias('list')
  .action(async () => {
    try {
      // Import templates to ensure they are registered
      await import('../templates');
      const { getTemplateNames } = await import('../templates/templateRegistry');
      const templates = getTemplateNames();
      
      logger.info('Available templates:');
      templates.forEach((template: string) => {
        logger.info(`  - ${template}`);
      });
      
      process.exit(0);
    } catch (error) {
      logger.error(`Error listing templates: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Validate resume command
program
  .command('validate')
  .description('Validate a resume JSON file for ATS compliance')
  .option('-i, --input <path>', 'Path to resume.json file (required)')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      // Set verbose mode if requested
      if (options.verbose) {
        logger.setVerbose(true);
      }

      if (!options.input) {
        logger.error('Error: --input is required');
        program.help();
        process.exit(1);
      }

      const { parseResume } = await import('../utils/resumeParser');
      const { validateAtsCompliance } = await import('../services/atsValidator');

      logger.info('Validating resume...');
      
      const resume = await parseResume({
        resumePath: options.input,
        validate: true,
      });

      const validation = validateAtsCompliance(resume);

      // Display results
      logger.info(`\n📊 ATS Validation Results:`);
      logger.info(`   Score: ${validation.score}/100`);
      logger.info(`   Status: ${validation.isCompliant ? '✅ Compliant' : '⚠️  Needs Improvement'}`);
      
      if (validation.errors.length > 0) {
        logger.error(`\n   Errors (${validation.errors.length}):`);
        validation.errors.forEach((error) => {
          logger.error(`   - ${error}`);
        });
      }

      if (validation.warnings.length > 0) {
        logger.warn(`\n   Warnings (${validation.warnings.length}):`);
        validation.warnings.forEach((warning) => {
          logger.warn(`   - ${warning}`);
        });
      }

      if (validation.errors.length === 0 && validation.warnings.length === 0) {
        logger.success('\n✅ No issues found!');
      }

      process.exit(validation.isCompliant ? 0 : 1);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`\n❌ Error: ${error.message}`);
        if (logger.isVerbose()) {
          logger.error(`\nStack trace:\n${error.stack}`);
        }
      } else {
        logger.error(`\n❌ Unknown error occurred`);
        if (logger.isVerbose()) {
          logger.error(String(error));
        }
      }
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export default program;
