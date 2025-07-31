import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient, ReferenceType, DocumentType } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create document reference/relationship
router.post('/create-reference', authenticateToken, async (req, res) => {
  try {
    const { referencingDocumentId, referencedDocumentId, referenceType, description } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and User ID are required'
      });
    }

    // Verify both documents belong to the organization
    const documents = await prisma.artefact.findMany({
      where: {
        id: { in: [referencingDocumentId, referencedDocumentId] },
        organizationId
      }
    });

    if (documents.length !== 2) {
      return res.status(404).json({
        success: false,
        error: 'One or both documents not found'
      });
    }

    // Create the reference
    const reference = await prisma.documentReference.create({
      data: {
        referencingDocumentId,
        referencedDocumentId,
        referenceType: referenceType as ReferenceType,
        description,
        createdBy: userId
      },
      include: {
        referencingDocument: {
          select: { id: true, title: true, documentType: true }
        },
        referencedDocument: {
          select: { id: true, title: true, documentType: true }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_DOCUMENT_REFERENCE',
        entityType: 'DOCUMENT_REFERENCE',
        entityId: reference.id,
        userId,
        details: {
          referencingDocument: reference.referencingDocument.title,
          referencedDocument: reference.referencedDocument.title,
          referenceType,
          organizationId,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      data: reference
    });

  } catch (error) {
    console.error('Error creating document reference:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document reference'
    });
  }
});

// Set document parent (hierarchy)
router.post('/set-parent', authenticateToken, async (req, res) => {
  try {
    const { documentId, parentId } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and User ID are required'
      });
    }

    // Verify both documents belong to the organization
    const documents = await prisma.artefact.findMany({
      where: {
        id: { in: [documentId, parentId] },
        organizationId
      }
    });

    if (documents.length !== 2) {
      return res.status(404).json({
        success: false,
        error: 'One or both documents not found'
      });
    }

    // Check for circular references
    const wouldCreateCircle = await checkCircularReference(documentId, parentId);
    if (wouldCreateCircle) {
      return res.status(400).json({
        success: false,
        error: 'Setting this parent would create a circular reference'
      });
    }

    // Update the document
    const updatedDoc = await prisma.artefact.update({
      where: { id: documentId },
      data: { parentId },
      include: {
        parent: {
          select: { id: true, title: true, documentType: true }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'SET_DOCUMENT_PARENT',
        entityType: 'ARTEFACT',
        entityId: documentId,
        userId,
        details: {
          documentTitle: updatedDoc.title,
          parentTitle: updatedDoc.parent?.title,
          organizationId,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      data: updatedDoc
    });

  } catch (error) {
    console.error('Error setting document parent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set document parent'
    });
  }
});

// Get document relationships
router.get('/:documentId/relationships', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Get document with all relationships
    const document = await prisma.artefact.findFirst({
      where: {
        id: documentId,
        organizationId
      },
      include: {
        parent: {
          select: { id: true, title: true, documentType: true }
        },
        children: {
          select: { id: true, title: true, documentType: true }
        },
        references: {
          include: {
            referencedDocument: {
              select: { id: true, title: true, documentType: true }
            }
          }
        },
        referencedBy: {
          include: {
            referencingDocument: {
              select: { id: true, title: true, documentType: true }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        document: {
          id: document.id,
          title: document.title,
          documentType: document.documentType
        },
        parent: document.parent,
        children: document.children,
        references: document.references.map(ref => ({
          id: ref.id,
          referenceType: ref.referenceType,
          description: ref.description,
          document: ref.referencedDocument
        })),
        referencedBy: document.referencedBy.map(ref => ({
          id: ref.id,
          referenceType: ref.referenceType,
          description: ref.description,
          document: ref.referencingDocument
        }))
      }
    });

  } catch (error) {
    console.error('Error getting document relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document relationships'
    });
  }
});

// Auto-discover potential relationships
router.post('/discover-relationships', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    // Get the target document
    const targetDoc = await prisma.artefact.findFirst({
      where: { id: documentId, organizationId }
    });

    if (!targetDoc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Get all other documents in the organization
    const allDocs = await prisma.artefact.findMany({
      where: {
        organizationId,
        id: { not: documentId }
      }
    });

    const suggestions = [];

    for (const doc of allDocs) {
      const relationship = analyzeDocumentRelationship(targetDoc, doc);
      if (relationship.confidence > 0.5) {
        suggestions.push({
          document: {
            id: doc.id,
            title: doc.title,
            documentType: doc.documentType
          },
          suggestedRelationship: relationship.type,
          confidence: relationship.confidence,
          reasoning: relationship.reasoning
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    res.json({
      success: true,
      data: {
        targetDocument: {
          id: targetDoc.id,
          title: targetDoc.title,
          documentType: targetDoc.documentType
        },
        suggestions: suggestions.slice(0, 10) // Top 10 suggestions
      }
    });

  } catch (error) {
    console.error('Error discovering relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover relationships'
    });
  }
});

// Helper function to check for circular references
async function checkCircularReference(childId: string, parentId: string): Promise<boolean> {
  const checkParent = async (currentParentId: string): Promise<boolean> => {
    if (currentParentId === childId) {
      return true; // Circular reference found
    }

    const parent = await prisma.artefact.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    });

    if (parent?.parentId) {
      return await checkParent(parent.parentId);
    }

    return false;
  };

  return await checkParent(parentId);
}

// Helper function to analyze potential relationships
function analyzeDocumentRelationship(doc1: any, doc2: any) {
  const title1 = doc1.title.toLowerCase();
  const title2 = doc2.title.toLowerCase();

  // Manual/Policy relationship
  if (doc1.documentType === DocumentType.MANUAL && 
      doc2.documentType === DocumentType.POLICY) {
    if (title1.includes('manual') && (title2.includes('policy') || title2.includes('objective'))) {
      return {
        type: ReferenceType.IMPLEMENTS,
        confidence: 0.8,
        reasoning: 'Manual likely implements policy'
      };
    }
  }

  // Procedure/Policy relationship
  if (doc1.documentType === DocumentType.PROCEDURE && 
      doc2.documentType === DocumentType.POLICY) {
    return {
      type: ReferenceType.IMPLEMENTS,
      confidence: 0.7,
      reasoning: 'Procedure implements policy'
    };
  }

  // Log/Plan relationship
  if (doc1.documentType === DocumentType.LOG && 
      doc2.documentType === DocumentType.PLAN) {
    return {
      type: ReferenceType.SUPPORTS,
      confidence: 0.6,
      reasoning: 'Log supports plan execution'
    };
  }

  // Title similarity
  const commonWords = getCommonWords(title1, title2);
  if (commonWords.length > 0) {
    const similarity = commonWords.length / Math.min(title1.split(' ').length, title2.split(' ').length);
    if (similarity > 0.3) {
      return {
        type: ReferenceType.CROSS_REFERENCE,
        confidence: similarity * 0.8,
        reasoning: `Common keywords: ${commonWords.join(', ')}`
      };
    }
  }

  return {
    type: ReferenceType.CROSS_REFERENCE,
    confidence: 0,
    reasoning: 'No clear relationship found'
  };
}

// Helper function to find common words
function getCommonWords(text1: string, text2: string): string[] {
  const words1 = text1.split(' ').filter(word => word.length > 3);
  const words2 = text2.split(' ').filter(word => word.length > 3);
  
  return words1.filter(word => words2.includes(word));
}

export default router;