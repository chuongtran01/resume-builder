# Phase 2: AI-Powered Resume Enhancer - Task Breakdown

## 📋 Overview

This document breaks down Phase 2 into detailed, actionable tasks organized by component and priority. Each task includes acceptance criteria and dependencies.

Phase 2 implements a complete AI-powered resume enhancement system that takes a resume JSON and job description, then produces an enhanced resume with detailed change tracking, ATS-friendly PDF, and a comprehensive markdown report.

**Status Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⏸️ Blocked

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

## 🏗️ Task Group 10: Foundation & Types

### Task 10.1: Define Enhanced Resume Output Types
**Status:** ✅  
**Priority:** High  
**Estimated Time:** 1 hour

**Description:**
Create TypeScript types for the enhanced resume output structure, including change tracking metadata.

**Subtasks:**
- [x] Create `ChangeDetail` interface with:
  - [x] `old: string` - Original text/content
  - [x] `new: string` - Enhanced/replaced text/content
  - [x] `section?: string` - Section where change occurred
  - [x] `type?: 'bulletPoint' | 'skill' | 'summary' | 'keyword'` - Type of change
- [x] Create `EnhancedResumeOutput` interface with:
  - [x] `updatedResume: Resume` - The enhanced resume object
  - [x] `suggestions: string[]` - List of general suggestions
  - [x] `highlightedSkills: string[]` - Skills highlighted for the job
  - [x] `changesSummary: string` - Human-readable summary of changes
  - [x] `changesDetail: ChangeDetail[]` - Detailed list of all changes
  - [x] `pdfPath: string` - Path to generated PDF file
  - [x] `mdPath: string` - Path to generated Markdown report
- [x] Update `src/types/enhancement.types.ts` with new interfaces
- [x] Verify types are exported from `src/types/index.ts`
- [x] Add JSDoc comments for all types

**Files to Create/Modify:**
- `src/types/enhancement.types.ts` (update)
- `src/types/index.ts` (verify exports)

**Acceptance Criteria:**
- All types are properly defined and exported
- Types match the specification in PROJECT_PLAN.md
- TypeScript compilation passes without errors
- JSDoc comments are comprehensive

**Dependencies:** Phase 1 Task 2.1 (Resume Types)

---

### Task 10.2: Create Job Description Parser Utility
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2.5 hours

**Description:**
Create a utility to parse job descriptions and extract keywords, requirements, and important information.

**Subtasks:**
- [ ] Create `src/utils/jobParser.ts`
- [ ] Implement keyword extraction (technologies, skills, tools)
- [ ] Implement required qualifications identification
- [ ] Implement job title extraction (if present)
- [ ] Implement company name extraction (if present)
- [ ] Implement years of experience extraction
- [ ] Implement preferred skills identification
- [ ] Create `ParsedJobDescription` interface
- [ ] Handle various job description formats
- [ ] Add error handling for malformed input
- [ ] Add logging for debugging
- [ ] Write unit tests

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
- Can extract keywords from job descriptions
- Handles common job description formats
- Returns structured data
- Includes comprehensive unit tests
- Handles edge cases gracefully

**Dependencies:** Task 10.1

---

## 🤖 Task Group 11: Enhancement Service

### Task 11.1: Implement Mock Resume Enhancement Service
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 4 hours

**Description:**
Implement a rules-based mock enhancement service that can be easily replaced with AI later.

**Subtasks:**
- [ ] Create `src/services/resumeEnhancementService.ts`
- [ ] Implement `ResumeEnhancementService` interface
- [ ] Implement `enhanceResume` method signature
- [ ] Integrate job description parser
- [ ] Implement keyword extraction from job description
- [ ] Implement `rewriteBulletPoints` helper function
  - [ ] Match keywords to existing bullet points
  - [ ] Rewrite bullet points to include keywords (truthfully)
  - [ ] Track changes in `ChangeDetail[]` format
- [ ] Implement `reorderSkills` helper function
  - [ ] Prioritize job-relevant skills
  - [ ] Track skill reordering changes
- [ ] Implement `trackChanges` helper function
  - [ ] Compare original vs enhanced resume
  - [ ] Generate comprehensive `changesDetail` array
