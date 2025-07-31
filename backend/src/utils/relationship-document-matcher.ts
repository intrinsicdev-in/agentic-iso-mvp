import { PrismaClient, StandardType, DocumentType } from '@prisma/client';
import { DocumentMatcher } from './document-matcher';

const prisma = new PrismaClient();

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
export class RelationshipDocumentMatcher extends DocumentMatcher {
  
  /**
   * Check if a standard requirement is fulfilled considering relationships
   */
  async checkRequirementFulfillment(
    standardDoc: {
      id: string;
      title: string;
      keywords: string[];
      clauseNumbers: string[];
      standard: StandardType;
      canBeFulfilledBy: string[];
      fulfills: string[];
    },
    organizationId: string
  ): Promise<RelationshipMatchResult> {
    
    // Get all organization documents with relationships
    const orgDocuments = await prisma.artefact.findMany({
      where: { organizationId },
      include: {
        clauseMappings: {
          include: {
            clause: {
              select: {
                clauseNumber: true,
                standard: true
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            documentType: true
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            documentType: true
          }
        },
        references: {
          include: {
            referencedDocument: {
              select: {
                id: true,
                title: true,
                documentType: true
              }
            }
          }
        },
        referencedBy: {
          include: {
            referencingDocument: {
              select: {
                id: true,
                title: true,
                documentType: true
              }
            }
          }
        }
      }
    });

    // 1. Direct matching (existing logic)
    for (const doc of orgDocuments) {
      const directMatch = await this.matchDocument(doc, standardDoc);
      if (directMatch.isMatch && directMatch.confidence > 0.5) {
        return {
          isMatch: true,
          confidence: directMatch.confidence,
          matchType: 'direct',
          matchedBy: {
            documentId: doc.id,
            documentTitle: doc.title
          }
        };
      }
    }

    // 2. Check if any document fulfills this requirement through relationships
    const fulfillmentMatch = await this.checkFulfillmentRelationships(
      standardDoc,
      orgDocuments
    );
    if (fulfillmentMatch.isMatch) {
      return fulfillmentMatch;
    }

    // 3. Check parent-child relationships
    const hierarchyMatch = await this.checkHierarchicalRelationships(
      standardDoc,
      orgDocuments
    );
    if (hierarchyMatch.isMatch) {
      return hierarchyMatch;
    }

    // 4. Check cross-references
    const referenceMatch = await this.checkCrossReferences(
      standardDoc,
      orgDocuments
    );
    if (referenceMatch.isMatch) {
      return referenceMatch;
    }

    return {
      isMatch: false,
      confidence: 0,
      matchType: 'direct'
    };
  }

  /**
   * Check if documents fulfill requirements through the fulfills/canBeFulfilledBy relationships
   */
  private async checkFulfillmentRelationships(
    standardDoc: any,
    orgDocuments: any[]
  ): Promise<RelationshipMatchResult> {
    
    // Check if any org document can fulfill this standard document
    for (const doc of orgDocuments) {
      // Check if this document type and title suggests it fulfills the standard doc
      if (this.documentCanFulfillStandard(doc, standardDoc)) {
        return {
          isMatch: true,
          confidence: 0.9, // High confidence for fulfillment relationships
          matchType: 'fulfills',
          matchedBy: {
            documentId: doc.id,
            documentTitle: doc.title,
            relationshipType: 'fulfills'
          }
        };
      }
    }

    // Check reverse relationship - if this standard doc can be fulfilled by others
    if (standardDoc.canBeFulfilledBy && standardDoc.canBeFulfilledBy.length > 0) {
      for (const doc of orgDocuments) {
        for (const canBeFulfilledBy of standardDoc.canBeFulfilledBy) {
          if (this.titleMatches(doc.title, canBeFulfilledBy)) {
            return {
              isMatch: true,
              confidence: 0.85,
              matchType: 'canBeFulfilledBy',
              matchedBy: {
                documentId: doc.id,
                documentTitle: doc.title,
                relationshipType: 'canBeFulfilledBy'
              }
            };
          }
        }
      }
    }

    return {
      isMatch: false,
      confidence: 0,
      matchType: 'fulfills'
    };
  }

  /**
   * Check parent-child relationships
   */
  private async checkHierarchicalRelationships(
    standardDoc: any,
    orgDocuments: any[]
  ): Promise<RelationshipMatchResult> {
    
    for (const doc of orgDocuments) {
      // Check if parent document fulfills this requirement
      if (doc.parent && doc.parent.documentType === DocumentType.MANUAL) {
        const parentMatch = await this.matchDocument(doc.parent, standardDoc);
        if (parentMatch.isMatch) {
          return {
            isMatch: true,
            confidence: parentMatch.confidence * 0.8, // Slightly lower confidence for parent match
            matchType: 'parent',
            matchedBy: {
              documentId: doc.parent.id,
              documentTitle: doc.parent.title,
              relationshipType: 'parent'
            }
          };
        }
      }

      // Check if any child documents fulfill this requirement
      for (const child of doc.children) {
        const childMatch = await this.matchDocument(child, standardDoc);
        if (childMatch.isMatch) {
          return {
            isMatch: true,
            confidence: childMatch.confidence * 0.9, // Good confidence for child match
            matchType: 'parent',
            matchedBy: {
              documentId: child.id,
              documentTitle: child.title,
              relationshipType: 'child'
            }
          };
        }
      }
    }

    return {
      isMatch: false,
      confidence: 0,
      matchType: 'parent'
    };
  }

  /**
   * Check cross-reference relationships
   */
  private async checkCrossReferences(
    standardDoc: any,
    orgDocuments: any[]
  ): Promise<RelationshipMatchResult> {
    
    for (const doc of orgDocuments) {
      // Check referenced documents
      for (const ref of doc.references) {
        const refMatch = await this.matchDocument(ref.referencedDocument, standardDoc);
        if (refMatch.isMatch) {
          return {
            isMatch: true,
            confidence: refMatch.confidence * 0.7, // Lower confidence for indirect reference
            matchType: 'reference',
            matchedBy: {
              documentId: ref.referencedDocument.id,
              documentTitle: ref.referencedDocument.title,
              relationshipType: 'references'
            }
          };
        }
      }

      // Check referencing documents
      for (const ref of doc.referencedBy) {
        const refMatch = await this.matchDocument(ref.referencingDocument, standardDoc);
        if (refMatch.isMatch) {
          return {
            isMatch: true,
            confidence: refMatch.confidence * 0.7,
            matchType: 'reference',
            matchedBy: {
              documentId: ref.referencingDocument.id,
              documentTitle: ref.referencingDocument.title,
              relationshipType: 'referencedBy'
            }
          };
        }
      }
    }

    return {
      isMatch: false,
      confidence: 0,
      matchType: 'reference'
    };
  }

  /**
   * Check if a document can fulfill a standard requirement based on type and content
   */
  private documentCanFulfillStandard(doc: any, standardDoc: any): boolean {
    // Manual documents can fulfill multiple requirements
    if (doc.documentType === DocumentType.MANUAL) {
      // Check if manual title contains relevant keywords
      const docTitle = doc.title.toLowerCase();
      const standardKeywords = standardDoc.keywords.join(' ').toLowerCase();
      
      let keywordMatches = 0;
      for (const keyword of standardDoc.keywords) {
        if (docTitle.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
      
      // Manual with 30% keyword match can fulfill requirements
      return keywordMatches / standardDoc.keywords.length > 0.3;
    }

    // Policy documents can fulfill policy requirements
    if (doc.documentType === DocumentType.POLICY && 
        standardDoc.documentType === DocumentType.POLICY) {
      return this.titleMatches(doc.title, standardDoc.title);
    }

    // Procedure documents can fulfill procedure requirements
    if (doc.documentType === DocumentType.PROCEDURE && 
        standardDoc.documentType === DocumentType.PROCEDURE) {
      return this.titleMatches(doc.title, standardDoc.title);
    }

    return false;
  }

  /**
   * Enhanced title matching for relationships
   */
  private titleMatches(docTitle: string, standardTitle: string): boolean {
    const normalizeTitle = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[_\-\.&]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedDoc = normalizeTitle(docTitle);
    const normalizedStandard = normalizeTitle(standardTitle);

    // Exact match
    if (normalizedDoc === normalizedStandard) return true;

    // Contains match
    if (normalizedDoc.includes(normalizedStandard) || 
        normalizedStandard.includes(normalizedDoc)) return true;

    // Keyword match (50% of words in common)
    const docWords = normalizedDoc.split(' ').filter(word => word.length > 2);
    const standardWords = normalizedStandard.split(' ').filter(word => word.length > 2);
    
    const commonWords = docWords.filter(word => standardWords.includes(word));
    const similarity = commonWords.length / Math.min(docWords.length, standardWords.length);
    
    return similarity > 0.5;
  }
}

/**
 * Enhanced missing documents finder that considers relationships
 */
export async function findMissingDocumentsWithRelationships(
  organizationId: string,
  standard?: StandardType
): Promise<any[]> {
  
  const matcher = new RelationshipDocumentMatcher();
  
  // Get standard documents to check against
  const whereClause = standard 
    ? { standard } 
    : { 
        OR: [
          { standard: StandardType.ISO_9001_2015 },
          { standard: StandardType.ISO_27001_2022 }
        ]
      };
  
  const standardDocs = await prisma.standardDocument.findMany({
    where: whereClause
  });
  
  const missingDocs = [];
  
  for (const standardDoc of standardDocs) {
    const fulfillmentResult = await matcher.checkRequirementFulfillment(
      standardDoc,
      organizationId
    );
    
    if (!fulfillmentResult.isMatch) {
      missingDocs.push({
        title: standardDoc.title,
        category: standardDoc.category,
        description: standardDoc.description,
        clauseRef: standardDoc.clauseRef,
        importance: standardDoc.importance,
        standard: standardDoc.standard,
        documentType: standardDoc.documentType,
        canBeFulfilledBy: standardDoc.canBeFulfilledBy
      });
    } else {
      console.log(`✅ ${standardDoc.title} fulfilled by ${fulfillmentResult.matchedBy?.documentTitle} (${fulfillmentResult.matchType}, ${Math.round(fulfillmentResult.confidence * 100)}%)`);
    }
  }
  
  return missingDocs;
}