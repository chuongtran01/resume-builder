/**
 * Markdown prompt template loader.
 */

import * as fs from 'fs-extra';
import * as path from 'path';

const TEMPLATE_DIR = path.join(__dirname, 'templates');
const SOURCE_TEMPLATE_DIR = path.join(process.cwd(), 'src/services/ai/prompts/templates');

export function loadPromptTemplateText(fileName: string): string {
  const templatePath = resolveTemplatePath(fileName);
  const text = fs.readFileSync(templatePath, 'utf8').trim();

  if (!text) {
    throw new Error(`Prompt template is empty: ${fileName}`);
  }

  return text;
}

function resolveTemplatePath(fileName: string): string {
  const candidates = [
    path.join(TEMPLATE_DIR, fileName),
    path.join(SOURCE_TEMPLATE_DIR, fileName),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Prompt template not found: ${fileName}`);
  }

  return found;
}
