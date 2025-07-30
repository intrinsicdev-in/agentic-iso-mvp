'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    const mockAgents: Agent[] = [
      {
        id: 1,
        name: 'Risk Register Agent',
        type: 'risk_management',
        description: 'Identifies and manages risks across ISO 27001/9001',
        status: 'active',
        lastActivity: '2024-01-15T10:00:00Z',
        suggestions: 5,
        approvals: 3
      },
      {
        id: 2,
        name: 'Policy Optimiser Agent',
        type: 'policy_optimization',
        description: 'Suggests improvements to policies and procedures',
        status: 'active',
        lastActivity: '2024-01-14T15:30:00Z',
        suggestions: 8,
        approvals: 6
      },
      {
        id: 3,
        name: 'Audit Preparer Agent',
        type: 'audit_preparation',
        description: 'Compiles documentation ahead of audits',
        status: 'active',
        lastActivity: '2024-01-13T09:15:00Z',
        suggestions: 12,
        approvals: 10
      },
      {
        id: 4,
        name: 'Training Compliance Agent',
        type: 'training_compliance',
        description: 'Tracks required training events and coverage',
        status: 'active',
        lastActivity: '2024-01-12T11:45:00Z',
        suggestions: 3,
        approvals: 2
      }
    ];
    
    setAgents(mockAgents);
    setLoading(false);
  }, []);

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="mt-2 text-gray-600">Manage ISO Angel Agents with predefined specializations</p>
          </div>
          <Link href="/agents/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Configure Agent
            </button>
          </Link>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, agent) => sum + agent.suggestions, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, agent) => sum + (agent.suggestions - agent.approvals), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, agent) => sum + agent.approvals, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {agents.length} AI Agent{agents.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {agents.map((agent) => (
            <div key={agent.id} className="px-6 py-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(agent.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(agent.type)}`}>
                        {agent.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                    <div className="flex items-center space-x-6 mt-2">
                      <span className="text-xs text-gray-500">
                        Suggestions: {agent.suggestions}
                      </span>
                      <span className="text-xs text-gray-500">
                        Approved: {agent.approvals}
                      </span>
                      <span className="text-xs text-gray-500">
                        Last Activity: {new Date(agent.lastActivity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href={`/agents/${agent.id}`}>
                    <button className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link href={`/agents/${agent.id}/config`}>
                    <button className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-50">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 