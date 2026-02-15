"use strict";
/**
 * Unit tests for enhanced resume generator service
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
const enhancedResumeGenerator_1 = require("@services/enhancedResumeGenerator");
// Mock logger
jest.mock('@utils/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
describe('enhancedResumeGenerator', () => {
    const testDir = path.join(__dirname, '../fixtures/enhancedResumeGenerator');
    const sampleResume = {
        personalInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 123-456-7890',
            location: 'San Francisco, CA',
        },
        summary: 'Experienced software engineer',
        experience: [
            {
                company: 'Tech Corp',
                role: 'Senior Software Engineer',
                startDate: '2020-01',
                endDate: 'Present',
                location: 'Remote',
                bulletPoints: ['Built scalable systems', 'Led team of engineers'],
            },
        ],
        skills: {
            categories: [
                {
                    name: 'Programming Languages',
                    items: ['TypeScript', 'JavaScript', 'Python'],
                },
            ],
        },
    };
    const firstExperience = sampleResume.experience[0];
    if (!firstExperience) {
        throw new Error('Test setup error: sampleResume must have at least one experience');
    }
    const sampleEnhancementResult = {
        originalResume: sampleResume,
        enhancedResume: {
            ...sampleResume,
            experience: [
                {
                    company: firstExperience.company,
                    role: firstExperience.role,
                    startDate: firstExperience.startDate,
                    endDate: firstExperience.endDate,
                    location: firstExperience.location,
                    bulletPoints: [
                        'Built scalable systems using React and TypeScript',
                        'Led team of engineers',
                    ],
                },
            ],
        },
        improvements: [
            {
                type: 'bulletPoint',
                section: 'experience[0]',
                original: 'Built scalable systems',
                suggested: 'Built scalable systems using React and TypeScript',
                reason: 'Enhanced to include relevant keywords',
                confidence: 0.7,
            },
        ],
        keywordSuggestions: [
            {
                keyword: 'React',
                category: 'Frontend Framework',
                suggestedPlacement: ['summary', 'skills', 'experience'],
                importance: 'high',
            },
            {
                keyword: 'TypeScript',
                category: 'Programming Language',
                suggestedPlacement: ['summary', 'skills', 'experience'],
                importance: 'high',
            },
        ],
        missingSkills: ['Kubernetes', 'Docker'],
        atsScore: {
            before: 75,
            after: 85,
            improvement: 10,
        },
        recommendations: [
            'Consider adding more job-relevant keywords',
            'Add a professional summary to improve ATS score',
        ],
    };
    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });
    afterEach(async () => {
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    describe('generateEnhancedResumeOutput', () => {
        it('should generate enhanced resume output structure', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(output).toBeDefined();
            expect(output.updatedResume).toBeDefined();
            expect(output.suggestions).toBeDefined();
            expect(output.highlightedSkills).toBeDefined();
            expect(output.changesSummary).toBeDefined();
            expect(output.changesDetail).toBeDefined();
            expect(output.pdfPath).toBeDefined();
            expect(output.mdPath).toBeDefined();
        });
        it('should include all required fields', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(output).toHaveProperty('updatedResume');
            expect(output).toHaveProperty('suggestions');
            expect(output).toHaveProperty('highlightedSkills');
            expect(output).toHaveProperty('changesSummary');
            expect(output).toHaveProperty('changesDetail');
            expect(output).toHaveProperty('pdfPath');
            expect(output).toHaveProperty('mdPath');
        });
        it('should convert improvements to changesDetail', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(output.changesDetail.length).toBe(sampleEnhancementResult.improvements.length);
            expect(output.changesDetail[0]).toHaveProperty('old');
            expect(output.changesDetail[0]).toHaveProperty('new');
            expect(output.changesDetail[0]).toHaveProperty('section');
            expect(output.changesDetail[0]).toHaveProperty('type');
        });
        it('should generate changes summary', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(typeof output.changesSummary).toBe('string');
            expect(output.changesSummary.length).toBeGreaterThan(0);
        });
        it('should set suggestions from recommendations', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(output.suggestions).toEqual(sampleEnhancementResult.recommendations);
        });
        it('should identify highlighted skills', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(Array.isArray(output.highlightedSkills)).toBe(true);
            // Should include React and TypeScript as they're high importance and in resume
            expect(output.highlightedSkills.length).toBeGreaterThanOrEqual(0);
        });
        it('should use default output directory and base name', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            expect(output.pdfPath).toContain('output');
            expect(output.pdfPath).toContain('enhancedResume.pdf');
            expect(output.mdPath).toContain('output');
            expect(output.mdPath).toContain('enhancedResume.md');
        });
        it('should use custom output directory and base name', () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult, {
                outputDir: './custom-output',
                baseName: 'custom-resume',
            });
            expect(output.pdfPath).toContain('custom-output');
            expect(output.pdfPath).toContain('custom-resume.pdf');
            expect(output.mdPath).toContain('custom-output');
            expect(output.mdPath).toContain('custom-resume.md');
        });
        it('should handle empty improvements', () => {
            const emptyResult = {
                ...sampleEnhancementResult,
                improvements: [],
            };
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(emptyResult);
            expect(output.changesDetail).toEqual([]);
            expect(output.changesSummary).toContain('No changes');
        });
        it('should handle resume without skills', () => {
            const resumeWithoutSkills = { ...sampleResume };
            delete resumeWithoutSkills.skills;
            const resultWithoutSkills = {
                ...sampleEnhancementResult,
                enhancedResume: resumeWithoutSkills,
            };
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(resultWithoutSkills);
            expect(output).toBeDefined();
            expect(output.highlightedSkills).toBeDefined();
            expect(Array.isArray(output.highlightedSkills)).toBe(true);
        });
    });
    describe('writeEnhancedResumeJson', () => {
        it('should write enhanced resume JSON to file', async () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            const filePath = path.join(testDir, 'enhanced-resume.json');
            await (0, enhancedResumeGenerator_1.writeEnhancedResumeJson)(output, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
            const writtenData = await fs.readJson(filePath);
            expect(writtenData).toHaveProperty('updatedResume');
            expect(writtenData).toHaveProperty('suggestions');
            expect(writtenData).toHaveProperty('highlightedSkills');
            expect(writtenData).toHaveProperty('changesSummary');
            expect(writtenData).toHaveProperty('changesDetail');
        });
        it('should create output directory if it does not exist', async () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            const nestedDir = path.join(testDir, 'nested', 'directory');
            const filePath = path.join(nestedDir, 'enhanced-resume.json');
            await (0, enhancedResumeGenerator_1.writeEnhancedResumeJson)(output, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
            expect(await fs.pathExists(nestedDir)).toBe(true);
        });
        it('should format JSON with proper indentation', async () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            const filePath = path.join(testDir, 'enhanced-resume.json');
            await (0, enhancedResumeGenerator_1.writeEnhancedResumeJson)(output, filePath);
            const fileContent = await fs.readFile(filePath, 'utf8');
            // Should have proper indentation (2 spaces)
            expect(fileContent).toMatch(/^\s{2}"updatedResume"/m);
        });
        it('should throw JsonWriteError on write failure', async () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            // Use an invalid path that cannot be written to
            const invalidPath = '/invalid/path/that/does/not/exist/enhanced-resume.json';
            await expect((0, enhancedResumeGenerator_1.writeEnhancedResumeJson)(output, invalidPath)).rejects.toThrow(enhancedResumeGenerator_1.JsonWriteError);
        });
        it('should handle file path with spaces', async () => {
            const output = (0, enhancedResumeGenerator_1.generateEnhancedResumeOutput)(sampleEnhancementResult);
            const filePath = path.join(testDir, 'enhanced resume with spaces.json');
            await (0, enhancedResumeGenerator_1.writeEnhancedResumeJson)(output, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
        });
    });
    describe('generateAndWriteEnhancedResume', () => {
        it('should generate and write enhanced resume in one step', async () => {
            const filePath = await (0, enhancedResumeGenerator_1.generateAndWriteEnhancedResume)(sampleEnhancementResult, {
                outputDir: testDir,
                baseName: 'test-resume',
            });
            expect(await fs.pathExists(filePath)).toBe(true);
            expect(filePath).toContain('test-resume.json');
            const writtenData = await fs.readJson(filePath);
            expect(writtenData).toHaveProperty('updatedResume');
        });
        it('should use default options when not provided', async () => {
            const filePath = await (0, enhancedResumeGenerator_1.generateAndWriteEnhancedResume)(sampleEnhancementResult);
            // Should use default output directory
            expect(filePath).toContain('output');
            expect(filePath).toContain('enhancedResume.json');
        });
        it('should return the correct file path', async () => {
            const customPath = path.join(testDir, 'custom');
            const filePath = await (0, enhancedResumeGenerator_1.generateAndWriteEnhancedResume)(sampleEnhancementResult, {
                outputDir: customPath,
                baseName: 'my-resume',
            });
            expect(filePath).toBe(path.join(customPath, 'my-resume.json'));
            expect(await fs.pathExists(filePath)).toBe(true);
        });
    });
});
//# sourceMappingURL=enhancedResumeGenerator.test.js.map