import { Router } from 'express';
import Agent from '../models/Agent';

const router = Router();

// Get all AI agents
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findByPk(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Get agent suggestions
router.get('/:id/suggestions', async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return mock suggestions
    // In a real app, this would query a suggestions table
    const suggestions = [
      {
        id: 1,
        agentId: parseInt(id),
        type: 'policy_update',
        title: 'Update Quality Policy for ISO 9001:2015 Clause 5.2',
        description: 'The current quality policy should be updated to better align with customer focus requirements.',
        status: 'pending_review',
        priority: 'medium',
        createdAt: '2024-01-15T10:00:00Z',
        content: 'Recommend updating section 3.2 to include...'
      },
      {
        id: 2,
        agentId: parseInt(id),
        type: 'risk_assessment',
        title: 'New Risk Identified: Data Breach',
        description: 'Potential risk of data breach due to outdated access controls.',
        status: 'approved',
        priority: 'high',
        createdAt: '2024-01-14T15:30:00Z',
        content: 'Risk assessment reveals vulnerability in...'
      }
    ];
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Approve/reject suggestion
router.post('/suggestions/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' | 'reject'
    
    // TODO: Implement actual approval logic with database
    res.json({ 
      success: true, 
      message: `Suggestion ${action}ed successfully`,
      suggestionId: parseInt(id)
    });
  } catch (error) {
    console.error('Error reviewing suggestion:', error);
    res.status(500).json({ error: 'Failed to review suggestion' });
  }
});

// Get agent configuration
router.get('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findByPk(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ config: agent.config });
  } catch (error) {
    console.error('Error fetching agent configuration:', error);
    res.status(500).json({ error: 'Failed to fetch agent configuration' });
  }
});

// Update agent configuration
router.put('/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    const agent = await Agent.findByPk(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await agent.update({ config });
    
    res.json({ 
      success: true, 
      message: 'Agent configuration updated successfully',
      config: agent.config
    });
  } catch (error) {
    console.error('Error updating agent configuration:', error);
    res.status(500).json({ error: 'Failed to update agent configuration' });
  }
});

// Create new agent
router.post('/', async (req, res) => {
  try {
    const { name, type, description, config } = req.body;
    
    if (!name || !type || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newAgent = await Agent.create({
      name,
      type,
      description,
      config: config || {},
      status: 'active'
    });
    
    res.status(201).json({ agent: newAgent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, status, config } = req.body;
    
    const agent = await Agent.findByPk(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await agent.update({
      ...(name && { name }),
      ...(type && { type }),
      ...(description && { description }),
      ...(status && { status }),
      ...(config && { config })
    });
    
    res.json({ 
      success: true, 
      agent,
      message: 'Agent updated successfully' 
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await Agent.findByPk(id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await agent.destroy();
    
    res.json({ 
      success: true, 
      message: 'Agent deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export const agentRoutes = router; 