# Resume Builder

A modular, ATS-friendly resume generator that accepts structured JSON input and produces professional, machine-readable resumes in PDF or HTML format.

## Features

- 📄 Generate ATS-compliant resumes from structured JSON
- 🤖 **AI-Powered Resume Enhancement** - Tailor your resume to specific job descriptions
- 🔗 Support for reusable resume sections via file references
- 💻 CLI interface for command-line usage
- 🌐 REST API for programmatic access
- 🎨 Multiple ATS-safe resume templates
- ✅ Built-in ATS validation and compliance checking
- 📊 Change tracking and detailed enhancement reports

## Installation

```bash
npm install
```

## Quick Start

### CLI Usage

Generate a PDF resume:
```bash
npm run cli -- --input resume.json --output resume.pdf
```

Generate an HTML resume:
```bash
npm run cli -- --input resume.json --output resume.html --format html
```

Specify a template:
```bash
npm run cli -- --input resume.json --output resume.pdf --template modern
```

Run ATS validation:
```bash
npm run cli -- --input resume.json --output resume.pdf --validate
```

### Enhance Resume (Phase 2)

Enhance your resume based on a job description:
```bash
npm run cli -- enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --output ./output \
  --template classic \
  --format pdf
```

**Options:**
- `--input, -i` - Path to resume JSON file (required)
- `--job, -j` - Path to job description file (required)
- `--output, -o` - Output directory for enhanced files (default: `./output`)
- `--template, -t` - Template name: `classic` or `modern` (default: `classic`)
- `--format, -f` - Output format: `pdf` or `html` (default: `pdf`)
- `--verbose, -v` - Enable verbose logging

**Output Files:**
- `{name}-enhanced.json` - Enhanced resume with change tracking metadata
- `{name}-enhanced.pdf` - Enhanced resume PDF
- `{name}-enhanced.md` - Markdown report showing all changes made

**Example:**
```bash
npm run cli -- enhanceResume \
  --input examples/resume.json \
  --job examples/job-description.txt \
  --output ./output \
  --template classic
```

This will:
1. Load and parse your resume
2. Analyze the job description
3. Enhance bullet points with relevant keywords
4. Reorder skills to prioritize job-relevant technologies
5. Generate enhanced JSON, PDF, and Markdown report
6. Display ATS score improvement and change summary

### API Usage

Start the API server:
```bash
npm run api
```

For complete API documentation, see [API.md](./API.md).

**Quick Examples:**

Generate a resume via API:
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d @resume.json \
  --output resume.pdf
```

Validate a resume:
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d @resume.json
```

Enhance a resume based on job description:
```bash
curl -X POST http://localhost:3000/api/enhanceResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "jobDescription": "Full job description text...",
    "options": {
      "focusAreas": ["bulletPoints", "keywords"],
      "tone": "professional"
    }
  }'
```

For complete API documentation, see [API.md](./API.md).

## Project Structure

```
resume-builder/
├── src/
│   ├── templates/          # ATS-safe resume templates
│   ├── services/          # Core business logic
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── cli/               # CLI interface
│   └── api/               # REST API server
├── resume-sections/       # Reusable resume sections (JSON)
├── examples/              # Example files
└── tests/                 # Test files
```

## Resume JSON Schema

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed schema documentation.

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
