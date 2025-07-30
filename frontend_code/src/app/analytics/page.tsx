'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ComplianceMetrics {
  totalArtefacts: number;
  approvedArtefacts: number;
  pendingReviews: number;
  overdueDeadlines: number;
  activeRisks: number;
  complianceScore: number;
  lastUpdated: Date;
}

interface AgentPerformance {
  agentId: number;
  agentName: string;
  suggestionsGenerated: number;
  suggestionsApproved: number;
  approvalRate: number;
  lastActivity: Date;
}

interface AuditReadiness {
  documentationCompleteness: number;
  riskAssessmentStatus: string;
  trainingCompliance: number;
  managementReviewStatus: string;
  overallReadiness: number;
}

interface TrendData {
  period: string;
  artefactsCreated: number;
  risksIdentified: number;
  suggestionsGenerated: number;
  complianceScore: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [readiness, setReadiness] = useState<AuditReadiness | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      setMetrics({
        totalArtefacts: 24,
        approvedArtefacts: 18,
        pendingReviews: 3,
        overdueDeadlines: 2,
        activeRisks: 8,
        complianceScore: 75,
        lastUpdated: new Date()
      });

      setPerformance([
        {
          agentId: 1,
          agentName: 'Risk Register Agent',
          suggestionsGenerated: 12,
          suggestionsApproved: 8,
          approvalRate: 67,
          lastActivity: new Date()
        },
        {
          agentId: 2,
          agentName: 'Policy Optimiser Agent',
          suggestionsGenerated: 15,
          suggestionsApproved: 12,
          approvalRate: 80,
          lastActivity: new Date()
        },
        {
          agentId: 3,
          agentName: 'Audit Preparer Agent',
          suggestionsGenerated: 8,
          suggestionsApproved: 6,
          approvalRate: 75,
          lastActivity: new Date()
        },
        {
          agentId: 4,
          agentName: 'Training Compliance Agent',
          suggestionsGenerated: 5,
          suggestionsApproved: 4,
          approvalRate: 80,
          lastActivity: new Date()
        }
      ]);

      setReadiness({
        documentationCompleteness: 85,
        riskAssessmentStatus: 'Current',
        trainingCompliance: 92,
        managementReviewStatus: 'Scheduled',
        overallReadiness: 87
      });

      // Mock trend data
      const mockTrends: TrendData[] = [];
      for (let i = 11; i >= 0; i--) {
        mockTrends.push({
          period: `Month ${i + 1}`,
          artefactsCreated: Math.floor(Math.random() * 10) + 2,
          risksIdentified: Math.floor(Math.random() * 5) + 1,
          suggestionsGenerated: Math.floor(Math.random() * 15) + 5,
          complianceScore: Math.floor(Math.random() * 20) + 75
        });
      }
      setTrends(mockTrends);

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
        <p className="mt-2 text-gray-600">Advanced compliance metrics and performance insights</p>
      </div>

      {/* Compliance Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Artefacts</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalArtefacts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.approvedArtefacts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${getComplianceBgColor(metrics.complianceScore)}`}>
                <ChartBarIcon className={`h-6 w-6 ${getComplianceColor(metrics.complianceScore)}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className={`text-2xl font-bold ${getComplianceColor(metrics.complianceScore)}`}>
                  {metrics.complianceScore}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggestions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performance.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agent.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.suggestionsGenerated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.suggestionsApproved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agent.approvalRate >= 80 ? 'bg-green-100 text-green-800' :
                      agent.approvalRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {agent.approvalRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(agent.lastActivity).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Readiness */}
      {readiness && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Readiness</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Documentation Completeness</p>
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${readiness.documentationCompleteness}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {readiness.documentationCompleteness}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Training Compliance</p>
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${readiness.trainingCompliance}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {readiness.trainingCompliance}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Risk Assessment</p>
              <p className="mt-1 text-sm text-gray-900">{readiness.riskAssessmentStatus}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Overall Readiness</p>
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${readiness.overallReadiness}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {readiness.overallReadiness}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Trends</h2>
          <div className="flex space-x-2">
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artefacts Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risks Identified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Suggestions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trends.slice(-6).map((trend, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trend.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trend.artefactsCreated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trend.risksIdentified}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trend.suggestionsGenerated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trend.complianceScore >= 80 ? 'bg-green-100 text-green-800' :
                      trend.complianceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trend.complianceScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 