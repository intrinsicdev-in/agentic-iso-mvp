'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface ArtefactForm {
  title: string;
  type: 'policy' | 'procedure' | 'work-instruction' | 'form' | 'record' | 'iso-book';
  clause: string;
  content: string;
  owner: string;
}

export default function CreateArtefactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArtefactForm>({
    title: '',
    type: 'policy',
    clause: '',
    content: '',
    owner: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/artefacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create artefact');
      }

      const result = await response.json();
      console.log('Artefact created:', result);
      
      // Redirect to artefacts list
      router.push('/artefacts');
    } catch (error) {
      console.error('Failed to create artefact:', error);
      setError('Failed to create artefact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ArtefactForm, value: string) => {
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Artefact</h1>
            <p className="mt-2 text-gray-600">Add new ISO documentation with clause mapping</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Artefact Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
              placeholder="e.g., Quality Policy, Information Security Procedure"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
              Document Type *
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="policy">Policy</option>
              <option value="procedure">Procedure</option>
              <option value="work-instruction">Work Instruction</option>
              <option value="form">Form</option>
              <option value="record">Record</option>
              <option value="iso-book">ISO Book</option>
            </select>
          </div>

          {/* Clause */}
          <div>
            <label htmlFor="clause" className="block text-sm font-semibold text-gray-900 mb-2">
              ISO Clause *
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

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              required
              rows={12}
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white resize-vertical"
              placeholder="Enter the artefact content here..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Include all relevant information, procedures, and requirements for this artefact.
            </p>
          </div>

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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Artefact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 