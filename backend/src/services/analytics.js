"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const Artefact_1 = __importDefault(require("../models/Artefact"));
const Agent_1 = __importDefault(require("../models/Agent"));
class AnalyticsService {
    constructor() { }
    static getInstance() {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }
    getComplianceMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalArtefacts, approvedArtefacts, pendingReviews] = yield Promise.all([
                    Artefact_1.default.count(),
                    Artefact_1.default.count({ where: { status: 'approved' } }),
                    Artefact_1.default.count({ where: { status: 'pending_review' } })
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
            }
            catch (error) {
                console.error('Failed to get compliance metrics:', error);
                throw new Error('Failed to retrieve compliance metrics');
            }
        });
    }
    getAgentPerformance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const agents = yield Agent_1.default.findAll();
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
            }
            catch (error) {
                console.error('Failed to get agent performance:', error);
                throw new Error('Failed to retrieve agent performance');
            }
        });
    }
    getAuditReadiness() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Mock audit readiness data
                return {
                    documentationCompleteness: 85,
                    riskAssessmentStatus: 'Current',
                    trainingCompliance: 92,
                    managementReviewStatus: 'Scheduled',
                    overallReadiness: 87
                };
            }
            catch (error) {
                console.error('Failed to get audit readiness:', error);
                throw new Error('Failed to retrieve audit readiness');
            }
        });
    }
    getTrends() {
        return __awaiter(this, arguments, void 0, function* (period = 'month') {
            try {
                // Mock trend data
                const trends = [];
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
            }
            catch (error) {
                console.error('Failed to get trends:', error);
                throw new Error('Failed to retrieve trend data');
            }
        });
    }
    getPeriodLabel(period, index) {
        const now = new Date();
        const labels = [];
        for (let i = index; i >= 0; i--) {
            const date = new Date(now);
            if (period === 'week') {
                date.setDate(date.getDate() - (i * 7));
                labels.push(`Week ${date.getWeek()}`);
            }
            else if (period === 'month') {
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            }
            else {
                date.setMonth(date.getMonth() - (i * 3));
                labels.push(`Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`);
            }
        }
        return labels[labels.length - 1];
    }
    generateComplianceReport() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [metrics, performance, readiness, trends] = yield Promise.all([
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
            }
            catch (error) {
                console.error('Failed to generate compliance report:', error);
                throw new Error('Failed to generate compliance report');
            }
        });
    }
    generateRecommendations(metrics, readiness) {
        const recommendations = [];
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
exports.AnalyticsService = AnalyticsService;
Date.prototype.getWeek = function () {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
exports.default = AnalyticsService.getInstance();
