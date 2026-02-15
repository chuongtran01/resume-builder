# Phase 2: AI-Powered Resume Enhancer - Task Breakdown

## 📋 Overview

Phase 2 implements a complete AI-powered resume enhancement system that takes a resume JSON and job description, then produces an enhanced resume with detailed change tracking, ATS-friendly PDF, and a comprehensive markdown report.

**Status:** 🚧 In Progress  
**Timeline:** Post-Phase 1

---

## 🎯 Goals

- Accept current resume JSON (from Phase 1)
- Accept job description text (extensible to URL later)
- Produce enhanced resume JSON with change tracking
- Generate ATS-friendly PDF from enhanced resume
- Generate Markdown report summarizing all changes
- Provide CLI and API interfaces
- Maintain modular, AI-ready architecture

---

## 📦 Task Groups

### Task Group 10: Foundation & Types
**Status:** ⏳ Pending

#### Task 10.1: Define Enhanced Resume Output Types
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Create TypeScript types for the enhanced resume output structure, including change tracking metadata.

**Requirements:**
- Define `EnhancedResumeOutput` interface with:
  - `updatedResume: Resume`
  - `suggestions: string[]`
  - `highlightedSkills: string[]`
  - `changesSummary: string`
  - `changesDetail: ChangeDetail[]`
  - `pdfPath: string`
  - `mdPath: string`
- Define `ChangeDetail` interface with:
  - `old: string`
  - `new: string`
  - `section?: string`
  - `type?: 'bulletPoint' | 'skill' | 'summary' | 'keyword'`
- Update existing `enhancement.types.ts` if needed
- Export types from `src/types/index.ts`

**Files to Create/Modify:**
- `src/types/enhancement.types.ts` (update)
- `src/types/index.ts` (update)

**Acceptance Criteria:**
- ✅ All types are properly defined and exported
- ✅ Types match the specification in PROJECT_PLAN.md
- ✅ TypeScript compilation passes without errors

---

#### Task 10.2: Create Job Description Parser Utility
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Create a utility to parse job descriptions and extract keywords, requirements, and important information.

**Requirements:**
- Extract keywords (technologies, skills, tools)
- Identify required qualifications
- Extract job title and company (if present)
- Extract years of experience requirements
- Return structured data for enhancement service
- Handle various job description formats

**Files to Create:**
- `src/utils/jobParser.ts`

**Interface:**
```typescript
interface ParsedJobDescription {
  keywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel?: string;
  jobTitle?: string;
  company?: string;
  requirements: string[];
}

function parseJobDescription(text: string): ParsedJobDescription
```

**Acceptance Criteria:**
- ✅ Can extract keywords from job descriptions
- ✅ Handles common job description formats
- ✅ Returns structured data
- ✅ Includes unit tests

---

### Task Group 11: Enhancement Service
**Status:** ⏳ Pending

#### Task 11.1: Implement Mock Resume Enhancement Service
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Implement a rules-based mock enhancement service that can be easily replaced with AI later.

**Requirements:**
- Implement `ResumeEnhancementService` interface
- Accept resume and job description
- Extract keywords from job description using parser
- Rewrite bullet points to include keywords (truthfully)
- Reorder skills to prioritize job-relevant ones
- Track all changes in `changesDetail` array
- Generate `changesSummary` string
- Identify `highlightedSkills` based on job description
- Generate `suggestions` array
- Never add experience/skills not in original resume
- Return `EnhancementResult` with all metadata

**Files to Create:**
- `src/services/resumeEnhancementService.ts`

**Key Functions:**
- `enhanceResume(resume, jobDescription, options?): Promise<EnhancementResult>`
- `rewriteBulletPoints(bulletPoints, keywords): ChangeDetail[]`
- `reorderSkills(skills, jobKeywords): ChangeDetail[]`
- `trackChanges(original, enhanced): ChangeDetail[]`
- `generateChangesSummary(changes): string`

**Acceptance Criteria:**
- ✅ Implements the service interface correctly
- ✅ Tracks all changes with old → new mappings
- ✅ Never adds content not in original resume
- ✅ Generates comprehensive change tracking
- ✅ Includes unit tests
- ✅ Ready for AI integration (modular design)

---

#### Task 11.2: Create Enhanced Resume JSON Generator
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Create a service that combines the enhanced resume with change tracking metadata into the final JSON output.

**Requirements:**
- Take `EnhancementResult` from enhancement service
- Combine enhanced resume with metadata
- Generate `EnhancedResumeOutput` structure
- Set output paths for PDF and Markdown
- Ensure all required fields are present

**Files to Create:**
- `src/services/enhancedResumeGenerator.ts`

**Key Functions:**
- `generateEnhancedResumeOutput(result, outputDir): EnhancedResumeOutput`
- `writeEnhancedResumeJson(output, path): Promise<void>`

