'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image
} from 'lucide-react';

interface SimpleRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SimpleRichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className = ""
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastContent, setLastContent] = useState(content);
  const [initialized, setInitialized] = useState(false);

  // Save and restore cursor position
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range) => {
    const selection = window.getSelection();
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Initialize content when component mounts
  useEffect(() => {
    if (editorRef.current && !initialized) {
      console.log('Initializing editor with content:', content?.substring(0, 100) + '...');
      editorRef.current.innerHTML = content || '';
      setLastContent(content || '');
      setInitialized(true);
    }
  }, [content, initialized]);

  // Update content only when it changes from parent (after initialization)
  useEffect(() => {
    if (!initialized) return; // Skip if not initialized yet
    
    console.log('SimpleRichTextEditor useEffect triggered');
    console.log('- content prop:', content?.substring(0, 100) + '...');
    console.log('- content length:', content?.length);
    console.log('- lastContent:', lastContent?.substring(0, 100) + '...');
    console.log('- editorRef.current?.innerHTML:', editorRef.current?.innerHTML?.substring(0, 100) + '...');
    
    if (editorRef.current && content !== lastContent && content !== editorRef.current.innerHTML) {
      console.log('Updating editor content');
      const savedRange = saveSelection();
      editorRef.current.innerHTML = content;
      setLastContent(content);
      
      // Restore cursor position after a brief delay
      setTimeout(() => {
        if (savedRange) {
          try {
            restoreSelection(savedRange);
          } catch (e) {
            console.log('Failed to restore selection, placing at end');
            // If restoring fails, place cursor at end
            const selection = window.getSelection();
            if (selection && editorRef.current) {
              const range = document.createRange();
              range.selectNodeContents(editorRef.current);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 0);
    } else {
      console.log('Not updating editor content - no change detected');
    }
  }, [content, lastContent, initialized]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setLastContent(newContent);
      onChange(newContent);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    children, 
    title,
    isActive = false
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  const insertTable = () => {
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <thead>
          <tr>
            <th style="padding: 8px; background-color: #f5f5f5;">Header 1</th>
            <th style="padding: 8px; background-color: #f5f5f5;">Header 2</th>
            <th style="padding: 8px; background-color: #f5f5f5;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px;">Cell 1</td>
            <td style="padding: 8px;">Cell 2</td>
            <td style="padding: 8px;">Cell 3</td>
          </tr>
          <tr>
            <td style="padding: 8px;">Cell 4</td>
            <td style="padding: 8px;">Cell 5</td>
            <td style="padding: 8px;">Cell 6</td>
          </tr>
        </tbody>
      </table>
    `;
    handleCommand('insertHTML', tableHTML);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  return (
    <div className={`rich-editor border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => handleCommand('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleCommand('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleCommand('underline')}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleCommand('formatBlock', e.target.value);
                e.target.value = '';
              }
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            defaultValue=""
          >
            <option value="">Format</option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
          </select>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => handleCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleCommand('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => handleCommand('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleCommand('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleCommand('justifyRight')}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Insert */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={insertLink}
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertTable}
            title="Insert Table"
          >
            <span className="text-xs font-bold">⊞</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        className="min-h-[200px] max-h-[500px] overflow-y-auto p-4 focus:outline-none border-t border-gray-200"
        style={{ 
          minHeight: '200px',
          lineHeight: '1.6',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-editor [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            font-style: italic;
          }
          
          .rich-editor table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          
          .rich-editor table th,
          .rich-editor table td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          
          .rich-editor table th {
            background-color: #f9fafb;
            font-weight: bold;
          }
          
          .rich-editor blockquote {
            border-left: 4px solid #e5e7eb;
            margin: 16px 0;
            padding-left: 16px;
            color: #6b7280;
            font-style: italic;
          }
        `
      }} />

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex justify-between items-center text-sm text-gray-600">
        <span>
          Rich text editor • Click to format text
        </span>
        <span className="text-xs">
          Use the toolbar above to format your content
        </span>
      </div>
    </div>
  );
}