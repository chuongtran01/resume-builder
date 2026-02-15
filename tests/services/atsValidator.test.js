"use strict";
/**
 * Unit tests for ATS validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const atsValidator_1 = require("@services/atsValidator");
describe('atsValidator', () => {
    const completeResume = {
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
                role: 'Software Engineer',
                startDate: '2020-01',
                endDate: 'Present',
                location: 'Remote',
                bulletPoints: [
                    'Built scalable systems',
                    'Led team of engineers',
                ],
            },
        ],
        education: {
            institution: 'University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            graduationDate: '2018-05',
        },
        skills: {
            categories: [
                {
                    name: 'Programming',
                    items: ['TypeScript', 'JavaScript'],
                },
            ],
        },
    };
    describe('validateAtsCompliance', () => {
        it('should validate a complete resume with high score', () => {
            const result = (0, atsValidator_1.validateAtsCompliance)(completeResume);
            expect(result.isCompliant).toBe(true);
            expect(result.score).toBeGreaterThan(70);
            expect(result.errors).toHaveLength(0);
        });
        it('should detect missing required sections', () => {
            const incompleteResume = {
                personalInfo: {
                    name: 'John Doe',
                    email: '',
                    phone: '',
                    location: 'SF',
                },
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(incompleteResume);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e) => e.includes('email'))).toBe(true);
            expect(result.errors.some((e) => e.includes('phone'))).toBe(true);
            expect(result.score).toBeLessThan(100);
        });
        it('should warn about missing recommended sections', () => {
            const resumeWithoutSummary = {
                personalInfo: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1 123-456-7890',
                    location: 'SF',
                },
                experience: [
                    {
                        company: 'Tech Corp',
                        role: 'Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Did something'],
                    },
                ],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(resumeWithoutSummary);
            expect(result.warnings.some((w) => w.includes('summary'))).toBe(true);
            expect(result.suggestions.length).toBeGreaterThan(0);
        });
        it('should validate date formats', () => {
            const resumeWithInvalidDates = {
                ...completeResume,
                experience: [
                    {
                        company: 'Tech Corp',
                        role: 'Engineer',
                        startDate: 'invalid-date',
                        endDate: 'also-invalid',
                        location: 'Remote',
                        bulletPoints: ['Something'],
                    },
                ],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(resumeWithInvalidDates);
            expect(result.errors.some((e) => e.includes('startDate'))).toBe(true);
            expect(result.errors.some((e) => e.includes('endDate'))).toBe(true);
        });
        it('should accept "Present" as valid end date', () => {
            const resumeWithPresent = {
                ...completeResume,
                experience: [
                    {
                        company: 'Tech Corp',
                        role: 'Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['Something'],
                    },
                ],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(resumeWithPresent);
            expect(result.errors.some((e) => e.includes('endDate'))).toBe(false);
        });
        it('should warn about long bullet points', () => {
            const longBullet = 'A'.repeat(200);
            const resumeWithLongBullets = {
                ...completeResume,
                experience: [
                    {
                        company: 'Tech Corp',
                        role: 'Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: [longBullet],
                    },
                ],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(resumeWithLongBullets, {
                maxBulletLength: 150,
            });
            expect(result.warnings.some((w) => w.includes('exceeds recommended length'))).toBe(true);
        });
        it('should calculate score based on errors and warnings', () => {
            const badResume = {
                personalInfo: {
                    name: 'John',
                    email: '',
                    phone: '',
                    location: 'SF',
                },
                experience: [],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(badResume);
            expect(result.score).toBeLessThan(70);
            expect(result.isCompliant).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should give bonus points for recommended sections', () => {
            const resumeWithAllSections = {
                ...completeResume,
                certifications: [
                    {
                        name: 'AWS Certified',
                        issuer: 'AWS',
                        date: '2023-01',
                    },
                ],
                projects: [
                    {
                        name: 'Project',
                        description: 'Description',
                    },
                ],
            };
            const result = (0, atsValidator_1.validateAtsCompliance)(resumeWithAllSections);
            expect(result.score).toBeGreaterThan(90);
        });
        it('should respect validation options', () => {
            const resumeWithLongBullets = {
                ...completeResume,
                experience: [
                    {
                        company: 'Tech Corp',
                        role: 'Engineer',
                        startDate: '2020-01',
                        endDate: 'Present',
                        location: 'Remote',
                        bulletPoints: ['A'.repeat(200)],
                    },
                ],
            };
            const resultWithCheck = (0, atsValidator_1.validateAtsCompliance)(resumeWithLongBullets, {
                checkBulletLength: true,
            });
            const resultWithoutCheck = (0, atsValidator_1.validateAtsCompliance)(resumeWithLongBullets, {
                checkBulletLength: false,
            });
            expect(resultWithCheck.warnings.length).toBeGreaterThan(resultWithoutCheck.warnings.length);
        });
    });
    describe('isValidAtsHeading', () => {
        it('should validate standard headings', () => {
            expect((0, atsValidator_1.isValidAtsHeading)('Experience')).toBe(true);
            expect((0, atsValidator_1.isValidAtsHeading)('Education')).toBe(true);
            expect((0, atsValidator_1.isValidAtsHeading)('Skills')).toBe(true);
            expect((0, atsValidator_1.isValidAtsHeading)('Professional Experience')).toBe(true);
        });
        it('should reject non-standard headings', () => {
            expect((0, atsValidator_1.isValidAtsHeading)('Random Section')).toBe(false);
            expect((0, atsValidator_1.isValidAtsHeading)('About Me')).toBe(false);
        });
        it('should be case-insensitive', () => {
            expect((0, atsValidator_1.isValidAtsHeading)('EXPERIENCE')).toBe(true);
            expect((0, atsValidator_1.isValidAtsHeading)('experience')).toBe(true);
        });
    });
    describe('suggestHeading', () => {
        it('should suggest alternatives for non-standard headings', () => {
            expect((0, atsValidator_1.suggestHeading)('Work History')).toBe('Experience');
            expect((0, atsValidator_1.suggestHeading)('Employment History')).toBe('Experience');
            expect((0, atsValidator_1.suggestHeading)('Technical Expertise')).toBe('Skills');
            expect((0, atsValidator_1.suggestHeading)('Academic Background')).toBe('Education');
        });
        it('should return null for standard headings', () => {
            expect((0, atsValidator_1.suggestHeading)('Experience')).toBeNull();
            expect((0, atsValidator_1.suggestHeading)('Education')).toBeNull();
            expect((0, atsValidator_1.suggestHeading)('Skills')).toBeNull();
        });
        it('should return null for unrecognized headings', () => {
            expect((0, atsValidator_1.suggestHeading)('Random Section')).toBeNull();
        });
    });
});
//# sourceMappingURL=atsValidator.test.js.map