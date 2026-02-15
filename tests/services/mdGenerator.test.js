"use strict";
/**
 * Unit tests for Markdown report generator service
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
const mdGenerator_1 = require("@services/mdGenerator");
// Mock logger
jest.mock('@utils/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
describe('mdGenerator', () => {
    const testDir = path.join(__dirname, '../fixtures/mdGenerator');
    const sampleResume = {
        personalInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 123-456-7890',
            location: 'San Francisco, CA',
            linkedin: 'https://linkedin.com/in/johndoe',
            github: 'https://github.com/johndoe',
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
    const sampleEnhancedOutput = {
        updatedResume: sampleResume,
        suggestions: [
            'Consider adding more job-relevant keywords',
            'Add a professional summary to improve ATS score',
        ],
        highlightedSkills: ['TypeScript', 'React', 'Node.js'],
        changesSummary: 'Enhanced resume with 2 total changes. 1 bullet point was enhanced, skills were reordered to prioritize job-relevant technologies.',
        changesDetail: [
            {
                old: 'Built scalable systems',
                new: 'Built scalable systems using React and TypeScript',
                section: 'experience[0]',
                type: 'bulletPoint',
            },
            {
                old: 'Position 1 in Programming Languages',
                new: 'Position 2 in Programming Languages',
                section: 'skills.Programming Languages',
                type: 'skill',
            },
        ],
        pdfPath: './output/enhancedResume.pdf',
        mdPath: './output/enhancedResume.md',
    };
    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });
    afterEach(async () => {
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    describe('generateMarkdownReport', () => {
        it('should generate complete Markdown report', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toBeDefined();
            expect(typeof markdown).toBe('string');
            expect(markdown.length).toBeGreaterThan(0);
        });
        it('should include header with name', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('# John Doe — Enhanced Resume Report');
        });
        it('should include contact information section', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Contact');
            expect(markdown).toContain('john@example.com');
            expect(markdown).toContain('+1 123-456-7890');
            expect(markdown).toContain('San Francisco, CA');
        });
        it('should include highlighted skills section', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Highlighted Skills');
            expect(markdown).toContain('- TypeScript');
            expect(markdown).toContain('- React');
            expect(markdown).toContain('- Node.js');
        });
        it('should include experience changes section', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Experience Changes');
            expect(markdown).toContain('**Original:**');
            expect(markdown).toContain('**Enhanced:**');
        });
        it('should include changes summary section', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Changes Summary');
            expect(markdown).toContain(sampleEnhancedOutput.changesSummary);
        });
        it('should include changes detail table', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Changes Detail');
            expect(markdown).toContain('| Original | Enhanced |');
            expect(markdown).toContain('Built scalable systems');
        });
        it('should include suggestions section', () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            expect(markdown).toContain('## Suggestions');
            expect(markdown).toContain('- Consider adding more job-relevant keywords');
        });
        it('should handle empty highlighted skills', () => {
            const outputWithoutSkills = {
                ...sampleEnhancedOutput,
                highlightedSkills: [],
            };
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(outputWithoutSkills);
            expect(markdown).toBeDefined();
            // Should not crash, but may or may not include the section
        });
        it('should handle empty suggestions', () => {
            const outputWithoutSuggestions = {
                ...sampleEnhancedOutput,
                suggestions: [],
            };
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(outputWithoutSuggestions);
            expect(markdown).toBeDefined();
            // Should not crash
        });
        it('should handle empty changes', () => {
            const outputWithoutChanges = {
                ...sampleEnhancedOutput,
                changesDetail: [],
                changesSummary: 'No changes were made to the resume.',
            };
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(outputWithoutChanges);
            expect(markdown).toBeDefined();
            expect(markdown).toContain('No changes were made');
        });
    });
    describe('formatContactInfo', () => {
        it('should format contact information correctly', () => {
            const contactInfo = (0, mdGenerator_1.formatContactInfo)(sampleResume.personalInfo);
            expect(contactInfo).toContain('## Contact');
            expect(contactInfo).toContain('Email: john@example.com');
            expect(contactInfo).toContain('Phone: +1 123-456-7890');
            expect(contactInfo).toContain('Location: San Francisco, CA');
        });
        it('should include optional fields when present', () => {
            const contactInfo = (0, mdGenerator_1.formatContactInfo)(sampleResume.personalInfo);
            expect(contactInfo).toContain('LinkedIn:');
            expect(contactInfo).toContain('GitHub:');
        });
        it('should handle minimal contact info', () => {
            const minimalInfo = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '+1 555-1234',
                location: 'New York, NY',
            };
            const contactInfo = (0, mdGenerator_1.formatContactInfo)(minimalInfo);
            expect(contactInfo).toContain('Email: jane@example.com');
            expect(contactInfo).not.toContain('LinkedIn:');
            expect(contactInfo).not.toContain('GitHub:');
        });
    });
    describe('formatExperienceChanges', () => {
        it('should format experience changes correctly', () => {
            const experienceChanges = sampleEnhancedOutput.changesDetail.filter(c => c.type === 'bulletPoint');
            const formatted = (0, mdGenerator_1.formatExperienceChanges)(experienceChanges);
            expect(formatted).toContain('## Experience Changes');
            expect(formatted).toContain('**Original:**');
            expect(formatted).toContain('**Enhanced:**');
            expect(formatted).toContain('Built scalable systems');
        });
        it('should include section information when available', () => {
            const changes = [
                {
                    old: 'Original text',
                    new: 'Enhanced text',
                    section: 'experience[0]',
                    type: 'bulletPoint',
                },
            ];
            const formatted = (0, mdGenerator_1.formatExperienceChanges)(changes);
            expect(formatted).toContain('experience[0]');
        });
        it('should handle empty changes', () => {
            const formatted = (0, mdGenerator_1.formatExperienceChanges)([]);
            expect(formatted).toContain('## Experience Changes');
        });
    });
    describe('formatChangesTable', () => {
        it('should format table correctly', () => {
            const table = (0, mdGenerator_1.formatChangesTable)(sampleEnhancedOutput.changesDetail);
            expect(table).toContain('## Changes Detail');
            expect(table).toContain('| Original | Enhanced |');
            expect(table).toContain('|----------|----------|');
            expect(table).toContain('Built scalable systems');
        });
        it('should include section and type columns', () => {
            const table = (0, mdGenerator_1.formatChangesTable)(sampleEnhancedOutput.changesDetail);
            expect(table).toContain('| Section | Type |');
            expect(table).toContain('experience[0]');
            expect(table).toContain('bulletPoint');
        });
        it('should handle empty changes', () => {
            const table = (0, mdGenerator_1.formatChangesTable)([]);
            expect(table).toContain('## Changes Detail');
            expect(table).toContain('No changes were made');
        });
        it('should escape special characters in table cells', () => {
            const changesWithSpecialChars = [
                {
                    old: 'Text with | pipe and * asterisk',
                    new: 'Enhanced text',
                    section: 'test',
                    type: 'bulletPoint',
                },
            ];
            const table = (0, mdGenerator_1.formatChangesTable)(changesWithSpecialChars);
            // Should not break table structure
            expect(table).toContain('|');
            expect(table.split('\n').filter(line => line.startsWith('|')).length).toBeGreaterThan(2);
        });
    });
    describe('writeMarkdownReport', () => {
        it('should write Markdown report to file', async () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            const filePath = path.join(testDir, 'report.md');
            await (0, mdGenerator_1.writeMarkdownReport)(markdown, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
            const writtenContent = await fs.readFile(filePath, 'utf8');
            expect(writtenContent).toBe(markdown);
            expect(writtenContent).toContain('# John Doe — Enhanced Resume Report');
        });
        it('should create output directory if it does not exist', async () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            const nestedDir = path.join(testDir, 'nested', 'directory');
            const filePath = path.join(nestedDir, 'report.md');
            await (0, mdGenerator_1.writeMarkdownReport)(markdown, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
            expect(await fs.pathExists(nestedDir)).toBe(true);
        });
        it('should throw MarkdownWriteError on write failure', async () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            // Use an invalid path that cannot be written to
            const invalidPath = '/invalid/path/that/does/not/exist/report.md';
            await expect((0, mdGenerator_1.writeMarkdownReport)(markdown, invalidPath)).rejects.toThrow(mdGenerator_1.MarkdownWriteError);
        });
        it('should handle file path with spaces', async () => {
            const markdown = (0, mdGenerator_1.generateMarkdownReport)(sampleEnhancedOutput);
            const filePath = path.join(testDir, 'report with spaces.md');
            await (0, mdGenerator_1.writeMarkdownReport)(markdown, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
        });
    });
    describe('generateAndWriteMarkdownReport', () => {
        it('should generate and write Markdown report in one step', async () => {
            const filePath = path.join(testDir, 'enhanced-report.md');
            await (0, mdGenerator_1.generateAndWriteMarkdownReport)(sampleEnhancedOutput, filePath);
            expect(await fs.pathExists(filePath)).toBe(true);
            const writtenContent = await fs.readFile(filePath, 'utf8');
            expect(writtenContent).toContain('# John Doe — Enhanced Resume Report');
            expect(writtenContent).toContain('## Contact');
            expect(writtenContent).toContain('## Changes Summary');
        });
        it('should create output directory if needed', async () => {
            const nestedPath = path.join(testDir, 'nested', 'report.md');
            await (0, mdGenerator_1.generateAndWriteMarkdownReport)(sampleEnhancedOutput, nestedPath);
            expect(await fs.pathExists(nestedPath)).toBe(true);
        });
    });
});
//# sourceMappingURL=mdGenerator.test.js.map