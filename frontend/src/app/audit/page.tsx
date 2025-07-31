'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Clock, User, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { safeJsonParse } from '../../utils/api';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  agentId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  agent?: {
    name: string;
    type: string;
  };
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    dateRange: '7' // Last 7 days
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await safeJsonParse(response);
      setAuditLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return '✨';
    if (action.includes('updated')) return '📝';
    if (action.includes('deleted')) return '🗑️';
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    return '📋';
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'text-green-600 bg-green-50';
    if (action.includes('updated')) return 'text-blue-600 bg-blue-50';
    if (action.includes('deleted')) return 'text-red-600 bg-red-50';
    if (action.includes('login')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/\./g, ' → ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Mode</h1>
          <p className="text-gray-600 mt-2">Monitor and review system activity and user actions</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search actions, entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="artefact">Documents</option>
              <option value="task">Tasks</option>
              <option value="user">Users</option>
              <option value="organization">Organizations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSearch}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
          <p className="text-sm text-gray-500">
            Showing {auditLogs.length} audit log entries
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getActionIcon(log.action)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.entityType}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {log.entityId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user?.name || log.agent?.name || 'System'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.user?.email || log.agent?.type || 'Automated'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">
                          {format(new Date(log.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(log.createdAt), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {log.details && Object.keys(log.details).length > 0 
                        ? JSON.stringify(log.details, null, 2).substring(0, 100) + '...'
                        : 'No additional details'
                      }
                    </div>
                    {log.ipAddress && (
                      <div className="text-xs text-gray-500 mt-1">
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auditLogs.length === 0 && !loading && (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found for the selected criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}