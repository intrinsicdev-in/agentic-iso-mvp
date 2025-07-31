'use client';

import { useState } from 'react';

export default function DuplicateTestButton() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDuplicateAPI = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Check if token exists
      const token = localStorage.getItem('authToken'); 
      
      if (!token) {
        setResult('❌ No auth token found - please log in first');
        return;
      }
      
      console.log('Testing duplicate API with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/duplicates/detect', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        setResult(`✅ Success! Found ${data.data?.duplicateGroups?.length || 0} duplicate groups`);
      } else {
        setResult(`❌ Error ${response.status}: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Duplicate API Test</h3>
      <button
        onClick={testDuplicateAPI}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Duplicate Detection API'}
      </button>
      {result && (
        <div className="mt-2 p-2 bg-white border rounded text-sm">
          {result}
        </div>
      )}
    </div>
  );
}