export interface OnboardingData {
    companyName: string;
    industry: string;
    employeeCount: number;
    currentCertifications: string[];
    targetStandards: string[];
    currentProcesses: {
        hasQualityManual: boolean;
        hasDocumentControl: boolean;
        hasRiskManagement: boolean;
        hasIncidentTracking: boolean;
        hasTrainingProgram: boolean;
        hasAuditProgram: boolean;
    };
    timeline: string;
    budget: string;
    primaryContact: {
        name: string;
        email: string;
        role: string;
        phone?: string;
    };
    additionalNotes?: string;
}
export interface OnboardingAssessment {
    id: string;
    companyName: string;
    currentMaturity: number;
    recommendedActions: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    estimatedTimeline: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
    createdAt: Date;
    updatedAt: Date;
}
export declare class OnboardingService {
    private prisma;
    constructor();
    saveOnboardingData(data: OnboardingData, userId: string): Promise<any>;
    private generateAssessment;
    private generateActions;
    private calculateTimeline;
    private generateRecommendations;
    getOnboardingHistory(userId: string): Promise<any[]>;
    getAssessmentById(assessmentId: string): Promise<any>;
}
