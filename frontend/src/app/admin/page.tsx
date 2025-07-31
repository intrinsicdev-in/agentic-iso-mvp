'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Building, Shield, Activity, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalDocuments: 0,
    recentActivity: 0
  });

  useEffect(() => {
    // Fetch admin stats here if needed
  }, []);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is restricted to Super Administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-2">Manage system-wide settings, users, and organizations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <Shield className="w-6 h-6 text-purple-600" />
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
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activity (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Administrative Tools</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/audit"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Activity className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">Audit Mode</h3>
                <p className="text-sm text-gray-600">View system audit logs and activity</p>
              </div>
            </Link>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Users className="w-8 h-8 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-500">User Management</h3>
                <p className="text-sm text-gray-400">Manage system-wide users (Coming Soon)</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Building className="w-8 h-8 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-500">Organization Management</h3>
                <p className="text-sm text-gray-400">Manage organizations (Coming Soon)</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <Settings className="w-8 h-8 text-gray-400 mr-4" />
              <div>
                <h3 className="font-medium text-gray-500">System Settings</h3>
                <p className="text-sm text-gray-400">Configure system-wide settings (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">System Status</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Database Connection</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ● Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">API Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ● Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">File Storage</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ● Available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}