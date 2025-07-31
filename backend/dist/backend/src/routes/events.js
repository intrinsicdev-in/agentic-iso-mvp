"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_service_1 = require("../services/event.service");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const eventService = new event_service_1.EventService();
// Get all events with optional filtering
router.get('/', async (req, res) => {
    try {
        const { type, status, reportedById, startDate, endDate } = req.query;
        const filters = {};
        if (type && Object.values(client_1.EventType).includes(type)) {
            filters.type = type;
        }
        if (status) {
            filters.status = status;
        }
        if (reportedById) {
            filters.reportedById = reportedById;
        }
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }
        const events = await eventService.getAllEvents(filters);
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch events'
        });
    }
});
// Get event statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await eventService.getEventStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching event stats:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch event statistics'
        });
    }
});
// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    }
    catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch event'
        });
    }
});
// Create new event
router.post('/', async (req, res) => {
    try {
        const { type, title, description, severity, metadata } = req.body;
        // TODO: Get from authentication
        const reportedById = 'test-user-id';
        if (!type || !title || !description) {
            return res.status(400).json({
                error: 'Missing required fields: type, title, description'
            });
        }
        if (!Object.values(client_1.EventType).includes(type)) {
            return res.status(400).json({
                error: 'Invalid event type'
            });
        }
        const event = await eventService.createEvent({
            type,
            title,
            description,
            severity: severity || 2,
            reportedById,
            metadata
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create event'
        });
    }
});
// Update event
router.put('/:id', async (req, res) => {
    try {
        const { status, resolution, metadata } = req.body;
        // TODO: Get from authentication
        const userId = 'test-user-id';
        const event = await eventService.updateEvent(req.params.id, userId, {
            status,
            resolution,
            metadata
        });
        res.json(event);
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update event'
        });
    }
});
// Delete event
router.delete('/:id', async (req, res) => {
    try {
        // TODO: Get from authentication
        const userId = 'test-user-id';
        await eventService.deleteEvent(req.params.id, userId);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete event'
        });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map