- [ ] Implement `generateChangesSummary` helper function
  - [ ] Create human-readable summary of all changes
- [ ] Identify `highlightedSkills` based on job description keywords
- [ ] Generate `suggestions` array with improvement recommendations
- [ ] Ensure truthfulness (never add experience/skills not in original)
- [ ] Calculate ATS score improvements
- [ ] Return `EnhancementResult` with all metadata
- [ ] Add comprehensive error handling
- [ ] Add logging for debugging
- [ ] Write unit tests

**Files to Create:**
- `src/services/resumeEnhancementService.ts`

**Key Functions:**
- `enhanceResume(resume, jobDescription, options?): Promise<EnhancementResult>`
- `rewriteBulletPoints(bulletPoints, keywords): ChangeDetail[]`
- `reorderSkills(skills, jobKeywords): ChangeDetail[]`
- `trackChanges(original, enhanced): ChangeDetail[]`
- `generateChangesSummary(changes): string`

**Acceptance Criteria:**
- Implements the service interface correctly
- Tracks all changes with old → new mappings
- Never adds content not in original resume
- Generates comprehensive change tracking
- Includes comprehensive unit tests
- Ready for AI integration (modular design)
- All helper functions are well-tested

**Dependencies:** Task 10.1, Task 10.2

---

### Task 11.2: Create Enhanced Resume JSON Generator
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 1.5 hours

**Description:**
Create a service that combines the enhanced resume with change tracking metadata into the final JSON output.

**Subtasks:**
- [ ] Create `src/services/enhancedResumeGenerator.ts`
- [ ] Implement `generateEnhancedResumeOutput` function
  - [ ] Take `EnhancementResult` from enhancement service
  - [ ] Combine enhanced resume with metadata
  - [ ] Generate `EnhancedResumeOutput` structure
  - [ ] Set output paths for PDF and Markdown
  - [ ] Ensure all required fields are present
- [ ] Implement `writeEnhancedResumeJson` function
  - [ ] Write JSON to file system
  - [ ] Format JSON with proper indentation
  - [ ] Handle file write errors
- [ ] Add path validation
- [ ] Add error handling
- [ ] Add logging
- [ ] Write unit tests

**Files to Create:**
- `src/services/enhancedResumeGenerator.ts`

**Key Functions:**
- `generateEnhancedResumeOutput(result, outputDir): EnhancedResumeOutput`
- `writeEnhancedResumeJson(output, path): Promise<void>`

**Acceptance Criteria:**
- Generates correct JSON structure
- Includes all required metadata fields
- Writes JSON file correctly
- Handles errors gracefully
- Unit tests pass

**Dependencies:** Task 11.1

---

## 📄 Task Group 12: Report Generation

### Task 12.1: Implement Markdown Report Generator
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create a service that generates a human-readable Markdown report summarizing all changes made to the resume.

**Subtasks:**
- [ ] Create `src/services/mdGenerator.ts`
- [ ] Implement `generateMarkdownReport` function
  - [ ] Generate report header with name
  - [ ] Format contact information
  - [ ] List highlighted skills
  - [ ] Show experience changes with old → new format
  - [ ] Include changes summary
  - [ ] Create changes detail table
  - [ ] List suggestions
- [ ] Implement `formatContactInfo` helper function
- [ ] Implement `formatExperienceChanges` helper function
- [ ] Implement `formatChangesTable` helper function
- [ ] Implement `writeMarkdownReport` function
  - [ ] Write Markdown to file system
  - [ ] Handle file write errors
- [ ] Ensure clean, readable Markdown formatting
- [ ] Add error handling
- [ ] Add logging
- [ ] Write unit tests

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
- Generates properly formatted Markdown
- Includes all required sections
- Formats changes clearly (old → new)
- Creates readable table for changes detail
- Writes file correctly
- Unit tests pass

**Dependencies:** Task 11.2

---

## 💻 Task Group 13: CLI Integration

### Task 13.1: Implement Enhance Resume CLI Command
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 2.5 hours

**Description:**
Add a new CLI command `enhanceResume` that orchestrates the entire enhancement pipeline.

