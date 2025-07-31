'use client';

import { useState, useEffect } from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentView from '@/components/DocumentView';
import Dashboard from '@/components/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [artefacts, setArtefacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'simple'>('dashboard');
  const { token } = useAuth();

  const fetchData = () => {
    setLoading(true);
    
    // Test backend connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(`✅ Connected - ${data.status}`))
      .catch(() => setBackendStatus('❌ Backend not connected'));

    // Fetch artefacts with authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/artefacts', { headers })
      .then(res => res.json())
      .then(data => {
        setArtefacts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching artefacts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <ProtectedRoute>
      <div>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome to your ISO compliance management system</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  backendStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {backendStatus}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      currentView === 'dashboard' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('simple')}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      currentView === 'simple' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Simple View
                  </button>
                </div>
                <DocumentUpload onUploadComplete={fetchData} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'dashboard' ? (
            <Dashboard onSelectDocument={setSelectedDocumentId} />
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Documents {!loading && `(${artefacts.length})`}
                </h2>
                {loading ? (
                  <p className="text-gray-500">Loading documents...</p>
                ) : artefacts.length === 0 ? (
                  <p className="text-gray-500">No documents found. Upload your first document to get started.</p>
                ) : (
                  <div className="space-y-2">
                    {artefacts.map((artefact) => (
                      <div 
                        key={artefact.id} 
                        className="border p-3 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedDocumentId(artefact.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{artefact.title}</h3>
                            <p className="text-sm text-gray-600">{artefact.description}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Owner: {artefact.owner?.name || 'Unknown'} | 
                              Versions: {artefact._count?.versions || 0} | 
                              Clauses: {artefact._count?.clauseMappings || 0}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              artefact.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              artefact.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {artefact.status}
                            </span>
                            <span className="text-xs text-blue-600">View →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🧪 Document Management Features</h3>
                <p className="text-sm text-blue-800">
                  Click on any document to view, edit, add comments, create reviews, and manage tasks. 
                  The system supports collaborative document management with version control.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Document View Modal */}
        {selectedDocumentId && (
          <DocumentView
            documentId={selectedDocumentId}
            onClose={() => setSelectedDocumentId(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}