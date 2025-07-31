'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { safeJsonParse } from '../utils/api';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DocumentUpload({ onUploadComplete, isOpen: propIsOpen, onClose }: DocumentUploadProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use prop isOpen if explicitly controlled (has onClose), otherwise use internal state
  const isControlled = onClose !== undefined;
  const isOpen = isControlled ? propIsOpen : internalIsOpen;
  
  // Debug logging
  console.log('DocumentUpload render:', {
    isControlled,
    propIsOpen,
    internalIsOpen,
    isOpen,
    hasOnClose: !!onClose
  });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001_2015');
  const [autoClassify, setAutoClassify] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    file: File;
    duplicates: Array<{id: string; title: string; currentVersion: number}>;
  } | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const { token } = useAuth();

  const checkForDuplicates = async (filename: string) => {
    try {
      setCheckingDuplicates(true);
      const token = localStorage.getItem('authToken');
      if (!token) return [];

      // Normalize filename for comparison (remove extension and version info)
      const normalizedName = filename
        .toLowerCase()
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .replace(/[_\-\.]/g, ' ') // Replace separators with spaces
        .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '') // Remove dates
        .replace(/v\d+(\.\d+)?/gi, '') // Remove version numbers
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .trim();

      // Get existing documents
      const response = await fetch('/api/artefacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return [];

      const documents = await safeJsonParse(response);
      
      // Check for potential duplicates using simple title matching
      const potentialDuplicates = documents.filter((doc: any) => {
        const docNormalized = doc.title
          .toLowerCase()
          .replace(/[_\-\.]/g, ' ')
          .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '')
          .replace(/v\d+(\.\d+)?/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Check for similar titles (simple contains check)
        return docNormalized.includes(normalizedName.slice(0, 10)) || 
               normalizedName.includes(docNormalized.slice(0, 10)) ||
               docNormalized === normalizedName;
      });

      return potentialDuplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Check for duplicates first
    const duplicates = await checkForDuplicates(file.name);
    
    if (duplicates.length > 0) {
      setDuplicateWarning({
        file,
        duplicates: duplicates.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          currentVersion: doc.currentVersion
        }))
      });
      return;
    }

    // If no duplicates, proceed with upload
    await performUpload(file);
  }, [selectedStandard, autoClassify, onUploadComplete]);

  const performUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('standard', selectedStandard);
    formData.append('autoClassify', autoClassify.toString());

    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch('/api/artefacts/import', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await safeJsonParse(response);
      setUploadResult({
        success: true,
        data: result
      });

      // Refresh the page after successful upload
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProceedWithUpload = async () => {
    if (duplicateWarning) {
      await performUpload(duplicateWarning.file);
      setDuplicateWarning(null);
    }
  };

  const handleCancelUpload = () => {
    setDuplicateWarning(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleClose = () => {
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleButtonClick = () => {
    console.log('Button clicked! isControlled:', isControlled, 'internalIsOpen:', internalIsOpen);
    setInternalIsOpen(true);
    console.log('After setState - internalIsOpen should be true');
  };

  if (!isOpen) {
    // If controlled by parent, don't render anything when closed
    if (isControlled) {
      return null;
    }
    
    // Only render button for uncontrolled (standalone) mode
    return (
      <button
        onClick={handleButtonClick}
        className="bg-primary-500 text-white p-4 rounded hover:bg-primary-600 transition-colors"
      >
        Upload Document
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload ISO Document</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ISO Standard</label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full border rounded p-2"
              disabled={uploading}
            >
              <option value="ISO_9001_2015">ISO 9001:2015</option>
              <option value="ISO_27001_2022">ISO 27001:2022</option>
              <option value="ISO_27001_2013">ISO 27001:2013</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoClassify}
                onChange={(e) => setAutoClassify(e.target.checked)}
                className="mr-2"
                disabled={uploading}
              />
              <span className="text-sm">Automatically classify to ISO clauses</span>
            </label>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here...</p>
            ) : uploading ? (
              <p>Uploading...</p>
            ) : (
              <div>
                <p className="mb-2">Drag & drop a document here, or click to select</p>
                <p className="text-sm text-gray-500">
                  Supported: PDF, Word, Excel, Text
                </p>
              </div>
            )}
          </div>

          {uploadResult && (
            <div className={`p-4 rounded ${uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {uploadResult.success ? (
                <div>
                  <p className="font-semibold">✅ Upload successful!</p>
                  <p className="text-sm mt-1">
                    Document classified to {uploadResult.data?.mappings?.length || 0} ISO clauses
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">❌ Upload failed</p>
                  <p className="text-sm mt-1">{uploadResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Potential Duplicates Detected</h3>
                <p className="text-sm text-gray-600">
                  We found {duplicateWarning.duplicates.length} similar document{duplicateWarning.duplicates.length > 1 ? 's' : ''} already in your system.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Uploading: <span className="font-normal text-blue-600">{duplicateWarning.file.name}</span>
              </h4>
              
              <h4 className="text-sm font-medium text-gray-900 mb-2">Similar documents found:</h4>
              <div className="max-h-32 overflow-y-auto border rounded-md">
                {duplicateWarning.duplicates.map((doc, index) => (
                  <div key={doc.id} className={`p-2 ${index > 0 ? 'border-t' : ''}`}>
                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                    <div className="text-xs text-gray-500">Version {doc.currentVersion}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-yellow-700">
                    Uploading this document may create duplicates. Consider whether this is a new version of an existing document or truly unique content.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel Upload
              </button>
              <button
                onClick={handleProceedWithUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Upload Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for duplicate checking */}
      {checkingDuplicates && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Checking for duplicates...</span>
          </div>
        </div>
      )}
    </div>
  );
}