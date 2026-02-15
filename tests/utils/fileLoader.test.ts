/**
 * Unit tests for fileLoader utility
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  resolveFileReferences,
  resolveFilePath,
  isFileReferenceString,
  clearFileCache,
  FileNotFoundError,
  InvalidJsonError,
  CircularReferenceError,
  MaxDepthExceededError,
} from '@utils/fileLoader';

describe('fileLoader', () => {
  const testDir = path.join(__dirname, '../fixtures/fileLoader');
  const baseDir = testDir;

  beforeEach(() => {
    clearFileCache();
  });

  afterEach(async () => {
    // Clean up test files
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  describe('isFileReferenceString', () => {
    it('should detect file references', () => {
      expect(isFileReferenceString('file:./test.json')).toBe(true);
      expect(isFileReferenceString('file:../test.json')).toBe(true);
      expect(isFileReferenceString('file:/absolute/path/test.json')).toBe(true);
    });

    it('should reject non-file references', () => {
      expect(isFileReferenceString('not a file ref')).toBe(false);
      expect(isFileReferenceString('')).toBe(false);
      expect(isFileReferenceString(null)).toBe(false);
      expect(isFileReferenceString(undefined)).toBe(false);
      expect(isFileReferenceString({})).toBe(false);
    });
  });

  describe('resolveFilePath', () => {
    it('should resolve relative file paths', () => {
      const fileRef = 'file:./test.json' as const;
      const resolved = resolveFilePath(fileRef, baseDir);
      expect(resolved).toBe(path.resolve(baseDir, './test.json'));
    });

    it('should resolve parent directory paths', () => {
      const fileRef = 'file:../test.json' as const;
      const resolved = resolveFilePath(fileRef, baseDir);
      expect(resolved).toBe(path.resolve(path.dirname(baseDir), './test.json'));
    });
  });

  describe('resolveFileReferences', () => {
    it('should load a simple JSON file', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.json');
      await fs.ensureDir(testDir);
      await fs.writeJson(testFile, { name: 'Test', value: 123 });

      const fileRef = `file:${path.relative(baseDir, testFile)}` as const;
      const result = await resolveFileReferences(fileRef, { baseDir });

      expect(result).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle nested file references', async () => {
      // Create nested files
      await fs.ensureDir(testDir);
      const nestedDir = path.join(testDir, 'nested');
      await fs.ensureDir(nestedDir);

      const nestedFile = path.join(nestedDir, 'nested.json');
      await fs.writeJson(nestedFile, { nested: true });

      const parentFile = path.join(testDir, 'parent.json');
      await fs.writeJson(parentFile, {
        data: `file:${path.relative(testDir, nestedFile)}`,
      });

      const fileRef = `file:${path.relative(baseDir, parentFile)}` as const;
      const result = await resolveFileReferences(fileRef, { baseDir });

      expect(result).toEqual({
        data: { nested: true },
      });
    });

    it('should cache loaded files', async () => {
      const testFile = path.join(testDir, 'cache-test.json');
      await fs.ensureDir(testDir);
      await fs.writeJson(testFile, { cached: true });

      const fileRef = `file:${path.relative(baseDir, testFile)}` as const;

      // Load twice
      const result1 = await resolveFileReferences(fileRef, { baseDir });
      const result2 = await resolveFileReferences(fileRef, { baseDir });

      expect(result1).toEqual(result2);
      expect(result1).toEqual({ cached: true });
    });

    it('should throw FileNotFoundError for missing files', async () => {
      const fileRef = 'file:./nonexistent.json' as const;

      await expect(
        resolveFileReferences(fileRef, { baseDir })
      ).rejects.toThrow(FileNotFoundError);
    });

    it('should throw InvalidJsonError for invalid JSON', async () => {
      const testFile = path.join(testDir, 'invalid.json');
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, '{ invalid json }');

      const fileRef = `file:${path.relative(baseDir, testFile)}` as const;

      await expect(
        resolveFileReferences(fileRef, { baseDir })
      ).rejects.toThrow(InvalidJsonError);
    });

    it('should throw CircularReferenceError for circular references', async () => {
      await fs.ensureDir(testDir);

      const file1 = path.join(testDir, 'file1.json');
      const file2 = path.join(testDir, 'file2.json');

      await fs.writeJson(file1, {
        ref: `file:${path.relative(testDir, file2)}`,
      });
      await fs.writeJson(file2, {
        ref: `file:${path.relative(testDir, file1)}`,
      });

      const fileRef = `file:${path.relative(baseDir, file1)}` as const;

      await expect(
        resolveFileReferences(fileRef, { baseDir })
      ).rejects.toThrow(CircularReferenceError);
    });

    it('should throw MaxDepthExceededError when depth limit exceeded', async () => {
      await fs.ensureDir(testDir);

      const file1 = path.join(testDir, 'deep1.json');
      await fs.writeJson(file1, { ref: `file:${path.relative(testDir, 'deep2.json')}` });

      const fileRef = `file:${path.relative(baseDir, file1)}` as const;

      await expect(
        resolveFileReferences(fileRef, { baseDir, maxDepth: 1 })
      ).rejects.toThrow(MaxDepthExceededError);
    });

    it('should resolve file references in arrays', async () => {
      await fs.ensureDir(testDir);

      const file1 = path.join(testDir, 'item1.json');
      const file2 = path.join(testDir, 'item2.json');

      await fs.writeJson(file1, { item: 1 });
      await fs.writeJson(file2, { item: 2 });

      const arrayRef = [
        `file:${path.relative(baseDir, file1)}`,
        `file:${path.relative(baseDir, file2)}`,
      ] as const;

      const result = await resolveFileReferences(arrayRef, { baseDir });

      expect(result).toEqual([{ item: 1 }, { item: 2 }]);
    });

    it('should resolve file references in objects', async () => {
      await fs.ensureDir(testDir);

      const nestedFile = path.join(testDir, 'nested.json');
      await fs.writeJson(nestedFile, { nested: true });

      const objRef = {
        key1: 'value1',
        key2: `file:${path.relative(baseDir, nestedFile)}`,
      };

      const result = await resolveFileReferences(objRef, { baseDir });

      expect(result).toEqual({
        key1: 'value1',
        key2: { nested: true },
      });
    });
  });
});