**Acceptance Criteria:**
- ✅ Generates correct JSON structure
- ✅ Includes all required metadata fields
- ✅ Writes JSON file correctly
- ✅ Handles errors gracefully

---

### Task Group 12: Report Generation
**Status:** ⏳ Pending

#### Task 12.1: Implement Markdown Report Generator
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Create a service that generates a human-readable Markdown report summarizing all changes made to the resume.

**Requirements:**
- Generate report with name and contact info
- List highlighted skills
- Show experience changes with old → new format
- Include changes summary
- Create changes detail table
- List suggestions
- Format as clean, readable Markdown

**Files to Create:**
- `src/services/mdGenerator.ts`

**Key Functions:**
- `generateMarkdownReport(enhancedOutput): string`
- `formatContactInfo(personalInfo): string`
- `formatExperienceChanges(changesDetail): string`
- `formatChangesTable(changesDetail): string`
- `writeMarkdownReport(content, path): Promise<void>`

**Report Format:**
```markdown
# [Name] — Enhanced Resume Report

## Contact
- Email: [email]
- Phone: [phone]
- Location: [location]

## Highlighted Skills
- [Skill 1]
- [Skill 2]

## Experience Changes
- **Original:** [old text]
- **Enhanced:** [new text]

## Changes Summary
[Summary text]

## Changes Detail

| Original | Enhanced |
|----------|----------|
| [old] | [new] |

## Suggestions
- [Suggestion 1]
- [Suggestion 2]
```

**Acceptance Criteria:**
- ✅ Generates properly formatted Markdown
- ✅ Includes all required sections
- ✅ Formats changes clearly (old → new)
- ✅ Creates readable table for changes detail
- ✅ Writes file correctly

---

### Task Group 13: CLI Integration
**Status:** ⏳ Pending

#### Task 13.1: Implement Enhance Resume CLI Command
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Add a new CLI command `enhanceResume` that orchestrates the entire enhancement pipeline.

**Requirements:**
- Add `enhanceResume` command to CLI
- Accept `--input` / `-i` for resume JSON path
- Accept `--job` / `-j` for job description file path
- Accept `--output` / `-o` for output directory (default: `./output`)
- Accept `--template` for PDF template (default: `classic`)
- Accept `--format` for output format (default: `pdf`)
- Load and parse resume JSON
- Load job description text
- Call enhancement service
- Generate enhanced JSON
- Generate PDF using existing generator
- Generate Markdown report
- Display progress and results
- Handle errors gracefully

**Files to Modify:**
- `src/cli/index.ts` (add command)

**Command Usage:**
```bash
enhanceResume \
  --input ./examples/resume.json \
  --job ./examples/jobDescription.txt \
  --output ./output \
  --template classic \
  --format pdf
```

**Acceptance Criteria:**
- ✅ Command is properly registered
- ✅ All options are parsed correctly
- ✅ Validates input files exist
- ✅ Orchestrates full enhancement pipeline
- ✅ Generates all three output files
- ✅ Provides clear progress feedback
- ✅ Handles errors with helpful messages

---

### Task Group 14: API Integration
**Status:** ⏳ Pending

#### Task 14.1: Implement Enhance Resume API Endpoint
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Add a REST API endpoint `/api/enhanceResume` that accepts resume and job description, then returns enhanced resume with all outputs.

**Requirements:**
- Create `POST /api/enhanceResume` endpoint
- Accept JSON body with:
  - `resume: Resume` (required)
  - `jobDescription: string` (required)
  - `options?: EnhancementOptions` (optional)
- Validate request body using Zod schemas
- Call enhancement service
- Generate enhanced JSON
- Generate PDF (if format is pdf)
- Generate Markdown report
- Return JSON response with:
  - `success: boolean`
  - `enhancedResume: EnhancedResumeOutput`
  - `atsScore: AtsScore` (optional)
- Handle errors appropriately
- Set appropriate HTTP status codes
- Include PDF in response if requested (as base64 or file download)

**Files to Modify:**
- `src/api/routes.ts` (add endpoint)
- `src/api/middleware.ts` (add validation schema)

**Request Example:**
```json
{
  "resume": { ... },
  "jobDescription": "Full job description text...",
  "options": {
    "template": "classic",
    "format": "pdf",
    "focusAreas": ["bulletPoints", "keywords"]
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "enhancedResume": {
    "updatedResume": { ... },
    "suggestions": [...],
    "highlightedSkills": [...],
    "changesSummary": "...",
    "changesDetail": [...],
    "pdfPath": "./output/enhancedResume.pdf",
    "mdPath": "./output/enhancedResume.md"
  },
  "atsScore": {
    "before": 75,
    "after": 88,
    "improvement": 13
  }
}
```

