import { AISuggestion, AIAgent, AgentType } from '@prisma/client';
export interface CreateAISuggestionDto {
    agentId: string;
    type: string;
    title: string;
    content: string;
    rationale?: string;
    metadata?: any;
}
export interface UpdateAISuggestionDto {
    status?: string;
    reviewedBy?: string;
    reviewNotes?: string;
}
export interface AISuggestionWithAgent extends AISuggestion {
    agent: {
        id: string;
        name: string;
        type: AgentType;
        description: string;
    };
}
export declare class AISuggestionService {
    private prisma;
    constructor();
    createSuggestion(data: CreateAISuggestionDto): Promise<AISuggestionWithAgent>;
    getAllSuggestions(filters?: {
        status?: string;
        type?: string;
        agentType?: AgentType;
        agentId?: string;
    }): Promise<AISuggestionWithAgent[]>;
    getSuggestionById(id: string): Promise<AISuggestionWithAgent | null>;
    updateSuggestion(id: string, userId: string, data: UpdateAISuggestionDto): Promise<AISuggestionWithAgent>;
    deleteSuggestion(id: string, userId: string): Promise<void>;
    getSuggestionStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byAgent: Record<string, number>;
        confidenceAverage: number;
        recentActivity: AISuggestionWithAgent[];
    }>;
    getAllAgents(): Promise<AIAgent[]>;
    createAgent(data: {
        name: string;
        type: AgentType;
        description: string;
        config?: any;
    }): Promise<AIAgent>;
    updateAgent(id: string, data: {
        name?: string;
        description?: string;
        config?: any;
        isActive?: boolean;
    }): Promise<AIAgent>;
    generateDocumentSuggestions(documentId: string): Promise<AISuggestionWithAgent[]>;
    generateComplianceSuggestions(): Promise<AISuggestionWithAgent[]>;
    private createAuditLog;
}
