Provide a JSON object with this exact top-level structure:
{
  "enhancedResume": {
    "personalInfo": { ... },
    "summary": "enhanced summary text",  // ONLY include if "summary" exists in the original resume
    "experience": [
      {
        "company": "...",
        "role": "...",
        "bulletPoints": ["enhanced bullet point 1", ...],
        ...
      }
    ],
    "education": { ... },  // ONLY include if "education" exists in the original
    "skills": { ... },  // ONLY include if "skills" exists in the original
    ...
  },
  "improvements": [
    {
      "type": "bulletPoint",
      "section": "experience[0].bulletPoints[0]",
      "original": "...",
      "suggested": "...",
      "reason": "...",
      "confidence": 0.9
    }
  ],
  "reasoning": "Brief explanation of the changes",
  "confidence": 0.9
}

CRITICAL RULES:
- enhancedResume MUST be a complete resume object with personalInfo and experience
- ONLY include sections that exist in the original resume
- Do NOT add new sections (e.g., do not add "summary" if it wasn't in the original)
- Match the exact structure and sections of the original resume
- You can add items WITHIN existing sections (e.g., add skills to skills section, add bullet points to experience)
- Ensure the JSON is valid and complete
