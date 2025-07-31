import { StandardType, AgentType } from '@prisma/client';
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
export declare class ResponsibilityMatrixService {
    private prisma;
    constructor();
    getResponsibilityMatrix(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityAssignment[]>;
    private getClauseAssignments;
    private getArtefactAssignments;
    updateAssignment(update: AssignmentUpdate, updatedById: string): Promise<ResponsibilityAssignment>;
    private updateClauseAssignment;
    private updateArtefactAssignment;
    getResponsibilityMatrixStats(filters?: ResponsibilityMatrixFilters): Promise<ResponsibilityMatrixStats>;
    getAvailableAssignees(): Promise<{
        users: Array<{
            id: string;
            name: string;
            email: string;
            role: string;
        }>;
        agents: Array<{
            id: string;
            name: string;
            type: AgentType;
            isActive: boolean;
        }>;
    }>;
    getUnassignedItems(): Promise<{
        clauses: Array<{
            id: string;
            clauseNumber: string;
            title: string;
            standard: StandardType;
        }>;
        artefacts: Array<{
            id: string;
            title: string;
            status: string;
        }>;
    }>;
    private createAuditLog;
}
