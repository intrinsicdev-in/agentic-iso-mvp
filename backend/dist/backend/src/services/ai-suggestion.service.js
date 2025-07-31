"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISuggestionService = void 0;
const client_1 = require("@prisma/client");
class AISuggestionService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async createSuggestion(data) {
        const suggestion = await this.prisma.aISuggestion.create({
            data: {
                agentId: data.agentId,
                type: data.type,
                title: data.title,
                content: data.content,
                rationale: data.rationale,
                metadata: data.metadata || {},
                status: 'PENDING'
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true
                    }
                }
            }
        });
        // Create audit log
        await this.createAuditLog('ai_suggestion.created', 'ai_suggestion', suggestion.id, data.agentId, {
            type: data.type,
            title: data.title
        });
        return suggestion;
    }
    async getAllSuggestions(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.agentId) {
            where.agentId = filters.agentId;
        }
        if (filters?.agentType) {
            where.agent = {
                type: filters.agentType
            };
        }
        return this.prisma.aISuggestion.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async getSuggestionById(id) {
        return this.prisma.aISuggestion.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true
                    }
                }
            }
        });
    }
    async updateSuggestion(id, userId, data) {
        const updateData = {
            updatedAt: new Date()
        };
        if (data.status) {
            updateData.status = data.status;
            updateData.reviewedAt = new Date();
        }
        if (data.reviewedBy) {
            updateData.reviewedBy = data.reviewedBy;
        }
        if (data.reviewNotes) {
            updateData.reviewNotes = data.reviewNotes;
        }
        const suggestion = await this.prisma.aISuggestion.update({
            where: { id },
            data: updateData,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true
                    }
                }
            }
        });
        // Create audit log
        await this.createAuditLog('ai_suggestion.updated', 'ai_suggestion', id, userId, {
            changes: data
        });
        return suggestion;
    }
    async deleteSuggestion(id, userId) {
        await this.prisma.aISuggestion.delete({
            where: { id }
        });
        // Create audit log
        await this.createAuditLog('ai_suggestion.deleted', 'ai_suggestion', id, userId, {});
    }
    async getSuggestionStats() {
        const suggestions = await this.getAllSuggestions();
        const total = suggestions.length;
        const byStatus = suggestions.reduce((acc, suggestion) => {
            acc[suggestion.status] = (acc[suggestion.status] || 0) + 1;
            return acc;
        }, {});
        const byType = suggestions.reduce((acc, suggestion) => {
            acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
            return acc;
        }, {});
        const byAgent = suggestions.reduce((acc, suggestion) => {
            acc[suggestion.agent.name] = (acc[suggestion.agent.name] || 0) + 1;
            return acc;
        }, {});
        const confidenceSum = suggestions.reduce((acc, suggestion) => {
            const metadata = suggestion.metadata;
            const confidence = metadata?.confidence || 0;
            return acc + confidence;
        }, 0);
        const confidenceAverage = total > 0 ? confidenceSum / total : 0;
        const recentActivity = suggestions.slice(0, 10);
        return {
            total,
            byStatus,
            byType,
            byAgent,
            confidenceAverage,
            recentActivity
        };
    }
    async getAllAgents() {
        return this.prisma.aIAgent.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    }
    async createAgent(data) {
        return this.prisma.aIAgent.create({
            data: {
                name: data.name,
                type: data.type,
                description: data.description,
                config: data.config || {},
                isActive: true
            }
        });
    }
    async updateAgent(id, data) {
        return this.prisma.aIAgent.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }
    // Generate AI suggestions for various scenarios
    async generateDocumentSuggestions(documentId) {
        const agent = await this.prisma.aIAgent.findFirst({
            where: { type: 'DOCUMENT_REVIEWER' }
        });
        if (!agent) {
            throw new Error('Document reviewer agent not found');
        }
        const suggestions = [
            {
                type: 'document_improvement',
                title: 'Update document version control',
                content: 'Consider implementing automated version control for better document management.',
                rationale: 'Automated version control reduces human error and ensures compliance with ISO requirements.',
                metadata: { documentId, confidence: 0.85 }
            },
            {
                type: 'compliance_gap',
                title: 'Review document accessibility',
                content: 'Ensure document meets accessibility standards and is available to relevant personnel.',
                rationale: 'ISO standards require controlled documents to be available at points of use.',
                metadata: { documentId, confidence: 0.75 }
            }
        ];
        const created = [];
        for (const suggestion of suggestions) {
            const created_suggestion = await this.createSuggestion({
                agentId: agent.id,
                ...suggestion
            });
            created.push(created_suggestion);
        }
        return created;
    }
    async generateComplianceSuggestions() {
        const agent = await this.prisma.aIAgent.findFirst({
            where: { type: 'COMPLIANCE_CHECKER' }
        });
        if (!agent) {
            throw new Error('Compliance checker agent not found');
        }
        const suggestions = [
            {
                type: 'compliance_gap',
                title: 'Schedule internal audit',
                content: 'Internal audit is due for Q4 2024. Schedule audit activities and prepare documentation.',
                rationale: 'ISO 9001:2015 Clause 9.2 requires internal audits at planned intervals.',
                metadata: { dueDate: '2024-12-31', confidence: 0.95 }
            },
            {
                type: 'training_need',
                title: 'Update staff training records',
                content: 'Some staff training records are outdated. Schedule refresher training sessions.',
                rationale: 'Current competency records are required for ISO compliance.',
                metadata: { confidence: 0.80 }
            }
        ];
        const created = [];
        for (const suggestion of suggestions) {
            const created_suggestion = await this.createSuggestion({
                agentId: agent.id,
                ...suggestion
            });
            created.push(created_suggestion);
        }
        return created;
    }
    async createAuditLog(action, entityType, entityId, userId, details) {
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
exports.AISuggestionService = AISuggestionService;
//# sourceMappingURL=ai-suggestion.service.js.map