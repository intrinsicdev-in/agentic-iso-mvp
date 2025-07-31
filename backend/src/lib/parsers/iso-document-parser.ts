import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import * as natural from 'natural';
import Fuse from 'fuse.js';
const pdfParse = require('pdf-parse');
import { ISO_9001_2015_CLAUSES, ISO_27001_2022_CLAUSES, ISO_CLAUSE_KEYWORDS } from '../../../../shared/src/constants/iso-standards';

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    fileType: string;
    parseError?: boolean;
  };
  sections: DocumentSection[];
}

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  startIndex: number;
  endIndex: number;
}

export interface ClauseMapping {
  clauseNumber: string;
  clauseTitle: string;
  confidence: number;
  keywords: string[];
  matchedContent: string;
}

export class ISODocumentParser {
  private tokenizer: natural.WordTokenizer;
  private tfidf: natural.TfIdf;
  
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  async parseDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocument> {
    let content = '';
    let metadata: ParsedDocument['metadata'] = {
      fileType: mimeType
    };

    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        // Extract HTML to preserve formatting
        const htmlResult = await mammoth.convertToHtml({ buffer }, {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh", 
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Quote'] => blockquote:fresh",
            "table => table:fresh"
          ],
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
              };
            });
          })
        });
        
        // Store the HTML content to preserve formatting
        content = this.cleanContentForDatabase(htmlResult.value);
        
        // Also extract raw text for search purposes
        const rawTextResult = await mammoth.extractRawText({ buffer });
        
        // Log conversion info
        console.log('📄 DOCX Conversion Summary:');
        console.log('- HTML length:', htmlResult.value.length);
        console.log('- Raw text length:', rawTextResult.value.length);
        console.log('- Conversion messages:', htmlResult.messages.length);
        
        if (htmlResult.messages.length > 0) {
          console.log('⚠️ Conversion issues:', htmlResult.messages.map(m => `${m.type}: ${m.message}`));
        }
        
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
          } catch (parseError) {
            console.warn('⚠️ pdf-parse failed, trying fallback method...');
            console.warn('Parse error:', parseError instanceof Error ? parseError.message : 'Unknown error');
            
            // Fallback: Basic text extraction
            // For now, we'll just use a placeholder content
            console.log('📝 Using fallback PDF handling for:', filename);
            content = `[PDF Document: ${filename}]\n\nThis PDF could not be parsed automatically. Please review the original document.`;
            metadata.title = filename.replace('.pdf', '');
            metadata.parseError = true;
          }
        } catch (pdfError) {
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

  private extractSections(content: string): DocumentSection[] {
    const lines = content.split('\n');
    const sections: DocumentSection[] = [];
    const sectionRegex = /^(\d+\.?\d*\.?\d*)\s+(.+)$/;
    const headingRegex = /^(#{1,6}|[A-Z][A-Z\s]+:?|^\s*[A-Z][^.!?]*$)/;
    
    let currentSection: DocumentSection | null = null;
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

  async classifyToISOClauses(
    document: ParsedDocument,
    standard: 'ISO9001' | 'ISO27001'
  ): Promise<Map<string, ClauseMapping[]>> {
    const clauses = standard === 'ISO9001' ? ISO_9001_2015_CLAUSES : ISO_27001_2022_CLAUSES;
    const mappings = new Map<string, ClauseMapping[]>();

    // Build search index
    const searchItems = [];
    for (const [clauseNum, clauseData] of Object.entries(clauses)) {
      const clause = clauseData as any;
      searchItems.push({
        clauseNumber: clauseNum,
        clauseTitle: clause.title,
        keywords: (ISO_CLAUSE_KEYWORDS as any)[clauseNum] || []
      });
      
      if (clause.subclauses) {
        for (const [subclauseNum, subclauseTitle] of Object.entries(clause.subclauses)) {
          searchItems.push({
            clauseNumber: subclauseNum,
            clauseTitle: subclauseTitle,
            keywords: (ISO_CLAUSE_KEYWORDS as any)[subclauseNum] || []
          });
        }
      }
    }

    // Configure Fuse.js for fuzzy searching
    const fuse = new Fuse(searchItems, {
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
        const matchedClause = searchItems.find(item => 
          item.clauseNumber === clauseNumberMatch[1]
        );
        
        if (matchedClause) {
          const mapping: ClauseMapping = {
            clauseNumber: matchedClause.clauseNumber,
            clauseTitle: matchedClause.clauseTitle,
            confidence: 0.95,
            keywords: matchedClause.keywords,
            matchedContent: section.content.substring(0, 200) + '...'
          };
          
          if (!mappings.has(section.title)) {
            mappings.set(section.title, []);
          }
          mappings.get(section.title)!.push(mapping);
          continue;
        }
      }

      // Keyword and fuzzy matching
      const results = fuse.search(sectionText);
      
      for (const result of results.slice(0, 3)) { // Top 3 matches
        const confidence = 1 - (result.score || 0);
        
        if (confidence > 0.5) {
          const mapping: ClauseMapping = {
            clauseNumber: result.item.clauseNumber,
            clauseTitle: result.item.clauseTitle,
            confidence,
            keywords: result.item.keywords,
            matchedContent: section.content.substring(0, 200) + '...'
          };
          
          if (!mappings.has(section.title)) {
            mappings.set(section.title, []);
          }
          mappings.get(section.title)!.push(mapping);
        }
      }

      // TF-IDF analysis for content similarity
      this.tfidf.addDocument(sectionText);
    }

    return mappings;
  }

  async extractMetadata(document: ParsedDocument): Promise<{
    documentType?: string;
    version?: string;
    effectiveDate?: Date;
    reviewDate?: Date;
    owner?: string;
    approver?: string;
  }> {
    const metadata: any = {};
    
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
        } else {
          metadata[key] = value;
        }
      }
    }
    
    return metadata;
  }

  private parseSafeDate(dateString: string): Date | undefined {
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date detected:', dateString);
        return undefined;
      }
      return date;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return undefined;
    }
  }

  private cleanContentForDatabase(content: string): string {
    // Remove null bytes and other problematic characters for PostgreSQL
    return content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove other control characters except \n, \r, \t
      .replace(/\uFFFE/g, '') // Remove BOM
      .replace(/\uFEFF/g, '') // Remove BOM
      .trim();
  }
}