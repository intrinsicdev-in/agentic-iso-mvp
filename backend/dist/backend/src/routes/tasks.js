"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_service_1 = require("../services/task.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const taskService = new task_service_1.TaskService();
// Get all tasks with optional filtering
router.get('/', async (req, res) => {
    try {
        const { status, priority, assigneeId, startDate, endDate, artefactId } = req.query;
        const filters = {};
        if (status && Object.values(client_1.TaskStatus).includes(status)) {
            filters.status = status;
        }
        if (priority) {
            const priorityNum = parseInt(priority);
            if (priorityNum >= 1 && priorityNum <= 5) {
                filters.priority = priorityNum;
            }
        }
        if (assigneeId) {
            filters.assigneeId = assigneeId;
        }
        if (artefactId) {
            filters.artefactId = artefactId;
        }
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }
        const tasks = await taskService.getAllTasks(filters);
        res.json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch tasks'
        });
    }
});
// Get task statistics
router.get('/stats', async (req, res) => {
    try {
        const { userId } = req.query;
        const stats = await taskService.getTaskStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching task stats:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch task statistics'
        });
    }
});
// Get calendar events
router.get('/calendar', async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate and endDate are required'
            });
        }
        const events = await taskService.getCalendarEvents(new Date(startDate), new Date(endDate), userId);
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch calendar events'
        });
    }
});
// Get task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch task'
        });
    }
});
// Create new task
router.post('/', async (req, res) => {
    try {
        const { title, description, dueDate, priority, assigneeId, assigneeIds, artefactId } = req.body;
        // TODO: Get from authentication
        const createdById = 'test-user-id';
        if (!title || !priority) {
            return res.status(400).json({
                error: 'Missing required fields: title, priority'
            });
        }
        if (priority !== undefined && (typeof priority !== 'number' || priority < 1 || priority > 5)) {
            return res.status(400).json({
                error: 'Invalid priority'
            });
        }
        const task = await taskService.createTask({
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            priority,
            assigneeId,
            assigneeIds,
            artefactId
        }, createdById);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create task'
        });
    }
});
// Create recurring task
router.post('/recurring', async (req, res) => {
    try {
        const { title, description, dueDate, priority, assigneeId, artefactId, recurrence } = req.body;
        // TODO: Get from authentication
        const createdById = 'test-user-id';
        if (!title || !priority || !recurrence) {
            return res.status(400).json({
                error: 'Missing required fields: title, priority, recurrence'
            });
        }
        if (priority !== undefined && (typeof priority !== 'number' || priority < 1 || priority > 5)) {
            return res.status(400).json({
                error: 'Invalid priority'
            });
        }
        const tasks = await taskService.createRecurringTask({
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            priority,
            assigneeId,
            artefactId
        }, {
            frequency: recurrence.frequency,
            interval: recurrence.interval || 1,
            endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
            count: recurrence.count
        }, createdById);
        res.status(201).json({
            message: `Created ${tasks.length} recurring tasks`,
            tasks
        });
    }
    catch (error) {
        console.error('Error creating recurring tasks:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create recurring tasks'
        });
    }
});
// Update task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, dueDate, priority, status, assigneeId, assigneeIds } = req.body;
        // TODO: Get from authentication
        const userId = 'test-user-id';
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (dueDate !== undefined)
            updateData.dueDate = new Date(dueDate);
        if (priority !== undefined) {
            if (priority !== undefined && (typeof priority !== 'number' || priority < 1 || priority > 5)) {
                return res.status(400).json({
                    error: 'Invalid priority'
                });
            }
            updateData.priority = priority;
        }
        if (status !== undefined) {
            if (!Object.values(client_1.TaskStatus).includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status'
                });
            }
            updateData.status = status;
        }
        if (assigneeId !== undefined)
            updateData.assigneeId = assigneeId;
        if (assigneeIds !== undefined)
            updateData.assigneeIds = assigneeIds;
        const task = await taskService.updateTask(req.params.id, userId, updateData);
        res.json(task);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update task'
        });
    }
});
// Delete task
router.delete('/:id', async (req, res) => {
    try {
        // TODO: Get from authentication
        const userId = 'test-user-id';
        await taskService.deleteTask(req.params.id, userId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete task'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map