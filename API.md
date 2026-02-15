# Resume Builder API Documentation

## Overview

The Resume Builder API provides REST endpoints for generating ATS-compliant resumes, validating resume content, and enhancing resumes based on job descriptions. The API accepts structured JSON input and returns PDF or HTML resumes, validation results, or enhanced resumes with detailed change tracking.

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
    "validate": "/api/validate",
    "enhance": "/api/enhanceResume"
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
```

---

### Enhance Resume

Enhance a resume based on a job description. This endpoint analyzes the job description, enhances the resume with relevant keywords, reorders skills, and provides detailed change tracking.

**Endpoint:** `POST /api/enhanceResume`

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
    "education": {
      "institution": "University of California",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationDate": "2020-05"
    },
    "skills": {
      "categories": [
        {
          "name": "Programming Languages",
          "items": ["JavaScript", "TypeScript", "Python"]
        }
      ]
    }
  },
  "jobDescription": "We are looking for a Senior Software Engineer with 5+ years of experience. Requirements: Proficient in React, TypeScript, and Node.js. Experience with AWS and cloud infrastructure. Strong problem-solving skills.",
  "options": {
    "focusAreas": ["bulletPoints", "keywords"],
    "tone": "professional",
    "maxSuggestions": 10
  },
  "aiProvider": "gemini",
  "aiModel": "gemini-2.5-pro",
  "aiOptions": {
    "temperature": 0.7,
    "maxTokens": 2000,
    "timeout": 30000,
    "maxRetries": 3
  }
}
```

**Request Fields:**
- `resume` (required) - Complete resume object (see Resume JSON Schema)
- `jobDescription` (required) - Full job description text
- `options` (optional) - Enhancement options:
  - `focusAreas` - Array of focus areas: `["keywords", "bulletPoints", "skills", "summary"]`
  - `tone` - Enhancement tone: `"professional" | "technical" | "leadership"`
  - `maxSuggestions` - Maximum number of suggestions to return
- `aiProvider` (optional) - AI provider to use: `"gemini"` (default: uses configured default provider)
- `aiModel` (optional) - AI model to use: `"gemini-2.5-pro"` (default) or `"gemini-3-flash-preview"`
- `aiOptions` (optional) - AI provider-specific options:
  - `temperature` - Temperature (0-1) for creativity control (default: 0.7)
  - `maxTokens` - Maximum tokens to generate (default: 2000)
  - `timeout` - Request timeout in milliseconds (default: 30000)
  - `maxRetries` - Maximum retry attempts (default: 3)

**Response:**

**200 OK** - Success:
```json
{
  "success": true,
  "enhancedResume": {
    "updatedResume": {
      "personalInfo": { ... },
      "summary": "Enhanced summary...",
      "experience": [ ... ],
      "skills": { ... }
    },
    "suggestions": [
      "Consider adding more job-relevant keywords",
      "Add a professional summary to improve ATS score"
    ],
    "highlightedSkills": ["React", "TypeScript", "Node.js"],
    "changesSummary": "Enhanced resume with 5 total changes. 3 bullet points were enhanced, skills were reordered to prioritize job-relevant technologies.",
    "changesDetail": [
      {
        "old": "Built scalable API services",
        "new": "Built scalable API services using React and TypeScript",
        "section": "experience[0]",
        "type": "bulletPoint"
      }
    ]
  },
  "atsScore": {
    "before": 75,
    "after": 85,
    "improvement": 10
  },
  "provider": {
    "name": "gemini",
    "displayName": "Google Gemini",
    "model": "gemini-2.5-pro",
    "temperature": 0.7
  },
  "pdf": {
    "base64": "JVBERi0xLjQKJeLjz9MKMy...",
    "contentType": "application/pdf",
    "filename": "enhanced-resume.pdf",
    "size": 122880
  },
  "markdown": {
    "content": "# John Doe — Enhanced Resume Report\n\n## Contact\n...",
    "filename": "enhanced-resume.md"
  }
}
```

**Response Fields:**
- `success` - Boolean indicating success
- `enhancedResume` - Enhanced resume output with change tracking:
  - `updatedResume` - The enhanced resume object
  - `suggestions` - Array of improvement suggestions
  - `highlightedSkills` - Skills highlighted as important for the job
  - `changesSummary` - Human-readable summary of all changes
  - `changesDetail` - Detailed list of all changes (old → new)
- `atsScore` - ATS score comparison:
  - `before` - Score before enhancement (0-100)
  - `after` - Score after enhancement (0-100)
  - `improvement` - Improvement amount
