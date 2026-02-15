/**
 * File loader utility for resolving and loading file references in resume JSON
 * Supports `file:./path/to/file.json` syntax with recursive resolution
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { isFileReference, type FileReference } from '@resume-types/resume.types';

/**
 * Cache for loaded files to avoid duplicate loads
 */
const fileCache = new Map<string, unknown>();

/**
 * Set of files currently being loaded (to detect circular references)
 */
const loadingFiles = new Set<string>();

/**
 * Options for file loading
 */
export interface FileLoaderOptions {
  /** Base directory for resolving relative paths */
  baseDir: string;
  /** Maximum depth for recursive file resolution */
  maxDepth?: number;
  /** Current depth (for recursion tracking) */
  currentDepth?: number;
}

/**
 * Error thrown when a file is not found
 */
export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when JSON parsing fails
 */
export class InvalidJsonError extends Error {
  constructor(filePath: string, originalError: Error) {
    super(`Invalid JSON in file ${filePath}: ${originalError.message}`);
    this.name = 'InvalidJsonError';
    this.cause = originalError;
  }
}

/**
 * Error thrown when a circular reference is detected
 */
export class CircularReferenceError extends Error {
  constructor(filePath: string) {
    super(`Circular reference detected: ${filePath}`);
    this.name = 'CircularReferenceError';
  }
}

/**
 * Error thrown when maximum depth is exceeded
 */
export class MaxDepthExceededError extends Error {
  constructor(maxDepth: number) {
    super(`Maximum file resolution depth (${maxDepth}) exceeded`);
    this.name = 'MaxDepthExceededError';
  }
}

/**
 * Detects if a value is a file reference
 * @param value - Value to check
 * @returns True if value is a file reference string
 */
export function isFileReferenceString(value: unknown): value is FileReference {
  return isFileReference(value);
}

/**
 * Resolves a file path relative to the base directory
 * @param fileRef - File reference string (e.g., "file:./path/to/file.json")
 * @param baseDir - Base directory for resolution
 * @returns Absolute file path
 */
export function resolveFilePath(
  fileRef: FileReference,
  baseDir: string
): string {
  // Remove "file:" prefix
  const relativePath = fileRef.replace(/^file:/, '');
  // Resolve relative to base directory
  const absolutePath = path.resolve(baseDir, relativePath);
  // Normalize the path
  return path.normalize(absolutePath);
}

/**
 * Loads and parses a JSON file
 * @param filePath - Absolute path to the JSON file
 * @returns Parsed JSON object
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {InvalidJsonError} If JSON is invalid
 */
export async function loadJsonFile(filePath: string): Promise<unknown> {
  // Check if file exists
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    throw new FileNotFoundError(filePath);
  }

  // Read and parse JSON
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidJsonError(filePath, error);
    }
    throw error;
  }
}

/**
 * Recursively resolves file references in a value
 * @param value - Value that may contain file references
 * @param options - File loader options
 * @returns Resolved value with all file references loaded
 */
export async function resolveFileReferences<T>(
  value: T,
  options: FileLoaderOptions
): Promise<T> {
  const {
    baseDir,
    maxDepth = 10,
    currentDepth = 0,
  } = options;

  // Check depth limit
  if (currentDepth >= maxDepth) {
    throw new MaxDepthExceededError(maxDepth);
  }

  // If value is a file reference, load it
  if (isFileReferenceString(value)) {
    const filePath = resolveFilePath(value, baseDir);

    // Check for circular references
    if (loadingFiles.has(filePath)) {
      throw new CircularReferenceError(filePath);
    }

    // Check cache first
    if (fileCache.has(filePath)) {
      return fileCache.get(filePath) as T;
    }

    // Mark as loading
    loadingFiles.add(filePath);

    try {
      // Load the file
      const loaded = await loadJsonFile(filePath);
      
      // Get directory of loaded file for resolving nested references
      const fileDir = path.dirname(filePath);

      // Recursively resolve any file references in the loaded content
      const resolved = await resolveFileReferences(loaded, {
        baseDir: fileDir,
        maxDepth,
        currentDepth: currentDepth + 1,
      });

      // Cache the resolved result
      fileCache.set(filePath, resolved);

      return resolved as T;
    } finally {
      // Remove from loading set
      loadingFiles.delete(filePath);
    }
  }

  // If value is an array, recursively resolve each element
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) =>
        resolveFileReferences(item, {
          ...options,
          currentDepth: currentDepth + 1,
        })
      )
    ) as Promise<T>;
  }

  // If value is an object, recursively resolve each property
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = await resolveFileReferences(val, {
        ...options,
        currentDepth: currentDepth + 1,
      });
    }
    return resolved as T;
  }

  // Primitive value, return as-is
  return value;
}

/**
 * Clears the file cache
 */
export function clearFileCache(): void {
  fileCache.clear();
  loadingFiles.clear();
}

/**
 * Gets the current cache size
 */
export function getCacheSize(): number {
  return fileCache.size;
}
