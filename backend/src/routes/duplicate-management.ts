import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { DuplicateDetector, mergeDuplicates } from '../utils/duplicate-detector';

const router = Router();
const prisma = new PrismaClient();

// Detect duplicates in organization
router.get('/detect', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const detector = new DuplicateDetector();
    const result = await detector.detectDuplicates(organizationId);

    // Log the detection
    await prisma.auditLog.create({
      data: {
        action: 'DETECT_DUPLICATES',
        entityType: 'DUPLICATE_DETECTION',
        entityId: 'DETECTION',
        userId: req.user?.id,
        details: {
          organizationId,
          totalDocuments: result.totalDocuments,
          duplicatesFound: result.duplicatesFound,
          groupsFound: result.duplicateGroups.length
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error detecting duplicates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect duplicates'
    });
  }
});

// Get duplicate details for a specific group
router.get('/group/:baseDocument', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const { baseDocument } = req.params;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const detector = new DuplicateDetector();
    const result = await detector.detectDuplicates(organizationId);
    
    const group = result.duplicateGroups.find(g => 
      g.baseDocument === decodeURIComponent(baseDocument)
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Duplicate group not found'
      });
    }

    // Get additional details for each document
    const detailedDocuments = await Promise.all(
      group.documents.map(async (doc) => {
        const fullDocument = await prisma.artefact.findUnique({
          where: { id: doc.id },
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 5
            },
            clauseMappings: {
              include: {
                clause: {
                  select: {
                    clauseNumber: true,
                    title: true,
                    standard: true
                  }
                }
              }
            },
            _count: {
              select: {
                comments: true,
                reviews: true,
                tasks: true
              }
            }
          }
        });

        return {
          ...doc,
          versions: fullDocument?.versions || [],
          clauseMappings: fullDocument?.clauseMappings || [],
          activityCount: {
            comments: fullDocument?._count.comments || 0,
            reviews: fullDocument?._count.reviews || 0,
            tasks: fullDocument?._count.tasks || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...group,
        documents: detailedDocuments
      }
    });

  } catch (error) {
    console.error('Error getting duplicate group details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get duplicate group details'
    });
  }
});

// Merge duplicate documents
router.post('/merge', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const { documentIds, keepDocumentId } = req.body;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and User ID are required'
      });
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 document IDs are required'
      });
    }

    if (!keepDocumentId || !documentIds.includes(keepDocumentId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid keepDocumentId is required'
      });
    }

    // Verify all documents belong to the organization
    const documents = await prisma.artefact.findMany({
      where: {
        id: { in: documentIds },
        organizationId
      }
    });

    if (documents.length !== documentIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some documents not found or not in your organization'
      });
    }

    // Perform the merge
    const result = await mergeDuplicates(documentIds, keepDocumentId, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error merging documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge documents'
    });
  }
});

// Delete duplicate document
router.delete('/delete/:documentId', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and User ID are required'
      });
    }

    // Verify document belongs to organization
    const document = await prisma.artefact.findFirst({
      where: {
        id: documentId,
        organizationId
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete the document
    await prisma.artefact.delete({
      where: { id: documentId }
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_DUPLICATE',
        entityType: 'ARTEFACT',
        entityId: documentId,
        userId,
        details: {
          documentTitle: document.title,
          organizationId
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      data: {
        deletedDocument: {
          id: document.id,
          title: document.title
        }
      }
    });

  } catch (error) {
    console.error('Error deleting duplicate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete duplicate'
    });
  }
});

// Bulk resolve duplicates
router.post('/bulk-resolve', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const { resolutions } = req.body;

    if (!organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID and User ID are required'
      });
    }

    if (!resolutions || !Array.isArray(resolutions)) {
      return res.status(400).json({
        success: false,
        error: 'Resolutions array is required'
      });
    }

    const results = [];

    for (const resolution of resolutions) {
      const { action, documentIds, keepDocumentId } = resolution;

      try {
        if (action === 'merge' && documentIds && keepDocumentId) {
          const mergeResult = await mergeDuplicates(documentIds, keepDocumentId, userId);
          results.push({
            action: 'merge',
            success: true,
            result: mergeResult
          });
        } else if (action === 'delete' && documentIds) {
          for (const docId of documentIds) {
            await prisma.artefact.delete({
              where: { id: docId }
            });
          }
          results.push({
            action: 'delete',
            success: true,
            deletedCount: documentIds.length
          });
        } else if (action === 'keep_all') {
          results.push({
            action: 'keep_all',
            success: true,
            keptCount: documentIds ? documentIds.length : 0
          });
        }
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log bulk resolution
    await prisma.auditLog.create({
      data: {
        action: 'BULK_RESOLVE_DUPLICATES',
        entityType: 'DUPLICATE_RESOLUTION',
        entityId: 'BULK',
        userId,
        details: {
          organizationId,
          totalResolutions: resolutions.length,
          successCount: results.filter(r => r.success).length,
          failureCount: results.filter(r => !r.success).length
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });

  } catch (error) {
    console.error('Error in bulk resolve:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk resolve duplicates'
    });
  }
});

export default router;