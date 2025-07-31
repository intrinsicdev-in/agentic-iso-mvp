import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient, StandardType } from '@prisma/client';
import { findMissingDocuments } from '../utils/document-matcher';
import { findMissingDocumentsWithRelationships } from '../utils/relationship-document-matcher';

const router = Router();
const prisma = new PrismaClient();

interface MasterDocumentListItem {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  status: string;
  currentVersion: number;
  lastReviewed?: Date;
  lastChanged: Date;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isoStandards: string[];
  clauseMappings: {
    clauseCode: string;
    clauseTitle: string;
    isoVersion: StandardType;
  }[];
}

interface MissingDocument {
  title: string;
  category: string;
  description: string;
  clauseRef?: string | null;
  importance?: string | null;
  standard: StandardType;
}

// Get Master Document List with missing documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isoStandard } = req.query;
    const organizationId = req.user?.organizationId;

    // Build where clause for filtering
    const whereClause: any = {
      organizationId,
    };

    // If specific ISO standard is requested, filter by it
    if (isoStandard && (isoStandard === 'ISO_9001' || isoStandard === 'ISO_27001')) {
      whereClause.clauseMappings = {
        some: {
          clause: {
            isoVersion: {
              in: isoStandard === 'ISO_9001' 
                ? [StandardType.ISO_9001_2015]
                : [StandardType.ISO_27001_2022, StandardType.ISO_27001_2013]
            }
          }
        }
      };
    }

    // Fetch all documents with their related data
    const documents = await prisma.artefact.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
            status: true,
          }
        },
        clauseMappings: {
          include: {
            clause: {
              select: {
                clauseNumber: true,
                title: true,
                standard: true,
              }
            }
          }
        },
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform the data into Master Document List format
    const masterDocumentList: MasterDocumentListItem[] = documents.map(doc => {
      // Get unique ISO standards from clause mappings
      const isoStandardsSet = new Set<string>();
      doc.clauseMappings.forEach((mapping: any) => {
        if (mapping.clause.standard === StandardType.ISO_9001_2015) {
          isoStandardsSet.add('ISO 9001:2015');
        } else if (mapping.clause.standard === StandardType.ISO_27001_2022) {
          isoStandardsSet.add('ISO 27001:2022');
        } else if (mapping.clause.standard === StandardType.ISO_27001_2013) {
          isoStandardsSet.add('ISO 27001:2013');
        }
      });

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description || undefined,
        fileUrl: doc.fileUrl || undefined,
        status: doc.status,
        currentVersion: doc.currentVersion,
        lastReviewed: doc.reviews[0]?.createdAt || undefined,
        lastChanged: doc.updatedAt,
        owner: {
          id: doc.owner.id,
          name: doc.owner.name || 'Unknown',
          email: doc.owner.email,
        },
        isoStandards: Array.from(isoStandardsSet),
        clauseMappings: doc.clauseMappings.map(mapping => ({
          clauseCode: mapping.clause.clauseNumber,
          clauseTitle: mapping.clause.title,
          isoVersion: mapping.clause.standard,
        }))
      };
    });

    // Log the action to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'GENERATE_MASTER_DOCUMENT_LIST',
        entityType: 'MASTER_DOCUMENT_LIST',
        entityId: 'MDL',
        userId: req.user?.id,
        details: {
          documentCount: masterDocumentList.length,
          isoStandard: isoStandard || 'ALL',
          organizationId,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    // Get missing documents using intelligent matching
    let missingDocuments: MissingDocument[] = [];
    if (isoStandard === 'ISO_9001' || isoStandard === 'ISO_27001' || !isoStandard) {
      let standardType: StandardType | undefined;
      if (isoStandard === 'ISO_9001') {
        standardType = StandardType.ISO_9001_2015;
      } else if (isoStandard === 'ISO_27001') {
        standardType = StandardType.ISO_27001_2022;
      }

      // Use relationship-aware missing document finder
      missingDocuments = await findMissingDocumentsWithRelationships(organizationId!, standardType);
    }

    // Return the master document list with missing documents
    res.json({
      success: true,
      data: {
        documents: masterDocumentList,
        missingDocuments: missingDocuments,
        totalCount: masterDocumentList.length,
        missingCount: missingDocuments.length,
        requiredMissingCount: missingDocuments.filter(d => d.category === 'Required').length,
        generatedAt: new Date(),
        filters: {
          isoStandard: isoStandard || 'ALL'
        }
      }
    });
  } catch (error) {
    console.error('Error generating master document list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate master document list'
    });
  }
});

// Export Master Document List as CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const { isoStandard } = req.query;
    const organizationId = req.user?.organizationId;

    // Build where clause for filtering
    const whereClause: any = {
      organizationId,
    };

    if (isoStandard && (isoStandard === 'ISO_9001' || isoStandard === 'ISO_27001')) {
      whereClause.clauseMappings = {
        some: {
          clause: {
            isoVersion: {
              in: isoStandard === 'ISO_9001' 
                ? [StandardType.ISO_9001_2015]
                : [StandardType.ISO_27001_2022, StandardType.ISO_27001_2013]
            }
          }
        }
      };
    }

    const documents = await prisma.artefact.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          }
        },
        reviews: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
        clauseMappings: {
          include: {
            clause: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    // Create CSV header
    const csvRows = [
      ['Document Title', 'Description', 'Status', 'Version', 'Owner', 'Owner Email', 'Last Reviewed', 'Last Changed', 'ISO Standards', 'Document Link']
    ];

    // Add document rows
    documents.forEach(doc => {
      const isoStandardsSet = new Set<string>();
      doc.clauseMappings.forEach((mapping: any) => {
        if (mapping.clause.standard === StandardType.ISO_9001_2015) {
          isoStandardsSet.add('ISO 9001:2015');
        } else if (mapping.clause.standard === StandardType.ISO_27001_2022) {
          isoStandardsSet.add('ISO 27001:2022');
        } else if (mapping.clause.standard === StandardType.ISO_27001_2013) {
          isoStandardsSet.add('ISO 27001:2013');
        }
      });

      csvRows.push([
        doc.title,
        doc.description || '',
        doc.status,
        doc.currentVersion.toString(),
        doc.owner.name || 'Unknown',
        doc.owner.email,
        doc.reviews[0]?.createdAt?.toISOString() || 'Never reviewed',
        doc.updatedAt.toISOString(),
        Array.from(isoStandardsSet).join('; '),
        doc.fileUrl || 'No file attached'
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Log the export action
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_MASTER_DOCUMENT_LIST',
        entityType: 'MASTER_DOCUMENT_LIST',
        entityId: 'MDL',
        userId: req.user?.id,
        details: {
          format: 'CSV',
          documentCount: documents.length,
          isoStandard: isoStandard || 'ALL',
          organizationId,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }
    });

    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="master-document-list-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting master document list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export master document list'
    });
  }
});

export default router;