'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Users, FileText, Shield, Settings } from 'lucide-react';

export default function OrganizationAdminPage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    pendingTasks: 0,
    compliance: 0
  });

  useEffect(() => {
    if (user?.organizationId) {
      // Fetch organization details and stats
    }
  }, [user]);

  if (user?.role !== 'ACCOUNT_ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is restricted to Account Administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Administration</h1>
        <p className="text-gray-600 mt-2">Manage your organization's settings, users, and compliance</p>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Organization Details</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {(user as any)?.organization?.name || 'Test Organization'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization ID
              </label>
              <p className="text-sm text-gray-600 font-mono">
                {user?.organizationId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Organization Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.compliance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Tools */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Management Tools</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage organization users</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Shield className="w-8 h-8 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-500">Compliance Dashboard</h3>
                <p className="text-sm text-gray-400">View compliance metrics (Coming Soon)</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Settings className="w-8 h-8 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-500">Organization Settings</h3>
                <p className="text-sm text-gray-400">Configure settings (Coming Soon)</p>
              </div>
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
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="font-medium text-gray-900">Invite New User</div>
              <div className="text-sm text-gray-600">Send an invitation to join your organization</div>
            </button>
            
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="font-medium text-gray-900">Generate Compliance Report</div>
              <div className="text-sm text-gray-600">Create a compliance status report</div>
            </button>
            
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="font-medium text-gray-900">Review Pending Tasks</div>
              <div className="text-sm text-gray-600">Check tasks requiring your attention</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}