#!/usr/bin/env node
/**
 * CLI entry point for resume builder
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from '@utils/logger';
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
      await import('@templates/index');

      // Import here to avoid circular dependencies
      const { generateResumeFromFile } = await import('@services/resumeGenerator');
      
      // Validate required options
      if (!options.input) {
        logger.error('❌ Error: --input is required');
        logger.info('💡 Tip: Use --input <path> to specify the resume JSON file');
        logger.info('   Example: --input examples/resume.json');
        program.help();
        process.exit(1);
      }

      if (!options.output) {
        logger.error('❌ Error: --output is required');
        logger.info('💡 Tip: Use --output <path> to specify where to save the generated resume');
        logger.info('   Example: --output resume.pdf');
        program.help();
        process.exit(1);
      }

      // Validate input file
      const inputPath = path.resolve(options.input);
      const inputExists = await fs.pathExists(inputPath);
      if (!inputExists) {
        logger.error(`❌ Error: Input file not found: ${inputPath}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check if the file path is correct`);
        logger.info(`   - Ensure the file exists at: ${inputPath}`);
        logger.info(`   - Use an absolute path or a path relative to the current directory`);
        process.exit(1);
      }

      // Check if input is a file (not a directory)
      const inputStats = await fs.stat(inputPath);
      if (!inputStats.isFile()) {
        logger.error(`❌ Error: Input path is not a file: ${inputPath}`);
        logger.info('💡 Tip: The --input option must point to a JSON file, not a directory');
        process.exit(1);
      }

      // Check if input file has .json extension (warning, not error)
      if (!inputPath.toLowerCase().endsWith('.json')) {
        logger.warn(`⚠️  Warning: Input file does not have .json extension: ${inputPath}`);
        logger.info('💡 Tip: Resume files should typically have a .json extension');
      }

      // Validate output path
      const outputPath = path.resolve(options.output);
      const outputDir = path.dirname(outputPath);
      const outputDirExists = await fs.pathExists(outputDir);
      
      if (!outputDirExists) {
        logger.error(`❌ Error: Output directory does not exist: ${outputDir}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Create the directory: mkdir -p ${outputDir}`);
        logger.info(`   - Use an existing directory for the output path`);
        process.exit(1);
      }

      // Check if output directory is writable
      try {
        await fs.access(outputDir, fs.constants.W_OK);
      } catch (error) {
        logger.error(`❌ Error: Output directory is not writable: ${outputDir}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check directory permissions`);
        logger.info(`   - Ensure you have write access to: ${outputDir}`);
        process.exit(1);
      }

      // Validate format
      const format = options.format.toLowerCase();
      if (!['pdf', 'html'].includes(format)) {
        logger.error(`❌ Error: Invalid format "${options.format}"`);
        logger.info('💡 Valid formats are:');
        logger.info('   - pdf (Portable Document Format)');
        logger.info('   - html (HyperText Markup Language)');
        logger.info(`   Example: --format pdf`);
        process.exit(1);
      }

      // Determine spacing mode
      let spacing: 'auto' | 'compact' | 'normal' = options.compact ? 'compact' : (options.spacing as 'auto' | 'compact' | 'normal' || 'auto');
      if (!['auto', 'compact', 'normal'].includes(spacing)) {
        logger.error(`❌ Error: Invalid spacing mode "${spacing}"`);
        logger.info('💡 Valid spacing modes are:');
        logger.info('   - auto (automatically adjust based on content)');
        logger.info('   - compact (minimal spacing for dense content)');
        logger.info('   - normal (standard spacing)');
        logger.info(`   Example: --spacing compact`);
        process.exit(1);
      }

      // Validate template
      const { getTemplateNames, hasTemplate } = await import('@templates/templateRegistry');
      const availableTemplates = getTemplateNames();
      
      if (!hasTemplate(options.template)) {
        logger.error(`❌ Error: Template "${options.template}" not found`);
        logger.info('💡 Available templates:');
        availableTemplates.forEach((template: string) => {
          logger.info(`   - ${template}`);
        });
        logger.info(`   Example: --template ${availableTemplates[0] || 'classic'}`);
        process.exit(1);
      }
      
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
      // Import error types for type checking
      const { FileNotFoundError, InvalidJsonError } = await import('@utils/fileLoader');
      const { ResumeValidationError, MissingRequiredFieldError } = await import('@utils/resumeParser');
      const { TemplateNotFoundError } = await import('@services/resumeGenerator');
      const { PdfGenerationError } = await import('@utils/pdfGenerator');

      if (error instanceof FileNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Check if the file path is correct');
        logger.info('   - Ensure all referenced files exist');
        logger.info('   - Verify file: references in your resume.json are valid');
      } else if (error instanceof InvalidJsonError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Validate your JSON syntax using a JSON validator');
        logger.info('   - Check for missing commas, brackets, or quotes');
        logger.info('   - Ensure all strings are properly escaped');
      } else if (error instanceof ResumeValidationError) {
        logger.error(`\n❌ ${error.message}`);
        if (error.errors.length > 0) {
          logger.info('\n   Validation errors:');
          error.errors.forEach((err) => {
            logger.error(`   - ${err}`);
          });
        }
        logger.info('\n💡 Suggestions:');
        logger.info('   - Ensure all required fields are present in your resume.json');
        logger.info('   - Check the resume schema documentation');
        logger.info('   - Run with --validate to see detailed validation results');
      } else if (error instanceof MissingRequiredFieldError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Tip: Check your resume.json file and ensure all required fields are included');
      } else if (error instanceof TemplateNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        const { getTemplateNames } = await import('../templates/templateRegistry');
        const availableTemplates = getTemplateNames();
        logger.info('💡 Available templates:');
        availableTemplates.forEach((template: string) => {
          logger.info(`   - ${template}`);
        });
      } else if (error instanceof PdfGenerationError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Ensure Puppeteer dependencies are installed correctly');
        logger.info('   - Check if you have sufficient disk space');
        logger.info('   - Try generating HTML format instead: --format html');
        if (error.originalError) {
          logger.info(`   - Original error: ${error.originalError.message}`);
        }
      } else if (error instanceof Error) {
        logger.error(`\n❌ Error: ${error.message}`);
        if (logger.isVerbose()) {
          logger.error(`\nStack trace:\n${error.stack}`);
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
        }
      } else {
        logger.error(`\n❌ Unknown error occurred`);
        if (logger.isVerbose()) {
          logger.error(String(error));
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
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
      await import('@templates/index');
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
        logger.error('❌ Error: --input is required');
        logger.info('💡 Tip: Use --input <path> to specify the resume JSON file');
        logger.info('   Example: --input examples/resume.json');
        program.help();
        process.exit(1);
      }

      // Validate input file
      const inputPath = path.resolve(options.input);
      const inputExists = await fs.pathExists(inputPath);
      if (!inputExists) {
        logger.error(`❌ Error: Input file not found: ${inputPath}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check if the file path is correct`);
        logger.info(`   - Ensure the file exists at: ${inputPath}`);
        logger.info(`   - Use an absolute path or a path relative to the current directory`);
        process.exit(1);
      }

      // Check if input is a file (not a directory)
      const inputStats = await fs.stat(inputPath);
      if (!inputStats.isFile()) {
        logger.error(`❌ Error: Input path is not a file: ${inputPath}`);
        logger.info('💡 Tip: The --input option must point to a JSON file, not a directory');
        process.exit(1);
      }

      const { parseResume } = await import('@utils/resumeParser');
      const { validateAtsCompliance } = await import('@services/atsValidator');

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
      // Import error types for type checking
      const { FileNotFoundError, InvalidJsonError } = await import('@utils/fileLoader');
      const { ResumeValidationError, MissingRequiredFieldError } = await import('@utils/resumeParser');

      if (error instanceof FileNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Check if the file path is correct');
        logger.info('   - Ensure the file exists at the specified location');
        logger.info('   - Use an absolute path or a path relative to the current directory');
      } else if (error instanceof InvalidJsonError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Validate your JSON syntax using a JSON validator');
        logger.info('   - Check for missing commas, brackets, or quotes');
        logger.info('   - Ensure all strings are properly escaped');
      } else if (error instanceof ResumeValidationError) {
        logger.error(`\n❌ ${error.message}`);
        if (error.errors.length > 0) {
          logger.info('\n   Validation errors:');
          error.errors.forEach((err) => {
            logger.error(`   - ${err}`);
          });
        }
        logger.info('\n💡 Suggestions:');
        logger.info('   - Ensure all required fields are present in your resume.json');
        logger.info('   - Check the resume schema documentation');
      } else if (error instanceof MissingRequiredFieldError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Tip: Check your resume.json file and ensure all required fields are included');
      } else if (error instanceof Error) {
        logger.error(`\n❌ Error: ${error.message}`);
        if (logger.isVerbose()) {
          logger.error(`\nStack trace:\n${error.stack}`);
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
        }
      } else {
        logger.error(`\n❌ Unknown error occurred`);
        if (logger.isVerbose()) {
          logger.error(String(error));
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
        }
      }
      process.exit(1);
    }
  });

// Enhance resume command
program
  .command('enhanceResume')
  .description('Enhance a resume based on a job description')
  .alias('enhance')
  .option('-i, --input <path>', 'Path to resume.json file (required)')
  .option('-j, --job <path>', 'Path to job description file (required)')
  .option('-o, --output <path>', 'Output directory for enhanced files', './output')
  .option('-t, --template <name>', 'Template name (modern, classic)', 'classic')
  .option('-f, --format <format>', 'Output format (pdf, html)', 'pdf')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      // Set verbose mode if requested
      if (options.verbose) {
        logger.setVerbose(true);
      }

      // Import templates to ensure they are registered
      await import('@templates/index');

      // Validate required options
      if (!options.input) {
        logger.error('❌ Error: --input is required');
        logger.info('💡 Tip: Use --input <path> to specify the resume JSON file');
        logger.info('   Example: --input examples/resume.json');
        program.help();
        process.exit(1);
      }

      if (!options.job) {
        logger.error('❌ Error: --job is required');
        logger.info('💡 Tip: Use --job <path> to specify the job description file');
        logger.info('   Example: --job examples/jobDescription.txt');
        program.help();
        process.exit(1);
      }

      // Validate input file
      const inputPath = path.resolve(options.input);
      const inputExists = await fs.pathExists(inputPath);
      if (!inputExists) {
        logger.error(`❌ Error: Input file not found: ${inputPath}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check if the file path is correct`);
        logger.info(`   - Ensure the file exists at: ${inputPath}`);
        process.exit(1);
      }

      const inputStats = await fs.stat(inputPath);
      if (!inputStats.isFile()) {
        logger.error(`❌ Error: Input path is not a file: ${inputPath}`);
        process.exit(1);
      }

      // Validate job description file
      const jobPath = path.resolve(options.job);
      const jobExists = await fs.pathExists(jobPath);
      if (!jobExists) {
        logger.error(`❌ Error: Job description file not found: ${jobPath}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check if the file path is correct`);
        logger.info(`   - Ensure the file exists at: ${jobPath}`);
        process.exit(1);
      }

      const jobStats = await fs.stat(jobPath);
      if (!jobStats.isFile()) {
        logger.error(`❌ Error: Job description path is not a file: ${jobPath}`);
        process.exit(1);
      }

      // Validate output directory
      const outputDir = path.resolve(options.output);
      try {
        await fs.ensureDir(outputDir);
        await fs.access(outputDir, fs.constants.W_OK);
      } catch (error) {
        logger.error(`❌ Error: Cannot write to output directory: ${outputDir}`);
        logger.info('💡 Suggestions:');
        logger.info(`   - Check directory permissions`);
        logger.info(`   - Ensure you have write access to: ${outputDir}`);
        process.exit(1);
      }

      // Validate format
      const format = options.format.toLowerCase();
      if (!['pdf', 'html'].includes(format)) {
        logger.error(`❌ Error: Invalid format "${options.format}"`);
        logger.info('💡 Valid formats are: pdf, html');
        process.exit(1);
      }

      // Validate template
      const { getTemplateNames, hasTemplate } = await import('@templates/templateRegistry');
      const availableTemplates = getTemplateNames();
      
      if (!hasTemplate(options.template)) {
        logger.error(`❌ Error: Template "${options.template}" not found`);
        logger.info('💡 Available templates:');
        availableTemplates.forEach((template: string) => {
          logger.info(`   - ${template}`);
        });
        process.exit(1);
      }

      logger.info('🚀 Starting resume enhancement...\n');

      // Step 1: Load and parse resume
      logger.info('📄 Step 1: Loading resume...');
      const { parseResume } = await import('@utils/resumeParser');
      const resume = await parseResume({
        resumePath: options.input,
        validate: true,
      });
      logger.success('   ✅ Resume loaded successfully');

      // Step 2: Load job description
      logger.info('\n📋 Step 2: Loading job description...');
      const jobDescription = await fs.readFile(jobPath, 'utf8');
      if (!jobDescription.trim()) {
        logger.error('❌ Error: Job description file is empty');
        process.exit(1);
      }
      logger.success('   ✅ Job description loaded successfully');

      // Step 3: Enhance resume
      logger.info('\n🤖 Step 3: Enhancing resume...');
      const { resumeEnhancementService } = await import('@services/resumeEnhancementService');
      const enhancementResult = await resumeEnhancementService.enhanceResume(
        resume,
        jobDescription
      );
      logger.success('   ✅ Resume enhanced successfully');
      logger.info(`   📊 ATS Score: ${enhancementResult.atsScore.before} → ${enhancementResult.atsScore.after} (+${enhancementResult.atsScore.improvement})`);
      logger.info(`   📝 Changes: ${enhancementResult.improvements.length} improvements made`);

      // Step 4: Generate enhanced JSON
      logger.info('\n📦 Step 4: Generating enhanced resume JSON...');
      const { generateAndWriteEnhancedResume } = await import('@services/enhancedResumeGenerator');
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const jsonPath = await generateAndWriteEnhancedResume(enhancementResult, {
        outputDir: options.output,
        baseName: `${baseName}-enhanced`,
      });
      logger.success(`   ✅ Enhanced JSON written: ${jsonPath}`);

      // Step 5: Generate PDF
      logger.info(`\n📄 Step 5: Generating ${format.toUpperCase()}...`);
      const { generateResumeFromObject } = await import('@services/resumeGenerator');
      const pdfPath = path.join(outputDir, `${baseName}-enhanced.${format}`);
      const pdfResult = await generateResumeFromObject(
        enhancementResult.enhancedResume,
        pdfPath,
        {
          template: options.template,
          format: format as 'pdf' | 'html',
          validate: false,
        }
      );
      logger.success(`   ✅ ${format.toUpperCase()} generated: ${pdfResult.outputPath}`);

      // Step 6: Generate Markdown report
      logger.info('\n📝 Step 6: Generating Markdown report...');
      const { generateEnhancedResumeOutput } = await import('@services/enhancedResumeGenerator');
      const { generateAndWriteMarkdownReport } = await import('@services/mdGenerator');
      const enhancedOutput = generateEnhancedResumeOutput(enhancementResult, {
        outputDir: options.output,
        baseName: `${baseName}-enhanced`,
      });
      const mdPath = path.join(outputDir, `${baseName}-enhanced.md`);
      await generateAndWriteMarkdownReport(enhancedOutput, mdPath);
      logger.success(`   ✅ Markdown report written: ${mdPath}`);

      // Display summary
      logger.success('\n✅ Resume enhancement completed successfully!\n');
      logger.info('📁 Generated files:');
      logger.info(`   📄 Enhanced JSON: ${jsonPath}`);
      logger.info(`   📄 ${format.toUpperCase()}: ${pdfResult.outputPath}`);
      logger.info(`   📄 Markdown Report: ${mdPath}`);
      logger.info('\n📊 Enhancement Summary:');
      logger.info(`   ATS Score Improvement: +${enhancementResult.atsScore.improvement} points`);
      logger.info(`   Total Changes: ${enhancementResult.improvements.length}`);
      logger.info(`   Suggestions: ${enhancementResult.recommendations.length}`);
      if (enhancementResult.missingSkills.length > 0) {
        logger.warn(`\n   Missing Skills: ${enhancementResult.missingSkills.slice(0, 5).join(', ')}${enhancementResult.missingSkills.length > 5 ? '...' : ''}`);
      }

      process.exit(0);
    } catch (error) {
      // Import error types for type checking
      const { FileNotFoundError, InvalidJsonError } = await import('@utils/fileLoader');
      const { ResumeValidationError, MissingRequiredFieldError } = await import('@utils/resumeParser');
      const { TemplateNotFoundError } = await import('@services/resumeGenerator');
      const { PdfGenerationError } = await import('@utils/pdfGenerator');
      const { JsonWriteError } = await import('@services/enhancedResumeGenerator');
      const { MarkdownWriteError } = await import('@services/mdGenerator');

      if (error instanceof FileNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Check if the file path is correct');
        logger.info('   - Ensure all referenced files exist');
      } else if (error instanceof InvalidJsonError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Validate your JSON syntax using a JSON validator');
        logger.info('   - Check for missing commas, brackets, or quotes');
      } else if (error instanceof ResumeValidationError) {
        logger.error(`\n❌ ${error.message}`);
        if (error.errors.length > 0) {
          logger.info('\n   Validation errors:');
          error.errors.forEach((err) => {
            logger.error(`   - ${err}`);
          });
        }
      } else if (error instanceof MissingRequiredFieldError) {
        logger.error(`\n❌ ${error.message}`);
      } else if (error instanceof TemplateNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        const { getTemplateNames } = await import('../templates/templateRegistry');
        const availableTemplates = getTemplateNames();
        logger.info('💡 Available templates:');
        availableTemplates.forEach((template: string) => {
          logger.info(`   - ${template}`);
        });
      } else if (error instanceof PdfGenerationError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Ensure Puppeteer dependencies are installed correctly');
        logger.info('   - Try generating HTML format instead: --format html');
      } else if (error instanceof JsonWriteError || error instanceof MarkdownWriteError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Check output directory permissions');
        logger.info('   - Ensure you have write access to the output directory');
      } else if (error instanceof Error) {
        logger.error(`\n❌ Error: ${error.message}`);
        if (logger.isVerbose()) {
          logger.error(`\nStack trace:\n${error.stack}`);
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
        }
      } else {
        logger.error(`\n❌ Unknown error occurred`);
        if (logger.isVerbose()) {
          logger.error(String(error));
        } else {
          logger.info('💡 Tip: Use --verbose flag to see detailed error information');
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
