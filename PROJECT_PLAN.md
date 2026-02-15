# ATS-Friendly Resume Generator - Project Plan

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Phases](#project-phases)
3. [Folder Structure](#folder-structure)
4. [Resume JSON Schema](#resume-json-schema)
5. [ATS Compliance Rules](#ats-compliance-rules)
6. [CLI/API Usage Examples](#cliapi-usage-examples)
7. [Tech Stack](#tech-stack)
8. [Development Roadmap](#development-roadmap)

---

## Project Overview

This project is a modular, ATS-friendly resume generator that accepts structured JSON input and produces professional, machine-readable resumes in PDF or HTML format. The architecture is designed to be extensible, allowing future AI-driven resume tailoring to integrate seamlessly.

**Key Goals:**
- Generate ATS-compliant resumes from structured JSON
- Support reusable resume sections via file references
- Provide both CLI and API interfaces
- Maintain modular, extensible architecture
- Prepare foundation for AI-driven enhancements

---

## Project Phases

### Phase 1: CLI/API Generator (MVP)
**Status:** To be implemented  
**Timeline:** Initial development phase

**Core Features:**
- ✅ Parse `resume.json` with support for reusable sections (`file:` references)
- ✅ Generate ATS-compliant PDF and HTML resumes
- ✅ CLI interface with command-line arguments
- ✅ REST API endpoint for programmatic access
- ✅ Multiple ATS-safe resume templates
- ✅ Template system that's easy to extend
- ✅ Optional ATS validation and warnings
- ✅ TypeScript type safety throughout

**Deliverables:**
- Working CLI tool
- REST API server
- 2-3 ATS-compliant templates
- Comprehensive TypeScript types
- Documentation and examples

---

### Phase 2: AI-Powered Resume Enhancer
**Status:** To be implemented  
**Timeline:** Post-MVP

**Core Features:**
- 🤖 AI-powered resume enhancement service
- 🤖 Job description analysis and matching
- 🤖 Automated bullet point rewriting with change tracking
- 🤖 Keyword optimization and skill highlighting
- 🤖 Missing skills detection
- 🤖 ATS score improvements
- 🤖 Enhanced resume JSON output with detailed change tracking
- 🤖 ATS-friendly PDF generation from enhanced resume
- 🤖 Markdown report generation summarizing all changes
- 🤖 CLI command for resume enhancement
- 🤖 REST API endpoint for programmatic enhancement
- 🤖 Modular architecture ready for real AI integration

**Input:**
- `resume.json` - Current resume (from Phase 1)
- `jobDescription.txt` - Job description text (extensible to URL later)

**Output:**
- `enhancedResume.json` - Enhanced resume with change tracking metadata
- `enhancedResume.pdf` - ATS-friendly PDF of enhanced resume
- `enhancedResume.md` - Human-readable markdown report with change details

**Deliverables:**
- Resume enhancement service (`resumeEnhancementService.ts`)
- Mock implementation (rules-based, ready for AI replacement)
- Markdown report generator (`mdGenerator.ts`)
- Enhanced PDF generator integration
- CLI `enhanceResume` command
- REST API `/api/enhanceResume` endpoint
- Job description parser utility
- Comprehensive change tracking system
- Type definitions for enhancement results

---

## Folder Structure

```
resume-builder/
├── src/
│   ├── templates/              # ATS-safe resume templates
│   │   ├── modern.ts           # Modern single-column template
│   │   ├── classic.ts          # Classic professional template
│   │   ├── minimal.ts          # Minimalist template
│   │   └── template.types.ts   # Template interface definitions
│   │
│   ├── services/               # Core business logic
│   │   ├── resumeGenerator.ts  # Main generator service
│   │   ├── resumeEnhancementService.ts  # AI service (Phase 2)
│   │   └── atsValidator.ts     # ATS compliance checker
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── resume.types.ts     # Resume JSON schema types
│   │   ├── template.types.ts   # Template types
│   │   └── enhancement.types.ts    # AI enhancement types (Phase 2)
│   │
│   ├── utils/                  # Utility functions
│   │   ├── fileLoader.ts       # Load reusable JSON sections
│   │   ├── pdfGenerator.ts     # PDF generation utilities
│   │   ├── htmlGenerator.ts    # HTML generation utilities
│   │   └── logger.ts           # Logging utilities
│   │
│   ├── cli/                    # CLI interface
│   │   └── index.ts            # CLI entry point with commander
│   │
│   ├── api/                    # REST API server
│   │   ├── server.ts           # Express/Fastify server setup
│   │   ├── routes.ts           # API route handlers
│   │   └── middleware.ts       # Request validation, error handling
│   │
│   └── index.ts                # Main entry point (exports)
│
├── resume-sections/            # Reusable resume sections (JSON files)
│   ├── education.json
│   ├── skills.json
│   ├── certifications.json
│   └── projects.json
│
├── examples/                   # Example files
│   ├── resume.json             # Complete resume example
│   ├── resume-minimal.json     # Minimal resume example
│   └── output/                 # Sample generated outputs
│
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .cursor/                    # Cursor IDE rules
│   └── rules/
│
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── PROJECT_PLAN.md             # This file
```

---

## Resume JSON Schema

### Core Structure

A resume JSON file contains the following main sections:

#### PersonalInfo
```json
{
  "name": "Chuong Tran",
  "email": "chuong@example.com",
  "phone": "+1 123-456-7890",
  "location": "San Francisco, CA, USA",
  "linkedin": "https://linkedin.com/in/chuongtran",  // Optional
  "github": "https://github.com/chuongtran",          // Optional
  "website": "https://chuongtran.dev"                 // Optional
}
```

#### Experience
```json
{
  "company": "Awesome Corp",
  "role": "Senior Software Engineer",
  "startDate": "2023-01",
  "endDate": "Present",
  "location": "Remote",
  "bulletPoints": [
    "Built scalable API services with Node.js and TypeScript",
    "Led a team of 4 engineers to deliver features on time"
  ]
}
```

#### Education
```json
{
  "institution": "University of California, Berkeley",
  "degree": "Bachelor of Science",
  "field": "Computer Science",
  "graduationDate": "2018-05",
  "gpa": "3.8/4.0",  // Optional
  "honors": ["Summa Cum Laude"]  // Optional
}
```

#### Skills
```json
{
  "categories": [
    {
      "name": "Programming Languages",
      "items": ["TypeScript", "JavaScript", "Python", "Go"]
    },
    {
      "name": "Frameworks",
      "items": ["React", "Node.js", "Express", "Next.js"]
    },
    {
      "name": "Tools & Technologies",
      "items": ["Docker", "AWS", "PostgreSQL", "MongoDB"]
    }
  ]
}
```

#### Certification
```json
{
  "name": "AWS Certified Solutions Architect",
  "issuer": "Amazon Web Services",
  "date": "2023-06",
  "expirationDate": "2026-06",  // Optional
  "credentialId": "ABC123XYZ"    // Optional
}
```

### File Reference Syntax

Any section that accepts an object or array can also accept a file reference string:
- Format: `"file:./path/to/file.json"`
- Example: `"education": "file:./resume-sections/education.json"`
- The loader will resolve the path, load the JSON, and merge it into the resume object

### Complete Example

```json
{
  "personalInfo": {
    "name": "Chuong Tran",
    "email": "chuong@example.com",
    "phone": "+1 123-456-7890",
    "location": "San Francisco, CA, USA",
    "linkedin": "https://linkedin.com/in/chuongtran"
  },
  "summary": "Software engineer with 5 years of experience in fullstack development, specializing in scalable web applications and cloud infrastructure.",
  "experience": [
    {
      "company": "Awesome Corp",
      "role": "Senior Software Engineer",
      "startDate": "2023-01",
      "endDate": "Present",
      "location": "Remote",
      "bulletPoints": [
        "Built scalable API services with Node.js and TypeScript serving 1M+ requests/day",
        "Led a team of 4 engineers to deliver features on time and within budget",
        "Reduced API response time by 40% through optimization and caching strategies"
      ]
    },
    {
      "company": "StartupXYZ",
      "role": "Full Stack Engineer",
      "startDate": "2020-06",
      "endDate": "2022-12",
      "location": "San Francisco, CA",
      "bulletPoints": [
        "Developed React-based frontend with TypeScript and Redux",
        "Implemented RESTful APIs using Express.js and PostgreSQL"
      ]
    }
  ],
  "education": "file:./resume-sections/education.json",
  "skills": "file:./resume-sections/skills.json",
  "certifications": "file:./resume-sections/certifications.json"
}
```

---

## ATS Compliance Rules

### Layout Requirements
- ✅ **Single-column layout** - No multi-column designs
- ✅ **Standard margins** - 0.5" to 1" margins on all sides
- ✅ **Consistent spacing** - Uniform spacing between sections
- ✅ **No tables for layout** - Use semantic HTML structure

### Typography Requirements
- ✅ **Standard fonts** - Arial, Times New Roman, Calibri, Helvetica
- ✅ **Readable font size** - Minimum 10pt, recommended 11-12pt
- ✅ **No decorative fonts** - Avoid script or display fonts
- ✅ **Proper heading hierarchy** - Use `<h1>`, `<h2>`, `<h3>` appropriately

### Content Requirements
- ✅ **Semantic HTML** - Use proper HTML5 semantic elements
- ✅ **Text-based content** - All text must be actual text, not images
- ✅ **Standard section names** - Use common headings (Experience, Education, Skills)
- ✅ **Keyword optimization** - Support industry-standard keywords
- ✅ **No special characters** - Avoid Unicode symbols that may not parse correctly

### Format Requirements
- ✅ **PDF text selectable** - PDF must contain selectable text, not scanned images
- ✅ **No images for text** - Never use images to display text content
- ✅ **Proper encoding** - UTF-8 encoding for all text
- ✅ **File size** - Keep PDF under 2MB for ATS systems

### Validation Checks

The ATS validator checks for missing sections, non-standard headings, content quality issues, and technical problems like unselectable text or encoding issues.

---

## CLI/API Usage Examples

### CLI Usage

#### Basic PDF Generation
```bash
generate --input resume.json --output resume.pdf
```
(Default template: classic)

#### Specify Template
```bash
generate --input resume.json --output resume.pdf --template modern
```

#### Generate HTML
```bash
generate --input resume.json --output resume.html --format html
```

#### Run ATS Validation
```bash
generate --input resume.json --output resume.pdf --validate
```

#### Verbose Logging
```bash
generate --input resume.json --output resume.pdf --verbose
```

#### Full Example
```bash
generate \
  --input ./examples/resume.json \
  --output ./output/resume.pdf \
  --template classic \
  --validate \
  --verbose
```

### API Usage

#### Start Server
```bash
npm run api
# Server starts on http://localhost:3000
```

#### Generate PDF (POST Request)
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": {
      "personalInfo": { ... },
      "experience": [ ... ]
    },
    "options": {
      "format": "pdf",
      "template": "modern"
    }
  }' \
  --output resume.pdf
```

#### Generate HTML (POST Request)
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "options": {
      "format": "html",
      "template": "classic"
    }
  }' \
  --output resume.html
```

#### Validate Resume (POST Request)
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... }
  }'
```

#### Response Format
```json
{
  "success": true,
  "format": "pdf",
  "template": "modern",
  "fileSize": 123456,
  "warnings": [
    "Summary section is missing",
    "Bullet point exceeds recommended length"
  ],
  "atsScore": 85
}
```

---

## Phase 2 AI Integration

### Overview

Phase 2 implements a complete AI-powered resume enhancement system that takes a resume JSON and job description, then produces an enhanced resume with detailed change tracking, ATS-friendly PDF, and a comprehensive markdown report.

### Enhancement Pipeline

1. **Input:** resume.json + jobDescription.txt
2. **Job Description Parser:** Extract keywords and requirements
3. **Resume Enhancement Service:** Rewrite bullet points, reorder skills, track changes
4. **Output Generation:** Create enhanced JSON, PDF, and Markdown report

### Enhanced Resume Output

The enhanced resume JSON includes:
- Updated resume with improvements
- List of suggestions
- Highlighted skills relevant to the job
- Human-readable summary of changes
- Detailed change tracking (old → new for each modification)
- Paths to generated PDF and Markdown files

### Implementation Strategy

**Phase 2.1: Mock Implementation (Rules-Based)**
- Pattern-based keyword extraction
- Bullet point rewriting with keyword injection
- Skill reordering based on job relevance
- Comprehensive change tracking
- Never adds content not in original resume

**Phase 2.2: AI Integration (Future)**
- Architecture designed for easy AI integration
- Support for OpenAI, Anthropic, or custom models
- Multi-agent system support (Modifier + Reviewer agents)

### Markdown Report

The generated Markdown report includes:
- Contact information
- Highlighted skills
- Experience changes (original → enhanced)
- Changes summary
- Detailed changes table
- Suggestions for improvement

### CLI Command

```bash
enhanceResume \
  --input ./examples/resume.json \
  --job ./examples/jobDescription.txt \
  --output ./output \
  --template classic \
  --format pdf
```

**Output Files:**
- `enhancedResume.json` - Enhanced resume with metadata
- `enhancedResume.pdf` - ATS-friendly PDF
- `enhancedResume.md` - Markdown report

### API Endpoint

**POST `/api/enhanceResume`**

Accepts resume JSON and job description, returns enhanced resume with change tracking, PDF path, and Markdown report path.

### Key Requirements

- **Truthfulness:** Never add experience or skills not in original resume
- **ATS Compliance:** Maintain all Phase 1 ATS compliance rules
- **Change Tracking:** Track every modification with old → new mapping
- **Modularity:** Easy to swap mock implementation with real AI

---

## Tech Stack

### Core Technologies
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript (v5+)
- **Package Manager:** npm or yarn

### Key Dependencies
- **PDF Generation:** puppeteer (HTML-to-PDF conversion)
- **CLI:** commander, chalk, ora
- **API Server:** express/fastify, zod/joi for validation
- **Utilities:** fs-extra, winston/pino for logging
- **Development:** typescript, jest, eslint, prettier

---

## Development Roadmap

### Phase 1: MVP
- Set up project structure and TypeScript configuration
- Implement resume JSON parsing with file references
- Create ATS-compliant templates (modern, classic, minimal)
- Build PDF and HTML generation
- Implement CLI and REST API interfaces
- Add ATS validation and warnings
- Create examples and documentation

### Phase 2: AI Enhancement
- Design enhancement service interface
- Implement mock/rules-based enhancement service
- Create job description parser
- Build change tracking system
- Generate Markdown reports
- Add CLI and API endpoints for enhancement
- Prepare architecture for AI integration

---

## Success Criteria

### Phase 1 Complete When:
- ✅ CLI generates PDF and HTML from resume.json
- ✅ API endpoint accepts JSON and returns PDF/HTML
- ✅ File references (`file:...`) are properly resolved
- ✅ At least 2 ATS-compliant templates are available
- ✅ ATS validator provides useful warnings
- ✅ All code is typed with TypeScript
- ✅ Documentation is complete
- ✅ Mock AI service demonstrates Phase 2 architecture

### Phase 2 Ready When:
- ✅ AI service interface is defined
- ✅ Mock implementation works end-to-end
- ✅ Integration points are clear and documented
- ✅ Enhancement workflow is testable

---

## Notes & Considerations

- **ATS Compatibility:** Keep templates simple, test with actual ATS systems, prioritize text readability
- **Extensibility:** Template system supports easy additions, modular architecture
- **Performance:** Cache JSON files, optimize PDF generation
- **Security:** Validate file paths, sanitize inputs, limit file sizes

---

*This plan is a living document and may be updated as the project evolves.*
