import { PrismaClient, Artefact, StandardType } from '@prisma/client';
import { DocumentMatcher } from './document-matcher';

const prisma = new PrismaClient();

interface DuplicateGroup {
  baseDocument: string; // The normalized base name
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

export class DuplicateDetector {
  private matcher: DocumentMatcher;

  constructor() {
    this.matcher = new DocumentMatcher();
  }

  /**
   * Detect duplicate documents within an organization
   */
  async detectDuplicates(organizationId: string): Promise<DuplicateDetectionResult> {
    // Get all documents for the organization
    const documents = await prisma.artefact.findMany({
      where: { organizationId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        clauseMappings: {
          include: {
            clause: true
          }
        }
      },
      orderBy: [
        { title: 'asc' },
        { currentVersion: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    // Compare each document with others
    for (let i = 0; i < documents.length; i++) {
      if (processedIds.has(documents[i].id)) continue;

      const doc1 = documents[i];
      const group: DuplicateGroup = {
        baseDocument: this.normalizeDocumentName(doc1.title),
        documents: [],
        recommendedAction: 'keep_latest',
        confidence: 1.0
      };

      // Add the first document
      group.documents.push({
        id: doc1.id,
        title: doc1.title,
        currentVersion: doc1.currentVersion,
        status: doc1.status,
        createdAt: doc1.createdAt,
        updatedAt: doc1.updatedAt,
        fileUrl: doc1.fileUrl,
        owner: doc1.owner,
        isLatestVersion: false,
        versionInfo: this.extractVersionInfo(doc1.title)
      });
      processedIds.add(doc1.id);

      // Find potential duplicates
      for (let j = i + 1; j < documents.length; j++) {
        if (processedIds.has(documents[j].id)) continue;

        const doc2 = documents[j];
        const similarity = this.calculateDocumentSimilarity(doc1, doc2);

        if (similarity.isDuplicate && similarity.confidence > 0.7) {
          group.documents.push({
            id: doc2.id,
            title: doc2.title,
            currentVersion: doc2.currentVersion,
            status: doc2.status,
            createdAt: doc2.createdAt,
            updatedAt: doc2.updatedAt,
            fileUrl: doc2.fileUrl,
            owner: doc2.owner,
            isLatestVersion: false,
            versionInfo: this.extractVersionInfo(doc2.title)
          });
          processedIds.add(doc2.id);
          
          // Update confidence
          group.confidence = Math.min(group.confidence, similarity.confidence);
        }
      }

      // Only add groups with actual duplicates
      if (group.documents.length > 1) {
        // Mark the latest version
        this.markLatestVersion(group);
        
        // Determine recommended action
        group.recommendedAction = this.determineRecommendedAction(group);
        
        duplicateGroups.push(group);
      }
    }

    // Sort duplicate groups by confidence and number of duplicates
    duplicateGroups.sort((a, b) => {
      const countDiff = b.documents.length - a.documents.length;
      if (countDiff !== 0) return countDiff;
      return b.confidence - a.confidence;
    });

    return {
      organizationId,
      duplicateGroups,
      totalDocuments: documents.length,
      duplicatesFound: duplicateGroups.reduce((sum, group) => sum + group.documents.length, 0),
      analysisDate: new Date()
    };
  }

  /**
   * Calculate similarity between two documents
   */
  private calculateDocumentSimilarity(doc1: any, doc2: any): { isDuplicate: boolean; confidence: number } {
    const norm1 = this.normalizeDocumentName(doc1.title);
    const norm2 = this.normalizeDocumentName(doc2.title);

    // Exact match after normalization
    if (norm1 === norm2) {
      return { isDuplicate: true, confidence: 1.0 };
    }

    // Check if they have the same clause mappings
    const clauses1 = new Set(doc1.clauseMappings.map((cm: any) => cm.clause.id));
    const clauses2 = new Set(doc2.clauseMappings.map((cm: any) => cm.clause.id));
    
    if (clauses1.size > 0 && clauses2.size > 0) {
      const intersection = new Set([...clauses1].filter(x => clauses2.has(x)));
      const union = new Set([...clauses1, ...clauses2]);
      const clauseSimilarity = intersection.size / union.size;
      
      if (clauseSimilarity > 0.8) {
        return { isDuplicate: true, confidence: clauseSimilarity };
      }
    }

    // Check if one is a version of the other
    const base1 = this.removeVersioning(norm1);
    const base2 = this.removeVersioning(norm2);
    
    if (base1 === base2) {
      return { isDuplicate: true, confidence: 0.9 };
    }

    // Calculate string similarity
    const similarity = this.calculateStringSimilarity(base1, base2);
    
    return {
      isDuplicate: similarity > 0.8,
      confidence: similarity
    };
  }

  /**
   * Normalize document name for comparison
   */
  private normalizeDocumentName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[_\-\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Remove version information from title
   */
  private removeVersioning(title: string): string {
    return title
      // Remove version patterns like v1, v2.1, V1.0
      .replace(/\sv\d+(\.\d+)?/gi, '')
      // Remove version patterns like version 1, version 2.1
      .replace(/\sversion\s*\d+(\.\d+)?/gi, '')
      // Remove date patterns
      .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '')
      .replace(/\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}/g, '')
      .replace(/\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4}/g, '')
      // Remove year patterns
      .replace(/\s\d{4}\s?/g, ' ')
      // Remove revision patterns
      .replace(/\srev\s*\d+/gi, '')
      .replace(/\srevision\s*\d+/gi, '')
      // Remove draft/final indicators
      .replace(/\s(draft|final|approved|pending)/gi, '')
      // Clean up
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract version information from title
   */
  private extractVersionInfo(title: string): { versionNumber?: string; versionDate?: string } {
    const versionInfo: { versionNumber?: string; versionDate?: string } = {};

    // Extract version number
    const versionMatch = title.match(/v(\d+(?:\.\d+)?)/i);
    if (versionMatch) {
      versionInfo.versionNumber = versionMatch[1];
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4})/,
      /(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})/,
      /(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/
    ];

    for (const pattern of datePatterns) {
      const dateMatch = title.match(pattern);
      if (dateMatch) {
        versionInfo.versionDate = dateMatch[1];
        break;
      }
    }

    return versionInfo;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Mark the latest version in a duplicate group
   */
  private markLatestVersion(group: DuplicateGroup): void {
    // Sort by multiple criteria to find the best "latest" version
    const sorted = [...group.documents].sort((a, b) => {
      // First, prefer approved status
      if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
      if (b.status === 'APPROVED' && a.status !== 'APPROVED') return 1;
      
      // Then, check version numbers
      const versionA = parseFloat(a.versionInfo.versionNumber || '0');
      const versionB = parseFloat(b.versionInfo.versionNumber || '0');
      if (versionA !== versionB) return versionB - versionA;
      
      // Then, check currentVersion field
      if (a.currentVersion !== b.currentVersion) {
        return b.currentVersion - a.currentVersion;
      }
      
      // Finally, check update date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    // Mark the first one as latest
    if (sorted.length > 0) {
      const latestId = sorted[0].id;
      group.documents.forEach(doc => {
        doc.isLatestVersion = doc.id === latestId;
      });
    }
  }

  /**
   * Determine recommended action for a duplicate group
   */
  private determineRecommendedAction(group: DuplicateGroup): 'keep_latest' | 'merge_content' | 'manual_review' {
    // If all documents have the same status and one is clearly newer, keep latest
    const statuses = new Set(group.documents.map(d => d.status));
    if (statuses.size === 1) {
      return 'keep_latest';
    }
    
    // If documents have different owners, suggest manual review
    const owners = new Set(group.documents.map(d => d.owner.id));
    if (owners.size > 1) {
      return 'manual_review';
    }
    
    // If documents have different statuses but same content, might need merging
    const hasApproved = group.documents.some(d => d.status === 'APPROVED');
    const hasDraft = group.documents.some(d => d.status === 'DRAFT');
    if (hasApproved && hasDraft) {
      return 'merge_content';
    }
    
    return 'keep_latest';
  }
}

/**
 * Merge duplicate documents
 */
export async function mergeDuplicates(
  documentIds: string[],
  keepDocumentId: string,
  userId: string
): Promise<{ success: boolean; mergedDocument: any }> {
  try {
    // Get all documents
    const documents = await prisma.artefact.findMany({
      where: { id: { in: documentIds } },
      include: {
        clauseMappings: true,
        comments: true,
        reviews: true,
        tasks: true
      }
    });

    const keepDocument = documents.find(d => d.id === keepDocumentId);
    if (!keepDocument) {
      throw new Error('Document to keep not found');
    }

    const documentsToMerge = documents.filter(d => d.id !== keepDocumentId);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Merge clause mappings
      const existingClauseMappings = new Set(
        keepDocument.clauseMappings.map(cm => cm.clauseId)
      );

      for (const doc of documentsToMerge) {
        for (const mapping of doc.clauseMappings) {
          if (!existingClauseMappings.has(mapping.clauseId)) {
            await tx.clauseMapping.create({
              data: {
                artefactId: keepDocumentId,
                clauseId: mapping.clauseId,
                confidence: mapping.confidence,
                keywords: mapping.keywords
              }
            });
          }
        }
      }

      // Move comments
      await tx.comment.updateMany({
        where: { artefactId: { in: documentsToMerge.map(d => d.id) } },
        data: { artefactId: keepDocumentId }
      });

      // Move reviews
      await tx.review.updateMany({
        where: { artefactId: { in: documentsToMerge.map(d => d.id) } },
        data: { artefactId: keepDocumentId }
      });

      // Move tasks
      await tx.task.updateMany({
        where: { artefactId: { in: documentsToMerge.map(d => d.id) } },
        data: { artefactId: keepDocumentId }
      });

      // Delete the duplicate documents
      await tx.artefact.deleteMany({
        where: { id: { in: documentsToMerge.map(d => d.id) } }
      });

      // Get the updated document
      const mergedDocument = await tx.artefact.findUnique({
        where: { id: keepDocumentId },
        include: {
          owner: true,
          clauseMappings: {
            include: { clause: true }
          }
        }
      });

      // Log the merge
      await tx.auditLog.create({
        data: {
          action: 'MERGE_DUPLICATES',
          entityType: 'ARTEFACT',
          entityId: keepDocumentId,
          userId,
          details: {
            keptDocument: keepDocument.title,
            mergedDocuments: documentsToMerge.map(d => ({
              id: d.id,
              title: d.title
            })),
            totalMerged: documentsToMerge.length
          }
        }
      });

      return mergedDocument;
    });

    return {
      success: true,
      mergedDocument: result
    };

  } catch (error) {
    console.error('Error merging duplicates:', error);
    throw error;
  }
}