'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format } from 'date-fns';
import { 
  FileText, 
  Download, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  FileDown,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Copy
} from 'lucide-react';

interface MasterDocumentListItem {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  status: string;
  currentVersion: number;
  lastReviewed?: string;
  lastChanged: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isoStandards: string[];
  clauseMappings: {
    clauseCode: string;
    clauseTitle: string;
    isoVersion: string;
  }[];
}

interface MissingDocument {
  title: string;
  category: string;
  description: string;
  clauseRef?: string | null;
  importance?: string | null;
  standard: string;
}

interface MasterDocumentListResponse {
  success: boolean;
  data: {
    documents: MasterDocumentListItem[];
    missingDocuments: MissingDocument[];
    totalCount: number;
    missingCount: number;
    requiredMissingCount: number;
    generatedAt: string;
    filters: {
      isoStandard: string;
    };
  };
}

export default function MasterDocumentListPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<MasterDocumentListItem[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMissing, setShowMissing] = useState(true);
  const [duplicateData, setDuplicateData] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchMasterDocumentList();
    fetchDuplicateData();
  }, [selectedStandard]);

  const fetchMasterDocumentList = async () => {
    try {
      setIsLoading(true);
      const queryParams = selectedStandard !== 'ALL' ? `?isoStandard=${selectedStandard}` : '';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/master-document-list${queryParams}`, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch master document list');
      }

      const data: MasterDocumentListResponse = await response.json();
      if (data.success) {
        setDocuments(data.data.documents);
        setMissingDocuments(data.data.missingDocuments || []);
        setLastGenerated(new Date(data.data.generatedAt));
      }
    } catch (error) {
      console.error('Error fetching master document list:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMasterDocumentList();
    fetchDuplicateData();
  };

  const fetchDuplicateData = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/duplicates/detect', {
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.duplicateGroups) {
          // Create a map of document ID to duplicate count
          const duplicateMap: {[key: string]: number} = {};
          
          result.data.duplicateGroups.forEach((group: any) => {
            group.documents.forEach((doc: any) => {
              duplicateMap[doc.id] = group.documents.length - 1; // Number of duplicates (excluding self)
            });
          });
          
          setDuplicateData(duplicateMap);
        }
      }
    } catch (error) {
      console.error('Error fetching duplicate data:', error);
      // Don't show error for duplicates, just log it
    }
  };

  const exportToCSV = async () => {
    try {
      const queryParams = selectedStandard !== 'ALL' ? `?isoStandard=${selectedStandard}` : '';
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/master-document-list/export/csv${queryParams}`, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export master document list');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master-document-list-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting master document list:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'UNDER_REVIEW':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'DRAFT':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'ARCHIVED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Master Document List</h1>
        <p className="text-gray-600">
          Comprehensive list of all ISO compliance documents with their status, versions, and review dates.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="ALL">All Standards</option>
                <option value="ISO_9001">ISO 9001:2015</option>
                <option value="ISO_27001">ISO 27001</option>
              </select>
            </div>
            
            {lastGenerated && (
              <div className="text-sm text-gray-500">
                Last updated: {format(lastGenerated, 'MMM d, yyyy HH:mm')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading master document list...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents found for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duplicates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ISO Standards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Reviewed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          {doc.description && (
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {doc.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {duplicateData[doc.id] ? (
                        <div className="flex items-center">
                          <Copy className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-sm font-medium text-orange-600">
                            {duplicateData[doc.id]} duplicate{duplicateData[doc.id] > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      v{doc.currentVersion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.owner.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {doc.owner.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.isoStandards.map((standard) => (
                          <span
                            key={standard}
                            className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800"
                          >
                            {standard}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {doc.lastReviewed 
                          ? format(new Date(doc.lastReviewed), 'MMM d, yyyy')
                          : 'Never reviewed'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(doc.lastChanged), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Document"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            download
                            className="text-gray-600 hover:text-gray-900"
                            title="Download File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missing Documents Section */}
      {!isLoading && missingDocuments.length > 0 && showMissing && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Missing Documents</h2>
              <p className="text-sm text-gray-600 mt-1">
                {missingDocuments.filter(d => d.category === 'Required').length} required documents missing
                {missingDocuments.filter(d => d.category === 'Optional').length > 0 && 
                  `, ${missingDocuments.filter(d => d.category === 'Optional').length} optional documents`
                }
                {selectedStandard !== 'ALL' ? ` for ${selectedStandard.replace('_', ' ')}` : ' across all standards'}
              </p>
            </div>
            <button
              onClick={() => setShowMissing(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {missingDocuments.map((doc, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                doc.category === 'Required' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.category === 'Required' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.category}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                        {doc.standard.replace('ISO_', 'ISO ').replace('_', ':').replace('_', ' ')}
                      </span>
                      {doc.clauseRef && (
                        <span className="text-sm text-gray-500">
                          Clause {doc.clauseRef}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    {doc.importance && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Why it's important:</span> {doc.importance}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/documents/new"
                    className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          <div>
            Showing {documents.length} document{documents.length !== 1 ? 's' : ''} 
            {selectedStandard !== 'ALL' && ` for ${selectedStandard.replace('_', ' ')}`}
          </div>
          {missingDocuments.length > 0 && !showMissing && (
            <button
              onClick={() => setShowMissing(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Show {missingDocuments.length} missing document{missingDocuments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}