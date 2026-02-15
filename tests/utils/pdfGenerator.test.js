"use strict";
/**
 * Unit tests for pdfGenerator utility
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
const pdfGenerator_1 = require("@utils/pdfGenerator");
describe('pdfGenerator', () => {
    const testDir = path.join(__dirname, '../fixtures/pdfGenerator');
    const validHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Resume</title>
  <style>
    body { font-family: Arial; padding: 1in; }
    h1 { color: #000; }
  </style>
</head>
<body>
  <h1>Test Resume</h1>
  <p>This is a test resume for PDF generation.</p>
</body>
</html>`;
    beforeEach(async () => {
        await fs.ensureDir(testDir);
    });
    afterEach(async () => {
        // Clean up test files
        if (await fs.pathExists(testDir)) {
            await fs.remove(testDir);
        }
    });
    afterAll(async () => {
        // Close browser after all tests
        await (0, pdfGenerator_1.closeBrowser)();
    });
    describe('generatePdfFromHtml', () => {
        it('should generate PDF from HTML string', async () => {
            const outputPath = path.join(testDir, 'test.pdf');
            await (0, pdfGenerator_1.generatePdfFromHtml)(validHtml, { outputPath });
            expect(await fs.pathExists(outputPath)).toBe(true);
            const stats = await fs.stat(outputPath);
            expect(stats.size).toBeGreaterThan(0);
        }, 60000); // Increase timeout for PDF generation
        it('should generate PDF with custom format', async () => {
            const outputPath = path.join(testDir, 'test-a4.pdf');
            await (0, pdfGenerator_1.generatePdfFromHtml)(validHtml, {
                outputPath,
                format: 'A4',
            });
            expect(await fs.pathExists(outputPath)).toBe(true);
        }, 60000);
        it('should generate PDF with custom margins', async () => {
            const outputPath = path.join(testDir, 'test-margins.pdf');
            await (0, pdfGenerator_1.generatePdfFromHtml)(validHtml, {
                outputPath,
                margins: {
                    top: '1in',
                    right: '1in',
                    bottom: '1in',
                    left: '1in',
                },
            });
            expect(await fs.pathExists(outputPath)).toBe(true);
        }, 60000);
        it('should create output directory if it does not exist', async () => {
            const outputPath = path.join(testDir, 'nested', 'test.pdf');
            await (0, pdfGenerator_1.generatePdfFromHtml)(validHtml, { outputPath });
            expect(await fs.pathExists(outputPath)).toBe(true);
        }, 60000);
        it('should handle invalid HTML gracefully', async () => {
            const outputPath = path.join(testDir, 'invalid.pdf');
            const invalidHtml = '<html><body><p>Unclosed tag';
            // Puppeteer might still generate a PDF from invalid HTML
            // So we just check it doesn't throw a critical error
            await expect((0, pdfGenerator_1.generatePdfFromHtml)(invalidHtml, { outputPath, timeout: 5000 })).resolves.toBe(outputPath);
        }, 60000);
        it('should respect timeout option', async () => {
            const outputPath = path.join(testDir, 'timeout.pdf');
            // Very large HTML that might take time to process
            const largeHtml = validHtml + '<div>'.repeat(1000) + '</div>'.repeat(1000);
            await (0, pdfGenerator_1.generatePdfFromHtml)(largeHtml, {
                outputPath,
                timeout: 10000,
            });
            expect(await fs.pathExists(outputPath)).toBe(true);
        }, 60000);
    });
    describe('generatePdfFromFile', () => {
        it('should generate PDF from HTML file', async () => {
            const htmlPath = path.join(testDir, 'source.html');
            const pdfPath = path.join(testDir, 'from-file.pdf');
            await fs.writeFile(htmlPath, validHtml, 'utf-8');
            await (0, pdfGenerator_1.generatePdfFromFile)(htmlPath, { outputPath: pdfPath });
            expect(await fs.pathExists(pdfPath)).toBe(true);
        }, 60000);
        it('should throw error if HTML file does not exist', async () => {
            const htmlPath = path.join(testDir, 'nonexistent.html');
            const pdfPath = path.join(testDir, 'test.pdf');
            await expect((0, pdfGenerator_1.generatePdfFromFile)(htmlPath, { outputPath: pdfPath })).rejects.toThrow(pdfGenerator_1.PdfGenerationError);
        });
    });
});
//# sourceMappingURL=pdfGenerator.test.js.map