- `provider` - AI provider information:
  - `name` - Provider name (e.g., "gemini")
  - `displayName` - Human-readable provider name
  - `model` - Model used for enhancement
  - `temperature` - Temperature setting used
- `pdf` - Enhanced PDF file:
  - `base64` - Base64-encoded PDF content
  - `contentType` - MIME type (`application/pdf`)
  - `filename` - Suggested filename
  - `size` - File size in bytes
- `markdown` - Markdown report:
  - `content` - Full markdown report content
  - `filename` - Suggested filename

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "path": "jobDescription",
      "message": "Job description is required"
    }
  ]
}
```

**400 Bad Request** - Configuration error:
```json
{
  "success": false,
  "error": "Configuration error",
  "message": "Gemini API key not configured. Please set GEMINI_API_KEY in .env file."
}
```

**400 Bad Request** - Invalid provider:
```json
{
  "success": false,
  "error": "Invalid provider",
  "message": "Provider \"openai\" is not supported. Only \"gemini\" is currently supported."
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "API rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

**503 Service Unavailable** - Network error:
```json
{
  "success": false,
  "error": "Network error",
  "message": "Failed to connect to AI provider. Please try again later."
}
```

**504 Gateway Timeout** - Request timeout:
```json
{
  "success": false,
  "error": "Request timeout",
  "message": "AI provider request timed out. Please try again with a longer timeout."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An error occurred while enhancing the resume"
}
```

**Examples:**

Enhance resume (with defaults):
```bash
curl -X POST http://localhost:3000/api/enhanceResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "jobDescription": "We are looking for a Senior Software Engineer..."
  }' \
  | jq '.enhancedResume.changesSummary'
```

Enhance resume with custom AI model:
```bash
curl -X POST http://localhost:3000/api/enhanceResume \
  -H "Content-Type: application/json" \
  -d '{
    "resume": { ... },
    "jobDescription": "We are looking for a Senior Software Engineer...",
    "aiProvider": "gemini",
    "aiModel": "gemini-3-flash-preview",
    "aiOptions": {
      "temperature": 0.8
    }
  }' \
  | jq '.provider'
```

Using JavaScript (fetch):
```javascript
const response = await fetch('http://localhost:3000/api/enhanceResume', {
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
    jobDescription: 'We are looking for a Senior Software Engineer...',
    options: {
      focusAreas: ['bulletPoints', 'keywords'],
      tone: 'professional',
    },
    aiProvider: 'gemini',
    aiModel: 'gemini-2.5-pro',
    aiOptions: {
      temperature: 0.7,
      maxTokens: 2000,
    },
  }),
});

const result = await response.json();

if (result.success) {
  console.log('ATS Score Improvement:', result.atsScore.improvement);
  console.log('Changes:', result.enhancedResume.changesDetail.length);
  
  // Decode and save PDF
  const pdfBuffer = Buffer.from(result.pdf.base64, 'base64');
  fs.writeFileSync('enhanced-resume.pdf', pdfBuffer);
  
  // Save Markdown report
  fs.writeFileSync('enhanced-resume.md', result.markdown.content);
}
```

---

## Change Tracking Format

The enhancement service tracks all changes made to the resume. Each change in `changesDetail` has the following structure:

```typescript
{
  "old": "Original text/content before enhancement",
  "new": "Enhanced/replaced text/content after enhancement",
  "section": "experience[0]" | "skills.Programming Languages" | "summary",
  "type": "bulletPoint" | "skill" | "summary" | "keyword"
}
```

**Change Types:**
- `bulletPoint` - Changes to experience bullet points
- `skill` - Changes to skill ordering or categorization
- `summary` - Changes to professional summary
- `keyword` - Keyword additions or modifications

**Truthfulness Guarantee:**
The enhancement service never adds new experiences, skills, or content that wasn't in the original resume. All enhancements are truthful modifications of existing content.

---

## Troubleshooting

### Common Issues

**Enhancement returns no changes:**
- Ensure the job description contains relevant keywords
- Check that the resume has content that can be enhanced
- Verify the job description is not empty

**PDF generation fails:**
- Ensure Puppeteer dependencies are installed correctly
- Check available disk space
- Try generating HTML format instead

**Validation errors:**
- Verify resume JSON structure matches the schema
- Check that all required fields are present
- Ensure date formats are correct (YYYY-MM)

**API timeout:**
- Enhancement can take 10-30 seconds depending on resume size
- Consider increasing timeout settings for your HTTP client
- Check server logs for detailed error information

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
