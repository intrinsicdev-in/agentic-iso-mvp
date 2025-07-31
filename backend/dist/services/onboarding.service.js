"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const client_1 = require("@prisma/client");
class OnboardingService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async saveOnboardingData(data, userId) {
        // Store onboarding data and generate assessment
        const assessment = await this.generateAssessment(data);
        // For now, we'll store in a simple JSON format
        // In production, you might want proper database tables
        const onboardingRecord = await this.prisma.auditLog.create({
            data: {
                action: 'onboarding.submitted',
                entityType: 'onboarding',
                entityId: `onboarding-${Date.now()}`,
                userId,
                details: JSON.parse(JSON.stringify({
                    onboardingData: data,
                    assessment,
                    submittedAt: new Date()
                }))
            }
        });
        return {
            id: onboardingRecord.id,
            assessment,
            recommendations: this.generateRecommendations(data, assessment)
        };
    }
    async generateAssessment(data) {
        // Calculate maturity score based on current processes
        const processes = data.currentProcesses;
        const processScore = ((processes.hasQualityManual ? 20 : 0) +
            (processes.hasDocumentControl ? 15 : 0) +
            (processes.hasRiskManagement ? 15 : 0) +
            (processes.hasIncidentTracking ? 15 : 0) +
            (processes.hasTrainingProgram ? 20 : 0) +
            (processes.hasAuditProgram ? 15 : 0));
        // Adjust for certifications
        const certificationBonus = data.currentCertifications.length * 5;
        const currentMaturity = Math.min(100, processScore + certificationBonus);
        // Determine priority based on target standards and timeline
        let priority = 'MEDIUM';
        if (data.targetStandards.includes('ISO_27001_2022') || data.timeline === 'URGENT') {
            priority = 'HIGH';
        }
        else if (data.timeline === 'FLEXIBLE') {
            priority = 'LOW';
        }
        // Generate recommended actions
        const recommendedActions = this.generateActions(data, currentMaturity);
        return {
            id: `assessment-${Date.now()}`,
            companyName: data.companyName,
            currentMaturity,
            recommendedActions,
            estimatedTimeline: this.calculateTimeline(data, currentMaturity),
            priority,
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    generateActions(data, maturity) {
        const immediate = [];
        const shortTerm = [];
        const longTerm = [];
        // Immediate actions (next 30 days)
        if (!data.currentProcesses.hasQualityManual) {
            immediate.push('Develop Quality Manual framework');
        }
        if (!data.currentProcesses.hasDocumentControl) {
            immediate.push('Establish document control procedures');
        }
        immediate.push('Conduct gap analysis for target standards');
        immediate.push('Set up document management system');
        // Short-term actions (1-6 months)
        if (!data.currentProcesses.hasRiskManagement) {
            shortTerm.push('Implement risk management processes');
        }
        if (!data.currentProcesses.hasIncidentTracking) {
            shortTerm.push('Set up incident tracking system');
        }
        shortTerm.push('Train key personnel on ISO requirements');
        shortTerm.push('Begin internal audit preparation');
        // Long-term actions (6+ months)
        if (!data.currentProcesses.hasTrainingProgram) {
            longTerm.push('Develop comprehensive training program');
        }
        longTerm.push('Prepare for external certification audit');
        longTerm.push('Establish continuous improvement processes');
        longTerm.push('Complete management review cycles');
        return { immediate, shortTerm, longTerm };
    }
    calculateTimeline(data, maturity) {
        const baseMonths = data.targetStandards.includes('ISO_27001_2022') ? 12 : 9;
        const maturityAdjustment = Math.floor((100 - maturity) / 20);
        const totalMonths = baseMonths + maturityAdjustment;
        if (totalMonths <= 6)
            return '3-6 months';
        if (totalMonths <= 12)
            return '6-12 months';
        if (totalMonths <= 18)
            return '12-18 months';
        return '18+ months';
    }
    generateRecommendations(data, assessment) {
        const recommendations = [];
        // Priority recommendations based on assessment
        if (assessment.currentMaturity < 30) {
            recommendations.push({
                type: 'CRITICAL',
                title: 'Foundation Building Required',
                description: 'Focus on establishing basic quality management processes before pursuing certification.',
                priority: 'HIGH'
            });
        }
        if (data.targetStandards.includes('ISO_27001_2022')) {
            recommendations.push({
                type: 'SECURITY',
                title: 'Information Security Framework',
                description: 'Implement comprehensive information security management system.',
                priority: 'HIGH'
            });
        }
        if (data.employeeCount > 100 && !data.currentProcesses.hasTrainingProgram) {
            recommendations.push({
                type: 'TRAINING',
                title: 'Scale Training Program',
                description: 'Large organizations require structured training and competency management.',
                priority: 'MEDIUM'
            });
        }
        recommendations.push({
            type: 'PLANNING',
            title: 'Implementation Roadmap',
            description: `Based on your timeline (${data.timeline}), prioritize ${assessment.recommendedActions.immediate.length} immediate actions.`,
            priority: assessment.priority
        });
        return recommendations;
    }
    async getOnboardingHistory(userId) {
        const records = await this.prisma.auditLog.findMany({
            where: {
                userId,
                action: 'onboarding.submitted'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return records.map(record => ({
            id: record.id,
            submittedAt: record.createdAt,
            companyName: record.details?.onboardingData?.companyName,
            assessment: record.details?.assessment,
            status: record.details?.assessment?.status || 'COMPLETED'
        }));
    }
    async getAssessmentById(assessmentId) {
        const record = await this.prisma.auditLog.findFirst({
            where: {
                id: assessmentId,
                action: 'onboarding.submitted'
            }
        });
        if (!record) {
            throw new Error('Assessment not found');
        }
        return {
            id: record.id,
            onboardingData: record.details?.onboardingData,
            assessment: record.details?.assessment,
            recommendations: record.details?.recommendations,
            submittedAt: record.createdAt
        };
    }
}
exports.OnboardingService = OnboardingService;
//# sourceMappingURL=onboarding.service.js.map