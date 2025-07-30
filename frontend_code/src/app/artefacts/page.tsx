'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Artefact {
  id: number;
  title: string;
  type: string;
  clause: string;
  version: string;
  status: string;
  owner: string;
  lastUpdated: string;
  content: string;
  // File upload fields
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isoStandard?: string;
}

export default function ArtefactsPage() {
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchArtefacts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3001/api/artefacts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch artefacts');
        }
        
        const data = await response.json();
        setArtefacts(data.artefacts || []);
      } catch (error) {
        console.error('Failed to fetch artefacts:', error);
        setError('Failed to load artefacts. Please try again.');
        // Fallback to mock data if API fails
        const mockArtefacts: Artefact[] = [
          {
            id: 1,
            title: 'Quality Policy',
            type: 'policy',
            clause: 'ISO 9001:2015 - 5.2',
            version: '1.0',
            status: 'approved',
            owner: 'Quality Manager',
            lastUpdated: '2024-01-15T10:00:00Z',
            content: 'Our organization is committed to...'
          },
          {
            id: 2,
            title: 'Information Security Policy',
            type: 'policy',
            clause: 'ISO 27001:2022 - 5.2',
            version: '2.1',
            status: 'pending_review',
            owner: 'CISO',
            lastUpdated: '2024-01-10T14:30:00Z',
            content: 'This policy establishes...'
          }
        ];
        setArtefacts(mockArtefacts);
      } finally {
        setLoading(false);
      }
    };

    fetchArtefacts();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'draft':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = async (artefactId: number, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/artefacts/${artefactId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const filteredArtefacts = artefacts.filter(artefact => {
    const matchesSearch = artefact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artefact.clause.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || artefact.type === filterType;
    const matchesStatus = filterStatus === 'all' || artefact.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Artefacts</h1>
            <p className="mt-2 text-gray-600">Manage ISO documentation with clause mapping and version control</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/artefacts/upload">
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center">
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload ISO Book
              </button>
            </Link>
            <Link href="/artefacts/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Artefact
              </button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search artefacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="policy">Policy</option>
              <option value="procedure">Procedure</option>
              <option value="work-instruction">Work Instruction</option>
              <option value="form">Form</option>
              <option value="iso-book">ISO Book</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending_review">Pending Review</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Artefacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredArtefacts.length} Artefact{filteredArtefacts.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredArtefacts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No artefacts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {artefacts.length === 0 ? 'Get started by creating your first artefact or uploading an ISO book.' : 'Try adjusting your search or filters.'}
              </p>
              {artefacts.length === 0 && (
                <div className="mt-6 space-x-3">
                  <Link href="/artefacts/upload">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto mb-2">
                      <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                      Upload ISO Book
                    </button>
                  </Link>
                  <Link href="/artefacts/new">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto">
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Artefact
                    </button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            filteredArtefacts.map((artefact) => (
              <div key={artefact.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(artefact.status)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link href={`/artefacts/${artefact.id}`} className="hover:text-blue-600">
                          {artefact.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600">{artefact.clause}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Version {artefact.version}</span>
                        <span className="text-xs text-gray-500">Owner: {artefact.owner}</span>
                        <span className="text-xs text-gray-500">
                          Updated: {new Date(artefact.lastUpdated).toLocaleDateString()}
                        </span>
                        {artefact.isoStandard && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {artefact.isoStandard}
                          </span>
                        )}
                      </div>
                      {artefact.fileName && (
                        <div className="flex items-center space-x-2 mt-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {artefact.fileName} 
                            {artefact.fileSize && ` (${(artefact.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(artefact.status)}`}>
                      {artefact.status.replace('_', ' ')}
                    </span>
                    {artefact.fileName && (
                      <button
                        onClick={() => handleDownload(artefact.id, artefact.fileName!)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    )}
                    <Link href={`/artefacts/${artefact.id}`}>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 