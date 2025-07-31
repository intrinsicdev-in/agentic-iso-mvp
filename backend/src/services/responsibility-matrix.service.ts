import { PrismaClient, StandardType, AgentType } from '@prisma/client';

export interface ResponsibilityAssignment {
  id: string;
  type: 'CLAUSE' | 'ARTEFACT';
  entityId: string;
  entityName: string;
  entityDetails: {
    clauseNumber?: string;
    standard?: StandardType;
    artefactStatus?: string;
    status?: string;
    fileUrl?: string | null;
  };
  assigneeId: string | null;
  assigneeName: string;
  assigneeType: 'USER' | 'AI_AGENT';
  assigneeDetails: {
    email?: string;
    role?: string;
    agentType?: AgentType;
    isActive?: boolean;
  };
  assignedAt: Date;
  updatedAt: Date;
}

export interface ResponsibilityMatrixFilters {
  role?: string;
  clauseId?: string;
  clauseNumber?: string;
  isoStandard?: StandardType;
  assigneeType?: 'USER' | 'AI_AGENT';
  agentType?: AgentType;
  entityType?: 'CLAUSE' | 'ARTEFACT';
  artefactStatus?: string;
  status?: string;
}

export interface ResponsibilityMatrixStats {
  totalAssignments: number;
  clauseAssignments: number;
  artefactAssignments: number;
  userAssignments: number;
  aiAssignments: number;
  byStandard: Record<string, number>;
  byRole: Record<string, number>;
  byAgentType: Record<string, number>;
  unassignedClauses: number;
  unassignedArtefacts: number;
}

export interface AssignmentUpdate {
  entityType: 'CLAUSE' | 'ARTEFACT';
  entityId: string;
  assigneeId: string | null;
  assigneeType: 'USER' | 'AI_AGENT';
}

