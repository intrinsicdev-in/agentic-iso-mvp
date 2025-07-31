'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Merge, Trash2, AlertTriangle, CheckCircle, Clock, User, FileText } from 'lucide-react';

interface DuplicateDocument {
  id: string;
  title: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isLatestVersion: boolean;
  versionInfo: {
    versionNumber?: string;
    versionDate?: string;
  };
}

interface DuplicateGroup {
  baseDocument: string;
  documents: DuplicateDocument[];
  recommendedAction: 'keep_latest' | 'merge_content' | 'manual_review';
  confidence: number;
}

interface DuplicateDetectionResult {
  organizationId: string;
  duplicateGroups: DuplicateGroup[];
  totalDocuments: number;
  duplicatesFound: number;
  analysisDate: string;
}

interface DuplicateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicatesResolved: () => void;
}

export default function DuplicateManager({ isOpen, onClose, onDuplicatesResolved }: DuplicateManagerProps) {
  const [duplicateData, setDuplicateData] = useState<DuplicateDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('/api/duplicates/detect', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Server returned unsuccessful response');
      }
      
      setDuplicateData(result.data);
    } catch (err) {
      console.error('Duplicate fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeDocuments = async (documentIds: string[], keepDocumentId: string) => {
    setResolving(keepDocumentId);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('/api/duplicates/merge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentIds,
          keepDocumentId
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to merge documents: ${response.status}`);
      }

      // Refresh duplicates list
      await fetchDuplicates();
      onDuplicatesResolved();
    } catch (err) {
      console.error('Merge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to merge documents');
    } finally {
      setResolving(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setResolving(documentId);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`/api/duplicates/delete/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete document: ${response.status}`);
      }

      // Refresh duplicates list
      await fetchDuplicates();
      onDuplicatesResolved();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setResolving(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'UNDER_REVIEW': return 'text-yellow-600 bg-yellow-100';
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'keep_latest': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'merge_content': return <Merge className="w-4 h-4 text-blue-500" />;
      case 'manual_review': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRecommendationText = (action: string) => {
    switch (action) {
      case 'keep_latest': return 'Keep Latest Version';
      case 'merge_content': return 'Merge Content';
      case 'manual_review': return 'Manual Review Required';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Duplicate Document Manager</h2>
            <p className="text-sm text-gray-600">Find and resolve duplicate documents in your organization</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Scanning for duplicates...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">Error</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={fetchDuplicates}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : duplicateData ? (
            <div>
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Duplicate Analysis Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Total Documents:</span>
                    <span className="ml-2 text-blue-900">{duplicateData.totalDocuments}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Duplicates Found:</span>
                    <span className="ml-2 text-blue-900">{duplicateData.duplicatesFound}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Duplicate Groups:</span>
                    <span className="ml-2 text-blue-900">{duplicateData.duplicateGroups.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Analysis Date:</span>
                    <span className="ml-2 text-blue-900">
                      {new Date(duplicateData.analysisDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duplicate Groups */}
              {duplicateData.duplicateGroups.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Duplicates Found</h3>
                  <p className="text-gray-600">Your document library is clean and organized!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {duplicateData.duplicateGroups.map((group, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Copy className="w-5 h-5 text-gray-500" />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Duplicate Group: "{group.baseDocument}"
                              </h4>
                              <p className="text-sm text-gray-600">
                                {group.documents.length} documents, {Math.round(group.confidence * 100)}% confidence
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRecommendationIcon(group.recommendedAction)}
                            <span className="text-sm font-medium text-gray-700">
                              {getRecommendationText(group.recommendedAction)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Documents in Group */}
                      <div className="p-4">
                        <div className="space-y-3">
                          {group.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className={`border rounded-lg p-4 ${
                                doc.isLatestVersion ? 'border-green-200 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <FileText className="w-4 h-4 text-gray-500" />
                                    <h5 className="font-medium text-gray-900">{doc.title}</h5>
                                    {doc.isLatestVersion && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div>
                                      <span className="font-medium">Status:</span>
                                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(doc.status)}`}>
                                        {doc.status}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Version:</span>
                                      <span className="ml-2">{doc.currentVersion}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Owner:</span>
                                      <span className="ml-2">{doc.owner.name}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Updated:</span>
                                      <span className="ml-2">
                                        {new Date(doc.updatedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  {group.recommendedAction === 'keep_latest' && doc.isLatestVersion && (
                                    <button
                                      onClick={() => handleMergeDocuments(
                                        group.documents.map(d => d.id),
                                        doc.id
                                      )}
                                      disabled={resolving === doc.id}
                                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                      {resolving === doc.id ? 'Merging...' : 'Keep This'}
                                    </button>
                                  )}
                                  
                                  {!doc.isLatestVersion && (
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      disabled={resolving === doc.id}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      {resolving === doc.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Group Actions */}
                        {group.recommendedAction === 'merge_content' && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 mb-2">
                              <Merge className="w-4 h-4 inline mr-1" />
                              These documents have different statuses and may need content merging.
                            </p>
                            <button
                              onClick={() => {
                                const latestDoc = group.documents.find(d => d.isLatestVersion);
                                if (latestDoc) {
                                  handleMergeDocuments(
                                    group.documents.map(d => d.id),
                                    latestDoc.id
                                  );
                                }
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Merge All Documents
                            </button>
                          </div>
                        )}

                        {group.recommendedAction === 'manual_review' && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-700">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Manual review recommended due to different owners or complex situations.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={fetchDuplicates}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Refresh Scan'}
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}