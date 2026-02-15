# Resume Builder API Documentation

## Overview

The Resume Builder API provides REST endpoints for generating ATS-compliant resumes and validating resume content. The API accepts structured JSON input and returns PDF or HTML resumes, or validation results.

**Base URL:** `http://localhost:3000` (default)

## Authentication

Currently, the API does not require authentication. In production, you may want to add API keys or OAuth.

## Endpoints

### Health Check

Check if the API server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "resume-builder",
  "version": "1.0.0"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### Root Endpoint

Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Resume Builder API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "generate": "/api/generateResume",
    "validate": "/api/validate"
  }
}
```

**Example:**
```bash
curl http://localhost:3000/
```

---

### Generate Resume

Generate a PDF or HTML resume from structured JSON input.

**Endpoint:** `POST /api/generateResume`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "resume": {
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 123-456-7890",
      "location": "San Francisco, CA, USA"
    },
    "summary": "Experienced software engineer...",
    "experience": [
      {
        "company": "Tech Corp",
        "role": "Senior Software Engineer",
        "startDate": "2023-01",
        "endDate": "Present",
        "location": "Remote",
        "bulletPoints": [
          "Built scalable API services",
          "Led team of 4 engineers"
        ]
      }
    ],
    "education": [
      {
        "school": "University of California",
        "degree": "Bachelor of Science in Computer Science",
        "gpa": "3.8/4.0",
        "startDate": "2018-09",
        "endDate": "2022-05"
      }
    ],
    "skills": {
      "Programming Languages": ["JavaScript", "TypeScript", "Python"],
      "Frameworks & Libraries": ["React", "Node.js", "Express"]
    }
  },
  "options": {
    "template": "classic",
    "format": "pdf",
    "validate": false,
    "templateOptions": {
      "spacing": "auto",
      "pageBreaks": true,
      "printStyles": true
    }
  }
}
```

