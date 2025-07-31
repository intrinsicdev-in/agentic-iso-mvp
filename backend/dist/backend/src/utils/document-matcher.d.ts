import { StandardType } from '@prisma/client';
interface DocumentMatchResult {
    isMatch: boolean;
    confidence: number;
    matchType: 'clause' | 'keyword' | 'title' | 'none';
    matchedStandardDoc?: any;
}
export declare class DocumentMatcher {
    /**
     * Check if an existing document fulfills a standard requirement
     */
    matchDocument(existingDoc: {
        id: string;
        title: string;
        clauseMappings: Array<{
            clause: {
                clauseNumber: string;
                standard: StandardType;
            };
        }>;
    }, standardDoc: {
        id: string;
        title: string;
        keywords: string[];
        clauseNumbers: string[];
        standard: StandardType;
    }): Promise<DocumentMatchResult>;
    /**
     * Check if document has clause mappings that match the standard document's clauses
     */
    private checkClauseMatch;
    /**
     * Fuzzy title matching with various normalization techniques
     */
    private checkTitleMatch;
    /**
     * Check for abbreviation matches
     */
    private checkAbbreviationMatch;
    /**
     * Check if document title contains keywords from standard document
     */
    private checkKeywordMatch;
    /**
     * Calculate similarity between two strings using a simple algorithm
     */
    private calculateSimilarity;
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance;
}
/**
 * Find missing documents by checking existing documents against standard requirements
 */
export declare function findMissingDocuments(organizationId: string, standard?: StandardType): Promise<any[]>;
export {};
