'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Agent {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
  lastActivity: string;
  suggestions: number;
  approvals: number;
}

interface Suggestion {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  artefactId?: number;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for MVP
    const mockAgent: Agent = {
      id: parseInt(params.id as string),
      name: 'Risk Register Agent',
      type: 'risk_management',
      description: 'Identifies and manages risks across ISO 27001/9001 standards. Continuously monitors compliance gaps and suggests improvements.',
      status: 'active',
      lastActivity: '2024-01-15T10:00:00Z',
      suggestions: 5,
      approvals: 3
    };

    const mockSuggestions: Suggestion[] = [
      {
        id: 1,
        title: 'Update Risk Assessment Methodology',
        description: 'Current methodology doesn\'t cover new cyber threats identified in recent audit',
        status: 'approved',
        createdAt: '2024-01-15T09:30:00Z',
        artefactId: 1
      },
      {
        id: 2,
        title: 'Add Incident Response Procedure',
        description: 'Missing procedure for handling security incidents as per ISO 27001:2022',
        status: 'pending',
        createdAt: '2024-01-14T14:20:00Z'
      },
      {
        id: 3,
        title: 'Review Access Control Policy',
        description: 'Policy needs updates to align with new remote work requirements',
        status: 'rejected',
        createdAt: '2024-01-13T11:45:00Z',
        artefactId: 2
      }
    ];

    setAgent(mockAgent);
    setSuggestions(mockSuggestions);
    setLoading(false);
  }, [params.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <CogIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk_management':
        return 'bg-red-100 text-red-800';
      case 'policy_optimization':
        return 'bg-blue-100 text-blue-800';
      case 'audit_preparation':
        return 'bg-green-100 text-green-800';
      case 'training_compliance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuggestionStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Agent not found</h1>
          <p className="mt-2 text-gray-600">The requested agent could not be found.</p>
          <Link href="/agents">
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Back to Agents
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="mt-2 text-gray-600">AI Agent Details and Activity</p>
          </div>
        </div>
      </div>

      {/* Agent Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Agent Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(agent.status)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(agent.type)}`}>
                      {agent.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
              <Link href={`/agents/${agent.id}/config`}>
                <button className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50">
                  <PencilIcon className="h-5 w-5" />
                </button>
              </Link>
            </div>
            <p className="text-gray-700 mb-4">{agent.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agent.suggestions}</p>
                <p className="text-sm text-gray-600">Total Suggestions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{agent.approvals}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{agent.suggestions - agent.approvals}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Suggestions</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSuggestionStatusColor(suggestion.status)}`}>
                          {suggestion.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(suggestion.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {suggestion.artefactId && (
                      <Link href={`/artefacts/${suggestion.artefactId}`}>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View Artefact
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(agent.lastActivity).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.round((agent.approvals / agent.suggestions) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Time</span>
                <span className="text-sm font-medium text-gray-900">2 days</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center">
                <CogIcon className="h-4 w-4 mr-2" />
                Configure Agent
              </button>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Analytics
              </button>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 