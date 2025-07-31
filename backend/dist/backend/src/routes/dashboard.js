"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get dashboard data
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const organizationId = req.user.organizationId;
        // Build where clause based on user role
        const whereClause = {};
        if (req.user.role !== 'SUPER_ADMIN' && organizationId) {
            whereClause.organizationId = organizationId;
        }
        // Fetch documents
        const [totalDocuments, documentsUnderReview, approvedDocuments, draftDocuments, archivedDocuments, pendingTasks, totalComments, recentActivity] = await Promise.all([
            // Total documents
            prisma.artefact.count({ where: whereClause }),
            // Documents under review
            prisma.artefact.count({
                where: { ...whereClause, status: 'UNDER_REVIEW' }
            }),
            // Approved documents
            prisma.artefact.count({
                where: { ...whereClause, status: 'APPROVED' }
            }),
            // Draft documents
            prisma.artefact.count({
                where: { ...whereClause, status: 'DRAFT' }
            }),
            // Archived documents
            prisma.artefact.count({
                where: { ...whereClause, status: 'ARCHIVED' }
            }),
            // Pending tasks
            prisma.task.count({
                where: {
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                    ...(req.user.role === 'USER' ?
                        {
                            OR: [
                                { assigneeId: userId },
                                {
                                    artefact: {
                                        organizationId: organizationId
                                    }
                                }
                            ]
                        } :
                        organizationId ? {
                            artefact: {
                                organizationId: organizationId
                            }
                        } : {})
                }
            }),
            // Total comments
            prisma.comment.count({
                where: {
                    artefact: whereClause
                }
            }),
            // Recent activity from audit logs
            prisma.auditLog.findMany({
                where: {
                    ...(req.user.role !== 'SUPER_ADMIN' ? { userId } : {}),
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
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
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10
            })
        ]);
        // Transform audit logs to activity format
        const transformedActivity = recentActivity.map(log => {
            let title = '';
            let description = '';
            let type = 'document';
            switch (log.action) {
                case 'artefact.created':
                    title = 'Document Created';
                    description = `New document "${log.details?.title || 'Untitled'}" was created`;
                    type = 'document';
                    break;
                case 'artefact.updated':
                    title = 'Document Updated';
                    description = `Document was updated to version ${log.details?.version || 'unknown'}`;
                    type = 'document';
                    break;
                case 'artefact.imported':
                    title = 'Document Imported';
                    description = `Document "${log.details?.title || 'Untitled'}" was imported`;
                    type = 'document';
                    break;
                case 'review.created':
                    title = 'Review Added';
                    description = `New review added with status: ${log.details?.status || 'unknown'}`;
                    type = 'review';
                    break;
                case 'comment.created':
                    title = 'Comment Added';
                    description = 'New comment was added to a document';
                    type = 'comment';
                    break;
                case 'task.created':
                    title = 'Task Created';
                    description = `New task "${log.details?.title || 'Untitled'}" was created`;
                    type = 'task';
                    break;
                case 'task.updated':
                    title = 'Task Updated';
                    description = `Task status changed to ${log.details?.status || 'unknown'}`;
                    type = 'task';
                    break;
                default:
                    title = 'Activity';
                    description = log.action.replace(/\./g, ' ').replace(/_/g, ' ');
            }
            return {
                id: log.id,
                type,
                title,
                description,
                timestamp: log.createdAt.toISOString(),
                user: log.user?.name || log.user?.email || 'System'
            };
        });
        res.json({
            stats: {
                totalDocuments,
                documentsUnderReview,
                approvedDocuments,
                draftDocuments,
                archivedDocuments,
                pendingTasks,
                totalComments
            },
            recentActivity: transformedActivity
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
// Get recent documents
router.get('/recent-documents', auth_1.authenticateToken, async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        // Build where clause based on user role
        const whereClause = {};
        if (req.user.role !== 'SUPER_ADMIN' && organizationId) {
            whereClause.organizationId = organizationId;
        }
        const recentDocuments = await prisma.artefact.findMany({
            where: whereClause,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        clauseMappings: true,
                        reviews: true,
                        comments: true,
                        tasks: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        });
        res.json(recentDocuments);
    }
    catch (error) {
        console.error('Error fetching recent documents:', error);
        res.status(500).json({ error: 'Failed to fetch recent documents' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map