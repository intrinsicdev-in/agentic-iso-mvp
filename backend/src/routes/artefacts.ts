import { Router } from 'express';
import multer from 'multer';
import { ArtefactService } from '../services/artefact.service';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const artefactService = new ArtefactService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
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
    } else {
      cb(new Error('Invalid file type. Supported types: PDF, Word, Excel, Text'));
    }
  }
});

// Import document with classification
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('📤 Import request received');
  console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'None');
  console.log('Body:', req.body);
  
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    const { standard, autoClassify } = req.body;
    const ownerId = req.user!.id; // Get from authenticated user
    const organizationId = req.user!.organizationId;
    
    if (!standard) {
      return res.status(400).json({ 
        error: 'Missing required fields: standard' 
      });
    }

    const result = await artefactService.importAndClassifyArtefact({
      file: req.file,
      ownerId,
      organizationId,
      standard,
      autoClassify: autoClassify === 'true'
    });

    res.json({
      success: true,
      artefact: result.artefact,
      mappings: result.mappings,
      message: `Document imported successfully with ${result.mappings.length} clause mappings`
    });

  } catch (error) {
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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const artefacts = await artefactService.getAllArtefacts();
    res.json(artefacts);
  } catch (error) {
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

  } catch (error) {
    console.error('File proxy error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to proxy file' 
    });
  }
});

// Get artefact by ID with mappings
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const artefact = await artefactService.getArtefactWithMappings(req.params.id);
    
    if (!artefact) {
      return res.status(404).json({ error: 'Artefact not found' });
    }

    res.json(artefact);
  } catch (error) {
    console.error('Error fetching artefact:', error);
    res.status(500).json({ error: 'Failed to fetch artefact' });
  }
});

// Update artefact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, content, status } = req.body;
    const userId = req.user!.id;

    const updated = await artefactService.updateArtefact(
      req.params.id,
      userId,
      { title, description, content, status }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating artefact:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update artefact' 
    });
  }
});

// Delete artefact (exceptional circumstances)
router.delete('/:id', authenticateToken, requireRole([UserRole.SUPER_ADMIN, UserRole.ACCOUNT_ADMIN]), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const deleted = await artefactService.deleteArtefact(req.params.id, userId);
    
    res.json({
      success: true,
      message: 'Artefact deleted successfully',
      deletedArtefact: deleted
    });
  } catch (error) {
    console.error('Error deleting artefact:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete artefact' 
    });
  }
});

// REVIEW ENDPOINTS

// Create a review for an artefact
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { status, comments } = req.body;
    const reviewerId = req.user!.id;
    
    if (!status) {
      return res.status(400).json({ error: 'Review status is required' });
    }

    const review = await artefactService.createReview(
      req.params.id,
      reviewerId,
      status,
      comments
    );

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create review' 
    });
  }
});

// Get reviews for an artefact
router.get('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await artefactService.getArtefactReviews(req.params.id);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// COMMENT ENDPOINTS

// Create a comment on an artefact
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const authorId = req.user!.id;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await artefactService.createComment(
      req.params.id,
      authorId,
      content,
      parentId
    );

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create comment' 
    });
  }
});

// Get comments for an artefact
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await artefactService.getArtefactComments(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// TASK ENDPOINTS

// Create a task for an artefact
router.post('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate, priority, assigneeId } = req.body;
    const createdById = req.user!.id;
    
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = await artefactService.createTask(
      req.params.id,
      createdById,
      title,
      description,
      dueDate,
      priority,
      assigneeId
    );

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    });
  }
});

// Get tasks for an artefact
router.get('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await artefactService.getArtefactTasks(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update task status
router.put('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { status, completedAt } = req.body;
    const userId = req.user!.id;

    const task = await artefactService.updateTask(
      req.params.taskId,
      userId,
      { status, completedAt }
    );

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    });
  }
});

export default router;