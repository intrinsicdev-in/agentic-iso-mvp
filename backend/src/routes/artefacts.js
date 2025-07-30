"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.artefactRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Artefact_1 = __importDefault(require("../models/Artefact"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, DOC, DOCX files
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
        }
    }
});
// Get all artefacts
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const artefacts = yield Artefact_1.default.findAll({
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ artefacts });
    }
    catch (error) {
        console.error('Error fetching artefacts:', error);
        res.status(500).json({ error: 'Failed to fetch artefacts' });
    }
}));
// Get artefact by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const artefact = yield Artefact_1.default.findByPk(id, {
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        if (!artefact) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        res.json({ artefact });
    }
    catch (error) {
        console.error('Error fetching artefact:', error);
        res.status(500).json({ error: 'Failed to fetch artefact' });
    }
}));
// Create new artefact
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, type, clause, content, ownerId } = req.body;
        if (!title || !type || !clause || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // For now, use a default user ID if ownerId is not provided
        // In a real app, this would come from the authenticated user
        const defaultUserId = 1;
        const newArtefact = yield Artefact_1.default.create({
            title,
            type,
            clause,
            content,
            ownerId: ownerId || defaultUserId,
            createdById: ownerId || defaultUserId,
            lastUpdatedById: ownerId || defaultUserId,
            version: '1.0',
            status: 'draft'
        });
        // Fetch the created artefact with associations
        const createdArtefact = yield Artefact_1.default.findByPk(newArtefact.id, {
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.status(201).json({ artefact: createdArtefact });
    }
    catch (error) {
        console.error('Error creating artefact:', error);
        res.status(500).json({ error: 'Failed to create artefact' });
    }
}));
// Update artefact
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content, status, version } = req.body;
        const artefact = yield Artefact_1.default.findByPk(id);
        if (!artefact) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        // Update the artefact
        yield artefact.update(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (title && { title })), (content && { content })), (status && { status })), (version && { version })), { lastUpdatedById: 1 // In a real app, this would be the authenticated user ID
         }));
        // Fetch the updated artefact with associations
        const updatedArtefact = yield Artefact_1.default.findByPk(id, {
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.json({
            success: true,
            artefact: updatedArtefact,
            message: 'Artefact updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating artefact:', error);
        res.status(500).json({ error: 'Failed to update artefact' });
    }
}));
// Delete artefact
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const artefact = yield Artefact_1.default.findByPk(id);
        if (!artefact) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        yield artefact.destroy();
        res.json({
            success: true,
            message: 'Artefact deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting artefact:', error);
        res.status(500).json({ error: 'Failed to delete artefact' });
    }
}));
// Get artefacts by clause
router.get('/clause/:clause', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clause } = req.params;
        const artefacts = yield Artefact_1.default.findAll({
            where: {
                clause: {
                    [require('sequelize').Op.iLike]: `%${clause}%`
                }
            },
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ artefacts });
    }
    catch (error) {
        console.error('Error fetching artefacts by clause:', error);
        res.status(500).json({ error: 'Failed to fetch artefacts by clause' });
    }
}));
// Upload ISO book
router.post('/upload', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, isoStandard, clause, ownerId } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!title || !isoStandard || !clause) {
            return res.status(400).json({ error: 'Missing required fields: title, isoStandard, clause' });
        }
        // Validate ISO standard
        const validStandards = ['ISO 9001:2015', 'ISO 27001:2022'];
        if (!validStandards.includes(isoStandard)) {
            return res.status(400).json({ error: 'Invalid ISO standard. Must be ISO 9001:2015 or ISO 27001:2022' });
        }
        // For now, use a default user ID if ownerId is not provided
        const defaultUserId = 1;
        const newArtefact = yield Artefact_1.default.create({
            title,
            type: 'iso-book',
            clause,
            content: `ISO Book: ${title} - ${isoStandard}`,
            ownerId: ownerId || defaultUserId,
            createdById: ownerId || defaultUserId,
            lastUpdatedById: ownerId || defaultUserId,
            version: '1.0',
            status: 'draft',
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            fileType: file.mimetype,
            isoStandard
        });
        // Fetch the created artefact with associations
        const createdArtefact = yield Artefact_1.default.findByPk(newArtefact.id, {
            include: [
                { model: User_1.default, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                { model: User_1.default, as: 'lastUpdatedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.status(201).json({
            artefact: createdArtefact,
            message: 'ISO book uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading ISO book:', error);
        res.status(500).json({ error: 'Failed to upload ISO book' });
    }
}));
// Download file
router.get('/:id/download', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const artefact = yield Artefact_1.default.findByPk(id);
        if (!artefact) {
            return res.status(404).json({ error: 'Artefact not found' });
        }
        if (!artefact.filePath || !artefact.fileName) {
            return res.status(404).json({ error: 'No file associated with this artefact' });
        }
        // Check if file exists
        if (!fs_1.default.existsSync(artefact.filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        // Set headers for file download
        res.setHeader('Content-Type', artefact.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${artefact.fileName}"`);
        // Stream the file
        const fileStream = fs_1.default.createReadStream(artefact.filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
}));
exports.artefactRoutes = router;
