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

### Prerequisites

Before using AI enhancement features, set up your `.env` file:

```bash
# Copy the example .env file
cp .env.example .env

# Edit .env and add your Gemini API key
GEMINI_API_KEY=your-api-key-here
```

See [AI_CONFIG.md](./AI_CONFIG.md) for detailed configuration options.

### CLI Usage

**Note:** For development, use `npm run dev` which handles TypeScript path aliases. For production, build first with `npm run build` then use `npm run cli`.

#### Generate Resume

Generate a PDF resume:
```bash
npm run dev -- generate --input resume.json --output resume.pdf
```

Or after building:
```bash
npm run build
npm run cli -- generate --input resume.json --output resume.pdf
```

Generate an HTML resume:
```bash
npm run dev -- generate --input resume.json --output resume.html --format html
```

Specify a template:
```bash
npm run dev -- generate --input resume.json --output resume.pdf --template modern
```

Use compact spacing:
```bash
npm run dev -- generate --input resume.json --output resume.pdf --spacing compact
```

Run ATS validation:
```bash
npm run dev -- generate --input resume.json --output resume.pdf --validate
```

**Generate Command Options:**
- `--input, -i <path>` - Path to resume JSON file (required)
- `--output, -o <path>` - Path for output file (required)
- `--template, -t <name>` - Template name: `classic` or `modern` (default: `classic`)
- `--format, -f <format>` - Output format: `pdf` or `html` (default: `pdf`)
- `--spacing <mode>` - Spacing mode: `auto` (default), `compact`, or `normal`
- `--compact` - Use compact spacing (shorthand for `--spacing compact`)
- `--validate` - Run ATS validation
- `--verbose, -v` - Enable verbose logging

### Enhance Resume with AI

Enhance your resume based on a job description using AI:

**Basic usage (with defaults):**
```bash
npm run dev -- enhanceResume \
  --input resume.json \
  --job job-description.txt
```

Or after building:
```bash
npm run build
npm run cli -- enhanceResume \
  --input resume.json \
  --job job-description.txt
```

This uses default settings:
- AI Provider: `gemini` (default)
- AI Model: `gemini-2.5-pro` (default)
- AI Temperature: `0.7` (default)
- Output directory: `./output` (default)
- Template: `classic` (default)
- Format: `pdf` (default)

**With all options:**
```bash
npm run dev -- enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --output ./output \
  --template classic \
  --format pdf \
  --ai-provider gemini \
  --ai-model gemini-2.5-pro \
  --ai-temperature 0.7 \
  --verbose
```

**Options:**
- `--input, -i` - Path to resume JSON file (required)
- `--job, -j` - Path to job description file (required)
- `--output, -o` - Output directory for enhanced files (default: `./output`)
- `--template, -t` - Template name: `classic` or `modern` (default: `classic`)
- `--format, -f` - Output format: `pdf` or `html` (default: `pdf`)
- `--ai-provider <provider>` - AI provider to use (default: `gemini`)
- `--ai-model <model>` - AI model to use: `gemini-2.5-pro` (default) or `gemini-3-flash-preview`
- `--ai-temperature <temp>` - AI temperature 0-1 (default: `0.7`)
- `--verbose, -v` - Enable verbose logging

**Output Files:**
- `{name}-enhanced.json` - Enhanced resume with change tracking metadata
- `{name}-enhanced.pdf` - Enhanced resume PDF
- `{name}-enhanced.md` - Markdown report showing all changes made

**Examples:**

Minimal usage (all defaults):
```bash
npm run dev -- enhanceResume \
  --input examples/resume.json \
  --job examples/job-description.txt
```

With custom AI model (faster and cheaper):
```bash
npm run dev -- enhanceResume \
  --input examples/resume.json \
  --job examples/job-description.txt \
  --ai-model gemini-3-flash-preview
```

With custom temperature:
```bash
npm run dev -- enhanceResume \
  --input examples/resume.json \
  --job examples/job-description.txt \
  --ai-temperature 0.8
```

This will:
1. Load and parse your resume
2. Initialize AI provider (Gemini) with configured settings from `.env` file
3. Analyze the job description using AI
4. Enhance resume with AI-powered improvements
5. Generate enhanced JSON, PDF, and Markdown report
6. Display ATS score improvement and change summary

**Note:** Make sure you have set up your `.env` file with `GEMINI_API_KEY` before running enhancement commands. See [AI_CONFIG.md](./AI_CONFIG.md) for configuration details.

### API Usage

**Prerequisites:** Build the project first:
```bash
npm run build
```

Start the API server:
```bash
npm run api
```

The server will start on `http://localhost:3000` by default.

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

# Run CLI in development mode (with TypeScript path aliases)
npm run dev -- <command> [options]

# Run CLI in production mode (after building)
npm run cli -- <command> [options]

# Start API server
npm run api

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

**Available Commands:**
- `generate` - Generate a resume from JSON
- `enhanceResume` - Enhance a resume using AI based on job description

## License

MIT
