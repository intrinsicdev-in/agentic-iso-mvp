'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type SuggestionType = 'document_improvement' | 'risk_treatment' | 'compliance_gap' | 'process_optimization' | 'training_need';
type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_REVIEW';
type AgentType = 'DOCUMENT_REVIEWER' | 'RISK_ASSESSOR' | 'COMPLIANCE_CHECKER' | 'TASK_MANAGER' | 'REPORT_GENERATOR';

interface AISuggestion {
  id: string;
  agentId: string;
  agentType: AgentType;
  agentName: string;
  type: SuggestionType;
  title: string;
  content: string;
  rationale: string;
  status: SuggestionStatus;
  metadata?: {
    documentId?: string;
    clauseId?: string;
    riskLevel?: number;
    confidence?: number;
    relatedStandard?: string;
  };
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface AIStats {
  totalSuggestions: number;
  pendingSuggestions: number;
  acceptedSuggestions: number;
  confidenceAverage: number;
  topAgent: string;
}

export default function AICenterPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AISuggestion[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [filterStatus, setFilterStatus] = useState<SuggestionStatus | 'ALL'>('PENDING');
  const [filterType, setFilterType] = useState<SuggestionType | 'ALL'>('ALL');
  const [filterAgent, setFilterAgent] = useState<AgentType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showInteractionLog, setShowInteractionLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    filterSuggestions();
    calculateStats();
  }, [suggestions, filterStatus, filterType, filterAgent]);

  const fetchSuggestions = async () => {
    try {
      // Mock data for demonstration
      const mockSuggestions: AISuggestion[] = [
        {
          id: '1',
          agentId: 'agent-1',
          agentType: 'DOCUMENT_REVIEWER',
          agentName: 'Document Review Agent',
          type: 'document_improvement',
          title: 'Update Information Security Policy for Remote Work',
          content: 'The current Information Security Policy (v2.1) does not adequately address remote work security requirements introduced in ISO 27001:2022.',
          rationale: 'ISO 27001:2022 Annex A.6.2.2 requires specific controls for teleworking. Current policy lacks: VPN requirements, home network security guidelines, and device management procedures.',
          status: 'PENDING',
          metadata: {
            documentId: 'doc-123',
            clauseId: 'A.6.2.2',
            confidence: 0.92,
            relatedStandard: 'ISO_27001_2022'
          },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          agentId: 'agent-2',
          agentType: 'COMPLIANCE_CHECKER',
          agentName: 'Compliance Monitor',
          type: 'compliance_gap',
          title: 'Missing Evidence for Management Review',
          content: 'No management review meeting minutes found for Q3 2024. ISO 9001:2015 Clause 9.3 requires documented management reviews at planned intervals.',
          rationale: 'Regular management reviews are mandatory for ISO compliance. Missing documentation could result in major nonconformity during audit.',
          status: 'PENDING',
          metadata: {
            clauseId: '9.3',
            confidence: 0.95,
            relatedStandard: 'ISO_9001_2015',
            riskLevel: 4
          },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          agentId: 'agent-3',
          agentType: 'RISK_ASSESSOR',
          agentName: 'Risk Analysis Agent',
          type: 'risk_treatment',
          title: 'High Risk: Outdated Backup Procedures',
          content: 'Current backup procedures do not meet RPO/RTO requirements. Recommend immediate update to include cloud backup strategy.',
          rationale: 'Risk assessment shows potential data loss exposure of 48 hours. Industry best practice and ISO 27001 A.12.3 require maximum 4-hour RPO.',
          status: 'ACCEPTED',
          metadata: {
            riskLevel: 5,
            confidence: 0.88,
            relatedStandard: 'ISO_27001_2022'
          },
          reviewedBy: 'John Doe',
          reviewNotes: 'Approved. IT team to implement by end of month.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          reviewedAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: '4',
          agentId: 'agent-1',
          agentType: 'DOCUMENT_REVIEWER',
          agentName: 'Document Review Agent',
          type: 'process_optimization',
          title: 'Streamline Document Approval Workflow',
          content: 'Analysis shows document approval taking average 5.2 days. Suggested automated workflow can reduce to 1.5 days.',
          rationale: 'Current manual email-based approval creates bottlenecks. Automated workflow ensures compliance with ISO 9001 7.5.2 while improving efficiency.',
          status: 'IN_REVIEW',
          metadata: {
            confidence: 0.85,
            relatedStandard: 'ISO_9001_2015'
          },
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      setSuggestions(mockSuggestions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
      setLoading(false);
    }
  };

  const filterSuggestions = () => {
    let filtered = [...suggestions];

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    if (filterType !== 'ALL') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    if (filterAgent !== 'ALL') {
      filtered = filtered.filter(s => s.agentType === filterAgent);
    }

    setFilteredSuggestions(filtered);
  };

  const calculateStats = () => {
    const total = suggestions.length;
    const pending = suggestions.filter(s => s.status === 'PENDING').length;
    const accepted = suggestions.filter(s => s.status === 'ACCEPTED').length;
    const avgConfidence = suggestions.reduce((acc, s) => acc + (s.metadata?.confidence || 0), 0) / total;
    
    // Find most active agent
    const agentCounts = suggestions.reduce((acc, s) => {
      acc[s.agentName] = (acc[s.agentName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    setStats({
      totalSuggestions: total,
      pendingSuggestions: pending,
      acceptedSuggestions: accepted,
      confidenceAverage: avgConfidence,
      topAgent
    });
  };

  const handleSuggestionAction = async (suggestionId: string, action: 'accept' | 'reject', notes?: string) => {
    try {
      // API call would go here
      console.log(`${action} suggestion ${suggestionId} with notes: ${notes}`);
      
      // Update local state
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId 
          ? {
              ...s, 
              status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
              reviewedBy: 'Current User',
              reviewNotes: notes,
              reviewedAt: new Date().toISOString()
            }
          : s
      ));
      
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    }
  };

  const getTypeIcon = (type: SuggestionType) => {
    const icons: Record<SuggestionType, string> = {
      document_improvement: '📄',
      risk_treatment: '⚠️',
      compliance_gap: '🔍',
      process_optimization: '⚡',
      training_need: '📚'
    };
    return icons[type] || '💡';
  };

  const getStatusColor = (status: SuggestionStatus) => {
    const colors: Record<SuggestionStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const getAgentColor = (type: AgentType) => {
    const colors: Record<AgentType, string> = {
      DOCUMENT_REVIEWER: 'bg-purple-100 text-purple-800',
      RISK_ASSESSOR: 'bg-red-100 text-red-800',
      COMPLIANCE_CHECKER: 'bg-blue-100 text-blue-800',
      TASK_MANAGER: 'bg-green-100 text-green-800',
      REPORT_GENERATOR: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Agent Centre</h1>
              <p className="text-sm text-gray-600">AI-powered suggestions and compliance insights</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowInteractionLog(!showInteractionLog)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📊 Interaction Log
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats?.totalSuggestions || 0}</div>
            <div className="text-sm text-gray-600">Total Suggestions</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingSuggestions || 0}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats?.acceptedSuggestions || 0}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.confidenceAverage ? `${(stats.confidenceAverage * 100).toFixed(0)}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-lg font-medium text-gray-900">{stats?.topAgent || 'N/A'}</div>
            <div className="text-sm text-gray-600">Most Active Agent</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as SuggestionStatus | 'ALL')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="IN_REVIEW">In Review</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as SuggestionType | 'ALL')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Types</option>
                <option value="document_improvement">Document Improvement</option>
                <option value="risk_treatment">Risk Treatment</option>
                <option value="compliance_gap">Compliance Gap</option>
                <option value="process_optimization">Process Optimization</option>
                <option value="training_need">Training Need</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Agent</label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value as AgentType | 'ALL')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="ALL">All Agents</option>
                <option value="DOCUMENT_REVIEWER">Document Reviewer</option>
                <option value="RISK_ASSESSOR">Risk Assessor</option>
                <option value="COMPLIANCE_CHECKER">Compliance Checker</option>
                <option value="TASK_MANAGER">Task Manager</option>
                <option value="REPORT_GENERATOR">Report Generator</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">AI Suggestions Feed</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading suggestions...</p>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No suggestions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                          <h3 className="font-medium text-lg">{suggestion.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(suggestion.status)}`}>
                            {suggestion.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getAgentColor(suggestion.agentType)}`}>
                            {suggestion.agentName}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{suggestion.content}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {suggestion.metadata?.confidence && (
                            <span>Confidence: {(suggestion.metadata.confidence * 100).toFixed(0)}%</span>
                          )}
                          {suggestion.metadata?.relatedStandard && (
                            <span>{suggestion.metadata.relatedStandard.replace('_', ' ')}</span>
                          )}
                          <span>{format(new Date(suggestion.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button className="text-blue-600 hover:text-blue-800">
                          Review →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Detail Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">AI Suggestion Details</h2>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getTypeIcon(selectedSuggestion.type)}</span>
                <div>
                  <h3 className="text-xl font-semibold">{selectedSuggestion.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedSuggestion.status)}`}>
                      {selectedSuggestion.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getAgentColor(selectedSuggestion.agentType)}`}>
                      {selectedSuggestion.agentName}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Suggestion</h4>
                <p className="text-gray-600">{selectedSuggestion.content}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Rationale</h4>
                <div className="p-3 bg-blue-50 rounded text-blue-800">
                  {selectedSuggestion.rationale}
                </div>
              </div>
              
              {selectedSuggestion.metadata && (
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedSuggestion.metadata.confidence && (
                      <div>
                        <span className="font-medium">Confidence:</span>{' '}
                        {(selectedSuggestion.metadata.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    {selectedSuggestion.metadata.relatedStandard && (
                      <div>
                        <span className="font-medium">Standard:</span>{' '}
                        {selectedSuggestion.metadata.relatedStandard.replace('_', ' ')}
                      </div>
                    )}
                    {selectedSuggestion.metadata.clauseId && (
                      <div>
                        <span className="font-medium">Clause:</span>{' '}
                        {selectedSuggestion.metadata.clauseId}
                      </div>
                    )}
                    {selectedSuggestion.metadata.riskLevel && (
                      <div>
                        <span className="font-medium">Risk Level:</span>{' '}
                        <span className="text-red-600">
                          {'⚠️'.repeat(selectedSuggestion.metadata.riskLevel)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedSuggestion.reviewedBy && (
                <div>
                  <h4 className="font-medium mb-2">Review Information</h4>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <span className="font-medium">Reviewed by:</span> {selectedSuggestion.reviewedBy}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Date:</span>{' '}
                      {format(new Date(selectedSuggestion.reviewedAt!), 'MMM d, yyyy HH:mm')}
                    </p>
                    {selectedSuggestion.reviewNotes && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Notes:</span> {selectedSuggestion.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedSuggestion.status === 'PENDING' && (
                <div>
                  <h4 className="font-medium mb-2">Take Action</h4>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Add review notes (optional)..."
                      className="w-full border rounded-lg px-3 py-2 h-20"
                      id="review-notes"
                    />
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          const notes = (document.getElementById('review-notes') as HTMLTextAreaElement).value;
                          handleSuggestionAction(selectedSuggestion.id, 'accept', notes);
                        }}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                      >
                        Accept Suggestion
                      </button>
                      <button
                        onClick={() => {
                          const notes = (document.getElementById('review-notes') as HTMLTextAreaElement).value;
                          handleSuggestionAction(selectedSuggestion.id, 'reject', notes);
                        }}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                      >
                        Reject Suggestion
                      </button>
                      <button
                        onClick={() => setSelectedSuggestion(null)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Review Later
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">AI Agent Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Confidence Threshold</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span>Current: 70%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Only show suggestions with confidence above this threshold
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Enable/Disable Suggestion Types</h3>
                <div className="space-y-2">
                  {[
                    { type: 'document_improvement', label: 'Document Improvements' },
                    { type: 'risk_treatment', label: 'Risk Treatments' },
                    { type: 'compliance_gap', label: 'Compliance Gaps' },
                    { type: 'process_optimization', label: 'Process Optimizations' },
                    { type: 'training_need', label: 'Training Needs' }
                  ].map((item) => (
                    <label key={item.type} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mr-2"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">AI Model Information</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm"><span className="font-medium">Model:</span> GPT-4 Turbo</p>
                  <p className="text-sm"><span className="font-medium">Version:</span> 2024-01-25</p>
                  <p className="text-sm"><span className="font-medium">Last Updated:</span> 2 days ago</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}