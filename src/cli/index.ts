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
  .description('Enhance a resume based on a job description using AI')
  .alias('enhance')
  .option('-i, --input <path>', 'Path to resume.json file (required)')
  .option('-j, --job <path>', 'Path to job description file (required)')
  .option('-o, --output <path>', 'Output directory for enhanced files', './output')
  .option('-t, --template <name>', 'Template name (modern, classic)', 'classic')
  .option('-f, --format <format>', 'Output format (pdf, html)', 'pdf')
  .option('--ai-provider <provider>', 'AI provider to use (default: gemini)', 'gemini')
  .option('--ai-model <model>', 'AI model to use: gemini-2.5-pro (default) or gemini-3-flash-preview')
  .option('--ai-temperature <temp>', 'AI temperature 0-1 (default: 0.7)', parseFloat)
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

      // Validate AI provider
      if (options.aiProvider && options.aiProvider !== 'gemini') {
        logger.error(`❌ Error: Invalid AI provider "${options.aiProvider}"`);
        logger.info('💡 Valid providers are: gemini');
        process.exit(1);
      }

      // Validate AI model if provided
      if (options.aiModel && !['gemini-2.5-pro', 'gemini-3-flash-preview'].includes(options.aiModel)) {
        logger.error(`❌ Error: Invalid AI model "${options.aiModel}"`);
        logger.info('💡 Valid models are: gemini-2.5-pro, gemini-3-flash-preview');
        process.exit(1);
      }

      // Validate AI temperature if provided
      if (options.aiTemperature !== undefined) {
        if (isNaN(options.aiTemperature) || options.aiTemperature < 0 || options.aiTemperature > 1) {
          logger.error(`❌ Error: Invalid AI temperature "${options.aiTemperature}"`);
          logger.info('💡 Temperature must be a number between 0 and 1');
          process.exit(1);
        }
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

      // Step 3: Initialize AI provider and enhance resume
      logger.info('\n🤖 Step 3: Initializing AI provider...');

      // Load AI configuration
      const { loadAIConfig, getGeminiConfig } = await import('@services/ai/config');
      const aiConfig = await loadAIConfig();

      // Get provider name from CLI option or config (default: gemini)
      const providerName = options.aiProvider || aiConfig.defaultProvider || 'gemini';

      // Initialize and register Gemini provider if needed
      const { registerProvider, hasProvider } = await import('@services/ai/providerRegistry');
      const { GeminiProvider } = await import('@services/ai/gemini');

      if (!hasProvider('gemini')) {
        const geminiConfig = getGeminiConfig(aiConfig);
        if (!geminiConfig || !geminiConfig.apiKey) {
          logger.error('❌ Error: Gemini API key not configured');
          logger.info('💡 Suggestions:');
          logger.info('   - Set GEMINI_API_KEY environment variable');
          logger.info('   - Or set GEMINI_API_KEY in .env file');
          logger.info('   - See AI_CONFIG.md for configuration details');
          process.exit(1);
        }

        // Use defaults: model from config (default: gemini-2.5-pro), temperature from config (default: 0.7)
        // Override with CLI options if provided
        const DEFAULT_MODEL: 'gemini-2.5-pro' | 'gemini-3-flash-preview' = 'gemini-2.5-pro';
        const DEFAULT_TEMPERATURE = 0.7;

        const finalConfig = {
          ...geminiConfig,
          model: (options.aiModel as 'gemini-2.5-pro' | 'gemini-3-flash-preview') || geminiConfig.model || DEFAULT_MODEL,
          temperature: options.aiTemperature !== undefined ? options.aiTemperature : (geminiConfig.temperature ?? DEFAULT_TEMPERATURE),
        };

        const geminiProvider = new GeminiProvider(finalConfig);
        registerProvider('gemini', geminiProvider);
        logger.success(`   ✅ AI provider initialized: ${providerName}`);
        logger.info(`   📊 Model: ${finalConfig.model}${!options.aiModel ? ' (default)' : ''}`);
        logger.info(`   🌡️  Temperature: ${finalConfig.temperature}${options.aiTemperature === undefined ? ' (default)' : ''}`);
      } else {
        logger.success(`   ✅ Using existing AI provider: ${providerName}`);
      }

      // Enhance resume using AI
      logger.info('\n🤖 Step 4: Enhancing resume with AI...');
      const { AIResumeEnhancementService } = await import('@services/aiResumeEnhancementService');
      const { getProvider } = await import('@services/ai/providerRegistry');

      let provider = getProvider(providerName);
      if (provider) {
        const providerInfo = provider.getProviderInfo();
        logger.info(`   Using: ${providerInfo.displayName} (${providerInfo.name})`);
        // Get the actual model being used (from CLI option, config, or default)
        const geminiConfig = getGeminiConfig(aiConfig);
        const actualModel = options.aiModel || geminiConfig?.model || providerInfo.defaultModel;
        logger.info(`   Model: ${actualModel}${!options.aiModel ? ' (default)' : ''}`);
      }

      const aiEnhancementService = new AIResumeEnhancementService(providerName);

      // Get provider again after service initialization (in case it was set as default)
      provider = getProvider(providerName);
      const enhancementResult = await aiEnhancementService.enhanceResume(
        resume,
        jobDescription
      );
      logger.success('   ✅ Resume enhanced successfully');
      logger.info(`   📊 ATS Score: ${enhancementResult.atsScore.before} → ${enhancementResult.atsScore.after} (+${enhancementResult.atsScore.improvement})`);
      logger.info(`   📝 Changes: ${enhancementResult.improvements.length} improvements made`);

      // Step 5: Generate enhanced JSON
      logger.info('\n📦 Step 5: Generating enhanced resume JSON...');
      const { generateAndWriteEnhancedResume } = await import('@services/enhancedResumeGenerator');
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const jsonPath = await generateAndWriteEnhancedResume(enhancementResult, {
        outputDir: options.output,
        baseName: `${baseName}-enhanced`,
      });
      logger.success(`   ✅ Enhanced JSON written: ${jsonPath}`);

      // Step 6: Generate PDF
      logger.info(`\n📄 Step 6: Generating ${format.toUpperCase()}...`);
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

      // Step 7: Generate Markdown report
      logger.info('\n📝 Step 7: Generating Markdown report...');
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

      // Display provider information
      if (provider) {
        const providerInfo = provider.getProviderInfo();
        const geminiConfig = getGeminiConfig(aiConfig);
        const actualModel = options.aiModel || geminiConfig?.model || providerInfo.defaultModel;
        const actualTemperature = options.aiTemperature !== undefined
          ? options.aiTemperature
          : (geminiConfig?.temperature ?? 0.7);

        logger.info(`\n🤖 AI Provider: ${providerInfo.displayName}`);
        logger.info(`   Model: ${actualModel}${!options.aiModel ? ' (default)' : ''}`);
        logger.info(`   Temperature: ${actualTemperature}${options.aiTemperature === undefined ? ' (default)' : ''}`);
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
      const { AIProviderError, RateLimitError, NetworkError, TimeoutError } = await import('@services/ai/provider.types');
      const { ProviderNotFoundError } = await import('@services/ai/providerRegistry');

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
      } else if (error instanceof ProviderNotFoundError) {
        logger.error(`\n❌ ${error.message}`);
        logger.info('💡 Suggestions:');
        logger.info('   - Ensure AI provider is properly configured');
        logger.info('   - Check that GEMINI_API_KEY is set in .env file or environment variables');
        logger.info('   - See AI_CONFIG.md for configuration details');
      } else if (error instanceof AIProviderError) {
        logger.error(`\n❌ AI Provider Error: ${error.message}`);
        if (error instanceof RateLimitError) {
          logger.info('💡 Rate limit exceeded. Please wait before retrying.');
          if (error.retryAfter) {
            logger.info(`   Retry after: ${error.retryAfter} seconds`);
          }
        } else if (error instanceof NetworkError) {
          logger.info('💡 Network error. Please check your internet connection.');
        } else if (error instanceof TimeoutError) {
          logger.info('💡 Request timeout. The AI provider took too long to respond.');
        } else {
          logger.info('💡 Suggestions:');
          logger.info('   - Check your API key is valid');
          logger.info('   - Verify your internet connection');
          logger.info('   - Try again later if the service is temporarily unavailable');
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

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export default program;
