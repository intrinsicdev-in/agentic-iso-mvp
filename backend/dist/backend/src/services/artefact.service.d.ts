import { Artefact, ClauseMapping, StandardType } from '@prisma/client';
export interface CreateArtefactDto {
    title: string;
    description?: string;
    ownerId: string;
    organizationId?: string;
    content?: string;
    file?: Express.Multer.File;
}
export interface ImportArtefactDto {
    file: Express.Multer.File;
    ownerId: string;
    organizationId?: string;
    standard: StandardType;
    autoClassify: boolean;
}
export declare class ArtefactService {
    private prisma;
    private s3;
    private documentParser;
    constructor();
    createArtefact(data: CreateArtefactDto): Promise<Artefact>;
    importAndClassifyArtefact(data: ImportArtefactDto): Promise<{
        artefact: Artefact;
        mappings: ClauseMapping[];
    }>;
    updateArtefact(id: string, userId: string, data: {
        title?: string;
        description?: string;
        content?: string;
        status?: string;
    }): Promise<Artefact>;
    getArtefactWithMappings(id: string): Promise<any>;
    private uploadToS3;
    private generateChangeDescription;
    private createAuditLog;
    private getDefaultAgentId;
    getAllArtefacts(): Promise<any[]>;
    private createAISuggestion;
    createReview(artefactId: string, reviewerId: string, status: string, comments?: string): Promise<any>;
    getArtefactReviews(artefactId: string): Promise<any[]>;
    createComment(artefactId: string, authorId: string, content: string, parentId?: string): Promise<any>;
    getArtefactComments(artefactId: string): Promise<any[]>;
    createTask(artefactId: string, createdById: string, title: string, description?: string, dueDate?: string, priority?: number, assigneeId?: string): Promise<any>;
    getArtefactTasks(artefactId: string): Promise<any[]>;
    updateTask(taskId: string, userId: string, updates: {
        status?: string;
        completedAt?: string;
    }): Promise<any>;
    deleteArtefact(artefactId: string, userId: string): Promise<any>;
}
