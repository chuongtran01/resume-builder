"use strict";
/**
 * Unit tests for resumeParser utility
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
const resumeParser_1 = require("@utils/resumeParser");
describe('resumeParser', () => {
    const testDir = path.join(__dirname, '../fixtures/resumeParser');
    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });
    afterEach(async () => {
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    describe('validateResume', () => {
        it('should validate a complete resume', () => {
            const resume = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
                experience: [
                    {
                        company: 'Test Corp',
                        role: 'Software Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
            };
            const errors = (0, resumeParser_1.validateResume)(resume);
            expect(errors).toHaveLength(0);
        });
        it('should detect missing personalInfo', () => {
            const resume = {
                experience: [
                    {
                        company: 'Test Corp',
                        role: 'Software Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
            };
            const errors = (0, resumeParser_1.validateResume)(resume);
            expect(errors).toContain('personalInfo is required');
        });
        it('should detect missing experience', () => {
            const resume = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
            };
            const errors = (0, resumeParser_1.validateResume)(resume);
            expect(errors).toContain('experience is required and must be an array');
        });
        it('should detect missing required fields in experience', () => {
            const resume = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
                experience: [
                    {
                        company: 'Test Corp',
                        role: '',
                        startDate: '',
                        endDate: '',
                        location: '',
                        bulletPoints: [],
                        // Missing role
                    },
                ],
            };
            const errors = (0, resumeParser_1.validateResume)(resume);
            expect(errors.some((e) => e.includes('role is required'))).toBe(true);
        });
    });
    describe('parseResume', () => {
        it('should parse a valid resume.json file', async () => {
            const resumeFile = path.join(testDir, 'resume.json');
            const resume = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
                experience: [
                    {
                        company: 'Test Corp',
                        role: 'Software Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
            };
            await fs.writeJson(resumeFile, resume);
            const parsed = await (0, resumeParser_1.parseResume)({ resumePath: resumeFile });
            expect(parsed.personalInfo.name).toBe('John Doe');
            expect(parsed.experience).toHaveLength(1);
        });
        it('should resolve file references in resume', async () => {
            // Create education file
            const educationFile = path.join(testDir, 'education.json');
            await fs.writeJson(educationFile, {
                institution: 'Test University',
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                graduationDate: '2020-05',
            });
            // Create resume with file reference
            const resumeFile = path.join(testDir, 'resume.json');
            const resume = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
                experience: [
                    {
                        company: 'Test Corp',
                        role: 'Software Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
                education: `file:${path.relative(testDir, educationFile)}`,
            };
            await fs.writeJson(resumeFile, resume);
            const parsed = await (0, resumeParser_1.parseResume)({ resumePath: resumeFile });
            expect(parsed.education).toBeDefined();
            if (parsed.education && typeof parsed.education === 'object' && !Array.isArray(parsed.education)) {
                expect(parsed.education.institution).toBe('Test University');
            }
        });
        it('should throw error for missing file', async () => {
            const resumeFile = path.join(testDir, 'nonexistent.json');
            await expect((0, resumeParser_1.parseResume)({ resumePath: resumeFile })).rejects.toThrow();
        });
        it('should throw error for invalid JSON', async () => {
            const resumeFile = path.join(testDir, 'invalid.json');
            await fs.writeFile(resumeFile, '{ invalid json }');
            await expect((0, resumeParser_1.parseResume)({ resumePath: resumeFile })).rejects.toThrow();
        });
        it('should throw validation error when validate=true', async () => {
            const resumeFile = path.join(testDir, 'invalid-resume.json');
            const invalidResume = {
                // Missing required fields
                personalInfo: {
                    name: 'John Doe',
                    // Missing email, phone, location
                },
            };
            await fs.writeJson(resumeFile, invalidResume);
            await expect((0, resumeParser_1.parseResume)({ resumePath: resumeFile, validate: true })).rejects.toThrow(resumeParser_1.ResumeValidationError);
        });
        it('should skip validation when validate=false', async () => {
            const resumeFile = path.join(testDir, 'invalid-resume.json');
            const invalidResume = {
                personalInfo: {
                    name: 'John Doe',
                },
            };
            await fs.writeJson(resumeFile, invalidResume);
            const parsed = await (0, resumeParser_1.parseResume)({
                resumePath: resumeFile,
                validate: false,
            });
            expect(parsed.personalInfo.name).toBe('John Doe');
        });
    });
    describe('parseResumeFromString', () => {
        it('should parse resume from JSON string', async () => {
            const resumeJson = JSON.stringify({
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'San Francisco, CA',
                },
                experience: [
                    {
                        company: 'Test Corp',
                        role: 'Software Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
            });
            const parsed = await (0, resumeParser_1.parseResumeFromString)(resumeJson, testDir);
            expect(parsed.personalInfo.name).toBe('John Doe');
        });
        it('should throw error for invalid JSON string', async () => {
            const invalidJson = '{ invalid json }';
            await expect((0, resumeParser_1.parseResumeFromString)(invalidJson, testDir)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=resumeParser.test.js.map