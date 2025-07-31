"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISODocumentParser = void 0;
const mammoth = __importStar(require("mammoth"));
const xlsx = __importStar(require("xlsx"));
const natural = __importStar(require("natural"));
const fuse_js_1 = __importDefault(require("fuse.js"));
const pdfParse = require('pdf-parse');
const iso_standards_1 = require("../../../../shared/src/constants/iso-standards");
class ISODocumentParser {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
    }
    async parseDocument(buffer, mimeType, filename) {
        let content = '';
        let metadata = {
            fileType: mimeType
        };
        switch (mimeType) {
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
                const docResult = await mammoth.extractRawText({ buffer });
                content = this.cleanContentForDatabase(docResult.value);
                // Extract metadata from document properties if available
                break;
            case 'application/pdf':
                try {
                    console.log('🔍 Starting PDF parsing...');
                    console.log('📄 PDF buffer size:', buffer.length);
                    console.log('📄 PDF filename:', filename);
                    // Try pdf-parse first
                    try {
                        const pdfData = await pdfParse(buffer);
                        console.log('✅ PDF parsed successfully with pdf-parse');
                        console.log('📝 Extracted text length:', pdfData.text?.length || 0);
                        console.log('📋 PDF info:', pdfData.info);
                        content = this.cleanContentForDatabase(pdfData.text || '');
                        metadata = {
                            ...metadata,
                            title: pdfData.info?.Title,
                            author: pdfData.info?.Author,
                            createdDate: pdfData.info?.CreationDate ? this.parseSafeDate(pdfData.info.CreationDate) : undefined,
                            modifiedDate: pdfData.info?.ModDate ? this.parseSafeDate(pdfData.info.ModDate) : undefined
                        };
                    }
                    catch (parseError) {
                        console.warn('⚠️ pdf-parse failed, trying fallback method...');
                        console.warn('Parse error:', parseError instanceof Error ? parseError.message : 'Unknown error');
                        // Fallback: Basic text extraction
                        // For now, we'll just use a placeholder content
                        console.log('📝 Using fallback PDF handling for:', filename);
                        content = `[PDF Document: ${filename}]\n\nThis PDF could not be parsed automatically. Please review the original document.`;
                        metadata.title = filename.replace('.pdf', '');
                        metadata.parseError = true;
                    }
                }
                catch (pdfError) {
                    console.error('❌ Complete PDF processing failure:', pdfError);
                    console.error('📊 Error details:', {
                        name: pdfError instanceof Error ? pdfError.name : 'Unknown',
                        message: pdfError instanceof Error ? pdfError.message : 'Unknown error',
                        stack: pdfError instanceof Error ? pdfError.stack : 'No stack trace'
                    });
                    throw new Error(`Failed to process PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel':
                console.log('📊 Parsing Excel file...');
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                const sheets = workbook.SheetNames.map(name => {
                    const sheet = workbook.Sheets[name];
                    return xlsx.utils.sheet_to_txt(sheet);
                });
                const rawContent = sheets.join('\n\n');
                // Clean null bytes and other problematic characters for PostgreSQL
                content = this.cleanContentForDatabase(rawContent);
                console.log('📊 Excel content cleaned, length:', content.length);
                break;
            case 'text/plain':
                content = this.cleanContentForDatabase(buffer.toString('utf-8'));
                break;
            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }
        const sections = this.extractSections(content);
        return {
            content,
            metadata,
            sections
        };
    }
    extractSections(content) {
        const lines = content.split('\n');
        const sections = [];
        const sectionRegex = /^(\d+\.?\d*\.?\d*)\s+(.+)$/;
        const headingRegex = /^(#{1,6}|[A-Z][A-Z\s]+:?|^\s*[A-Z][^.!?]*$)/;
        let currentSection = null;
        let currentIndex = 0;
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Check for numbered sections (e.g., "4.1 Context")
            const sectionMatch = trimmedLine.match(sectionRegex);
            if (sectionMatch) {
                if (currentSection) {
                    currentSection.endIndex = currentIndex - 1;
                    sections.push(currentSection);
                }
                const level = sectionMatch[1].split('.').length;
                currentSection = {
                    title: trimmedLine,
                    content: '',
                    level,
                    startIndex: currentIndex,
                    endIndex: currentIndex
                };
            }
            // Check for heading-style sections
            else if (headingRegex.test(trimmedLine) && trimmedLine.length < 100) {
                if (currentSection) {
                    currentSection.endIndex = currentIndex - 1;
                    sections.push(currentSection);
                }
                currentSection = {
                    title: trimmedLine,
                    content: '',
                    level: 1,
                    startIndex: currentIndex,
                    endIndex: currentIndex
                };
            }
            // Add content to current section
            else if (currentSection && trimmedLine) {
                currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
            }
            currentIndex += line.length + 1; // +1 for newline
        }
        // Add the last section
        if (currentSection) {
            currentSection.endIndex = content.length;
            sections.push(currentSection);
        }
        return sections;
    }
    async classifyToISOClauses(document, standard) {
        const clauses = standard === 'ISO9001' ? iso_standards_1.ISO_9001_2015_CLAUSES : iso_standards_1.ISO_27001_2022_CLAUSES;
        const mappings = new Map();
        // Build search index
        const searchItems = [];
        for (const [clauseNum, clauseData] of Object.entries(clauses)) {
            const clause = clauseData;
            searchItems.push({
                clauseNumber: clauseNum,
                clauseTitle: clause.title,
                keywords: iso_standards_1.ISO_CLAUSE_KEYWORDS[clauseNum] || []
            });
            if (clause.subclauses) {
                for (const [subclauseNum, subclauseTitle] of Object.entries(clause.subclauses)) {
                    searchItems.push({
                        clauseNumber: subclauseNum,
                        clauseTitle: subclauseTitle,
                        keywords: iso_standards_1.ISO_CLAUSE_KEYWORDS[subclauseNum] || []
                    });
                }
            }
        }
        // Configure Fuse.js for fuzzy searching
        const fuse = new fuse_js_1.default(searchItems, {
            keys: ['clauseTitle', 'keywords'],
            threshold: 0.4,
            includeScore: true
        });
        // Analyze each section
        for (const section of document.sections) {
            const sectionText = `${section.title} ${section.content}`.toLowerCase();
            const tokens = this.tokenizer.tokenize(sectionText);
            // Direct clause number matching
            const clauseNumberMatch = section.title.match(/^\s*(\d+\.?\d*\.?\d*)/);
            if (clauseNumberMatch) {
                const matchedClause = searchItems.find(item => item.clauseNumber === clauseNumberMatch[1]);
                if (matchedClause) {
                    const mapping = {
                        clauseNumber: matchedClause.clauseNumber,
                        clauseTitle: matchedClause.clauseTitle,
                        confidence: 0.95,
                        keywords: matchedClause.keywords,
                        matchedContent: section.content.substring(0, 200) + '...'
                    };
                    if (!mappings.has(section.title)) {
                        mappings.set(section.title, []);
                    }
                    mappings.get(section.title).push(mapping);
                    continue;
                }
            }
            // Keyword and fuzzy matching
            const results = fuse.search(sectionText);
            for (const result of results.slice(0, 3)) { // Top 3 matches
                const confidence = 1 - (result.score || 0);
                if (confidence > 0.5) {
                    const mapping = {
                        clauseNumber: result.item.clauseNumber,
                        clauseTitle: result.item.clauseTitle,
                        confidence,
                        keywords: result.item.keywords,
                        matchedContent: section.content.substring(0, 200) + '...'
                    };
                    if (!mappings.has(section.title)) {
                        mappings.set(section.title, []);
                    }
                    mappings.get(section.title).push(mapping);
                }
            }
            // TF-IDF analysis for content similarity
            this.tfidf.addDocument(sectionText);
        }
        return mappings;
    }
    async extractMetadata(document) {
        const metadata = {};
        // Look for common metadata patterns
        const patterns = {
            documentType: /(?:document\s+type|type)\s*:\s*(.+)/i,
            version: /(?:version|revision|rev\.?)\s*:\s*(.+)/i,
            effectiveDate: /(?:effective\s+date|date\s+effective)\s*:\s*(.+)/i,
            reviewDate: /(?:review\s+date|next\s+review)\s*:\s*(.+)/i,
            owner: /(?:owner|author|prepared\s+by)\s*:\s*(.+)/i,
            approver: /(?:approved\s+by|approver)\s*:\s*(.+)/i
        };
        const searchText = document.sections
            .slice(0, 5) // Check first 5 sections
            .map(s => s.content)
            .join('\n');
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = searchText.match(pattern);
            if (match) {
                const value = match[1].trim();
                if (key.includes('Date')) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        metadata[key] = date;
                    }
                }
                else {
                    metadata[key] = value;
                }
            }
        }
        return metadata;
    }
    parseSafeDate(dateString) {
        try {
            const date = new Date(dateString);
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date detected:', dateString);
                return undefined;
            }
            return date;
        }
        catch (error) {
            console.warn('Date parsing error:', error);
            return undefined;
        }
    }
    cleanContentForDatabase(content) {
        // Remove null bytes and other problematic characters for PostgreSQL
        return content
            .replace(/\0/g, '') // Remove null bytes
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove other control characters except \n, \r, \t
            .replace(/\uFFFE/g, '') // Remove BOM
            .replace(/\uFEFF/g, '') // Remove BOM
            .trim();
    }
}
exports.ISODocumentParser = ISODocumentParser;
//# sourceMappingURL=iso-document-parser.js.map