import { Router } from 'express';
import { ResponsibilityMatrixService } from '../services/responsibility-matrix.service';
import { StandardType, AgentType } from '@prisma/client';

const router = Router();
const responsibilityMatrixService = new ResponsibilityMatrixService();

// Get responsibility matrix with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      role,
      clauseId,
      clauseNumber,
      isoStandard,
      assigneeType,
      agentType,
      entityType,
      artefactStatus,
      status
    } = req.query;

    const filters: any = {};
    
    if (role) filters.role = role as string;
    if (clauseId) filters.clauseId = clauseId as string;
    if (clauseNumber) filters.clauseNumber = clauseNumber as string;
    if (isoStandard && Object.values(StandardType).includes(isoStandard as StandardType)) {
      filters.isoStandard = isoStandard as StandardType;
    }
    if (assigneeType && ['USER', 'AI_AGENT'].includes(assigneeType as string)) {
      filters.assigneeType = assigneeType as 'USER' | 'AI_AGENT';
    }
    if (agentType && Object.values(AgentType).includes(agentType as AgentType)) {
      filters.agentType = agentType as AgentType;
    }
    if (entityType && ['CLAUSE', 'ARTEFACT'].includes(entityType as string)) {
      filters.entityType = entityType as 'CLAUSE' | 'ARTEFACT';
    }
    if (artefactStatus) filters.artefactStatus = artefactStatus as string;
    if (status) filters.status = status as string;

    const matrix = await responsibilityMatrixService.getResponsibilityMatrix(filters);
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching responsibility matrix:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch responsibility matrix' 
    });
  }
});

// Get responsibility matrix statistics
router.get('/stats', async (req, res) => {
  try {
    const {
      role,
      isoStandard,
      assigneeType,
      entityType
    } = req.query;

    const filters: any = {};
    
    if (role) filters.role = role as string;
    if (isoStandard && Object.values(StandardType).includes(isoStandard as StandardType)) {
      filters.isoStandard = isoStandard as StandardType;
    }
    if (assigneeType && ['USER', 'AI_AGENT'].includes(assigneeType as string)) {
      filters.assigneeType = assigneeType as 'USER' | 'AI_AGENT';
    }
    if (entityType && ['CLAUSE', 'ARTEFACT'].includes(entityType as string)) {
      filters.entityType = entityType as 'CLAUSE' | 'ARTEFACT';
    }

    const stats = await responsibilityMatrixService.getResponsibilityMatrixStats(filters);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching responsibility matrix stats:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch responsibility matrix statistics' 
    });
  }
});

// Get available assignees (users and AI agents)
router.get('/assignees', async (req, res) => {
  try {
    const assignees = await responsibilityMatrixService.getAvailableAssignees();
    res.json(assignees);
  } catch (error) {
    console.error('Error fetching available assignees:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch available assignees' 
    });
  }
});

// Get unassigned items
router.get('/unassigned', async (req, res) => {
  try {
    const unassigned = await responsibilityMatrixService.getUnassignedItems();
    res.json(unassigned);
  } catch (error) {
    console.error('Error fetching unassigned items:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch unassigned items' 
    });
  }
});

// Update assignment (reassign clause or artefact)
router.put('/assign', async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      assigneeId,
      assigneeType
    } = req.body;

    // TODO: Get from authentication
    const updatedById = 'test-user-id';

    if (!entityType || !entityId || !assigneeType) {
      return res.status(400).json({
        error: 'Missing required fields: entityType, entityId, assigneeType'
      });
    }

    if (!['CLAUSE', 'ARTEFACT'].includes(entityType)) {
      return res.status(400).json({
        error: 'Invalid entityType. Must be CLAUSE or ARTEFACT'
      });
    }

    if (!['USER', 'AI_AGENT'].includes(assigneeType)) {
      return res.status(400).json({
        error: 'Invalid assigneeType. Must be USER or AI_AGENT'
      });
    }

    // For artefacts, assigneeId is required and must be a user
    if (entityType === 'ARTEFACT') {
      if (!assigneeId) {
        return res.status(400).json({
          error: 'Artefacts must be assigned to a user (assigneeId required)'
        });
      }
      if (assigneeType !== 'USER') {
        return res.status(400).json({
          error: 'Artefacts can only be assigned to users, not AI agents'
        });
      }
    }

    const assignment = await responsibilityMatrixService.updateAssignment({
      entityType,
      entityId,
      assigneeId,
      assigneeType
    }, updatedById);

    res.json({
      success: true,
      message: `${entityType} successfully reassigned`,
      assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update assignment' 
    });
  }
});

// Bulk assignment update
router.put('/assign/bulk', async (req, res) => {
  try {
    const { assignments } = req.body;

    // TODO: Get from authentication
    const updatedById = 'test-user-id';

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        error: 'assignments must be a non-empty array'
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
      try {
        const result = await responsibilityMatrixService.updateAssignment(assignment, updatedById);
        results.push({
          success: true,
          assignment: result
        });
        successCount++;
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          assignment
        });
        errorCount++;
      }
    }

    res.json({
      success: errorCount === 0,
      message: `Bulk assignment completed: ${successCount} successful, ${errorCount} failed`,
      totalProcessed: assignments.length,
      successCount,
      errorCount,
      results
    });
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process bulk assignment' 
    });
  }
});

// Get assignment history for specific entity
router.get('/history/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['clause', 'artefact'].includes(entityType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid entityType. Must be clause or artefact'
      });
    }

    // Get audit logs for this entity  
    const auditLogs = await (responsibilityMatrixService as any).prisma.auditLog.findMany({
      where: {
        entityType: entityType === 'clause' ? 'clause_assignment' : 'artefact',
        entityId: entityType === 'clause' ? undefined : entityId,
        OR: entityType === 'clause' ? [
          { details: { path: ['clauseId'], equals: entityId } }
        ] : undefined
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent history
    });

    res.json({
      entityType: entityType.toUpperCase(),
      entityId,
      history: auditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        timestamp: log.createdAt,
        userId: log.userId,
        details: log.details
      }))
    });
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch assignment history' 
    });
  }
});

export default router;