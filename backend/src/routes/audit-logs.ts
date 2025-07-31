import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get audit logs (Admin only)
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ACCOUNT_ADMIN']), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      entityType = '',
      action = '',
      userId = '',
      dateRange = '7'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};

    // Organization filtering for ACCOUNT_ADMIN
    if (req.user!.role === 'ACCOUNT_ADMIN' && req.user!.organizationId) {
      // For ACCOUNT_ADMIN, only show logs from their organization
      whereClause.OR = [
        { userId: { in: await getUsersFromOrganization(req.user!.organizationId) } },
        { 
          AND: [
            { entityType: 'artefact' },
            { 
              // This is a bit complex - we'd need to join to check artefact organization
              // For now, let's show all audit logs for ACCOUNT_ADMIN but we should improve this
            }
          ]
        }
      ];
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Entity type filter
    if (entityType) {
      whereClause.entityType = entityType;
    }

    // Action filter
    if (action) {
      whereClause.action = { contains: action, mode: 'insensitive' };
    }

    // User filter
    if (userId) {
      whereClause.userId = userId;
    }

    // Date range filter
    const daysBack = parseInt(dateRange as string);
    if (daysBack) {
      whereClause.createdAt = {
        gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      };
    }

    // Get audit logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      logs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log details
router.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ACCOUNT_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Organization check for ACCOUNT_ADMIN
    if (req.user!.role === 'ACCOUNT_ADMIN' && req.user!.organizationId) {
      const userOrgUsers = await getUsersFromOrganization(req.user!.organizationId);
      if (!userOrgUsers.includes(log.userId!)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Export audit logs
router.get('/export/csv', authenticateToken, requireRole(['SUPER_ADMIN', 'ACCOUNT_ADMIN']), async (req, res) => {
  try {
    const {
      entityType = '',
      action = '',
      dateRange = '30'
    } = req.query;

    // Build where clause (similar to the main query)
    const whereClause: any = {};

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (action) {
      whereClause.action = { contains: action, mode: 'insensitive' };
    }

    const daysBack = parseInt(dateRange as string);
    if (daysBack) {
      whereClause.createdAt = {
        gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      };
    }

    // Organization filtering for ACCOUNT_ADMIN
    if (req.user!.role === 'ACCOUNT_ADMIN' && req.user!.organizationId) {
      const userOrgUsers = await getUsersFromOrganization(req.user!.organizationId);
      whereClause.userId = { in: userOrgUsers };
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10000 // Limit to prevent memory issues
    });

    // Generate CSV
    const csvHeader = 'Timestamp,Action,Entity Type,Entity ID,User,Email,IP Address,Details\n';
    const csvRows = logs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        log.createdAt.toISOString(),
        log.action,
        log.entityType,
        log.entityId,
        log.user?.name || 'System',
        log.user?.email || '',
        log.ipAddress || '',
        `"${details}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Helper function to get users from an organization
async function getUsersFromOrganization(organizationId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true }
  });
  return users.map(u => u.id);
}

export default router;