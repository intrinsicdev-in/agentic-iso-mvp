interface DuplicateGroup {
    baseDocument: string;
    documents: Array<{
        id: string;
        title: string;
        currentVersion: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        fileUrl?: string | null;
        owner: {
            id: string;
            name: string;
            email: string;
        };
        isLatestVersion: boolean;
        versionInfo: {
            versionNumber?: string;
            versionDate?: string;
        };
    }>;
    recommendedAction: 'keep_latest' | 'merge_content' | 'manual_review';
    confidence: number;
}
interface DuplicateDetectionResult {
    organizationId: string;
    duplicateGroups: DuplicateGroup[];
    totalDocuments: number;
    duplicatesFound: number;
    analysisDate: Date;
}
export declare class DuplicateDetector {
    private matcher;
    constructor();
    /**
     * Detect duplicate documents within an organization
     */
    detectDuplicates(organizationId: string): Promise<DuplicateDetectionResult>;
    /**
     * Calculate similarity between two documents
     */
    private calculateDocumentSimilarity;
    /**
     * Normalize document name for comparison
     */
    private normalizeDocumentName;
    /**
     * Remove version information from title
     */
    private removeVersioning;
    /**
     * Extract version information from title
     */
    private extractVersionInfo;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Mark the latest version in a duplicate group
     */
    private markLatestVersion;
    /**
     * Determine recommended action for a duplicate group
     */
    private determineRecommendedAction;
}
/**
 * Merge duplicate documents
 */
export declare function mergeDuplicates(documentIds: string[], keepDocumentId: string, userId: string): Promise<{
    success: boolean;
    mergedDocument: any;
}>;
export {};
