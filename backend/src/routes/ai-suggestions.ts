import { Router } from 'express';
import { AISuggestionService } from '../services/ai-suggestion.service';
import { AgentType } from '@prisma/client';

const router = Router();
const aiSuggestionService = new AISuggestionService();

// Get all AI suggestions with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      status,
      type,
      agentType,
      agentId
    } = req.query;

    const filters: any = {};
    
    if (status) {
      filters.status = status as string;
    }
    
    if (type) {
      filters.type = type as string;
    }
    
    if (agentType && Object.values(AgentType).includes(agentType as AgentType)) {
      filters.agentType = agentType as AgentType;
    }
    
    if (agentId) {
      filters.agentId = agentId as string;
    }

    const suggestions = await aiSuggestionService.getAllSuggestions(filters);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch AI suggestions' 
    });
  }
});

// Get AI suggestion statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await aiSuggestionService.getSuggestionStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching AI suggestion stats:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch AI suggestion statistics' 
    });
  }
});

// AI Agents management endpoints

// Get all AI agents
router.get('/agents', async (req, res) => {
  try {
    const agents = await aiSuggestionService.getAllAgents();
    res.json(agents);
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch AI agents' 
    });
  }
});

// Create new AI agent
router.post('/agents', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      config
    } = req.body;

    if (!name || !type || !description) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, description'
      });
    }

    if (!Object.values(AgentType).includes(type)) {
      return res.status(400).json({
        error: 'Invalid agent type'
      });
    }

    const agent = await aiSuggestionService.createAgent({
      name,
      type,
      description,
      config
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating AI agent:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create AI agent' 
    });
  }
});

// Update AI agent
router.put('/agents/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      config,
      isActive
    } = req.body;

    const agent = await aiSuggestionService.updateAgent(req.params.id, {
      name,
      description,
      config,
      isActive
    });

    res.json(agent);
  } catch (error) {
    console.error('Error updating AI agent:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update AI agent' 
    });
  }
});

// Get suggestion by ID
router.get('/:id', async (req, res) => {
  try {
    const suggestion = await aiSuggestionService.getSuggestionById(req.params.id);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'AI suggestion not found' });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Error fetching AI suggestion:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch AI suggestion' 
    });
  }
});

// Create new AI suggestion
router.post('/', async (req, res) => {
  try {
    const {
      agentId,
      type,
      title,
      content,
      rationale,
      metadata
    } = req.body;

    if (!agentId || !type || !title || !content) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, type, title, content'
      });
    }

    const suggestion = await aiSuggestionService.createSuggestion({
      agentId,
      type,
      title,
      content,
      rationale,
      metadata
    });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Error creating AI suggestion:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create AI suggestion' 
    });
  }
});

// Update AI suggestion (usually for review actions)
router.put('/:id', async (req, res) => {
  try {
    const {
      status,
      reviewNotes
    } = req.body;

    // TODO: Get from authentication
    const userId = 'test-user-id';

    const suggestion = await aiSuggestionService.updateSuggestion(req.params.id, userId, {
      status,
      reviewedBy: userId,
      reviewNotes
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Error updating AI suggestion:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update AI suggestion' 
    });
  }
});

// Delete AI suggestion
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Get from authentication
    const userId = 'test-user-id';

    await aiSuggestionService.deleteSuggestion(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting AI suggestion:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete AI suggestion' 
    });
  }
});

// Generate suggestions for a document
router.post('/generate/document/:documentId', async (req, res) => {
  try {
    const suggestions = await aiSuggestionService.generateDocumentSuggestions(req.params.documentId);
    res.json({
      success: true,
      suggestions,
      message: `Generated ${suggestions.length} suggestions for document`
    });
  } catch (error) {
    console.error('Error generating document suggestions:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate document suggestions' 
    });
  }
});

// Generate general compliance suggestions
router.post('/generate/compliance', async (req, res) => {
  try {
    const suggestions = await aiSuggestionService.generateComplianceSuggestions();
    res.json({
      success: true,
      suggestions,
      message: `Generated ${suggestions.length} compliance suggestions`
    });
  } catch (error) {
    console.error('Error generating compliance suggestions:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate compliance suggestions' 
    });
  }
});

export default router;