**Subtasks:**
- [ ] Add `enhanceResume` command to CLI
- [ ] Add `--input` / `-i` argument (required) for resume JSON path
- [ ] Add `--job` / `-j` argument (required) for job description file path
- [ ] Add `--output` / `-o` argument (optional, default: `./output`) for output directory
- [ ] Add `--template` argument (optional, default: `classic`) for PDF template
- [ ] Add `--format` argument (optional, default: `pdf`) for output format
- [ ] Implement input file validation
- [ ] Implement job description file validation
- [ ] Load and parse resume JSON
- [ ] Load job description text
- [ ] Call enhancement service
- [ ] Generate enhanced JSON
- [ ] Generate PDF using existing generator
- [ ] Generate Markdown report
- [ ] Display progress indicators
- [ ] Display success/error messages
- [ ] Handle errors gracefully
- [ ] Write integration tests

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
- Command is properly registered
- All options are parsed correctly
- Validates input files exist
- Orchestrates full enhancement pipeline
- Generates all three output files (JSON, PDF, MD)
- Provides clear progress feedback
- Handles errors with helpful messages
- Integration tests pass

**Dependencies:** Task 11.2, Task 12.1, Phase 1 Task 7.1 (Resume Generator)

---

## 🌐 Task Group 14: API Integration

### Task 14.1: Implement Enhance Resume API Endpoint
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Add a REST API endpoint `/api/enhanceResume` that accepts resume and job description, then returns enhanced resume with all outputs.

**Subtasks:**
- [ ] Create `POST /api/enhanceResume` endpoint
- [ ] Define request body schema using Zod:
  - [ ] `resume: Resume` (required)
  - [ ] `jobDescription: string` (required)
  - [ ] `options?: EnhancementOptions` (optional)
- [ ] Add validation middleware for request body
- [ ] Call enhancement service
- [ ] Generate enhanced JSON
- [ ] Generate PDF (if format is pdf)
- [ ] Generate Markdown report
- [ ] Return JSON response with:
  - [ ] `success: boolean`
  - [ ] `enhancedResume: EnhancedResumeOutput`
  - [ ] `atsScore: AtsScore` (optional)
- [ ] Handle errors appropriately
- [ ] Set appropriate HTTP status codes
- [ ] Include PDF in response if requested (as base64 or file download)
- [ ] Add request logging
- [ ] Write integration tests

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
- Endpoint is properly registered
- Request validation works correctly
- Orchestrates full enhancement pipeline
- Returns correct response structure
- Handles errors with proper status codes
- Includes comprehensive error messages
- Integration tests pass

**Dependencies:** Task 11.2, Task 12.1, Phase 1 Task 9.2 (Request Validation), Phase 1 Task 9.3 (API Endpoints)

---

## 🧪 Task Group 15: Integration & Testing

### Task 15.1: Create Example Job Description File
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 30 minutes

**Description:**
Create example job description files for testing and documentation.

**Subtasks:**
- [ ] Create `examples/jobDescription.txt` with realistic job description
- [ ] Include various formats (short, detailed, with requirements)
- [ ] Include common job description sections:
  - [ ] Job title and company
  - [ ] Required qualifications
  - [ ] Preferred skills
  - [ ] Experience requirements
  - [ ] Technologies and tools
- [ ] Ensure example is comprehensive and realistic
- [ ] Add to `.gitignore` if needed (or commit as example)

**Files to Create:**
- `examples/jobDescription.txt`

**Acceptance Criteria:**
- Example file is realistic and comprehensive
- Can be used for testing enhancement service
- Demonstrates various job description formats

**Dependencies:** None

---

### Task 15.2: Integration Testing
**Status:** ⬜  
**Priority:** High  
**Estimated Time:** 3 hours

**Description:**
Create integration tests for the complete enhancement pipeline.

**Subtasks:**
- [ ] Create `tests/integration/enhanceResume.test.ts`
- [ ] Test full CLI command end-to-end
  - [ ] Test with valid inputs
  - [ ] Test with invalid inputs
  - [ ] Test error handling
