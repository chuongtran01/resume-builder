"use strict";
/**
 * Unit tests for resume generator service
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
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const resumeGenerator_1 = require("@services/resumeGenerator");
// Import templates to ensure they are registered
require("@templates");
// Mock dependencies
jest.mock('@utils/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
// Mock PDF generator to return a file path and create the file
jest.mock('@utils/pdfGenerator', () => ({
    generatePdfFromHtml: jest.fn().mockImplementation(async (_html, options) => {
        const fs = require('fs-extra');
        await fs.ensureDir(require('path').dirname(options.outputPath));
        await fs.writeFile(options.outputPath, Buffer.from('mock pdf content'));
        return options.outputPath;
    }),
}));
describe('ResumeGenerator', () => {
    const testResume = {
        personalInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 123-456-7890',
            location: 'San Francisco, CA',
        },
        summary: 'Software engineer with 5 years of experience',
        experience: [
            {
                company: 'Tech Corp',
                role: 'Senior Engineer',
                startDate: '2020-01',
                endDate: 'Present',
                location: 'Remote',
                bulletPoints: ['Built scalable APIs', 'Led team of 5'],
            },
        ],
    };
    const testResumePath = path.join(__dirname, '../fixtures/test-resume.json');
    const testOutputPath = path.join(__dirname, '../output/test-resume.pdf');
    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure output directory exists
        fs.ensureDirSync(path.dirname(testOutputPath));
    });
    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testOutputPath)) {
            fs.removeSync(testOutputPath);
        }
    });
    describe('generateResumeFromFile', () => {
        it('should generate PDF from resume file', async () => {
            // Create test resume file
            await fs.ensureDir(path.dirname(testResumePath));
            await fs.writeJson(testResumePath, testResume);
            const result = await (0, resumeGenerator_1.generateResumeFromFile)(testResumePath, testOutputPath, {
                template: 'modern',
                format: 'pdf',
            });
            expect(result.format).toBe('pdf');
            expect(result.template).toBe('modern');
            expect(result.outputPath).toBeDefined();
            expect(result.fileSize).toBeGreaterThan(0);
        });
        it('should generate HTML from resume file', async () => {
            // Create test resume file
            await fs.ensureDir(path.dirname(testResumePath));
            await fs.writeJson(testResumePath, testResume);
            const htmlOutputPath = testOutputPath.replace('.pdf', '.html');
            const result = await (0, resumeGenerator_1.generateResumeFromFile)(testResumePath, htmlOutputPath, {
                template: 'modern',
                format: 'html',
            });
            expect(result.format).toBe('html');
            expect(result.template).toBe('modern');
            expect(result.outputPath).toBe(htmlOutputPath);
            expect(fs.existsSync(htmlOutputPath)).toBe(true);
            // Clean up
            if (fs.existsSync(htmlOutputPath)) {
                fs.removeSync(htmlOutputPath);
            }
        });
        it('should throw error for invalid template', async () => {
            await fs.ensureDir(path.dirname(testResumePath));
            await fs.writeJson(testResumePath, testResume);
            await expect((0, resumeGenerator_1.generateResumeFromFile)(testResumePath, testOutputPath, {
                template: 'invalid-template',
            })).rejects.toThrow(resumeGenerator_1.TemplateNotFoundError);
        });
        it('should run ATS validation when requested', async () => {
            await fs.ensureDir(path.dirname(testResumePath));
            await fs.writeJson(testResumePath, testResume);
            const result = await (0, resumeGenerator_1.generateResumeFromFile)(testResumePath, testOutputPath, {
                template: 'modern',
                validate: true,
            });
            expect(result.atsValidation).toBeDefined();
            expect(result.atsValidation?.score).toBeGreaterThanOrEqual(0);
            expect(result.atsValidation?.score).toBeLessThanOrEqual(100);
        });
        it('should include warnings in result', async () => {
            await fs.ensureDir(path.dirname(testResumePath));
            await fs.writeJson(testResumePath, testResume);
            const result = await (0, resumeGenerator_1.generateResumeFromFile)(testResumePath, testOutputPath, {
                template: 'modern',
                validate: true,
            });
            expect(Array.isArray(result.warnings)).toBe(true);
        });
    });
    describe('generateResumeFromObject', () => {
        it('should generate PDF from Resume object', async () => {
            const result = await (0, resumeGenerator_1.generateResumeFromObject)(testResume, testOutputPath, {
                template: 'modern',
                format: 'pdf',
            });
            expect(result.format).toBe('pdf');
            expect(result.template).toBe('modern');
            expect(result.outputPath).toBeDefined();
            expect(result.fileSize).toBeGreaterThan(0);
        });
        it('should generate HTML from Resume object', async () => {
            const htmlOutputPath = testOutputPath.replace('.pdf', '.html');
            const result = await (0, resumeGenerator_1.generateResumeFromObject)(testResume, htmlOutputPath, {
                template: 'modern',
                format: 'html',
            });
            expect(result.format).toBe('html');
            expect(result.template).toBe('modern');
            expect(result.outputPath).toBe(htmlOutputPath);
            expect(fs.existsSync(htmlOutputPath)).toBe(true);
            // Clean up
            if (fs.existsSync(htmlOutputPath)) {
                fs.removeSync(htmlOutputPath);
            }
        });
        it('should throw error for invalid template', async () => {
            await expect((0, resumeGenerator_1.generateResumeFromObject)(testResume, testOutputPath, {
                template: 'invalid-template',
            })).rejects.toThrow(resumeGenerator_1.TemplateNotFoundError);
        });
        it('should run ATS validation when requested', async () => {
            const result = await (0, resumeGenerator_1.generateResumeFromObject)(testResume, testOutputPath, {
                template: 'modern',
                validate: true,
            });
            expect(result.atsValidation).toBeDefined();
            expect(result.atsValidation?.score).toBeGreaterThanOrEqual(0);
            expect(result.atsValidation?.score).toBeLessThanOrEqual(100);
        });
        it('should support different templates', async () => {
            const templates = ['modern', 'classic'];
            for (const template of templates) {
                const result = await (0, resumeGenerator_1.generateResumeFromObject)(testResume, testOutputPath, {
                    template,
                    format: 'pdf',
                });
                expect(result.template).toBe(template);
            }
        });
    });
    describe('generateResumeHtml', () => {
        it('should generate HTML string from Resume object', async () => {
            const html = await (0, resumeGenerator_1.generateResumeHtml)(testResume, {
                template: 'modern',
            });
            expect(typeof html).toBe('string');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('John Doe');
            expect(html).toContain('john@example.com');
        });
        it('should throw error for invalid template', async () => {
            await expect((0, resumeGenerator_1.generateResumeHtml)(testResume, {
                template: 'invalid-template',
            })).rejects.toThrow(resumeGenerator_1.TemplateNotFoundError);
        });
        it('should support different templates', async () => {
            const templates = ['modern', 'classic'];
            for (const template of templates) {
                const html = await (0, resumeGenerator_1.generateResumeHtml)(testResume, { template });
                expect(html).toContain('<!DOCTYPE html>');
                expect(html).toContain('John Doe');
            }
        });
    });
    describe('error handling', () => {
        it('should handle missing resume file gracefully', async () => {
            const nonExistentPath = path.join(__dirname, '../fixtures/non-existent.json');
            await expect((0, resumeGenerator_1.generateResumeFromFile)(nonExistentPath, testOutputPath)).rejects.toThrow();
        });
        it('should handle invalid JSON gracefully', async () => {
            const invalidJsonPath = path.join(__dirname, '../fixtures/invalid-resume.json');
            await fs.ensureDir(path.dirname(invalidJsonPath));
            await fs.writeFile(invalidJsonPath, '{ invalid json }');
            await expect((0, resumeGenerator_1.generateResumeFromFile)(invalidJsonPath, testOutputPath)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=resumeGenerator.test.js.map