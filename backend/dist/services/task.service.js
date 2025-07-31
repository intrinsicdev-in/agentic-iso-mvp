"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const client_1 = require("@prisma/client");
class TaskService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async createTask(data, createdById) {
        const task = await this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority,
                assigneeId: data.assigneeId,
                artefactId: data.artefactId,
                createdById,
                status: 'PENDING'
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                artefact: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
        // Create audit log
        await this.createAuditLog('task.created', 'task', task.id, createdById, {
            title: data.title,
            priority: data.priority,
            dueDate: data.dueDate
        });
        return task;
    }
    async getAllTasks(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.priority) {
            where.priority = filters.priority;
        }
        if (filters?.assigneeId) {
            where.assigneeId = filters.assigneeId;
        }
        if (filters?.artefactId) {
            where.artefactId = filters.artefactId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.dueDate = {};
            if (filters.startDate) {
                where.dueDate.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.dueDate.lte = filters.endDate;
            }
        }
        return this.prisma.task.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                artefact: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    }
    async getTaskById(id) {
        return this.prisma.task.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                artefact: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
    }
    async updateTask(id, userId, data) {
        const updateData = {
            updatedAt: new Date()
        };
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.dueDate !== undefined)
            updateData.dueDate = data.dueDate;
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === 'COMPLETED') {
                updateData.completedAt = data.completedAt || new Date();
            }
        }
        if (data.assigneeId !== undefined)
            updateData.assigneeId = data.assigneeId;
        const task = await this.prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                artefact: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });
        // Create audit log
        await this.createAuditLog('task.updated', 'task', id, userId, {
            changes: data
        });
        return task;
    }
    async deleteTask(id, userId) {
        await this.prisma.task.delete({
            where: { id }
        });
        // Create audit log
        await this.createAuditLog('task.deleted', 'task', id, userId, {});
    }
    async getTaskStats(userId) {
        const filters = userId ? { assigneeId: userId } : undefined;
        const tasks = await this.getAllTasks(filters);
        const total = tasks.length;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const byStatus = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {});
        const byPriority = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});
        const overdue = tasks.filter(task => task.dueDate && task.dueDate < now && task.status !== 'COMPLETED').length;
        const dueToday = tasks.filter(task => task.dueDate && task.dueDate >= today && task.dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)).length;
        const dueThisWeek = tasks.filter(task => task.dueDate && task.dueDate >= today && task.dueDate < nextWeek).length;
        const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
        const completionRate = total > 0 ? (completedTasks.length / total) * 100 : 0;
        // Calculate average time to complete
        const tasksWithCompletionTime = completedTasks.filter(task => task.completedAt && task.createdAt);
        const totalCompletionTime = tasksWithCompletionTime.reduce((acc, task) => {
            const time = task.completedAt.getTime() - task.createdAt.getTime();
            return acc + time;
        }, 0);
        const averageTimeToComplete = tasksWithCompletionTime.length > 0
            ? totalCompletionTime / tasksWithCompletionTime.length / (1000 * 60 * 60 * 24) // days
            : 0;
        return {
            total,
            byStatus,
            byPriority,
            overdue,
            dueToday,
            dueThisWeek,
            completionRate,
            averageTimeToComplete
        };
    }
    async getCalendarEvents(startDate, endDate, userId) {
        const tasks = await this.getAllTasks({
            startDate,
            endDate,
            assigneeId: userId
        });
        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            start: task.dueDate || task.createdAt,
            end: task.dueDate || undefined,
            allDay: true,
            type: 'TASK',
            status: task.status,
            priority: task.priority,
            description: task.description || undefined,
            assignee: task.assignee?.name || task.assignee?.email || undefined
        }));
    }
    async createRecurringTask(baseTask, recurrence, createdById) {
        const tasks = [];
        let currentDate = baseTask.dueDate || new Date();
        let created = 0;
        while ((!recurrence.endDate || currentDate <= recurrence.endDate) &&
            (!recurrence.count || created < recurrence.count)) {
            const task = await this.createTask({
                ...baseTask,
                dueDate: new Date(currentDate),
                title: `${baseTask.title} (${created + 1})`
            }, createdById);
            tasks.push(task);
            created++;
            // Calculate next occurrence
            switch (recurrence.frequency) {
                case 'DAILY':
                    currentDate.setDate(currentDate.getDate() + recurrence.interval);
                    break;
                case 'WEEKLY':
                    currentDate.setDate(currentDate.getDate() + (7 * recurrence.interval));
                    break;
                case 'MONTHLY':
                    currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
                    break;
                case 'QUARTERLY':
                    currentDate.setMonth(currentDate.getMonth() + (3 * recurrence.interval));
                    break;
                case 'YEARLY':
                    currentDate.setFullYear(currentDate.getFullYear() + recurrence.interval);
                    break;
            }
        }
        return tasks;
    }
    async createAuditLog(action, entityType, entityId, userId, details) {
        await this.prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                userId,
                details
            }
        });
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=task.service.js.map