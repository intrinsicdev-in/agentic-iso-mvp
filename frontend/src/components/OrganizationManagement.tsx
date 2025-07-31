'use client';

import { useState, useEffect } from 'react';
import { Building, Plus, Settings, Users, FileText, BarChart3, Shield, Globe } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    artefacts: number;
  };
}

interface OrganizationManagementProps {
  currentUser: {
    id: string;
    role: 'SUPER_ADMIN' | 'ACCOUNT_ADMIN' | 'USER';
    organizationId?: string;
  };
}

export default function OrganizationManagement({ currentUser }: OrganizationManagementProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New organization form
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    if (currentUser.role === 'SUPER_ADMIN') {
      fetchOrganizations();
    }
  }, [currentPage, searchTerm, currentUser.role]);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/organizations?page=${currentPage}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data.organizations);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newOrg)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      setNewOrg({
        name: '',
        slug: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      setIsCreating(false);
      fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    }
  };

  const handleToggleActive = async (orgId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/organizations/${orgId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle organization status');
      }

      fetchOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle organization status');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view organization management.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-gray-600">Manage organizations and their settings</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create Organization Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Organization</h2>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrg.name}
                    onChange={(e) => {
                      setNewOrg({ 
                        ...newOrg, 
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={newOrg.website}
                    onChange={(e) => setNewOrg({ ...newOrg, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={newOrg.industry}
                    onChange={(e) => setNewOrg({ ...newOrg, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={newOrg.size}
                  onChange={(e) => setNewOrg({ ...newOrg, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
              
              <hr className="my-4" />
              
              <h3 className="text-lg font-medium text-gray-900">Admin User</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrg.adminName}
                    onChange={(e) => setNewOrg({ ...newOrg, adminName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newOrg.adminEmail}
                    onChange={(e) => setNewOrg({ ...newOrg, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={newOrg.adminPassword}
                  onChange={(e) => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{org.name}</h3>
                  <p className="text-sm text-gray-500">@{org.slug}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {org.description && (
              <p className="text-gray-600 text-sm mb-4">{org.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{org._count.users} users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{org._count.artefacts} docs</span>
                </div>
              </div>
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-xs text-gray-500">
                Created {new Date(org.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleActive(org.id)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    org.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {org.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  <Settings className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
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