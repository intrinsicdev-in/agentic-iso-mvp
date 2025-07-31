import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticateToken, requireSuperAdmin, requireAccountAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional()
});

const updateSettingsSchema = z.object({
  enabledStandards: z.array(z.enum(['ISO_9001_2015', 'ISO_27001_2022', 'ISO_27001_2013'])).optional(),
  enableAIAgents: z.boolean().optional(),
  enableReports: z.boolean().optional(),
  enableAuditLogs: z.boolean().optional(),
  enforcePasswordPolicy: z.boolean().optional(),
  require2FA: z.boolean().optional(),
  sessionTimeout: z.number().min(30).max(2880).optional(), // 30 min to 48 hours
  maxFileSize: z.number().min(1).max(100).optional(), // 1MB to 100MB
  maxTotalStorage: z.number().min(100).max(10000).optional() // 100MB to 10GB
});

// Get all organizations (super admin only)
router.get('/', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          _count: {
            select: {
              users: true,
              artefacts: true
            }
          },
          settings: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count({ where })
    ]);

    res.json({
      organizations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Failed to get organizations' });
  }
});

// Get users for current organization
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'User not associated with an organization' });
    }

    const users = await prisma.user.findMany({
      where: { 
        organizationId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ error: 'Failed to get organization users' });
  }
});

// Get single organization
router.get('/:organizationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Check permissions
    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            artefacts: true
          }
        },
        settings: true,
        users: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastLogin: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

// Update organization
router.put('/:organizationId', authenticateToken, requireAccountAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const data = updateOrganizationSchema.parse(req.body);

    // Check permissions
    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data,
      include: {
        settings: true
      }
    });

    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Update organization settings
router.put('/:organizationId/settings', authenticateToken, requireAccountAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const data = updateSettingsSchema.parse(req.body);

    // Check permissions
    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId },
      update: data,
      create: {
        organizationId,
        ...data
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Toggle organization active status (super admin only)
router.put('/:organizationId/toggle-active', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: { isActive: !organization.isActive }
    });

    res.json(updatedOrganization);
  } catch (error) {
    console.error('Toggle organization active error:', error);
    res.status(500).json({ error: 'Failed to toggle organization status' });
  }
});

// Get organization analytics/stats
router.get('/:organizationId/analytics', authenticateToken, requireAccountAdmin, async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Check permissions
    if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [
      totalUsers,
      activeUsers,
      totalArtefacts,
      artefactsByStatus,
      totalTasks,
      tasksByStatus,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.user.count({ where: { organizationId, isActive: true } }),
      prisma.artefact.count({ where: { organizationId } }),
      prisma.artefact.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { status: true }
      }),
      prisma.task.count({
        where: {
          createdBy: {
            organizationId
          }
        }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: {
          createdBy: {
            organizationId
          }
        },
        _count: { status: true }
      }),
      prisma.auditLog.findMany({
        where: {
          user: {
            organizationId
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      artefacts: {
        total: totalArtefacts,
        byStatus: artefactsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      recentActivity
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;