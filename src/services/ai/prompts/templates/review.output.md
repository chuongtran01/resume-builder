Provide your analysis as a JSON object with the following structure:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "opportunities": ["opportunity1", "opportunity2", ...],
  "prioritizedActions": [
    {
      "type": "enhance" | "reorder" | "add" | "remove" | "rewrite",
      "section": "section identifier (e.g., 'experience[0]' for first experience, 'experience' for all experiences, 'skills', 'summary' if it exists in original)",
      "priority": "high" | "medium" | "low",
      "reason": "explanation of why this action is needed",
      "suggestedChange": "optional specific suggestion"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "overall analysis summary"
}

IMPORTANT: Only use sections that exist in the original resume. The "add" type should only be used for adding items WITHIN existing sections (e.g., adding skills to the skills section), NOT for adding new sections to the resume.
