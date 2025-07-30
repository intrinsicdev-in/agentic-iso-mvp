import { Op } from 'sequelize';
import User from '../models/User';
import Artefact from '../models/Artefact';
import Agent from '../models/Agent';

export interface ComplianceMetrics {
  totalArtefacts: number;
  approvedArtefacts: number;
  pendingReviews: number;
  overdueDeadlines: number;
  activeRisks: number;
  complianceScore: number;
  lastUpdated: Date;
}

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  suggestionsGenerated: number;
  suggestionsApproved: number;
  approvalRate: number;
  lastActivity: Date;
}

export interface AuditReadiness {
  documentationCompleteness: number;
  riskAssessmentStatus: string;
  trainingCompliance: number;
  managementReviewStatus: string;
  overallReadiness: number;
}

export interface TrendData {
  period: string;
  artefactsCreated: number;
  risksIdentified: number;
  suggestionsGenerated: number;
  complianceScore: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  
  private constructor() {}
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const [
        totalArtefacts,
        approvedArtefacts,
        pendingReviews
      ] = await Promise.all([
        Artefact.count(),
        Artefact.count({ where: { status: 'approved' } }),
        Artefact.count({ where: { status: 'pending_review' } })
      ]);

      // Mock data for demonstration
      const overdueDeadlines = 3;
      const activeRisks = 8;
      const complianceScore = Math.round((approvedArtefacts / totalArtefacts) * 100);

      return {
        totalArtefacts,
        approvedArtefacts,
        pendingReviews,
        overdueDeadlines,
        activeRisks,
        complianceScore,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get compliance metrics:', error);
      throw new Error('Failed to retrieve compliance metrics');
    }
  }

  async getAgentPerformance(): Promise<AgentPerformance[]> {
    try {
      const agents = await Agent.findAll();
      
      return agents.map(agent => {
        // Mock performance data
        const suggestionsGenerated = Math.floor(Math.random() * 20) + 5;
        const suggestionsApproved = Math.floor(Math.random() * suggestionsGenerated);
        const approvalRate = suggestionsGenerated > 0 ? (suggestionsApproved / suggestionsGenerated) * 100 : 0;

        return {
          agentId: agent.id,
          agentName: agent.name,
          suggestionsGenerated,
          suggestionsApproved,
          approvalRate: Math.round(approvalRate),
          lastActivity: agent.lastActivity || new Date()
        };
      });
    } catch (error) {
      console.error('Failed to get agent performance:', error);
      throw new Error('Failed to retrieve agent performance');
    }
  }

  async getAuditReadiness(): Promise<AuditReadiness> {
    try {
      // Mock audit readiness data
      return {
        documentationCompleteness: 85,
        riskAssessmentStatus: 'Current',
        trainingCompliance: 92,
        managementReviewStatus: 'Scheduled',
        overallReadiness: 87
      };
    } catch (error) {
      console.error('Failed to get audit readiness:', error);
      throw new Error('Failed to retrieve audit readiness');
    }
  }

  async getTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendData[]> {
    try {
      // Mock trend data
      const trends: TrendData[] = [];
      const periods = period === 'week' ? 4 : period === 'month' ? 12 : 4;
      
      for (let i = periods - 1; i >= 0; i--) {
        trends.push({
          period: this.getPeriodLabel(period, i),
          artefactsCreated: Math.floor(Math.random() * 10) + 2,
          risksIdentified: Math.floor(Math.random() * 5) + 1,
          suggestionsGenerated: Math.floor(Math.random() * 15) + 5,
          complianceScore: Math.floor(Math.random() * 20) + 75
        });
      }

      return trends;
    } catch (error) {
      console.error('Failed to get trends:', error);
      throw new Error('Failed to retrieve trend data');
    }
  }

  private getPeriodLabel(period: string, index: number): string {
    const now = new Date();
    const labels = [];
    
    for (let i = index; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'week') {
        date.setDate(date.getDate() - (i * 7));
        labels.push(`Week ${date.getWeek()}`);
      } else if (period === 'month') {
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      } else {
        date.setMonth(date.getMonth() - (i * 3));
        labels.push(`Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`);
      }
    }
    
    return labels[labels.length - 1];
  }

  async generateComplianceReport(): Promise<any> {
    try {
      const [metrics, performance, readiness, trends] = await Promise.all([
        this.getComplianceMetrics(),
        this.getAgentPerformance(),
        this.getAuditReadiness(),
        this.getTrends('month')
      ]);

      return {
        reportDate: new Date(),
        summary: {
          overallCompliance: metrics.complianceScore,
          totalArtefacts: metrics.totalArtefacts,
          activeAgents: performance.length,
          auditReadiness: readiness.overallReadiness
        },
        metrics,
        agentPerformance: performance,
        auditReadiness: readiness,
        trends,
        recommendations: this.generateRecommendations(metrics, readiness)
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  private generateRecommendations(metrics: ComplianceMetrics, readiness: AuditReadiness): string[] {
    const recommendations: string[] = [];

    if (metrics.complianceScore < 80) {
      recommendations.push('Focus on improving documentation approval rates');
    }

    if (metrics.pendingReviews > 5) {
      recommendations.push('Accelerate review process for pending artefacts');
    }

    if (readiness.documentationCompleteness < 90) {
      recommendations.push('Complete missing documentation for better audit readiness');
    }

    if (readiness.trainingCompliance < 95) {
      recommendations.push('Ensure all staff complete required training');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance practices');
    }

    return recommendations;
  }
}

// Extend Date prototype for week calculation
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function(): number {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export default AnalyticsService.getInstance(); 