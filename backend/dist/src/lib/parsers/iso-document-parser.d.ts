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
export declare class ISODocumentParser {
    private tokenizer;
    private tfidf;
    constructor();
    parseDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocument>;
    private extractSections;
    classifyToISOClauses(document: ParsedDocument, standard: 'ISO9001' | 'ISO27001'): Promise<Map<string, ClauseMapping[]>>;
    extractMetadata(document: ParsedDocument): Promise<{
        documentType?: string;
        version?: string;
        effectiveDate?: Date;
        reviewDate?: Date;
        owner?: string;
        approver?: string;
    }>;
    private parseSafeDate;
    private cleanContentForDatabase;
}
