"use strict";
/**
 * Unit tests for modern template
 */
Object.defineProperty(exports, "__esModule", { value: true });
const modern_1 = require("@templates/modern");
const templateRegistry_1 = require("@templates/templateRegistry");
describe('modernTemplate', () => {
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
        expect(modern_1.modernTemplate.name).toBe('modern');
        expect(modern_1.modernTemplate.description).toBeDefined();
    });
    it('should render HTML from resume', () => {
        const html = modern_1.modernTemplate.render(sampleResume);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('John Doe');
        expect(html).toContain('john@example.com');
        expect(html).toContain('Experience');
        expect(html).toContain('Tech Corp');
    });
    it('should include all sections when present', () => {
        const html = modern_1.modernTemplate.render(sampleResume);
        expect(html).toContain('Experience');
        expect(html).toContain('Education');
        expect(html).toContain('Skills');
    });
    it('should escape HTML special characters', () => {
        const resumeWithSpecialChars = {
            ...sampleResume,
            personalInfo: {
                ...sampleResume.personalInfo,
                name: 'John <script>alert("xss")</script> Doe',
            },
        };
        const html = modern_1.modernTemplate.render(resumeWithSpecialChars);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
    it('should validate resume', () => {
        const result = modern_1.modernTemplate.validate(sampleResume);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should be registered in template registry', () => {
        const template = (0, templateRegistry_1.getTemplate)('modern');
        expect(template).toBeDefined();
        expect(template?.name).toBe('modern');
    });
});
//# sourceMappingURL=modern.test.js.map