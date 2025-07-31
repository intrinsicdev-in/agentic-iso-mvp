import { StandardType } from '@prisma/client';
interface AICategorizationResult {
    suggestedMappings: Array<{
        standardDocument: string;
        confidence: number;
        reasoning: string;
        clauseNumbers: string[];
        standard: StandardType;
    }>;
    documentSummary: string;
    confidence: number;
}
export declare class AIDocumentCategorizerService {
    /**
     * Use AI to analyze document content and suggest ISO standard mappings
     */
    categorizeDocument(documentTitle: string, documentContent?: string, standard?: StandardType): Promise<AICategorizationResult>;
    /**
     * Build the prompt for AI categorization
     */
    private buildCategorizationPrompt;
    /**
     * Validate and enhance AI response
     */
    private validateAndEnhanceResult;
    /**
     * Fallback categorization using keyword matching
     */
    private fallbackCategorization;
    /**
     * Batch categorize multiple documents
     */
    batchCategorizeDocuments(documentIds: string[]): Promise<Map<string, AICategorizationResult>>;
    /**
     * Auto-apply high-confidence mappings
     */
    autoApplyMappings(documentId: string, categoryResult: AICategorizationResult, userId: string, minConfidence?: number): Promise<number>;
}
export {};
