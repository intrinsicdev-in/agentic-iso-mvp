"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    industry: zod_1.z.string().optional(),
    size: zod_1.z.string().optional()
});
const updateSettingsSchema = zod_1.z.object({
    enabledStandards: zod_1.z.array(zod_1.z.enum(['ISO_9001_2015', 'ISO_27001_2022', 'ISO_27001_2013'])).optional(),
    enableAIAgents: zod_1.z.boolean().optional(),
    enableReports: zod_1.z.boolean().optional(),
    enableAuditLogs: zod_1.z.boolean().optional(),
    enforcePasswordPolicy: zod_1.z.boolean().optional(),
    require2FA: zod_1.z.boolean().optional(),
    sessionTimeout: zod_1.z.number().min(30).max(2880).optional(), // 30 min to 48 hours
    maxFileSize: zod_1.z.number().min(1).max(100).optional(), // 1MB to 100MB
    maxTotalStorage: zod_1.z.number().min(100).max(10000).optional() // 100MB to 10GB
});
// Get all organizations (super admin only)
router.get('/', auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
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
    }
    catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ error: 'Failed to get organizations' });
    }
});
// Get single organization
router.get('/:organizationId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { organizationId } = req.params;
        // Check permissions
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
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
    }
    catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization' });
    }
});
// Update organization
router.put('/:organizationId', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const { organizationId } = req.params;
        const data = updateOrganizationSchema.parse(req.body);
        // Check permissions
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
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
    }
    catch (error) {
        console.error('Update organization error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update organization' });
    }
});
// Update organization settings
router.put('/:organizationId/settings', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const { organizationId } = req.params;
        const data = updateSettingsSchema.parse(req.body);
        // Check permissions
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
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
    }
    catch (error) {
        console.error('Update settings error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
// Toggle organization active status (super admin only)
router.put('/:organizationId/toggle-active', auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Toggle organization active error:', error);
        res.status(500).json({ error: 'Failed to toggle organization status' });
    }
});
// Get organization analytics/stats
router.get('/:organizationId/analytics', auth_1.authenticateToken, auth_1.requireAccountAdmin, async (req, res) => {
    try {
        const { organizationId } = req.params;
        // Check permissions
        if (req.user.role !== client_1.UserRole.SUPER_ADMIN && req.user.organizationId !== organizationId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const [totalUsers, activeUsers, totalArtefacts, artefactsByStatus, totalTasks, tasksByStatus, recentActivity] = await Promise.all([
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
                }, {})
            },
            tasks: {
                total: totalTasks,
                byStatus: tasksByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {})
            },
            recentActivity
        };
        res.json(analytics);
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});
exports.default = router;
//# sourceMappingURL=organizations.js.map