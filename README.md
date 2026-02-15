# Resume Builder

A modular, ATS-friendly resume generator that accepts structured JSON input and produces professional, machine-readable resumes in PDF or HTML format.

## Features

- 📄 Generate ATS-compliant resumes from structured JSON
- 🔗 Support for reusable resume sections via file references
- 💻 CLI interface for command-line usage
- 🌐 REST API for programmatic access
- 🎨 Multiple ATS-safe resume templates
- ✅ Built-in ATS validation and compliance checking
- 🔧 Extensible architecture for future AI-driven enhancements

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