- [ ] Test API endpoint end-to-end
  - [ ] Test with valid request
  - [ ] Test with invalid request
  - [ ] Test error handling
- [ ] Verify all output files are generated correctly
  - [ ] Verify enhanced JSON structure
  - [ ] Verify PDF generation
  - [ ] Verify Markdown report generation
- [ ] Verify change tracking is accurate
- [ ] Verify truthfulness (no added content)
- [ ] Test with various job descriptions
- [ ] Test error scenarios

**Files to Create:**
- `tests/integration/enhanceResume.test.ts`

**Acceptance Criteria:**
- All integration tests pass
- Tests cover happy path and error cases
- Tests verify output file correctness
- Tests verify change tracking accuracy
- Tests verify truthfulness guarantee

**Dependencies:** Task 13.1, Task 14.1, Task 15.1

---

### Task 15.3: Update Documentation
**Status:** ⬜  
**Priority:** Medium  
**Estimated Time:** 2 hours

**Description:**
Update project documentation to include Phase 2 features.

**Subtasks:**
- [ ] Update `README.md` with enhancement command examples
  - [ ] Add `enhanceResume` CLI command documentation
  - [ ] Add usage examples
  - [ ] Add output file descriptions
- [ ] Update `API.md` with new endpoint documentation
  - [ ] Document `/api/enhanceResume` endpoint
  - [ ] Add request/response examples
  - [ ] Document error responses
- [ ] Add examples of enhanced resume output
- [ ] Document change tracking format
- [ ] Add troubleshooting section
- [ ] Update project overview to include Phase 2

**Files to Modify:**
- `README.md`
- `API.md`

**Acceptance Criteria:**
- Documentation is comprehensive
- Examples are clear and accurate
- API documentation matches implementation
- All Phase 2 features are documented

**Dependencies:** Task 13.1, Task 14.1

---

## 📊 Task Summary

### By Priority

**High Priority (Must Have):**
- Task Group 10: Foundation & Types (2 tasks)
- Task Group 11: Enhancement Service (2 tasks)
- Task Group 12: Report Generation (1 task)
- Task Group 13: CLI Integration (1 task)
- Task Group 14: API Integration (1 task)
- Task Group 15: Integration Testing (1 task)

**Medium Priority (Should Have):**
- Task Group 15: Examples & Documentation (2 tasks)

### Estimated Total Time
- High Priority: ~16.5 hours
- Medium Priority: ~2.5 hours
- **Total: ~19 hours**

### Task Dependencies Graph

```
10.1 → 10.2
 ↓
11.1 → 11.2
 ↓
12.1
 ↓
13.1 ← 12.1, 11.2
14.1 ← 12.1, 11.2
 ↓
15.1
15.2 ← 13.1, 14.1, 15.1
15.3 ← 13.1, 14.1
```

---

## ✅ Phase 2 Completion Checklist

Before marking Phase 2 as complete, verify:

- [ ] All High Priority tasks completed
- [ ] CLI `enhanceResume` command works end-to-end
- [ ] API `/api/enhanceResume` endpoint works end-to-end
- [ ] All three output files are generated correctly (JSON, PDF, MD)
- [ ] Change tracking is comprehensive and accurate
- [ ] Truthfulness is maintained (no fabricated content)
- [ ] ATS compliance is preserved in enhanced PDF
- [ ] Markdown report is readable and informative
- [ ] Code is modular and ready for AI integration
- [ ] Documentation is complete
- [ ] All tests pass
- [ ] Code quality standards met
- [ ] Examples work end-to-end

---

## 📝 Notes

- **Truthfulness First:** Never add experience, skills, or achievements not in the original resume. Only reword, reorder, or emphasize existing content.

- **Change Tracking:** Every modification must be tracked with old → new mapping in `changesDetail`.

- **Modularity:** Keep enhancement logic separate from PDF/Markdown generation for easy AI integration later.

- **ATS Compliance:** Enhanced PDF must maintain all Phase 1 ATS compliance requirements.

- **Error Handling:** Provide clear, actionable error messages at every step.

---

*Last Updated: [Date]*  
*Total Tasks: 9*  
*Estimated Completion: 2-3 weeks*
