"use strict";
/**
 * Unit tests for classic template
 */
Object.defineProperty(exports, "__esModule", { value: true });
const classic_1 = require("@templates/classic");
const templateRegistry_1 = require("@templates/templateRegistry");
describe('classicTemplate', () => {
    const sampleResume = {
        personalInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 123-456-7890',
            location: 'San Francisco, CA',
            linkedin: 'https://linkedin.com/in/johndoe',
        },
        summary: 'Experienced software engineer with 5 years of experience.',
        experience: [
            {
                company: 'Tech Corp',
                role: 'Senior Software Engineer',
                startDate: '2020-01',
                endDate: 'Present',
                location: 'Remote',
                bulletPoints: [
                    'Built scalable API services',
                    'Led a team of 4 engineers',
                ],
            },
        ],
        education: {
            institution: 'University of California',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            graduationDate: '2018-05',
        },
        skills: {
            categories: [
                {
                    name: 'Programming Languages',
                    items: ['TypeScript', 'JavaScript', 'Python'],
                },
            ],
        },
    };
    it('should have correct name and description', () => {
        expect(classic_1.classicTemplate.name).toBe('classic');
        expect(classic_1.classicTemplate.description).toBeDefined();
    });
    it('should render HTML from resume', () => {
        const html = classic_1.classicTemplate.render(sampleResume);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('John Doe');
        expect(html).toContain('john@example.com');
        expect(html).toContain('Professional Experience');
        expect(html).toContain('Tech Corp');
    });
    it('should use Times New Roman font (classic styling)', () => {
        const html = classic_1.classicTemplate.render(sampleResume);
        expect(html).toContain('Times New Roman');
    });
    it('should include all sections when present', () => {
        const html = classic_1.classicTemplate.render(sampleResume);
        expect(html).toContain('Professional Experience');
        expect(html).toContain('Education');
        expect(html).toContain('Technical Skills');
    });
    it('should escape HTML special characters', () => {
        const resumeWithSpecialChars = {
            ...sampleResume,
            personalInfo: {
                ...sampleResume.personalInfo,
                name: 'John <script>alert("xss")</script> Doe',
            },
        };
        const html = classic_1.classicTemplate.render(resumeWithSpecialChars);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
    it('should validate resume', () => {
        const result = classic_1.classicTemplate.validate(sampleResume);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should be registered in template registry', () => {
        const template = (0, templateRegistry_1.getTemplate)('classic');
        expect(template).toBeDefined();
        expect(template?.name).toBe('classic');
    });
    it('should be visually distinct from modern template', () => {
        const classicHtml = classic_1.classicTemplate.render(sampleResume);
        const { modernTemplate } = require('../../src/templates/modern');
        const modernHtml = modernTemplate.render(sampleResume);
        // Classic uses Times New Roman, modern uses Arial
        expect(classicHtml).toContain('Times New Roman');
        expect(modernHtml).toContain('Arial');
        // Classic has different section title (Professional Experience vs Experience)
        expect(classicHtml).toContain('Professional Experience');
        expect(modernHtml).toContain('Experience');
    });
});
//# sourceMappingURL=classic.test.js.map