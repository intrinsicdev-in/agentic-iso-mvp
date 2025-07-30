'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UploadForm {
  title: string;
  isoStandard: 'ISO 9001:2015' | 'ISO 27001:2022';
  clause: string;
  owner: string;
}

export default function UploadISOPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<UploadForm>({
    title: '',
    isoStandard: 'ISO 9001:2015',
    clause: '',
    owner: ''
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
        return;
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size too large. Please upload a file smaller than 50MB.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setError('Please select a file to upload.');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('isoStandard', formData.isoStandard);
      formDataToSend.append('clause', formData.clause);
      formDataToSend.append('owner', formData.owner);

      const response = await fetch('http://localhost:3001/api/artefacts/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload ISO book');
      }

      const result = await response.json();
      console.log('ISO book uploaded:', result);
      
      setSuccess('ISO book uploaded successfully!');
      setUploadProgress(100);
      
      // Redirect to artefacts list after a short delay
      setTimeout(() => {
        router.push('/artefacts');
      }, 2000);
    } catch (error) {
      console.error('Failed to upload ISO book:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload ISO book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UploadForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clauseOptions = [
    'ISO 9001:2015 - 4.1 Understanding the organization and its context',
    'ISO 9001:2015 - 4.2 Understanding the needs and expectations of interested parties',
    'ISO 9001:2015 - 4.3 Determining the scope of the quality management system',
    'ISO 9001:2015 - 4.4 Quality management system and its processes',
    'ISO 9001:2015 - 5.1 Leadership and commitment',
    'ISO 9001:2015 - 5.2 Policy',
    'ISO 9001:2015 - 5.3 Organizational roles, responsibilities and authorities',
    'ISO 9001:2015 - 6.1 Actions to address risks and opportunities',
    'ISO 9001:2015 - 6.2 Quality objectives and planning to achieve them',
    'ISO 9001:2015 - 6.3 Planning of changes',
    'ISO 9001:2015 - 7.1 Resources',
    'ISO 9001:2015 - 7.2 Competence',
    'ISO 9001:2015 - 7.3 Awareness',
    'ISO 9001:2015 - 7.4 Communication',
    'ISO 9001:2015 - 7.5 Documented information',
    'ISO 9001:2015 - 8.1 Operational planning and control',
    'ISO 9001:2015 - 8.2 Requirements for products and services',
    'ISO 9001:2015 - 8.3 Design and development of products and services',
    'ISO 9001:2015 - 8.4 Control of externally provided processes, products and services',
    'ISO 9001:2015 - 8.5 Production and service provision',
    'ISO 9001:2015 - 8.6 Release of products and services',
    'ISO 9001:2015 - 8.7 Control of nonconforming outputs',
    'ISO 9001:2015 - 9.1 Monitoring, measurement, analysis and evaluation',
    'ISO 9001:2015 - 9.2 Internal audit',
    'ISO 9001:2015 - 9.3 Management review',
    'ISO 9001:2015 - 10.1 General',
    'ISO 9001:2015 - 10.2 Nonconformity and corrective action',
    'ISO 9001:2015 - 10.3 Continual improvement',
    'ISO 27001:2022 - 4.1 Understanding the organization and its context',
    'ISO 27001:2022 - 4.2 Understanding the needs and expectations of interested parties',
    'ISO 27001:2022 - 4.3 Determining the scope of the information security management system',
    'ISO 27001:2022 - 4.4 Information security management system',
    'ISO 27001:2022 - 5.1 Leadership and commitment',
    'ISO 27001:2022 - 5.2 Policy',
    'ISO 27001:2022 - 5.3 Organizational roles, responsibilities and authorities',
    'ISO 27001:2022 - 6.1 Actions to address risks and opportunities',
    'ISO 27001:2022 - 6.2 Information security objectives and planning to achieve them',
    'ISO 27001:2022 - 7.1 Resources',
    'ISO 27001:2022 - 7.2 Competence',
    'ISO 27001:2022 - 7.3 Awareness',
    'ISO 27001:2022 - 7.4 Communication',
    'ISO 27001:2022 - 7.5 Documented information',
    'ISO 27001:2022 - 8.1 Operational planning and control',
    'ISO 27001:2022 - 8.2 Information security risk assessment',
    'ISO 27001:2022 - 8.3 Information security risk treatment',
    'ISO 27001:2022 - 9.1 Monitoring, measurement, analysis and evaluation',
    'ISO 27001:2022 - 9.2 Internal audit',
    'ISO 27001:2022 - 9.3 Management review',
    'ISO 27001:2022 - 10.1 Nonconformity and corrective action',
    'ISO 27001:2022 - 10.2 Continual improvement'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload ISO Book</h1>
            <p className="mt-2 text-gray-600">Upload existing ISO 9001 or 27001 documentation</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              ISO Book File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 50MB
                  </p>
                </div>
              </label>
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <DocumentTextIcon className="inline h-4 w-4 mr-2" />
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Book Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
              placeholder="e.g., Quality Management Manual, Information Security Policy"
            />
          </div>

          {/* ISO Standard */}
          <div>
            <label htmlFor="isoStandard" className="block text-sm font-semibold text-gray-900 mb-2">
              ISO Standard *
            </label>
            <select
              id="isoStandard"
              required
              value={formData.isoStandard}
              onChange={(e) => handleChange('isoStandard', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="ISO 9001:2015">ISO 9001:2015 (Quality Management)</option>
              <option value="ISO 27001:2022">ISO 27001:2022 (Information Security)</option>
            </select>
          </div>

          {/* Clause */}
          <div>
            <label htmlFor="clause" className="block text-sm font-semibold text-gray-900 mb-2">
              Primary ISO Clause *
            </label>
            <select
              id="clause"
              required
              value={formData.clause}
              onChange={(e) => handleChange('clause', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select an ISO clause...</option>
              {clauseOptions.map((clause, index) => (
                <option key={index} value={clause}>
                  {clause}
                </option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="owner" className="block text-sm font-semibold text-gray-900 mb-2">
              Owner *
            </label>
            <input
              type="text"
              id="owner"
              required
              value={formData.owner}
              onChange={(e) => handleChange('owner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
              placeholder="e.g., Quality Manager, CISO"
            />
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload ISO Book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 