export class ResponsibilityMatrixService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getResponsibilityMatrix(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityAssignment[]> {
    const assignments: ResponsibilityAssignment[] = [];

    // Get clause assignments
    if (!filters?.entityType || filters.entityType === 'CLAUSE') {
      const clauseAssignments = await this.getClauseAssignments(filters);
      assignments.push(...clauseAssignments);
    }

    // Get artefact assignments
    if (!filters?.entityType || filters.entityType === 'ARTEFACT') {
      const artefactAssignments = await this.getArtefactAssignments(filters);
      assignments.push(...artefactAssignments);
    }

    return assignments.sort((a, b) => {
      // Sort by type first (CLAUSE, then ARTEFACT), then by name
      if (a.type !== b.type) {
        return a.type === 'CLAUSE' ? -1 : 1;
      }
      return a.entityName.localeCompare(b.entityName);
    });
  }

  private async getClauseAssignments(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityAssignment[]> {
    const where: any = {};

    if (filters?.clauseId) {
      where.clauseId = filters.clauseId;
    }

    if (filters?.isoStandard) {
      where.clause = {
        standard: filters.isoStandard
      };
    }

    if (filters?.clauseNumber) {
      where.clause = {
        ...where.clause,
        clauseNumber: filters.clauseNumber
      };
    }

    if (filters?.assigneeType === 'USER') {
      where.userId = { not: null };
      where.agentId = null;
    } else if (filters?.assigneeType === 'AI_AGENT') {
      where.agentId = { not: null };
      where.userId = null;
    }

    if (filters?.agentType) {
      where.agent = {
        type: filters.agentType
      };
    }

    const clauseAssignments = await this.prisma.clauseAssignment.findMany({
      where,
      include: {
        clause: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        }
      }
    });

    return clauseAssignments.map(assignment => ({
      id: assignment.id,
      type: 'CLAUSE' as const,
      entityId: assignment.clauseId,
      entityName: `${assignment.clause.clauseNumber} - ${assignment.clause.title}`,
      entityDetails: {
        clauseNumber: assignment.clause.clauseNumber,
        standard: assignment.clause.standard,
        status: 'assigned'
      },
      assigneeId: assignment.userId || assignment.agentId,
      assigneeName: assignment.user?.name || assignment.user?.email || assignment.agent?.name || 'Unassigned',
      assigneeType: assignment.userId ? 'USER' : 'AI_AGENT',
      assigneeDetails: {
        email: assignment.user?.email,
        role: assignment.user?.role,
        agentType: assignment.agent?.type,
        isActive: assignment.agent?.isActive
      },
      assignedAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    }));
  }

  private async getArtefactAssignments(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityAssignment[]> {
    const where: any = {};

    if (filters?.artefactStatus) {
      where.status = filters.artefactStatus;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.role) {
      where.owner = {
        role: filters.role
      };
    }

    // Artefacts are only assigned to users, not AI agents
    if (filters?.assigneeType === 'AI_AGENT') {
      return []; // No AI agent assignments for artefacts
    }

    const artefacts = await this.prisma.artefact.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    return artefacts.map(artefact => ({
      id: `artefact-${artefact.id}`,
      type: 'ARTEFACT' as const,
      entityId: artefact.id,
      entityName: artefact.title,
      entityDetails: {
        artefactStatus: artefact.status,
        fileUrl: artefact.fileUrl || undefined
      },
      assigneeId: artefact.ownerId,
      assigneeName: artefact.owner.name || artefact.owner.email,
      assigneeType: 'USER' as const,
      assigneeDetails: {
        email: artefact.owner.email,
        role: artefact.owner.role
      },
      assignedAt: artefact.createdAt,
      updatedAt: artefact.updatedAt
    }));
  }

  async updateAssignment(update: AssignmentUpdate, updatedById: string): Promise<ResponsibilityAssignment> {
    if (update.entityType === 'CLAUSE') {
      return this.updateClauseAssignment(update, updatedById);
    } else {
      return this.updateArtefactAssignment(update, updatedById);
    }
  }

  private async updateClauseAssignment(update: AssignmentUpdate, updatedById: string): Promise<ResponsibilityAssignment> {
    const data: any = {
      updatedAt: new Date()
    };

    if (update.assigneeType === 'USER') {
      data.userId = update.assigneeId;
      data.agentId = null;
    } else {
      data.agentId = update.assigneeId;
      data.userId = null;
    }

    // Check if assignment exists
    const existingAssignment = await this.prisma.clauseAssignment.findUnique({
      where: { clauseId: update.entityId }
    });

    let assignment;
    if (existingAssignment) {
      // Update existing assignment
      assignment = await this.prisma.clauseAssignment.update({
        where: { clauseId: update.entityId },
        data,
        include: {
          clause: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              isActive: true
            }
          }
        }
      });
    } else {
      // Create new assignment
      assignment = await this.prisma.clauseAssignment.create({
        data: {
          clauseId: update.entityId,
          ...data
        },
        include: {
          clause: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              isActive: true
            }
          }
        }
      });
    }

    // Create audit log
    await this.createAuditLog('clause_assignment.updated', 'clause_assignment', assignment.id, updatedById, {
      clauseId: update.entityId,
      assigneeType: update.assigneeType,
      assigneeId: update.assigneeId
    });

    return {
      id: assignment.id,
      type: 'CLAUSE',
      entityId: assignment.clauseId,
      entityName: `${assignment.clause.clauseNumber} - ${assignment.clause.title}`,
      entityDetails: {
        clauseNumber: assignment.clause.clauseNumber,
        standard: assignment.clause.standard,
        status: 'assigned'
      },
      assigneeId: assignment.userId || assignment.agentId,
      assigneeName: assignment.user?.name || assignment.user?.email || assignment.agent?.name || 'Unassigned',
      assigneeType: assignment.userId ? 'USER' : 'AI_AGENT',
      assigneeDetails: {
        email: assignment.user?.email,
        role: assignment.user?.role,
        agentType: assignment.agent?.type,
        isActive: assignment.agent?.isActive
      },
      assignedAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
    };
  }

  private async updateArtefactAssignment(update: AssignmentUpdate, updatedById: string): Promise<ResponsibilityAssignment> {
    if (update.assigneeType !== 'USER') {
      throw new Error('Artefacts can only be assigned to users, not AI agents');
    }

    if (!update.assigneeId) {
      throw new Error('Artefacts must have an owner (assigneeId cannot be null)');
    }

    const artefact = await this.prisma.artefact.update({
      where: { id: update.entityId },
      data: {
        ownerId: update.assigneeId,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Create audit log
    await this.createAuditLog('artefact_assignment.updated', 'artefact', artefact.id, updatedById, {
      newOwnerId: update.assigneeId
    });

    return {
      id: `artefact-${artefact.id}`,
      type: 'ARTEFACT',
      entityId: artefact.id,
      entityName: artefact.title,
      entityDetails: {
        artefactStatus: artefact.status,
        fileUrl: artefact.fileUrl || undefined
      },
      assigneeId: artefact.ownerId,
      assigneeName: artefact.owner.name || artefact.owner.email,
      assigneeType: 'USER',
      assigneeDetails: {
        email: artefact.owner.email,
        role: artefact.owner.role
      },
      assignedAt: artefact.createdAt,
      updatedAt: artefact.updatedAt
    };
  }

  async getResponsibilityMatrixStats(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityMatrixStats> {
    const assignments = await this.getResponsibilityMatrix(filters);
    
    const totalAssignments = assignments.length;
    const clauseAssignments = assignments.filter(a => a.type === 'CLAUSE').length;
    const artefactAssignments = assignments.filter(a => a.type === 'ARTEFACT').length;
    const userAssignments = assignments.filter(a => a.assigneeType === 'USER').length;
    const aiAssignments = assignments.filter(a => a.assigneeType === 'AI_AGENT').length;

    const byStandard = assignments.reduce((acc, assignment) => {
      if (assignment.entityDetails.standard) {
        const standard = assignment.entityDetails.standard;
        acc[standard] = (acc[standard] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const byRole = assignments.reduce((acc, assignment) => {
      const role = assignment.assigneeDetails.role || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAgentType = assignments.reduce((acc, assignment) => {
      if (assignment.assigneeDetails.agentType) {
        const agentType = assignment.assigneeDetails.agentType;
        acc[agentType] = (acc[agentType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Count unassigned items
    const totalClauses = await this.prisma.iSOClause.count();
    const totalArtefacts = await this.prisma.artefact.count();
    const assignedClauseIds = new Set(assignments.filter(a => a.type === 'CLAUSE').map(a => a.entityId));
    const assignedArtefactIds = new Set(assignments.filter(a => a.type === 'ARTEFACT').map(a => a.entityId));
    
    const unassignedClauses = totalClauses - assignedClauseIds.size;
    const unassignedArtefacts = totalArtefacts - assignedArtefactIds.size;

    return {
      totalAssignments,
      clauseAssignments,
      artefactAssignments,
      userAssignments,
      aiAssignments,
      byStandard,
      byRole,
      byAgentType,
      unassignedClauses,
      unassignedArtefacts
    };
  }

  async getAvailableAssignees(): Promise<{
    users: Array<{ id: string; name: string; email: string; role: string; }>;
    agents: Array<{ id: string; name: string; type: AgentType; isActive: boolean; }>;
  }> {
    const [users, agents] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      this.prisma.aIAgent.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return { users, agents };
  }

  async getUnassignedItems(): Promise<{
    clauses: Array<{ id: string; clauseNumber: string; title: string; standard: StandardType; }>;
    artefacts: Array<{ id: string; title: string; status: string; }>;
  }> {
    // Get assigned clause IDs
    const assignedClauseIds = await this.prisma.clauseAssignment.findMany({
      select: { clauseId: true }
    }).then(assignments => assignments.map(a => a.clauseId));

    // Get unassigned clauses
    const clauses = await this.prisma.iSOClause.findMany({
      where: {
        id: {
          notIn: assignedClauseIds
        }
      },
      select: {
        id: true,
        clauseNumber: true,
        title: true,
        standard: true
      },
      orderBy: [
        { standard: 'asc' },
        { clauseNumber: 'asc' }
      ]
    });

    // All artefacts have owners, so no truly unassigned ones
    // But we can return artefacts that might need reassignment
    const artefacts = await this.prisma.artefact.findMany({
      where: {
        status: 'DRAFT' // Draft artefacts might need assignment review
      },
      select: {
        id: true,
        title: true,
        status: true
      },
      take: 20 // Limit for performance
    });

    return { clauses, artefacts };
  }

  private async createAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    details?: any
  ): Promise<void> {
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