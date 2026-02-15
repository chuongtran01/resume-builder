/**
 * Template registry for managing and retrieving resume templates
 */

import type { ResumeTemplate, TemplateRegistry } from '../types/template.types';

/**
 * Global template registry
 */
const templates: TemplateRegistry = {};

/**
 * Register a template in the registry
 * @param template - Template instance to register
 */
export function registerTemplate(template: ResumeTemplate): void {
  templates[template.name] = template;
}

/**
 * Get a template by name
 * @param name - Template name
 * @returns Template instance or undefined if not found
 */
export function getTemplate(name: string): ResumeTemplate | undefined {
  return templates[name];
}

/**
 * Get all registered templates
 * @returns Object with all registered templates
 */
export function getAllTemplates(): TemplateRegistry {
  return { ...templates };
}

/**
 * Get list of available template names
 * @returns Array of template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(templates);
}

/**
 * Check if a template exists
 * @param name - Template name
 * @returns True if template exists
 */
export function hasTemplate(name: string): boolean {
  return name in templates;
}

/**
 * Clear all registered templates (useful for testing)
 */
export function clearTemplates(): void {
  Object.keys(templates).forEach((key) => {
    delete templates[key];
  });
}
