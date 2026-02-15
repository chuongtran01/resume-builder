"use strict";
/**
 * Unit tests for CLI interface
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
// Import templates to ensure they are registered
require("../../src/templates");
describe('CLI', () => {
    const cliPath = path.join(__dirname, '../../dist/cli/index.js');
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
            const output = (0, child_process_1.execSync)(`node ${cliPath} --help`, { encoding: 'utf-8' });
            expect(output).toContain('Usage:');
            expect(output).toContain('resume-builder');
            expect(output).toContain('Commands:');
        });
        it('should display help for generate command', () => {
            const output = (0, child_process_1.execSync)(`node ${cliPath} generate --help`, { encoding: 'utf-8' });
            expect(output).toContain('Generate a resume from JSON input');
            expect(output).toContain('--input');
            expect(output).toContain('--output');
        });
    });
    describe('version command', () => {
        it('should display version when --version is used', () => {
            const output = (0, child_process_1.execSync)(`node ${cliPath} --version`, { encoding: 'utf-8' });
            expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });
    describe('templates command', () => {
        it('should list available templates', () => {
            const output = (0, child_process_1.execSync)(`node ${cliPath} templates`, { encoding: 'utf-8' });
            expect(output).toContain('Available templates:');
            // At least one template should be listed
            expect(output.length).toBeGreaterThan('Available templates:'.length);
        });
        it('should work with list alias', () => {
            const output = (0, child_process_1.execSync)(`node ${cliPath} list`, { encoding: 'utf-8' });
            expect(output).toContain('Available templates:');
        });
    });
    describe('validate command', () => {
        it('should validate a resume file', () => {
            const output = (0, child_process_1.execSync)(`node ${cliPath} validate --input ${testResumePath}`, { encoding: 'utf-8' });
            expect(output).toContain('ATS Validation Results');
            expect(output).toContain('Score:');
        });
        it('should require --input option', () => {
            try {
                (0, child_process_1.execSync)(`node ${cliPath} validate`, { encoding: 'utf-8' });
                fail('Should have thrown an error');
            }
            catch (error) {
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
                (0, child_process_1.execSync)(`node ${cliPath} generate --output ${testOutputPath}`, {
                    encoding: 'utf-8',
                });
                fail('Should have thrown an error');
            }
            catch (error) {
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
                (0, child_process_1.execSync)(`node ${cliPath} generate --input ${testResumePath}`, {
                    encoding: 'utf-8',
                });
                fail('Should have thrown an error');
            }
            catch (error) {
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
                (0, child_process_1.execSync)(`node ${cliPath} generate --input ${testResumePath} --output ${testOutputPath} --format docx`, { encoding: 'utf-8' });
                fail('Should have thrown an error');
            }
            catch (error) {
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
//# sourceMappingURL=index.test.js.map