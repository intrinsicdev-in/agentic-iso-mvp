'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'welcome' | 'business-info' | 'standard-selection' | 'document-import' | 'review';

interface BusinessInfo {
  businessName: string;
  sicCode: string;
  timezone: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  objectives: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    sicCode: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    industry: '',
    size: 'medium',
    objectives: []
  });
  const [onboardingMethod, setOnboardingMethod] = useState<'upload' | 'generate' | null>(null);

  const handleStandardToggle = (standard: string) => {
    setSelectedStandards(prev => 
      prev.includes(standard) 
        ? prev.filter(s => s !== standard)
        : [...prev, standard]
    );
  };

  const renderWelcomeStep = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to ETS Aero ISO</h1>
      <p className="text-xl text-gray-600 mb-8">
        Let\'s set up your ISO compliance management system
      </p>
      
      <div className="space-y-4 max-w-md mx-auto">
        <div 
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
            selectedStandards.includes('ISO_9001_2015') 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handleStandardToggle('ISO_9001_2015')}
        >
          <h3 className="font-semibold text-lg mb-2">ISO 9001:2015</h3>
          <p className="text-gray-600">Quality Management System</p>
        </div>
        
        <div 
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
            selectedStandards.includes('ISO_27001_2022') 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handleStandardToggle('ISO_27001_2022')}
        >
          <h3 className="font-semibold text-lg mb-2">ISO 27001:2022</h3>
          <p className="text-gray-600">Information Security Management System</p>
        </div>
      </div>
      
      <button
        onClick={() => setCurrentStep('business-info')}
        disabled={selectedStandards.length === 0}
        className="mt-8 bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );

  const renderBusinessInfoStep = () => (
    <div>
      <h2 className="text-3xl font-bold mb-6">Tell us about your business</h2>
      
      <div className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-2">Business Name</label>
          <input
            type="text"
            value={businessInfo.businessName}
            onChange={(e) => setBusinessInfo({...businessInfo, businessName: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Acme Corporation"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">SIC Code</label>
          <input
            type="text"
            value={businessInfo.sicCode}
            onChange={(e) => setBusinessInfo({...businessInfo, sicCode: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="6201"
          />
          <p className="text-xs text-gray-500 mt-1">Standard Industrial Classification code</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Industry</label>
          <select
            value={businessInfo.industry}
            onChange={(e) => setBusinessInfo({...businessInfo, industry: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select industry</option>
            <option value="technology">Technology</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="retail">Retail</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Company Size</label>
          <div className="space-x-4">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <label key={size} className="inline-flex items-center">
                <input
                  type="radio"
                  value={size}
                  checked={businessInfo.size === size}
                  onChange={(e) => setBusinessInfo({...businessInfo, size: size})}
                  className="mr-2"
                />
                <span className="capitalize">{size}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Timezone</label>
          <select
            value={businessInfo.timezone}
            onChange={(e) => setBusinessInfo({...businessInfo, timezone: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Central European Time</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>
      
      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => setCurrentStep('welcome')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep('standard-selection')}
          disabled={!businessInfo.businessName || !businessInfo.industry}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStandardSelectionStep = () => (
    <div>
      <h2 className="text-3xl font-bold mb-6">How would you like to get started?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div 
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
            onboardingMethod === 'upload' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setOnboardingMethod('upload')}
        >
          <div className="text-4xl mb-4">📤</div>
          <h3 className="font-semibold text-lg mb-2">Upload Existing Documents</h3>
          <p className="text-gray-600">
            I have existing ISO documentation that I\'d like to import and classify
          </p>
          <ul className="mt-4 text-sm text-gray-500 space-y-1">
            <li>• Quality manuals</li>
            <li>• Procedures</li>
            <li>• Work instructions</li>
            <li>• Records</li>
          </ul>
        </div>
        
        <div 
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
            onboardingMethod === 'generate' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setOnboardingMethod('generate')}
        >
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="font-semibold text-lg mb-2">Generate from Business Info</h3>
          <p className="text-gray-600">
            Help me create ISO documentation based on my business profile
          </p>
          <ul className="mt-4 text-sm text-gray-500 space-y-1">
            <li>• AI-powered templates</li>
            <li>• Industry best practices</li>
            <li>• Customized to your needs</li>
            <li>• Compliance-ready</li>
          </ul>
        </div>
      </div>
      
      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => setCurrentStep('business-info')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (onboardingMethod === 'upload') {
              setCurrentStep('document-import');
            } else {
              // For generate path, we would show a questionnaire
              // For now, skip to review
              setCurrentStep('review');
            }
          }}
          disabled={!onboardingMethod}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderDocumentImportStep = () => (
    <div>
      <h2 className="text-3xl font-bold mb-6">Import your existing documents</h2>
      <p className="text-gray-600 mb-8">
        Upload your ISO documentation and we\'ll automatically classify them to the appropriate clauses
      </p>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
        <p className="text-sm text-gray-500">Supports PDF, Word, Excel, and text files</p>
        <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Select Files
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can upload multiple files at once. Our AI will analyze each document 
          and suggest appropriate ISO clause mappings.
        </p>
      </div>
      
      <div className="flex space-x-4 mt-8">
        <button
          onClick={() => setCurrentStep('standard-selection')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <h2 className="text-3xl font-bold mb-6">Setup Complete!</h2>
      <p className="text-gray-600 mb-8">
        Here\'s a summary of your ISO compliance setup:
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <span className="font-medium">Business:</span> {businessInfo.businessName}
        </div>
        <div>
          <span className="font-medium">Industry:</span> {businessInfo.industry}
        </div>
        <div>
          <span className="font-medium">Standards:</span> {selectedStandards.join(', ')}
        </div>
        <div>
          <span className="font-medium">Setup Method:</span> {onboardingMethod === 'upload' ? 'Document Import' : 'AI Generation'}
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2">🎉 Next Steps</h3>
        <ul className="space-y-2 text-sm text-green-800">
          <li>• Your compliance calendar has been created with key dates</li>
          <li>• AI agents are ready to help with document review</li>
          <li>• Dashboard is customized for your industry</li>
        </ul>
      </div>
      
      <button
        onClick={() => {
          // Save onboarding data and redirect to dashboard
          localStorage.setItem('onboardingComplete', 'true');
          localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
          localStorage.setItem('selectedStandards', JSON.stringify(selectedStandards));
          router.push('/');
        }}
        className="mt-8 bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600"
      >
        Go to Dashboard
      </button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'business-info':
        return renderBusinessInfoStep();
      case 'standard-selection':
        return renderStandardSelectionStep();
      case 'document-import':
        return renderDocumentImportStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['welcome', 'business-info', 'standard-selection', 'document-import', 'review'] as OnboardingStep[]).map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < 4 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {renderStep()}
      </div>
    </div>
  );
}