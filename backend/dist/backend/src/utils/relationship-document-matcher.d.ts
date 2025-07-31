import { StandardType } from '@prisma/client';
import { DocumentMatcher } from './document-matcher';
interface RelationshipMatchResult {
    isMatch: boolean;
    confidence: number;
    matchType: 'direct' | 'fulfills' | 'canBeFulfilledBy' | 'parent' | 'reference';
    matchedBy?: {
        documentId: string;
        documentTitle: string;
        relationshipType?: string;
    };
}
/**
 * Enhanced document matcher that considers document relationships and cross-references
 */
export declare class RelationshipDocumentMatcher extends DocumentMatcher {
    /**
     * Check if a standard requirement is fulfilled considering relationships
     */
    checkRequirementFulfillment(standardDoc: {
        id: string;
        title: string;
        keywords: string[];
        clauseNumbers: string[];
        standard: StandardType;
        canBeFulfilledBy: string[];
        fulfills: string[];
    }, organizationId: string): Promise<RelationshipMatchResult>;
    /**
     * Check if documents fulfill requirements through the fulfills/canBeFulfilledBy relationships
     */
    private checkFulfillmentRelationships;
    /**
     * Check parent-child relationships
     */
    private checkHierarchicalRelationships;
    /**
     * Check cross-reference relationships
     */
    private checkCrossReferences;
    /**
     * Check if a document can fulfill a standard requirement based on type and content
     */
    private documentCanFulfillStandard;
    /**
     * Enhanced title matching for relationships
     */
    private titleMatches;
}
/**
 * Enhanced missing documents finder that considers relationships
 */
export declare function findMissingDocumentsWithRelationships(organizationId: string, standard?: StandardType): Promise<any[]>;
export {};
