'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import SimpleRichTextEditor from './SimpleRichTextEditor';
import ExcelViewer from './ExcelViewer';
// Remove PDFViewer import - we'll inline it to avoid chunk loading issues
import DOCXViewer from './DOCXViewer';
import { safeJsonParse } from '../utils/api';
import * as mammoth from 'mammoth';

interface DocumentViewProps {
  documentId: string;
  onClose?: () => void;
}

interface Document {
  id: string;
  title: string;
  description: string;
  currentVersion: number;
  status: string;
  fileUrl: string;
  metadata: any;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  versions: Array<{
    id: string;
    version: number;
    content: string;
    fileUrl: string;
    changes: string;
    createdAt: string;
    createdById: string;
  }>;
  reviews: Array<{
    id: string;
    status: string;
    comments: string;
    createdAt: string;
    reviewer: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  clauseMappings: Array<{
    id: string;
    confidence: number;
    keywords: string[];
    clause: {
      id: string;
      clauseNumber: string;
      title: string;
      description: string;
    };
  }>;
}

// Inline PDF viewer component to avoid chunk loading issues
const InlinePDFViewer = ({ fileUrl, title }: { fileUrl: string; title?: string }) => {
  const proxyUrl = typeof window !== 'undefined' && fileUrl.startsWith('http') && !fileUrl.includes(window.location.hostname)
    ? `/api/proxy?url=${encodeURIComponent(fileUrl)}`
    : fileUrl;

  return (
    <div className="w-full h-full min-h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">PDF Document</p>
          </div>
          <div className="flex items-center space-x-2">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Open in New Tab
            </a>
          </div>
        </div>
      )}
      
      <div className="flex-1 h-full">
        <iframe
          src={proxyUrl}
          className="w-full h-full min-h-[550px] border-0"
          title={title || 'PDF Document'}
        />
      </div>
    </div>
  );
};