**Request Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `resume` | `Resume` | Yes | - | Complete resume object (see [Resume JSON Schema](#resume-json-schema)) |
| `options.template` | `string` | No | `"classic"` | Template name (`"modern"` or `"classic"`) |
| `options.format` | `"pdf" \| "html"` | No | `"pdf"` | Output format |
| `options.validate` | `boolean` | No | `false` | Run ATS validation before generation |
| `options.templateOptions.spacing` | `"compact" \| "normal" \| "auto"` | No | `"normal"` | Spacing mode |
| `options.templateOptions.pageBreaks` | `boolean` | No | `true` | Enable page breaks |
| `options.templateOptions.printStyles` | `boolean` | No | `true` | Enable print styles |
| `options.templateOptions.customCss` | `string` | No | - | Custom CSS to inject |

**Response:**

**Success (200 OK):**
- **Content-Type:** `application/pdf` or `text/html`
- **Content-Disposition:** `attachment; filename="resume.pdf"` or `attachment; filename="resume.html"`
- **Headers:**
  - `X-Resume-Template`: Template used
  - `X-Resume-Format`: Output format
  - `X-Resume-Size`: File size in bytes
  - `X-ATS-Score`: ATS score (if validation was enabled)
  - `X-ATS-Compliant`: `"true"` or `"false"` (if validation was enabled)
- **Body:** Binary file (PDF or HTML)

**Error Responses:**

**400 Bad Request** - Invalid template:
```json
{
  "error": "Invalid template",
  "message": "Template \"invalid\" not found. Available templates: modern, classic",
  "availableTemplates": ["modern", "classic"]
}
```

**400 Bad Request** - Validation error:
```json
{
  "error": "Validation error",
  "message": "Invalid request body",
  "details": [
    {
      "path": ["resume", "personalInfo", "name"],
      "message": "Required"
    }
  ]
}
```

**500 Internal Server Error** - PDF generation failed:
```json
{
  "error": "PDF generation failed",
  "message": "Failed to launch browser process"
}
```

**500 Internal Server Error** - Generic error:
```json
{
  "error": "Internal server error",
  "message": "An error occurred while generating the resume"
}
```

**Examples:**

Generate PDF resume:
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d @resume.json \
  --output resume.pdf
```

Generate HTML resume with modern template:
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "options": {
      "template": "modern",
      "format": "html"
    }
  }' \
  --output resume.html
```

Generate PDF with ATS validation:
```bash
curl -X POST http://localhost:3000/api/generateResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "options": {
      "format": "pdf",
      "validate": true
    }
  }' \
  --output resume.pdf \
  -v
```

Using JavaScript (fetch):
```javascript
const response = await fetch('http://localhost:3000/api/generateResume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resume: {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 123-456-7890',
        location: 'San Francisco, CA, USA',
      },
      // ... rest of resume
    },
    options: {
      template: 'classic',
      format: 'pdf',
    },
  }),
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume.pdf';
  a.click();
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

---

### Validate Resume

Validate a resume for ATS compliance and get detailed feedback.

**Endpoint:** `POST /api/validate`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "resume": {
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 123-456-7890",
      "location": "San Francisco, CA, USA"
    },
    "experience": [
      {
        "company": "Tech Corp",
        "role": "Senior Software Engineer",
        "startDate": "2023-01",
        "endDate": "Present",
        "location": "Remote",
        "bulletPoints": [
          "Built scalable API services"
        ]
      }
    ],
    "education": [
      {
        "school": "University of California",
        "degree": "Bachelor of Science in Computer Science",
        "startDate": "2018-09",
        "endDate": "2022-05"
      }
    ],
    "skills": {
      "Programming Languages": ["JavaScript", "TypeScript"]
    }
  }
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | `Resume` | Yes | Complete resume object (see [Resume JSON Schema](#resume-json-schema)) |

**Response:**

**Success (200 OK):**
```json
{
  "score": 85,
  "isCompliant": true,
  "errors": [],
  "warnings": [
    "Missing summary section",
    "Some bullet points exceed recommended length (150 characters)"
  ],
  "suggestions": [
    "Add a professional summary section",
    "Consider shortening bullet points for better readability",
    "Include more relevant keywords from job descriptions"
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `score` | `number` | ATS compliance score (0-100) |
| `isCompliant` | `boolean` | Whether the resume is ATS-compliant (score >= 70) |
| `errors` | `string[]` | Critical issues that should be fixed |
| `warnings` | `string[]` | Non-critical issues to consider |
| `suggestions` | `string[]` | Recommendations for improvement |

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "error": "Validation error",
  "message": "Invalid request body",
  "details": [
    {
      "path": ["resume", "personalInfo", "name"],
      "message": "Required"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An error occurred while validating the resume"
}
```

**Examples:**

Validate resume:
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d @resume.json
```

Using JavaScript (fetch):
```javascript
const response = await fetch('http://localhost:3000/api/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resume: {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        // ... rest of resume
      },
    },
  }),
});

const result = await response.json();
console.log('ATS Score:', result.score);
console.log('Compliant:', result.isCompliant);
console.log('Warnings:', result.warnings);
console.log('Suggestions:', result.suggestions);
```

---

## Resume JSON Schema

The resume object follows a structured schema. See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for complete schema documentation.

**Key Sections:**
- `personalInfo` - Personal contact information (required)
- `summary` - Professional summary (optional)
- `experience` - Work experience array (optional)
- `education` - Education array (optional)
- `skills` - Skills object with categories (optional)
- `projects` - Projects array (optional)
- `certifications` - Certifications array (optional)
- `languages` - Languages array (optional)

**File References:**
Sections can reference external JSON files using `file:` prefix:
```json
{
  "personalInfo": "file:./resume-sections/personalInfo.json",
  "education": "file:./resume-sections/education.json"
}
```

See [examples/resume.json](./examples/resume.json) for a complete example.

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK** - Request successful
- **400 Bad Request** - Invalid request (validation errors, invalid template, etc.)
- **404 Not Found** - Endpoint not found
- **500 Internal Server Error** - Server error

Error responses follow this format:
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [] // Optional: Additional error details
}
```

---

## Rate Limiting

Currently, the API does not implement rate limiting. In production, consider adding rate limiting to prevent abuse.

---

## CORS

CORS is enabled by default. Configure the `CORS_ORIGIN` environment variable to restrict origins:

```bash
CORS_ORIGIN=https://example.com npm run api
```

Default: `*` (all origins allowed)

---

## Environment Variables

| Variable | Default | Description |
|-----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `NODE_ENV` | `development` | Environment mode |

---

## Response Headers

### Generate Resume Endpoint

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/pdf` or `text/html` |
| `Content-Disposition` | `attachment; filename="resume.pdf"` |
| `Content-Length` | File size in bytes |
| `X-Resume-Template` | Template name used |
| `X-Resume-Format` | Output format (`pdf` or `html`) |
| `X-Resume-Size` | File size in bytes |
| `X-ATS-Score` | ATS score (if validation enabled) |
| `X-ATS-Compliant` | `"true"` or `"false"` (if validation enabled) |

---

## Best Practices

1. **Always validate resumes** before generating final versions using the `/api/validate` endpoint
2. **Use file references** for reusable sections to keep your resume JSON clean
3. **Choose appropriate spacing** - Use `"auto"` for automatic spacing adjustment based on content
4. **Handle errors gracefully** - Check response status codes and error messages
5. **Use appropriate templates** - `"classic"` for traditional industries, `"modern"` for tech/creative roles

---

## Support

For issues, questions, or contributions, please see the main [README.md](./README.md) or open an issue on GitHub.
