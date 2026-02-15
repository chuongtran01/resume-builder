"use strict";
/**
 * Unit tests for fileLoader utility
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const fileLoader_1 = require("@utils/fileLoader");
describe('fileLoader', () => {
    const testDir = path.join(__dirname, '../fixtures/fileLoader');
    const baseDir = testDir;
    beforeEach(() => {
        (0, fileLoader_1.clearFileCache)();
    });
    afterEach(async () => {
        // Clean up test files
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    describe('isFileReferenceString', () => {
        it('should detect file references', () => {
            expect((0, fileLoader_1.isFileReferenceString)('file:./test.json')).toBe(true);
            expect((0, fileLoader_1.isFileReferenceString)('file:../test.json')).toBe(true);
            expect((0, fileLoader_1.isFileReferenceString)('file:/absolute/path/test.json')).toBe(true);
        });
        it('should reject non-file references', () => {
            expect((0, fileLoader_1.isFileReferenceString)('not a file ref')).toBe(false);
            expect((0, fileLoader_1.isFileReferenceString)('')).toBe(false);
            expect((0, fileLoader_1.isFileReferenceString)(null)).toBe(false);
            expect((0, fileLoader_1.isFileReferenceString)(undefined)).toBe(false);
            expect((0, fileLoader_1.isFileReferenceString)({})).toBe(false);
        });
    });
    describe('resolveFilePath', () => {
        it('should resolve relative file paths', () => {
            const fileRef = 'file:./test.json';
            const resolved = (0, fileLoader_1.resolveFilePath)(fileRef, baseDir);
            expect(resolved).toBe(path.resolve(baseDir, './test.json'));
        });
        it('should resolve parent directory paths', () => {
            const fileRef = 'file:../test.json';
            const resolved = (0, fileLoader_1.resolveFilePath)(fileRef, baseDir);
            expect(resolved).toBe(path.resolve(path.dirname(baseDir), './test.json'));
        });
    });
    describe('resolveFileReferences', () => {
        it('should load a simple JSON file', async () => {
            // Create test file
            const testFile = path.join(testDir, 'test.json');
            await fs.ensureDir(testDir);
            await fs.writeJson(testFile, { name: 'Test', value: 123 });
            const fileRef = `file:${path.relative(baseDir, testFile)}`;
            const result = await (0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir });
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
            const fileRef = `file:${path.relative(baseDir, parentFile)}`;
            const result = await (0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir });
            expect(result).toEqual({
                data: { nested: true },
            });
        });
        it('should cache loaded files', async () => {
            const testFile = path.join(testDir, 'cache-test.json');
            await fs.ensureDir(testDir);
            await fs.writeJson(testFile, { cached: true });
            const fileRef = `file:${path.relative(baseDir, testFile)}`;
            // Load twice
            const result1 = await (0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir });
            const result2 = await (0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir });
            expect(result1).toEqual(result2);
            expect(result1).toEqual({ cached: true });
        });
        it('should throw FileNotFoundError for missing files', async () => {
            const fileRef = 'file:./nonexistent.json';
            await expect((0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir })).rejects.toThrow(fileLoader_1.FileNotFoundError);
        });
        it('should throw InvalidJsonError for invalid JSON', async () => {
            const testFile = path.join(testDir, 'invalid.json');
            await fs.ensureDir(testDir);
            await fs.writeFile(testFile, '{ invalid json }');
            const fileRef = `file:${path.relative(baseDir, testFile)}`;
            await expect((0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir })).rejects.toThrow(fileLoader_1.InvalidJsonError);
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
            const fileRef = `file:${path.relative(baseDir, file1)}`;
            await expect((0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir })).rejects.toThrow(fileLoader_1.CircularReferenceError);
        });
        it('should throw MaxDepthExceededError when depth limit exceeded', async () => {
            await fs.ensureDir(testDir);
            const file1 = path.join(testDir, 'deep1.json');
            await fs.writeJson(file1, { ref: `file:${path.relative(testDir, 'deep2.json')}` });
            const fileRef = `file:${path.relative(baseDir, file1)}`;
            await expect((0, fileLoader_1.resolveFileReferences)(fileRef, { baseDir, maxDepth: 1 })).rejects.toThrow(fileLoader_1.MaxDepthExceededError);
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
            ];
            const result = await (0, fileLoader_1.resolveFileReferences)(arrayRef, { baseDir });
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
            const result = await (0, fileLoader_1.resolveFileReferences)(objRef, { baseDir });
            expect(result).toEqual({
                key1: 'value1',
                key2: { nested: true },
            });
        });
    });
});
//# sourceMappingURL=fileLoader.test.js.map