**Acceptance Criteria:**
- ✅ Endpoint is properly registered
- ✅ Request validation works correctly
- ✅ Orchestrates full enhancement pipeline
- ✅ Returns correct response structure
- ✅ Handles errors with proper status codes
- ✅ Includes comprehensive error messages

---

### Task Group 15: Integration & Testing
**Status:** ⏳ Pending

#### Task 15.1: Create Example Job Description File
**Status:** ⏳ Pending  
**Priority:** Medium

**Description:**
Create example job description files for testing and documentation.

**Requirements:**
- Create `examples/jobDescription.txt` with realistic job description
- Include various formats (short, detailed, with requirements)
- Add to `.gitignore` if needed (or commit as example)

**Files to Create:**
- `examples/jobDescription.txt`

**Acceptance Criteria:**
- ✅ Example file is realistic and comprehensive
- ✅ Can be used for testing enhancement service

---

#### Task 15.2: Integration Testing
**Status:** ⏳ Pending  
**Priority:** High

**Description:**
Create integration tests for the complete enhancement pipeline.

**Requirements:**
- Test full CLI command end-to-end
- Test API endpoint end-to-end
- Verify all output files are generated correctly
- Verify change tracking is accurate
- Verify truthfulness (no added content)
- Test error handling

**Files to Create:**
- `tests/integration/enhanceResume.test.ts`

**Acceptance Criteria:**
- ✅ All integration tests pass
- ✅ Tests cover happy path and error cases
- ✅ Tests verify output file correctness

---

#### Task 15.3: Update Documentation
**Status:** ⏳ Pending  
**Priority:** Medium

**Description:**
Update project documentation to include Phase 2 features.

**Requirements:**
- Update `README.md` with enhancement command examples
- Update `API.md` with new endpoint documentation
- Add examples of enhanced resume output
- Document change tracking format
- Add troubleshooting section

**Files to Modify:**
- `README.md`
- `API.md`

**Acceptance Criteria:**
- ✅ Documentation is comprehensive
- ✅ Examples are clear and accurate
- ✅ API documentation matches implementation

---

## 📊 Progress Summary

### Task Group 10: Foundation & Types
- [ ] Task 10.1: Define Enhanced Resume Output Types
- [ ] Task 10.2: Create Job Description Parser Utility

### Task Group 11: Enhancement Service
- [ ] Task 11.1: Implement Mock Resume Enhancement Service
- [ ] Task 11.2: Create Enhanced Resume JSON Generator

### Task Group 12: Report Generation
- [ ] Task 12.1: Implement Markdown Report Generator

### Task Group 13: CLI Integration
- [ ] Task 13.1: Implement Enhance Resume CLI Command

### Task Group 14: API Integration
- [ ] Task 14.1: Implement Enhance Resume API Endpoint

### Task Group 15: Integration & Testing
- [ ] Task 15.1: Create Example Job Description File
- [ ] Task 15.2: Integration Testing
- [ ] Task 15.3: Update Documentation

**Total Tasks:** 9  
**Completed:** 0  
**In Progress:** 0  
**Pending:** 9

---

## 🔄 Workflow

### Recommended Implementation Order

1. **Foundation (Task Group 10)**
   - Start with types and interfaces
   - Create job parser utility

2. **Core Service (Task Group 11)**
   - Implement mock enhancement service
   - Create enhanced resume JSON generator

3. **Output Generation (Task Group 12)**
   - Implement Markdown report generator

4. **Integration (Task Groups 13-14)**
   - Add CLI command
   - Add API endpoint

5. **Polish (Task Group 15)**
   - Create examples
   - Write tests
   - Update documentation

---

## 🎯 Success Criteria

Phase 2 is complete when:

- ✅ CLI `enhanceResume` command works end-to-end
- ✅ API `/api/enhanceResume` endpoint works end-to-end
- ✅ All three output files are generated correctly (JSON, PDF, MD)
- ✅ Change tracking is comprehensive and accurate
- ✅ Truthfulness is maintained (no fabricated content)
- ✅ ATS compliance is preserved in enhanced PDF
- ✅ Markdown report is readable and informative
- ✅ Code is modular and ready for AI integration
- ✅ Documentation is complete
- ✅ Tests pass

---

## 📝 Notes

- **Truthfulness First:** Never add experience, skills, or achievements not in the original resume. Only reword, reorder, or emphasize existing content.

- **Change Tracking:** Every modification must be tracked with old → new mapping in `changesDetail`.

- **Modularity:** Keep enhancement logic separate from PDF/Markdown generation for easy AI integration later.

- **ATS Compliance:** Enhanced PDF must maintain all Phase 1 ATS compliance requirements.

- **Error Handling:** Provide clear, actionable error messages at every step.

---

*This task breakdown is a living document and may be updated as Phase 2 progresses.*
