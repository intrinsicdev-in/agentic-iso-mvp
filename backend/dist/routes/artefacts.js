"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const artefact_service_1 = require("../services/artefact.service");
const router = (0, express_1.Router)();
const artefactService = new artefact_service_1.ArtefactService();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Supported types: PDF, Word, Excel, Text'));
        }
    }
});
// Import document with classification
router.post('/import', upload.single('file'), async (req, res) => {
    console.log('📤 Import request received');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'None');
    console.log('Body:', req.body);
    try {
        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({ error: 'No file provided' });
        }
        const { standard, autoClassify, ownerId } = req.body;
        if (!standard || !ownerId) {
            return res.status(400).json({
                error: 'Missing required fields: standard, ownerId'
            });
        }
        const result = await artefactService.importAndClassifyArtefact({
            file: req.file,
            ownerId,
            standard,
            autoClassify: autoClassify === 'true'
        });
        res.json({
            success: true,
            artefact: result.artefact,
            mappings: result.mappings,
            message: `Document imported successfully with ${result.mappings.length} clause mappings`
        });
    }
    catch (error) {
        console.error('Import error:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        if (error instanceof Error) {
            console.error('Error properties:', Object.getOwnPropertyNames(error));
        }
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to import document',
            details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : error) : undefined
        });
    }
});
// Get all artefacts
router.get('/', async (req, res) => {
    try {
        const artefacts = await artefactService.getAllArtefacts();
        res.json(artefacts);
    }
    catch (error) {
        console.error('Error fetching artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch artefacts' });
    }
});
// File proxy endpoint to handle CORS issues
router.get('/file-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL parameter is required' });
        }
        // Validate URL to prevent SSRF attacks
        if (!url.startsWith('http://localhost:9000/') && !url.startsWith('https://')) {
            return res.status(400).json({ error: 'Invalid URL' });
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        // Set appropriate headers
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        // Stream the response
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    }
    catch (error) {
        console.error('File proxy error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to proxy file'
        });
    }
});
// Get artefact by ID with mappings
router.get('/:id', async (req, res) => {
    try {
        const artefact = await artefactService.getArtefactWithMappings(req.params.id);
        if (!artefact) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        res.json(artefact);
    }
    catch (error) {
        console.error('Error fetching artefact:', error);
        res.status(500).json({ error: 'Failed to fetch artefact' });
    }
});
// Update artefact
router.put('/:id', async (req, res) => {
    try {
        const { title, description, content, status } = req.body;
        const userId = 'test-user-id'; // TODO: Get from auth
        const updated = await artefactService.updateArtefact(req.params.id, userId, { title, description, content, status });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating artefact:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update artefact'
        });
    }
});
// Delete artefact (exceptional circumstances)
router.delete('/:id', async (req, res) => {
    try {
        const userId = 'test-user-id'; // TODO: Get from auth
        const deleted = await artefactService.deleteArtefact(req.params.id, userId);
        res.json({
            success: true,
            message: 'Artefact deleted successfully',
            deletedArtefact: deleted
        });
    }
    catch (error) {
        console.error('Error deleting artefact:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete artefact'
        });
    }
});
// REVIEW ENDPOINTS
// Create a review for an artefact
router.post('/:id/reviews', async (req, res) => {
    try {
        const { status, comments } = req.body;
        const reviewerId = 'test-user-id'; // TODO: Get from auth
        if (!status) {
            return res.status(400).json({ error: 'Review status is required' });
        }
        const review = await artefactService.createReview(req.params.id, reviewerId, status, comments);
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create review'
        });
    }
});
// Get reviews for an artefact
router.get('/:id/reviews', async (req, res) => {
    try {
        const reviews = await artefactService.getArtefactReviews(req.params.id);
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
// COMMENT ENDPOINTS
// Create a comment on an artefact
router.post('/:id/comments', async (req, res) => {
    try {
        const { content, parentId } = req.body;
        const authorId = 'test-user-id'; // TODO: Get from auth
        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
        }
        const comment = await artefactService.createComment(req.params.id, authorId, content, parentId);
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create comment'
        });
    }
});
// Get comments for an artefact
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await artefactService.getArtefactComments(req.params.id);
        res.json(comments);
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
// TASK ENDPOINTS
// Create a task for an artefact
router.post('/:id/tasks', async (req, res) => {
    try {
        const { title, description, dueDate, priority, assigneeId } = req.body;
        const createdById = 'test-user-id'; // TODO: Get from auth
        if (!title) {
            return res.status(400).json({ error: 'Task title is required' });
        }
        const task = await artefactService.createTask(req.params.id, createdById, title, description, dueDate, priority, assigneeId);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create task'
        });
    }
});
// Get tasks for an artefact
router.get('/:id/tasks', async (req, res) => {
    try {
        const tasks = await artefactService.getArtefactTasks(req.params.id);
        res.json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// Update task status
router.put('/tasks/:taskId', async (req, res) => {
    try {
        const { status, completedAt } = req.body;
        const userId = 'test-user-id'; // TODO: Get from auth
        const task = await artefactService.updateTask(req.params.taskId, userId, { status, completedAt });
        res.json(task);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update task'
        });
    }
});
exports.default = router;
//# sourceMappingURL=artefacts.js.map