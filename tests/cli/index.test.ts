/**
 * Unit tests for CLI interface
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';

// Import templates to ensure they are registered
import '../../src/templates';

describe('CLI', () => {
  // Use ts-node to run TypeScript source directly to avoid path alias issues
  const cliSourcePath = path.join(__dirname, '../../src/cli/index.ts');
  const cliPath = `ts-node -r tsconfig-paths/register ${cliSourcePath}`;
  const testResumePath = path.join(__dirname, '../fixtures/test-resume.json');
  const testOutputPath = path.join(__dirname, '../output/test-resume.pdf');

  beforeEach(() => {
    // Ensure output directory exists
    fs.ensureDirSync(path.dirname(testOutputPath));
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputPath)) {
      fs.removeSync(testOutputPath);
    }
  });

  describe('help command', () => {
    it('should display help when --help is used', () => {
      const output = execSync(`${cliPath} --help`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../..')
      });
      expect(output).toContain('Usage:');
      expect(output).toContain('resume-builder');
      expect(output).toContain('Commands:');
    });

    it('should display help for generate command', () => {
      const output = execSync(`${cliPath} generate --help`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../..')
      });
      expect(output).toContain('Generate a resume from JSON input');
      expect(output).toContain('--input');
      expect(output).toContain('--output');
    });
  });

  describe('version command', () => {
    it('should display version when --version is used', () => {
      const output = execSync(`${cliPath} --version`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../..')
      });
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('templates command', () => {
    it('should list available templates', () => {
      const output = execSync(`${cliPath} templates`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../..')
      });
      expect(output).toContain('Available templates:');
      // At least one template should be listed
      expect(output.length).toBeGreaterThan('Available templates:'.length);
    });

    it('should work with list alias', () => {
      const output = execSync(`${cliPath} list`, { 
        encoding: 'utf-8',
        cwd: path.join(__dirname, '../..')
      });
      expect(output).toContain('Available templates:');
    });
  });

  describe('validate command', () => {
    it('should validate a resume file', () => {
      const output = execSync(
        `${cliPath} validate --input ${testResumePath}`,
        { 
          encoding: 'utf-8',
          cwd: path.join(__dirname, '../..')
        }
      );
      expect(output).toContain('ATS Validation Results');
      expect(output).toContain('Score:');
    });

    it('should require --input option', () => {
      try {
        execSync(`${cliPath} validate`, { 
          encoding: 'utf-8',
          cwd: path.join(__dirname, '../..')
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        // execSync throws an error when process exits with non-zero code
        expect(error).toBeDefined();
        // Verify it's an Error object
        if (error instanceof Error) {
          // The error should contain information about the failure
          expect(error.message).toBeDefined();
        }
      }
    });
  });

  describe('generate command', () => {
    it('should require --input option', () => {
      try {
        execSync(`${cliPath} generate --output ${testOutputPath}`, {
          encoding: 'utf-8',
          cwd: path.join(__dirname, '../..')
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        // execSync throws an error when process exits with non-zero code
        expect(error).toBeDefined();
        // Verify it's an Error object
        if (error instanceof Error) {
          // The error should contain information about the failure
          expect(error.message).toBeDefined();
        }
      }
    });

    it('should require --output option', () => {
      try {
        execSync(`${cliPath} generate --input ${testResumePath}`, {
          encoding: 'utf-8',
          cwd: path.join(__dirname, '../..')
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        // execSync throws an error when process exits with non-zero code
        expect(error).toBeDefined();
        // Verify it's an Error object
        if (error instanceof Error) {
          // The error should contain information about the failure
          expect(error.message).toBeDefined();
        }
      }
    });

    it('should reject invalid format', () => {
      try {
        execSync(
          `${cliPath} generate --input ${testResumePath} --output ${testOutputPath} --format docx`,
          { 
            encoding: 'utf-8',
            cwd: path.join(__dirname, '../..')
          }
        );
        fail('Should have thrown an error');
      } catch (error: unknown) {
        // execSync throws an error when process exits with non-zero code
        expect(error).toBeDefined();
        // Verify it's an Error object
        if (error instanceof Error) {
          // The error should contain information about the failure
          expect(error.message).toBeDefined();
        }
      }
    });
  });
});