export default function DocumentView({ documentId, onClose }: DocumentViewProps) {
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'reviews' | 'comments' | 'tasks' | 'history'>('content');
  
  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [loadingDocxContent, setLoadingDocxContent] = useState(false);
  const [editedPlainText, setEditedPlainText] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Comment states
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Review states
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewComments, setReviewComments] = useState('');

  // Task states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(2);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchDocument();
    fetchComments();
    fetchTasks();
  }, [documentId]);

  // Convert HTML to plain text when client is ready and document is loaded
  useEffect(() => {
    if (isClient && documentData?.versions[0]?.content && !editedPlainText) {
      const docContent = documentData.versions[0].content;
      const plainText = htmlToPlainText(docContent);
      setEditedPlainText(plainText);
    }
  }, [isClient, documentData, editedPlainText]);

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/artefacts/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch document');
      const data = await safeJsonParse(response);
      setDocumentData(data);
      setEditedTitle(data.title);
      setEditedContent(data.versions[0]?.content || '');
      setEditedStatus(data.status);
      
      
      
      // For DOCX files, we need to extract content from the file URL if no content exists
      const fileType = data.metadata?.fileType || '';
      const fileName = (data.fileUrl || '').toLowerCase();
      if ((fileType === 'application/vnd.openxmlformats-officedocumentData.wordprocessingml.document' || 
           fileType === 'application/msword' ||
           fileName.endsWith('.docx') || 
           fileName.endsWith('.doc')) && 
          (!data.versions[0]?.content || data.versions[0].content.trim() === '')) {
        // Content will be extracted when editing
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`/api/artefacts/${documentId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await safeJsonParse(response);
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`/api/artefacts/${documentId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await safeJsonParse(response);
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      // Convert plain text back to HTML for saving
      const htmlContent = plainTextToHtml(editedPlainText);
      
      const saveData = {
        title: editedTitle,
        content: htmlContent,
        status: editedStatus
      };
      
      const response = await fetch(`/api/artefacts/${documentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update document: ${response.status} ${errorText}`);
      }
      
      // Update the stored HTML content
      setEditedContent(htmlContent);
      
      await fetchDocument();
      setIsEditing(false);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save document');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/artefacts/${documentId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          parentId: replyTo
        })
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  const handleAddReview = async () => {
    if (!reviewComments.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/artefacts/${documentId}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          comments: reviewComments
        })
      });

      if (!response.ok) throw new Error('Failed to add review');
      
      setReviewComments('');
      await fetchDocument();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add review');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/artefacts/${documentId}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          dueDate: newTaskDueDate,
          priority: newTaskPriority
        })
      });

      if (!response.ok) throw new Error('Failed to add task');
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskPriority(2);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/artefacts/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update task');
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const extractDOCXContent = async (fileUrl: string): Promise<string> => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') {
        return '';
      }
      
      console.log('Fetching DOCX from URL:', fileUrl);
      
      // Add authentication token if needed
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      if (token && !fileUrl.startsWith('http')) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(fileUrl, { headers });
      console.log('Fetch response status:', response.status);
      console.log('Fetch response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('ArrayBuffer size:', arrayBuffer.byteLength);
      
      const result = await mammoth.convertToHtml({ arrayBuffer });
      console.log('Mammoth conversion result:', result);
      console.log('Mammoth messages:', result.messages);
      
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw error; // Re-throw to see the actual error
    }
  };

  const handleEditMode = async () => {
    if (!documentData) return;
    
    // For DOCX files, load the appropriate content for editing
    const fileType = documentData.metadata?.fileType || '';
    const fileName = (documentData.fileUrl || '').toLowerCase();
    const isDOCX = fileType === 'application/vnd.openxmlformats-officedocumentData.wordprocessingml.document' || 
                   fileType === 'application/msword' ||
                   fileName.endsWith('.docx') || 
                   fileName.endsWith('.doc');
    
    if (isDOCX) {
      // Check if we already have edited content saved
      if (documentData.versions[0]?.content && documentData.versions[0].content.trim() !== '') {
        // Use the saved edited content
        const htmlContent = documentData.versions[0].content;
        setEditedContent(htmlContent);
        // Convert to plain text for editing
        if (isClient) {
          const plainText = htmlToPlainText(htmlContent);
          setEditedPlainText(plainText);
        }
      } else {
        // Extract content from original DOCX file
        setLoadingDocxContent(true);
        try {
          const extractedContent = await extractDOCXContent(documentData.fileUrl);
          setEditedContent(extractedContent);
          // Convert to plain text for editing
          if (isClient) {
            const plainText = htmlToPlainText(extractedContent);
            setEditedPlainText(plainText);
          }
        } catch (error) {
          console.error('Failed to extract DOCX content:', error);
          setError('Failed to extract document content for editing');
        } finally {
          setLoadingDocxContent(false);
        }
      }
    }
    
    setIsEditing(true);
  };

  // Utility functions for HTML/text conversion
  const htmlToPlainText = (html: string): string => {
    // Only run on client side with DOM available
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
      return html;
    }
    
    try {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Better conversion that preserves paragraph structure
      let text = '';
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (textContent) {
            text += textContent;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = (node as Element).tagName.toLowerCase();
          // Add line breaks for block elements
          if (['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            if (text && !text.endsWith('\n')) {
              text += '\n';
            }
          } else if (['li'].includes(tagName)) {
            text += '\n• ';
          } else if (tagName === 'ul' || tagName === 'ol') {
            text += '\n';
          }
        }
      }
      
      // Clean up extra newlines but preserve paragraph breaks
      return text
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 newlines
        .replace(/^\s+|\s+$/g, '') // Trim start/end
        .replace(/[ \t]+/g, ' '); // Normalize spaces
        
    } catch (error) {
      console.error('Error converting HTML to plain text:', error);
      // Fallback to simple text extraction
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
  };

  const plainTextToHtml = (text: string): string => {
    if (!text || text.trim() === '') {
      return '<p>&nbsp;</p>';
    }
    
    // Convert plain text to HTML with proper paragraph structure
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Handle bullet points
      .replace(/\n\s*•\s*/g, '\n• ')
      // Split into paragraphs on double line breaks
      .split(/\n\s*\n/)
      .map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Handle bullet lists
        if (trimmed.includes('\n• ')) {
          const items = trimmed.split('\n• ').filter(item => item.trim());
          const firstItem = items[0];
          const listItems = items.slice(1);
          
          let html = '';
          if (firstItem && !firstItem.startsWith('• ')) {
            html += `<p>${firstItem.replace(/\n/g, '<br>')}</p>`;
          }
          
          if (listItems.length > 0) {
            html += '<ul>';
            listItems.forEach(item => {
              html += `<li>${item.trim().replace(/\n/g, '<br>')}</li>`;
            });
            html += '</ul>';
          }
          
          return html;
        } else {
          // Regular paragraph - convert single line breaks to <br>
          return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        }
      })
      .filter(p => p) // Remove empty paragraphs
      .join('');
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
          status: editingTask.status
        })
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      setIsEditingTask(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  if (loading) return <div className="p-6">Loading documentData...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!documentData) return <div className="p-6">Document not found</div>;

  const renderCommentTree = (comment: any, depth = 0) => (
    <div key={comment.id} className={`border-l-2 ${depth > 0 ? 'ml-4 pl-4 border-gray-200' : 'border-transparent'}`}>
      <div className="bg-gray-50 p-3 rounded mb-2">
        <div className="flex justify-between items-start mb-2">
          <span className="font-medium text-sm">{comment.author.name}</span>
          <span className="text-xs text-gray-500">{format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}</span>
        </div>
        <p className="text-sm">{comment.content}</p>
        <button
          onClick={() => setReplyTo(comment.id)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
        >
          Reply
        </button>
      </div>
      {comment.replies?.map((reply: any) => renderCommentTree(reply, depth + 1))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">{documentData.title}</h1>
            <p className="text-gray-600">{documentData.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Version {documentData.currentVersion}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                documentData.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                documentData.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {documentData.status}
              </span>
              <span>Owner: {documentData.owner.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['content', 'reviews', 'comments', 'tasks', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'comments' && comments.length > 0 && ` (${comments.length})`}
                {tab === 'tasks' && tasks.length > 0 && ` (${tasks.length})`}
                {tab === 'reviews' && documentData.reviews.length > 0 && ` (${documentData.reviews.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Document Content</h3>
                <button
                  onClick={() => {
                    if (isEditing) {
                      // Cancel editing - restore original content
                      if (documentData?.versions[0]?.content) {
                        const htmlContent = documentData.versions[0].content;
                        setEditedContent(htmlContent);
                        if (isClient) {
                          const plainText = htmlToPlainText(htmlContent);
                          setEditedPlainText(plainText);
                        }
                      }
                      setIsEditing(false);
                    } else {
                      handleEditMode();
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="border rounded p-2"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    {(() => {
                      const fileUrl = documentData.fileUrl || '';
                      const fileType = documentData.metadata?.fileType || '';
                      const fileName = fileUrl.toLowerCase();
                      
                      // For PDF files, show message that they can't be edited inline
                      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                            <p className="text-yellow-800">PDF files cannot be edited directly. Please upload a new version.</p>
                          </div>
                        );
                      }
                      
                      // For DOCX files, use SimpleRichTextEditor with extracted content
                      if (fileType === 'application/vnd.openxmlformats-officedocumentData.wordprocessingml.document' || 
                          fileType === 'application/msword' ||
                          fileName.endsWith('.docx') || 
                          fileName.endsWith('.doc')) {
                        if (loadingDocxContent) {
                          return (
                            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Extracting document content for editing...</p>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-blue-800 text-sm">
                                Editing DOCX content as rich text. Original formatting may be simplified.
                              </p>
                              {/* Debug info */}
                              <p className="text-xs text-blue-600 mt-1">
                                Content length: {editedContent.length} characters
                              </p>
                            </div>
                            
                            
                            {/* Plain Text Editor for Clean Editing */}
                            <div className="border rounded-lg">
                              <div className="bg-gray-50 p-2 border-b flex items-center justify-between">
                                <span className="text-sm font-medium">Document Editor</span>
                                <div className="flex items-center space-x-2 text-xs">
                                  <span className="text-gray-600">{editedPlainText.length} characters</span>
                                  <span className="text-gray-500">|</span>
                                  <span className="text-gray-600">{editedPlainText.split(/\s+/).filter(w => w.length > 0).length} words</span>
                                  {!isClient && <span className="text-orange-600">Loading...</span>}
                                </div>
                              </div>
                              <textarea
                                value={editedPlainText}
                                onChange={(e) => setEditedPlainText(e.target.value)}
                                className="w-full p-4 min-h-96 border-0 focus:outline-none resize-vertical"
                                placeholder={isClient ? "Edit your document content here. Type normally - the text will be converted to HTML when saved." : "Loading content..."}
                                disabled={!isClient}
                                style={{ 
                                  fontFamily: 'system-ui, -apple-system, sans-serif',
                                  fontSize: '14px',
                                  lineHeight: '1.5'
                                }}
                              />
                              <div className="bg-gray-50 p-2 border-t text-xs text-gray-600">
                                <strong>Note:</strong> You're editing clean text. The content will be automatically converted to HTML paragraphs when saved.
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // For Excel files, use ExcelViewer in edit mode
                      if (fileType?.includes('spreadsheet') || 
                          fileName.endsWith('.xlsx') || 
                          fileName.endsWith('.xls')) {
                        return (
                          <ExcelViewer 
                            fileUrl={fileUrl}
                            editable={true}
                          />
                        );
                      }
                      
                      // Default: Use SimpleRichTextEditor for HTML content
                      return (
                        <SimpleRichTextEditor
                          content={editedContent}
                          onChange={setEditedContent}
                          placeholder="Start writing your document content..."
                          className="min-h-64"
                        />
                      );
                    })()}
                  </div>
                  <button
                    onClick={handleSaveDocument}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Latest Version (v{documentData.currentVersion})</h4>
                    
                    {/* Check file type and render appropriate viewer */}
                    {(() => {
                      const fileUrl = documentData.fileUrl || '';
                      const fileType = documentData.metadata?.fileType || '';
                      const fileName = fileUrl.toLowerCase();
                      
                      // PDF files
                      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                        return (
                          <InlinePDFViewer
                            fileUrl={fileUrl}
                            title={documentData.title}
                          />
                        );
                      }
                      
                      // DOCX files - check if we have edited content first
                      if (fileType === 'application/vnd.openxmlformats-officedocumentData.wordprocessingml.document' || 
                          fileType === 'application/msword' ||
                          fileName.endsWith('.docx') || 
                          fileName.endsWith('.doc')) {
                        
                        // Debug: Check what content we have
                        console.log('🔍 DOCX Document Analysis:');
                        console.log('- Has versions:', !!documentData.versions[0]);
                        console.log('- Content length:', documentData.versions[0]?.content?.length || 0);
                        console.log('- Content preview:', documentData.versions[0]?.content?.substring(0, 200) || 'No content');
                        console.log('- File URL:', fileUrl);
                        
                        // If we have content from editing, show that instead of the original file
                        if (documentData.versions[0]?.content && documentData.versions[0].content.trim() !== '') {
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                                <span className="text-sm text-blue-800 flex items-center">
                                  📝 Showing edited version - changes have been saved
                                </span>
                                <button
                                  onClick={() => window.open(fileUrl, '_blank')}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View original file
                                </button>
                              </div>
                              <div 
                                className="max-w-none bg-white p-4 rounded border docx-content"
                                dangerouslySetInnerHTML={{ 
                                  __html: documentData.versions[0].content 
                                }}
                              />
                            </div>
                          );
                        } else {
                          // No edited content, show original DOCX viewer
                          return (
                            <DOCXViewer
                              fileUrl={fileUrl}
                              title={documentData.title}
                              editable={false}
                              onContentExtracted={(extractedContent) => {
                                console.log('DOCX text extracted:', extractedContent.substring(0, 100) + '...');
                              }}
                            />
                          );
                        }
                      }
                      
                      // Excel files
                      if (fileType?.includes('spreadsheet') || 
                          fileName.endsWith('.xlsx') || 
                          fileName.endsWith('.xls')) {
                        return (
                          <ExcelViewer 
                            fileUrl={fileUrl}
                            title={documentData.title}
                            editable={true} // Enable editing for Excel files
                          />
                        );
                      }
                      
                      // HTML content (from backend processing)
                      if (documentData.versions[0]?.content) {
                        return (
                          <div 
                            className="max-w-none docx-content"
                            dangerouslySetInnerHTML={{ 
                              __html: documentData.versions[0].content 
                            }}
                          />
                        );
                      }
                      
                      // Fallback
                      return (
                        <div className="text-gray-500 italic">
                          No content available
                          {fileUrl && (
                            <div className="mt-2">
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View original file
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {documentData.clauseMappings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">ISO Clause Mappings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {documentData.clauseMappings.map((mapping) => (
                          <div key={mapping.id} className="border p-2 rounded text-sm">
                            <div className="font-medium">{mapping.clause.clauseNumber} - {mapping.clause.title}</div>
                            <div className="text-gray-600">Confidence: {Math.round(mapping.confidence * 100)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                
                {/* Add Review Form */}
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <h4 className="font-medium mb-2">Add Review</h4>
                  <div className="space-y-2">
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="border rounded p-2"
                    >
                      <option value="APPROVED">Approved</option>
                      <option value="REQUIRES_CHANGES">Requires Changes</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Review comments..."
                      className="w-full border rounded p-2 h-20"
                    />
                    <button
                      onClick={handleAddReview}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {documentData.reviews.map((review) => (
                    <div key={review.id} className="border p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{review.reviewer.name}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            review.status === 'REQUIRES_CHANGES' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{review.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comments</h3>
              
              {/* Add Comment Form */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">
                  {replyTo ? 'Reply to comment' : 'Add Comment'}
                </h4>
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full border rounded p-2 h-20"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddComment}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      {replyTo ? 'Reply' : 'Comment'}
                    </button>
                    {replyTo && (
                      <button
                        onClick={() => setReplyTo(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => renderCommentTree(comment))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tasks</h3>
              
              {/* Add Task Form */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Create Task</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full border rounded p-2"
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Task description..."
                    className="w-full border rounded p-2 h-20"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="border rounded p-2"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                      className="border rounded p-2"
                    >
                      <option value={1}>Low Priority</option>
                      <option value={2}>Medium Priority</option>
                      <option value={3}>High Priority</option>
                    </select>
                    <button
                      onClick={handleAddTask}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                          className="text-xs border rounded p-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsEditingTask(true);
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>Priority: {['', 'Low', 'Medium', 'High'][task.priority]}</span>
                      {task.dueDate && (
                        <span className="ml-4">Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      )}
                      <span className="ml-4">Created by: {task.createdBy.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Version History</h3>
              <div className="space-y-3">
                {documentData.versions.map((version) => (
                  <div key={version.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Version {version.version}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{version.changes}</p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View content
                      </summary>
                      <div className="mt-2 bg-gray-50 p-2 rounded">
                        {version.content ? (
                          <div 
                            className="max-w-none docx-content"
                            dangerouslySetInnerHTML={{ __html: version.content }}
                          />
                        ) : (
                          <span className="text-gray-500 italic">No content available</span>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditingTask && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Task</h2>
              <button
                onClick={() => {
                  setIsEditingTask(false);
                  setEditingTask(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 h-32"
                  placeholder="Task description..."
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({...editingTask, priority: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsEditingTask(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  disabled={!editingTask.title}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}