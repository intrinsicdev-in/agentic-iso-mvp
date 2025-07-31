'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Upload, Eye, Edit, Trash2, Download, Clock, User, Tag, Copy } from 'lucide-react';
import DocumentView from '../../components/DocumentView';
import DocumentUpload from '../../components/DocumentUpload';
import DuplicateManager from '../../components/DuplicateManager';
import DuplicateTestButton from '../../components/DuplicateTestButton';
import { safeJsonParse } from '../../utils/api';

interface Artefact {
  id: string;
  title: string;
  description: string;
  currentVersion: number;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
  fileUrl: string;
  metadata: any;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    versions: number;
    clauseMappings: number;
  };
}

interface ArtefactLibraryFilters {
  search: string;
  status: string;
  owner: string;
  standard: string;
}

export default function DocumentsPage() {
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [filteredArtefacts, setFilteredArtefacts] = useState<Artefact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [filters, setFilters] = useState<ArtefactLibraryFilters>({
    search: '',
    status: '',
    owner: '',
    standard: ''
  });

  useEffect(() => {
    loadArtefacts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [artefacts, filters]);

  const loadArtefacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      const response = await fetch('/api/artefacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await safeJsonParse(response);
      setArtefacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...artefacts];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(artefact => 
        artefact.title.toLowerCase().includes(searchTerm) ||
        artefact.description.toLowerCase().includes(searchTerm) ||
        artefact.owner.name.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(artefact => artefact.status === filters.status);
    }

    // Owner filter
    if (filters.owner) {
      filtered = filtered.filter(artefact => artefact.ownerId === filters.owner);
    }

    setFilteredArtefacts(filtered);
  };

  const handleDeleteDocument = async (artefactId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      
      const response = await fetch(`/api/artefacts/${artefactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from local state
      setArtefacts(prev => prev.filter(a => a.id !== artefactId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueOwners = Array.from(new Set(artefacts.map(a => a.owner))).filter((owner, index, self) => 
    index === self.findIndex(o => o.id === owner.id)
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artefact Library</h1>
          <p className="text-gray-600">Manage, view, and edit all your ISO documents and artefacts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDuplicateManager(true)}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Find Duplicates
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Temporary Test Button - Remove this in production */}
      <DuplicateTestButton />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{artefacts.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {artefacts.filter(a => a.status === 'APPROVED').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {artefacts.filter(a => a.status === 'UNDER_REVIEW').length}
          </div>
          <div className="text-sm text-gray-600">Under Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {artefacts.filter(a => a.status === 'DRAFT').length}
          </div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <select
              value={filters.owner}
              onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Owners</option>
              {uniqueOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          {(filters.search || filters.status || filters.owner) && (
            <button
              onClick={() => setFilters({ search: '', status: '', owner: '', standard: '' })}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredArtefacts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              {artefacts.length === 0 ? (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No documents yet</p>
                  <p className="text-sm">Upload your first ISO document to get started</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No documents match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArtefacts.map((artefact) => (
                  <tr key={artefact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {artefact.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {artefact.description}
                          </div>
                          {artefact._count.clauseMappings > 0 && (
                            <div className="flex items-center mt-1">
                              <Tag className="w-3 h-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {artefact._count.clauseMappings} ISO clause{artefact._count.clauseMappings !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(artefact.status)}`}>
                        {artefact.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{artefact.owner.name}</div>
                        <div className="text-gray-500">{artefact.owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        v{artefact.currentVersion} ({artefact._count.versions} total)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(artefact.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDocument(artefact.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={artefact.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(artefact.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Document (Exceptional Circumstances)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {selectedDocument && (
        <DocumentView
          documentId={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Upload Modal */}
      <DocumentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={() => {
          setShowUpload(false);
          loadArtefacts();
        }}
      />

      {/* Duplicate Manager Modal */}
      <DuplicateManager
        isOpen={showDuplicateManager}
        onClose={() => setShowDuplicateManager(false)}
        onDuplicatesResolved={() => {
          loadArtefacts();
        }}
      />
    </div>
  );
}