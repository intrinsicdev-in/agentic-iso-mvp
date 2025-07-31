import { PrismaClient } from '@prisma/client';

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
  currentMaturity: number; // 0-100
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

export class OnboardingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveOnboardingData(data: OnboardingData, userId: string): Promise<any> {
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

  private async generateAssessment(data: OnboardingData): Promise<OnboardingAssessment> {
    // Calculate maturity score based on current processes
    const processes = data.currentProcesses;
    const processScore = (
      (processes.hasQualityManual ? 20 : 0) +
      (processes.hasDocumentControl ? 15 : 0) +
      (processes.hasRiskManagement ? 15 : 0) +
      (processes.hasIncidentTracking ? 15 : 0) +
      (processes.hasTrainingProgram ? 20 : 0) +
      (processes.hasAuditProgram ? 15 : 0)
    );

    // Adjust for certifications
    const certificationBonus = data.currentCertifications.length * 5;
    const currentMaturity = Math.min(100, processScore + certificationBonus);

    // Determine priority based on target standards and timeline
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (data.targetStandards.includes('ISO_27001_2022') || data.timeline === 'URGENT') {
      priority = 'HIGH';
    } else if (data.timeline === 'FLEXIBLE') {
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

  private generateActions(data: OnboardingData, maturity: number) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

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

  private calculateTimeline(data: OnboardingData, maturity: number): string {
    const baseMonths = data.targetStandards.includes('ISO_27001_2022') ? 12 : 9;
    const maturityAdjustment = Math.floor((100 - maturity) / 20);
    const totalMonths = baseMonths + maturityAdjustment;

    if (totalMonths <= 6) return '3-6 months';
    if (totalMonths <= 12) return '6-12 months';
    if (totalMonths <= 18) return '12-18 months';
    return '18+ months';
  }

  private generateRecommendations(data: OnboardingData, assessment: OnboardingAssessment) {
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

  async getOnboardingHistory(userId: string): Promise<any[]> {
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
      companyName: (record.details as any)?.onboardingData?.companyName,
      assessment: (record.details as any)?.assessment,
      status: (record.details as any)?.assessment?.status || 'COMPLETED'
    }));
  }

  async getAssessmentById(assessmentId: string): Promise<any> {
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
      onboardingData: (record.details as any)?.onboardingData,
      assessment: (record.details as any)?.assessment,
      recommendations: (record.details as any)?.recommendations,
      submittedAt: record.createdAt
    };
  }
}