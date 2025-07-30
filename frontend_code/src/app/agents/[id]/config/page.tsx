'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon
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

interface AgentConfig {
  id: number;
  agentId: number;
  isActive: boolean;
  scanFrequency: 'hourly' | 'daily' | 'weekly';
  notificationLevel: 'low' | 'medium' | 'high';
  autoApproval: boolean;
  maxSuggestionsPerDay: number;
  focusAreas: string[];
  customPrompts: string[];
}

export default function AgentConfigPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Mock data for MVP
    const mockAgent: Agent = {
      id: parseInt(params.id as string),
      name: 'Risk Register Agent',
      type: 'risk_management',
      description: 'Identifies and manages risks across ISO 27001/9001 standards',
      status: 'active',
      lastActivity: '2024-01-15T10:00:00Z',
      suggestions: 5,
      approvals: 3
    };

    const mockConfig: AgentConfig = {
      id: 1,
      agentId: parseInt(params.id as string),
      isActive: true,
      scanFrequency: 'daily',
      notificationLevel: 'medium',
      autoApproval: false,
      maxSuggestionsPerDay: 10,
      focusAreas: ['ISO 27001:2022', 'ISO 9001:2015', 'Risk Management'],
      customPrompts: [
        'Focus on identifying gaps in current risk assessment procedures',
        'Prioritize suggestions that improve compliance with latest standards'
      ]
    };

    setAgent(mockAgent);
    setConfig(mockConfig);
    setLoading(false);
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/agents/${params.id}`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent || !config) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Configuration not found</h1>
          <p className="mt-2 text-gray-600">The requested agent configuration could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Configure {agent.name}</h1>
            <p className="mt-2 text-gray-600">Customize agent behavior and settings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Agent Settings</h2>
            
            <div className="space-y-6">
              {/* Basic Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Agent Status</label>
                      <p className="text-sm text-gray-500">Enable or disable the agent</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => setConfig({...config, isActive: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scan Frequency</label>
                    <select
                      value={config.scanFrequency}
                      onChange={(e) => setConfig({...config, scanFrequency: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notification Level</label>
                    <select
                      value={config.notificationLevel}
                      onChange={(e) => setConfig({...config, notificationLevel: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low - Only critical issues</option>
                      <option value="medium">Medium - Important suggestions</option>
                      <option value="high">High - All suggestions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Suggestions Per Day</label>
                    <input
                      type="number"
                      value={config.maxSuggestionsPerDay}
                      onChange={(e) => setConfig({...config, maxSuggestionsPerDay: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Focus Areas</h3>
                <div className="space-y-2">
                  {config.focusAreas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => {
                          const newAreas = [...config.focusAreas];
                          newAreas[index] = e.target.value;
                          setConfig({...config, focusAreas: newAreas});
                        }}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newAreas = config.focusAreas.filter((_, i) => i !== index);
                          setConfig({...config, focusAreas: newAreas});
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setConfig({...config, focusAreas: [...config.focusAreas, '']})}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Focus Area
                  </button>
                </div>
              </div>

              {/* Custom Prompts */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Prompts</h3>
                <div className="space-y-2">
                  {config.customPrompts.map((prompt, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <textarea
                        value={prompt}
                        onChange={(e) => {
                          const newPrompts = [...config.customPrompts];
                          newPrompts[index] = e.target.value;
                          setConfig({...config, customPrompts: newPrompts});
                        }}
                        rows={3}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter custom prompt..."
                      />
                      <button
                        onClick={() => {
                          const newPrompts = config.customPrompts.filter((_, i) => i !== index);
                          setConfig({...config, customPrompts: newPrompts});
                        }}
                        className="text-red-600 hover:text-red-800 mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setConfig({...config, customPrompts: [...config.customPrompts, '']})}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Custom Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(agent.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                <p className="text-sm text-gray-600">{agent.type.replace('_', ' ')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{agent.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Suggestions:</span>
                <span className="font-medium">{agent.suggestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved:</span>
                <span className="font-medium">{agent.approvals}</span>
              </div>
            </div>
          </div>

          {/* Save Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 