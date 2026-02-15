"use strict";
/**
 * Unit tests for htmlGenerator utility
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
const htmlGenerator_1 = require("@utils/htmlGenerator");
describe('htmlGenerator', () => {
    const testDir = path.join(__dirname, '../fixtures/htmlGenerator');
    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });
    afterEach(async () => {
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    const validHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;
    describe('validateHtml', () => {
        it('should validate correct HTML', () => {
            const result = (0, htmlGenerator_1.validateHtml)(validHtml);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should detect missing DOCTYPE', () => {
            const html = '<html><head></head><body></body></html>';
            const result = (0, htmlGenerator_1.validateHtml)(html);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing DOCTYPE declaration');
        });
        it('should detect missing html tag', () => {
            const html = '<!DOCTYPE html><head></head><body></body>';
            const result = (0, htmlGenerator_1.validateHtml)(html);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing <html> tag');
        });
        it('should detect mismatched tags', () => {
            const html = '<!DOCTYPE html><html><head></head><body></html>';
            const result = (0, htmlGenerator_1.validateHtml)(html);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes('Mismatched'))).toBe(true);
        });
    });
    describe('formatHtml', () => {
        it('should format HTML with newlines', () => {
            const html = '<!DOCTYPE html><html><head></head><body></body></html>';
            const formatted = (0, htmlGenerator_1.formatHtml)(html);
            expect(formatted).toContain('\n');
            expect(formatted).toContain('<html');
            expect(formatted).toContain('</html>');
        });
    });
    describe('generateHtmlString', () => {
        it('should return HTML string when valid', () => {
            const result = (0, htmlGenerator_1.generateHtmlString)(validHtml);
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<html');
            expect(result).toContain('</html>');
        });
        it('should throw error for invalid HTML when validate=true', () => {
            const invalidHtml = '<html><head></head><body></html>';
            expect(() => (0, htmlGenerator_1.generateHtmlString)(invalidHtml, true)).toThrow(htmlGenerator_1.HtmlValidationError);
        });
        it('should not validate when validate=false', () => {
            const invalidHtml = '<html><head></head><body></html>';
            expect(() => (0, htmlGenerator_1.generateHtmlString)(invalidHtml, false)).not.toThrow();
        });
    });
    describe('generateHtmlFile', () => {
        it('should generate HTML file', async () => {
            const outputPath = path.join(testDir, 'test.html');
            await (0, htmlGenerator_1.generateHtmlFile)(validHtml, { outputPath });
            expect(await fs.pathExists(outputPath)).toBe(true);
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('<!DOCTYPE html>');
            expect(content).toContain('<html');
        });
        it('should validate HTML before writing', async () => {
            const outputPath = path.join(testDir, 'test.html');
            const invalidHtml = '<html><head></head><body></html>';
            await expect((0, htmlGenerator_1.generateHtmlFile)(invalidHtml, { outputPath, validate: true })).rejects.toThrow(htmlGenerator_1.HtmlValidationError);
        });
        it('should skip validation when validate=false', async () => {
            const outputPath = path.join(testDir, 'test.html');
            const invalidHtml = '<html><head></head><body></html>';
            await (0, htmlGenerator_1.generateHtmlFile)(invalidHtml, { outputPath, validate: false });
            expect(await fs.pathExists(outputPath)).toBe(true);
        });
        it('should format HTML when format=true', async () => {
            const outputPath = path.join(testDir, 'test.html');
            const unformattedHtml = '<!DOCTYPE html><html><head></head><body></body></html>';
            await (0, htmlGenerator_1.generateHtmlFile)(unformattedHtml, { outputPath, format: true });
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('\n');
        });
        it('should create output directory if it does not exist', async () => {
            const outputPath = path.join(testDir, 'nested', 'test.html');
            await (0, htmlGenerator_1.generateHtmlFile)(validHtml, { outputPath });
            expect(await fs.pathExists(outputPath)).toBe(true);
        });
    });
});
//# sourceMappingURL=htmlGenerator.test.js.map