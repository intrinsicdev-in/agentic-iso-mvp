'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, FileText, Download, Calendar, Filter, Shield } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('compliance');

  if (!user || !['SUPER_ADMIN', 'ACCOUNT_ADMIN'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is restricted to Administrators only.</p>
        </div>
      </div>
    );
  }

  const reports = [
    {
      id: 'compliance',
      name: 'Compliance Overview',
      description: 'Overall compliance status and metrics',
      icon: '📊',
      status: 'Available'
    },
    {
      id: 'documents',
      name: 'Document Status Report',
      description: 'Status of all documents by category',
      icon: '📄',
      status: 'Available'
    },
    {
      id: 'tasks',
      name: 'Task Progress Report',
      description: 'Progress on all pending and completed tasks',
      icon: '✅',
      status: 'Available'
    },
    {
      id: 'audit',
      name: 'Audit Activity Report',
      description: 'Summary of audit logs and system activity',
      icon: '🔍',
      status: 'Available'
    },
    {
      id: 'users',
      name: 'User Activity Report',
      description: 'User engagement and activity metrics',
      icon: '👥',
      status: 'Coming Soon'
    },
    {
      id: 'risk',
      name: 'Risk Assessment Report',
      description: 'Risk analysis and mitigation status',
      icon: '⚠️',
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">Generate and download compliance and activity reports</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className={`bg-white p-6 rounded-lg shadow border cursor-pointer transition-colors ${
              selectedReport === report.id
                ? 'border-blue-300 bg-blue-50'
                : 'hover:border-gray-300'
            } ${report.status === 'Coming Soon' ? 'opacity-50' : ''}`}
            onClick={() => report.status === 'Available' && setSelectedReport(report.id)}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{report.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  report.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{report.description}</p>
          </div>
        ))}
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Report Configuration</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">Charts and graphs</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">Detailed data</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Raw data export</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Report Preview</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reports.find(r => r.id === selectedReport)?.name || 'Select a Report'}
            </h3>
            <p className="text-gray-600 mb-4">
              {reports.find(r => r.id === selectedReport)?.description || 'Choose a report type to see the preview'}
            </p>
            {selectedReport && reports.find(r => r.id === selectedReport)?.status === 'Available' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm text-gray-600 mb-2">Sample metrics for {reports.find(r => r.id === selectedReport)?.name}:</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">85%</div>
                      <div className="text-xs text-gray-500">Compliance Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">23</div>
                      <div className="text-xs text-gray-500">Completed Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">7</div>
                      <div className="text-xs text-gray-500">Pending Items</div>
                    </div>
                  </div>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Generate Full Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}