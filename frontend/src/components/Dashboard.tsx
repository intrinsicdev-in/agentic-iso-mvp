'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { safeJsonParse } from '../utils/api';

interface DashboardProps {
  onSelectDocument?: (id: string) => void;
}

interface DashboardStats {
  totalDocuments: number;
  documentsUnderReview: number;
  approvedDocuments: number;
  pendingTasks: number;
  totalComments: number;
  recentActivity: Array<{
    id: string;
    type: 'document' | 'review' | 'comment' | 'task';
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function Dashboard({ onSelectDocument }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch dashboard stats and activity
      const [statsResponse, docsResponse] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/dashboard/recent-documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsResponse.ok || !docsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await safeJsonParse(statsResponse);
      const docsData = await safeJsonParse(docsResponse);
      
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setStats({
        totalDocuments: dashboardData.stats.totalDocuments,
        documentsUnderReview: dashboardData.stats.documentsUnderReview,
        approvedDocuments: dashboardData.stats.approvedDocuments,
        pendingTasks: dashboardData.stats.pendingTasks,
        totalComments: dashboardData.stats.totalComments,
        recentActivity: dashboardData.recentActivity
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'review':
        return '👀';
      case 'comment':
        return '💬';
      case 'task':
        return '✅';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your ISO compliance documents, reviews, and tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalDocuments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded">
              <span className="text-2xl">👀</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.documentsUnderReview || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.approvedDocuments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingTasks || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectDocument?.(doc.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Version {doc.currentVersion || 1}</span>
                      <span>Owner: {doc.owner?.name || 'Unknown'}</span>
                      <span>{doc._count?.clauseMappings || 0} clause mappings</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <span className="text-blue-600 hover:text-blue-800">→</span>
                  </div>
                </div>
              ))}
            </div>
            {documents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No documents found. Upload your first document to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.timestamp), 'MMM d, HH:mm')} by {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div className="text-center">
                <span className="text-2xl mb-2 block">📤</span>
                <span className="text-sm font-medium">Upload Document</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div className="text-center">
                <span className="text-2xl mb-2 block">👀</span>
                <span className="text-sm font-medium">Review Documents</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div className="text-center">
                <span className="text-2xl mb-2 block">📋</span>
                <span className="text-sm font-medium">Manage Tasks</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div className="text-center">
                <span className="text-2xl mb-2 block">📊</span>
                <span className="text-sm font-medium">View Reports</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Document Status Distribution */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Document Status Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{documents.filter(d => d.status === 'DRAFT').length}</div>
              <div className="text-sm text-gray-500">Draft Documents</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ width: `${documents.length > 0 ? (documents.filter(d => d.status === 'DRAFT').length / documents.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{documents.filter(d => d.status === 'UNDER_REVIEW').length}</div>
              <div className="text-sm text-gray-500">Under Review</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${documents.length > 0 ? (documents.filter(d => d.status === 'UNDER_REVIEW').length / documents.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{documents.filter(d => d.status === 'APPROVED').length}</div>
              <div className="text-sm text-gray-500">Approved</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${documents.length > 0 ? (documents.filter(d => d.status === 'APPROVED').length / documents.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}