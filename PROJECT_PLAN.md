# ATS-Friendly Resume Generator - Project Plan

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Phases](#project-phases)
3. [Folder Structure](#folder-structure)
4. [Resume JSON Schema](#resume-json-schema)
5. [Template System Design](#template-system-design)
6. [ATS Compliance Rules](#ats-compliance-rules)
7. [CLI/API Usage Examples](#cliapi-usage-examples)
8. [Phase 1 Implementation Details](#phase-1-implementation-details)
9. [Phase 2 AI Integration Architecture](#phase-2-ai-integration-architecture)
10. [Tech Stack](#tech-stack)
11. [Development Roadmap](#development-roadmap)

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

### Phase 2: AI Integration (Future Enhancement)
**Status:** Architecture preparation only  
**Timeline:** Post-MVP

**Core Features:**
- 🤖 AI service interface for resume enhancement
- 🤖 Job description analysis and matching
- 🤖 Automated bullet point rewriting
- 🤖 Keyword optimization suggestions
- 🤖 Missing skills detection
- 🤖 ATS score improvements
- 🤖 Integration with Phase 1 generator

**Deliverables:**
- AI service interface (`resumeEnhancementService.ts`)
- Mock implementation for testing
- Enhancement result types
- Integration hooks in generator

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

### Core Schema Structure

```typescript
interface Resume {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education?: Education | Education[] | string;  // Can be object, array, or file reference
  skills?: Skills | string;                      // Can be object or file reference
  certifications?: Certification[] | string;    // Can be array or file reference
  projects?: Project[] | string;                 // Can be array or file reference
  languages?: Language[] | string;               // Can be array or file reference
  awards?: Award[] | string;                     // Can be array or file reference
}
```

### Detailed Type Definitions

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

## Template System Design

### Template Interface

All templates must implement the following interface:

```typescript
interface ResumeTemplate {
  name: string;
  description: string;
  render(resume: Resume): string;  // Returns HTML string
  validate(resume: Resume): ValidationResult;
}
```

### Template Requirements

1. **ATS Compliance:**
   - Single-column layout only
   - Semantic HTML5 headings (`<h1>`, `<h2>`, etc.)
   - No floating elements or absolute positioning
   - No images used for text content
   - Machine-readable text (no text in images)
   - Standard font families (Arial, Times New Roman, Calibri)
   - Adequate spacing and margins

2. **Structure:**
   - Header with personal information
   - Summary section (if provided)
   - Experience section (required)
   - Education section (if provided)
   - Skills section (if provided)
   - Additional sections (certifications, projects, etc.)

3. **Styling:**
   - Print-friendly CSS
   - Consistent typography
   - Professional color scheme (black text on white)
   - Responsive for PDF generation

### Template Registration

Templates are registered in a template registry:

```typescript
const templates = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate
};
```

### Adding New Templates

1. Create a new template file in `src/templates/`
2. Implement the `ResumeTemplate` interface
3. Register in the template registry
4. No changes needed to core generator logic

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

The ATS validator will check for:

1. **Missing Sections:**
   - Warn if required sections (experience) are missing
   - Suggest adding summary if absent

2. **Non-Standard Headings:**
   - Flag headings that don't match common patterns
   - Suggest alternatives (e.g., "Work History" → "Experience")

3. **Content Quality:**
   - Warn for bullet points exceeding 2 lines
   - Flag missing dates in experience entries
   - Check for proper date formatting (YYYY-MM or YYYY-MM-DD)

4. **Technical Issues:**
   - Verify PDF contains selectable text
   - Check for proper encoding
   - Validate file size

---

## CLI/API Usage Examples

### CLI Usage

#### Basic PDF Generation
```bash
generate --input resume.json --output resume.pdf
```

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

## Phase 1 Implementation Details

### Core Components

#### 1. Resume Generator Service (`resumeGenerator.ts`)
- **Responsibilities:**
  - Load and parse `resume.json`
  - Resolve `file:` references to reusable sections
  - Merge all sections into complete resume object
  - Select appropriate template
  - Render resume to HTML
  - Convert HTML to PDF (if needed)
  - Handle errors and validation

#### 2. File Loader (`fileLoader.ts`)
- **Responsibilities:**
  - Detect `file:` prefix in JSON values
  - Resolve file paths (relative to resume.json location)
  - Load and parse JSON files
  - Recursively handle nested file references
  - Cache loaded files to avoid duplicates
  - Handle file not found errors

#### 3. PDF Generator (`pdfGenerator.ts`)
- **Responsibilities:**
  - Convert HTML to PDF using puppeteer or similar
  - Configure PDF options (margins, format, etc.)
  - Ensure text is selectable
  - Optimize file size
  - Handle PDF generation errors

#### 4. HTML Generator (`htmlGenerator.ts`)
- **Responsibilities:**
  - Generate standalone HTML files
  - Include embedded CSS
  - Ensure print-friendly styling
  - Validate HTML output

#### 5. ATS Validator (`atsValidator.ts`)
- **Responsibilities:**
  - Check for required sections
  - Validate heading structure
  - Check content quality (bullet length, dates, etc.)
  - Generate warnings and suggestions
  - Calculate ATS score (0-100)

#### 6. CLI Interface (`cli/index.ts`)
- **Responsibilities:**
  - Parse command-line arguments using commander
  - Validate input/output paths
  - Call generator service
  - Display progress and results
  - Handle errors gracefully

#### 7. API Server (`api/server.ts`)
- **Responsibilities:**
  - Set up Express/Fastify server
  - Define REST endpoints
  - Validate request payloads
  - Call generator service
  - Return appropriate responses
  - Handle errors and return proper status codes

### Implementation Flow

```
1. User provides resume.json (CLI or API)
   ↓
2. FileLoader resolves file: references
   ↓
3. Resume object is fully constructed
   ↓
4. ATS Validator checks compliance (optional)
   ↓
5. Template selected and resume rendered to HTML
   ↓
6. HTML converted to PDF (if format=pdf)
   ↓
7. Output file written or returned via API
```

### Error Handling

- **File Not Found:** Clear error message with file path
- **Invalid JSON:** Parse error with line number
- **Missing Required Fields:** Validation error listing missing fields
- **Template Not Found:** Error with available templates list
- **PDF Generation Failure:** Detailed error with troubleshooting tips

---

## Phase 2 AI Integration Architecture

### AI Service Interface

```typescript
interface ResumeEnhancementService {
  enhanceResume(
    resume: Resume,
    jobDescription: string,
    options?: EnhancementOptions
  ): Promise<EnhancementResult>;
}

interface EnhancementOptions {
  focusAreas?: ('keywords' | 'bulletPoints' | 'skills' | 'summary')[];
  tone?: 'professional' | 'technical' | 'leadership';
  maxSuggestions?: number;
}

interface EnhancementResult {
  originalResume: Resume;
  enhancedResume: Resume;
  improvements: Improvement[];
  keywordSuggestions: KeywordSuggestion[];
  missingSkills: string[];
  atsScore: {
    before: number;
    after: number;
    improvement: number;
  };
  recommendations: string[];
}

interface Improvement {
  type: 'bulletPoint' | 'summary' | 'skill' | 'keyword';
  section: string;
  original: string;
  suggested: string;
  reason: string;
  confidence: number;  // 0-1
}

interface KeywordSuggestion {
  keyword: string;
  category: string;
  suggestedPlacement: string[];
  importance: 'high' | 'medium' | 'low';
}
```

### Mock Implementation (Phase 1)

For Phase 1, a mock service will be implemented that:

1. **Returns Example Enhancements:**
   - Sample rewritten bullet points
   - Keyword suggestions based on common tech stack
   - Missing skills detection (basic pattern matching)
   - ATS score improvements (simulated)

2. **Demonstrates Architecture:**
   - Shows how AI service integrates with generator
   - Provides interface for future AI integration
   - Allows testing of enhancement workflow

3. **Placeholder Logic:**
   - Pattern matching for common keywords
   - Rule-based bullet point improvements
   - Basic skill gap analysis

### Future AI Integration Points

1. **API Endpoint:** `POST /api/enhanceResume`
   - Accepts resume + job description
   - Returns enhancement suggestions
   - Optionally generates enhanced resume

2. **CLI Command:** `enhanceResume --input resume.json --job-description job.txt`
   - Generates enhanced version
   - Shows diff of changes
   - Optionally applies enhancements

3. **Integration with Generator:**
   - Generator can accept enhancement results
   - Apply suggestions automatically or with confirmation
   - Generate enhanced resume PDF/HTML

### AI Service Architecture

```
┌─────────────────┐
│  AI Service     │
│  Interface      │
└────────┬────────┘
         │
         ├─── Mock Implementation (Phase 1)
         │
         └─── Real AI Implementation (Phase 2)
              ├─── OpenAI GPT Integration
              ├─── Anthropic Claude Integration
              └─── Custom ML Model
```

---

## Tech Stack

### Core Technologies
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript (v5+)
- **Package Manager:** npm or yarn

### Dependencies

#### PDF Generation
- **Primary:** `puppeteer` - Headless Chrome for HTML-to-PDF
- **Alternative:** `pdfkit` - Direct PDF generation (if needed)
- **Fallback:** `html-pdf` - Simpler but less control

#### CLI
- **commander** - Command-line argument parsing
- **chalk** - Terminal colors and styling
- **ora** - Terminal spinners for progress

#### API Server
- **express** or **fastify** - Web framework
- **zod** or **joi** - Request validation
- **cors** - CORS support
- **helmet** - Security headers

#### Utilities
- **fs-extra** - Enhanced file system operations
- **path** - Path resolution utilities
- **winston** or **pino** - Logging

#### Development
- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **@types/node** - Node.js type definitions
- **eslint** - Linting
- **prettier** - Code formatting
- **jest** - Testing framework

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli/index.ts",
    "cli": "node dist/cli/index.js",
    "api": "node dist/api/server.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

---

## Development Roadmap

### Week 1: Foundation
- [ ] Set up TypeScript project structure
- [ ] Define Resume JSON schema types
- [ ] Implement file loader for reusable sections
- [ ] Create basic template interface
- [ ] Set up testing framework

### Week 2: Core Generator
- [ ] Implement resume generator service
- [ ] Create first ATS-compliant template (modern)
- [ ] Implement PDF generation with puppeteer
- [ ] Implement HTML generation
- [ ] Add error handling and logging

### Week 3: CLI & API
- [ ] Build CLI interface with commander
- [ ] Create REST API server
- [ ] Add request validation
- [ ] Implement file upload/download handling
- [ ] Add comprehensive error handling

### Week 4: Templates & Validation
- [ ] Create additional templates (classic, minimal)
- [ ] Implement ATS validator
- [ ] Add validation warnings and suggestions
- [ ] Create example resume files
- [ ] Write documentation

### Week 5: Phase 2 Preparation
- [ ] Design AI service interface
- [ ] Implement mock AI service
- [ ] Create enhancement result types
- [ ] Add integration hooks
- [ ] Test enhancement workflow

### Week 6: Polish & Documentation
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Update README with examples
- [ ] Create API documentation
- [ ] Prepare for Phase 2 AI integration

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

### ATS Compatibility
- Test generated PDFs with actual ATS systems when possible
- Keep templates simple and standard
- Avoid any experimental HTML/CSS features
- Prioritize text readability over visual design

### Extensibility
- Template system allows adding new templates without core changes
- Service architecture supports plugin-style additions
- Type system ensures type safety across extensions

### Performance
- Cache loaded JSON files to avoid redundant reads
- Optimize PDF generation for large resumes
- Consider streaming for API responses

### Security
- Validate all file paths to prevent directory traversal
- Sanitize user input in API endpoints
- Limit file size for API uploads
- Validate JSON structure before processing

---

## Next Steps

1. **Review and approve this plan**
2. **Set up project structure** (folders, package.json, tsconfig.json)
3. **Implement Phase 1 components** in order:
   - Types and schemas
   - File loader
   - Template system
   - Generator service
   - CLI interface
   - API server
   - ATS validator
4. **Create example files** and test end-to-end
5. **Implement mock AI service** for Phase 2 preparation
6. **Documentation and examples**

---

*This plan is a living document and may be updated as the project evolves.*
