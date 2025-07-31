'use client';

import { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
import SimpleRichTextEditor from './SimpleRichTextEditor';

interface DOCXViewerProps {
  fileUrl: string;
  title?: string;
  editable?: boolean;
  onChange?: (content: string) => void;
  onContentExtracted?: (content: string) => void;
}

export default function DOCXViewer({ 
  fileUrl, 
  title, 
  editable = false, 
  onChange,
  onContentExtracted 
}: DOCXViewerProps) {
  const [content, setContent] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [formattingLost, setFormattingLost] = useState(false);
  const [conversionIssues, setConversionIssues] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<{
    fetched: boolean;
    size: number;
    converted: boolean;
    htmlLength: number;
    textLength: number;
    issues: number;
  }>({
    fetched: false,
    size: 0,
    converted: false,
    htmlLength: 0,
    textLength: 0,
    issues: 0
  });

  useEffect(() => {
    loadDocument();
  }, [fileUrl]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting DOCX loading for:', fileUrl);

      // Fetch the document with cache-busting
      const cacheBuster = `?v=${Date.now()}`;
      const fetchUrl = fileUrl.includes('?') ? `${fileUrl}&t=${Date.now()}` : `${fileUrl}${cacheBuster}`;
      const response = await fetch(fetchUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 Document fetched, size:', arrayBuffer.byteLength, 'bytes');
      
      setDebugInfo(prev => ({
        ...prev,
        fetched: true,
        size: arrayBuffer.byteLength
      }));

      // Convert DOCX to HTML using mammoth with comprehensive formatting options
      console.log('🔄 Starting mammoth conversion...');
      const result = await mammoth.convertToHtml({ 
        arrayBuffer,
        options: {
          styleMap: [
            // Standard Word heading styles
            "p[style-name='Heading 1'] => h1.word-heading1:fresh",
            "p[style-name='Heading 2'] => h2.word-heading2:fresh", 
            "p[style-name='Heading 3'] => h3.word-heading3:fresh",
            "p[style-name='Heading 4'] => h4.word-heading4:fresh",
            "p[style-name='Heading 5'] => h5.word-heading5:fresh",
            "p[style-name='Heading 6'] => h6.word-heading6:fresh",
            
            // Title and subtitle styles
            "p[style-name='Title'] => h1.word-title:fresh",
            "p[style-name='Subtitle'] => h2.word-subtitle:fresh",
            
            // Paragraph styles
            "p[style-name='Normal'] => p.word-normal:fresh",
            "p[style-name='Body Text'] => p.word-body:fresh",
            "p[style-name='List Paragraph'] => p.word-list-para:fresh",
            
            // Quote styles
            "p[style-name='Quote'] => blockquote.word-quote:fresh",
            "p[style-name='Intense Quote'] => blockquote.word-intense-quote:fresh",
            
            // Table styles
            "table => table.word-table:fresh",
            "table[style-name='Table Grid'] => table.word-table-grid:fresh",
            "table[style-name='Light Shading'] => table.word-table-light:fresh",
            "table[style-name='Medium Shading 1'] => table.word-table-medium:fresh",
            
            // List styles - try to preserve numbering
            "p[style-name='List'] => p.word-list:fresh",
            "p[style-name='List 2'] => p.word-list-2:fresh",
            "p[style-name='List 3'] => p.word-list-3:fresh",
            "p[style-name='List Number'] => p.word-list-number:fresh",
            "p[style-name='List Number 2'] => p.word-list-number-2:fresh",
            "p[style-name='List Number 3'] => p.word-list-number-3:fresh",
            
            // TOC styles
            "p[style-name='TOC 1'] => p.word-toc-1:fresh",
            "p[style-name='TOC 2'] => p.word-toc-2:fresh",
            "p[style-name='TOC 3'] => p.word-toc-3:fresh",
            
            // Header/Footer
            "p[style-name='Header'] => p.word-header:fresh",
            "p[style-name='Footer'] => p.word-footer:fresh",
            
            // Character styles
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "r[style-name='Intense Emphasis'] => strong.intense",
            "r[style-name='Subtle Emphasis'] => em.subtle"
          ],
          includeDefaultStyleMap: true,
          preserveEmptyParagraphs: true, // Keep empty paragraphs for spacing
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer,
                style: "max-width: 100%; height: auto;"
              };
            });
          }),
          // Transform functions for better formatting
          transformDocument: mammoth.transforms.paragraph(function(paragraph) {
            // Preserve paragraph alignment
            if (paragraph.alignment) {
              paragraph.styleName = paragraph.styleName || '';
              paragraph.styleName += ' align-' + paragraph.alignment;
            }
            return paragraph;
          })
        }
      });
      
      // Extract raw text for search/analysis
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      
      setContent(result.value);
      setRawText(textResult.value);
      setEditedContent(result.value);
      
      setDebugInfo(prev => ({
        ...prev,
        converted: true,
        htmlLength: result.value.length,
        textLength: textResult.value.length,
        issues: result.messages.length
      }));

      // Notify parent component if callback provided
      if (onContentExtracted) {
        onContentExtracted(textResult.value);
      }

      // Log conversion messages and warnings
      if (result.messages.length > 0) {
        console.group('🔍 DOCX Conversion Issues Found:');
        result.messages.forEach((message, index) => {
          const severity = message.type === 'error' ? '❌' : message.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`${severity} ${index + 1}. ${message.type}: ${message.message}`);
        });
        console.groupEnd();
        
        // Show user a warning if there are many conversion issues
        if (result.messages.length > 5) {
          console.warn(`⚠️ This document has ${result.messages.length} formatting issues. Some formatting may be lost.`);
        }
      }
      
      // Log document structure for debugging
      console.group('📄 Document Conversion Summary:');
      console.log('📊 Converted HTML length:', result.value.length);
      console.log('📝 Raw text length:', textResult.value.length);
      console.log('🔧 Conversion quality:', result.messages.length === 0 ? 'Good' : `${result.messages.length} issues found`);
      
      // Show preview of converted content
      const previewHTML = result.value.substring(0, 800);
      console.log('🔍 HTML preview:', previewHTML);
      
      // Check if the document seems to have lost significant formatting
      const hasHeadings = /<h[1-6]/.test(result.value);
      const hasTables = /<table/.test(result.value);
      const hasLists = /<[uo]l/.test(result.value);
      const hasFormatting = /<(strong|em|b|i)/.test(result.value);
      
      console.log('📋 Formatting preservation check:');
      console.log('  - Headings preserved:', hasHeadings ? '✅' : '❌');
      console.log('  - Tables preserved:', hasTables ? '✅' : '❌');
      console.log('  - Lists preserved:', hasLists ? '✅' : '❌');
      console.log('  - Text formatting preserved:', hasFormatting ? '✅' : '❌');
      
      // Set formatting loss warning
      const formatLossDetected = !hasHeadings && !hasTables && !hasLists && !hasFormatting;
      setFormattingLost(formatLossDetected);
      
      // Collect conversion issues for user display
      const issues = result.messages.map(msg => `${msg.type}: ${msg.message}`);
      setConversionIssues(issues);
      
      if (formatLossDetected) {
        console.warn('⚠️ WARNING: Most formatting appears to have been lost during conversion!');
        console.log('💡 TIP: This document may have complex formatting that mammoth.js cannot handle.');
      }
      console.groupEnd();
    } catch (err) {
      console.error('Error loading DOCX:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setContent(editedContent);
    setIsEditing(false);
    if (onChange) {
      onChange(editedContent);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center p-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-2 text-gray-600">{error}</p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 underline"
          >
            Download original file
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {editable && (
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mx-6 mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-sm">
          <div className="font-medium text-gray-800 mb-2">🔍 Debug Info:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Document fetched: {debugInfo.fetched ? '✅' : '❌'}</div>
            <div>Size: {debugInfo.size} bytes</div>
            <div>Converted: {debugInfo.converted ? '✅' : '❌'}</div>
            <div>HTML length: {debugInfo.htmlLength}</div>
            <div>Text length: {debugInfo.textLength}</div>
            <div>Issues: {debugInfo.issues}</div>
          </div>
          {conversionIssues.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-600">View Conversion Issues ({conversionIssues.length})</summary>
              <div className="mt-1 max-h-32 overflow-y-auto">
                {conversionIssues.map((issue, i) => (
                  <div key={i} className="text-xs text-red-600">{issue}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Formatting Loss Warning */}
      {formattingLost && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Formatting May Be Lost</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>This Word document contains complex formatting that cannot be fully preserved in the web viewer.</p>
                <div className="mt-2">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded text-amber-700 bg-white hover:bg-amber-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {isEditing ? (
          <div className="min-h-[400px]">
            <SimpleRichTextEditor
              content={editedContent}
              onChange={setEditedContent}
              placeholder="Edit document content..."
              className="min-h-[400px]"
            />
          </div>
        ) : (
          <div className="max-w-none">
            {/* Render the converted HTML */}
            <div 
              dangerouslySetInnerHTML={{ __html: content }}
              className="docx-content"
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        /* Base paragraph and text styles */
        .docx-content p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .docx-content p:empty {
          margin-bottom: 0.5em;
          min-height: 1em;
        }
        
        /* Word-specific paragraph styles */
        .docx-content p.word-normal {
          margin-bottom: 1em;
        }
        .docx-content p.word-body {
          margin-bottom: 0.8em;
          line-height: 1.5;
        }
        .docx-content p.word-list-para {
          margin-bottom: 0.5em;
          margin-left: 1.5em;
        }
        
        /* Word heading styles with proper hierarchy */
        .docx-content h1.word-heading1, .docx-content h1.word-title {
          font-size: 2.25em;
          font-weight: 700;
          margin: 1.5em 0 0.75em 0;
          color: #1f2937;
          line-height: 1.2;
          page-break-after: avoid;
        }
        .docx-content h2.word-heading2, .docx-content h2.word-subtitle {
          font-size: 1.875em;
          font-weight: 600;
          margin: 1.25em 0 0.5em 0;
          color: #1f2937;
          line-height: 1.25;
          page-break-after: avoid;
        }
        .docx-content h3.word-heading3 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
          color: #1f2937;
          line-height: 1.25;
        }
        .docx-content h4.word-heading4 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
          color: #1f2937;
        }
        .docx-content h5.word-heading5 {
          font-size: 1.125em;
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          color: #1f2937;
        }
        .docx-content h6.word-heading6 {
          font-size: 1em;
          font-weight: 600;
          margin: 0.75em 0 0.5em 0;
          color: #1f2937;
        }
        
        /* List styles with proper indentation */
        .docx-content ul, .docx-content ol {
          margin: 0.5em 0 1em 2em;
          line-height: 1.6;
        }
        .docx-content li {
          margin-bottom: 0.25em;
        }
        .docx-content p.word-list {
          margin-left: 1.5em;
          margin-bottom: 0.5em;
          position: relative;
        }
        .docx-content p.word-list-2 {
          margin-left: 3em;
          margin-bottom: 0.5em;
        }
        .docx-content p.word-list-3 {
          margin-left: 4.5em;
          margin-bottom: 0.5em;
        }
        .docx-content p.word-list-number {
          margin-left: 2em;
          margin-bottom: 0.5em;
          counter-increment: list-counter;
        }
        .docx-content p.word-list-number-2 {
          margin-left: 3.5em;
          margin-bottom: 0.5em;
        }
        .docx-content p.word-list-number-3 {
          margin-left: 5em;
          margin-bottom: 0.5em;
        }
        
        /* Table styles */
        .docx-content table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
          font-size: 0.9em;
        }
        .docx-content table.word-table {
          border: 1px solid #d1d5db;
        }
        .docx-content table.word-table-grid td, 
        .docx-content table.word-table-grid th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
        }
        .docx-content table.word-table-light th {
          background-color: #f8fafc;
        }
        .docx-content table.word-table-medium th {
          background-color: #e2e8f0;
        }
        .docx-content table td, .docx-content table th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }
        .docx-content table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .docx-content table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        /* Quote styles */
        .docx-content blockquote.word-quote {
          border-left: 4px solid #3b82f6;
          padding: 1em;
          margin: 1em 0;
          background-color: #f8fafc;
          font-style: italic;
          color: #6b7280;
        }
        .docx-content blockquote.word-intense-quote {
          border-left: 6px solid #1d4ed8;
          padding: 1.5em;
          margin: 1.5em 0;
          background-color: #eff6ff;
          font-style: italic;
          font-weight: 500;
          color: #1e40af;
        }
        
        /* TOC styles */
        .docx-content p.word-toc-1 {
          font-weight: 600;
          margin-bottom: 0.5em;
          font-size: 1.1em;
        }
        .docx-content p.word-toc-2 {
          margin-left: 1.5em;
          margin-bottom: 0.25em;
          font-weight: 500;
        }
        .docx-content p.word-toc-3 {
          margin-left: 3em;
          margin-bottom: 0.25em;
        }
        
        /* Header/Footer styles */
        .docx-content p.word-header {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5em;
          margin-bottom: 1em;
          font-size: 0.9em;
          color: #6b7280;
        }
        .docx-content p.word-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 0.5em;
          margin-top: 1em;
          font-size: 0.9em;
          color: #6b7280;
        }
        
        /* Text alignment classes */
        .docx-content .align-left { text-align: left; }
        .docx-content .align-center { text-align: center; }
        .docx-content .align-right { text-align: right; }
        .docx-content .align-justify { text-align: justify; }
        
        /* Character formatting */
        .docx-content strong {
          font-weight: 600;
        }
        .docx-content strong.intense {
          font-weight: 700;
          color: #1f2937;
        }
        .docx-content em {
          font-style: italic;
        }
        .docx-content em.subtle {
          font-style: italic;
          color: #6b7280;
        }
        
        /* Images */
        .docx-content img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          border-radius: 4px;
          display: block;
        }
        
        /* Code styles */
        .docx-content code {
          background-color: #f3f4f6;
          padding: 0.25em 0.5em;
          border-radius: 3px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9em;
        }
        .docx-content pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        /* Links */
        .docx-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .docx-content a:hover {
          color: #2563eb;
        }
        
        /* Page break avoidance */
        .docx-content h1, .docx-content h2, .docx-content h3 {
          page-break-after: avoid;
        }
        .docx-content table {
          page-break-inside: avoid;
        }
      `}</style>
    </div>
  );
}