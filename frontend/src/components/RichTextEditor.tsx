'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo,
  Table as TableIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className = ""
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded"></div>;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <select
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              'paragraph'
            }
            onChange={(e) => {
              if (e.target.value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) as 1 | 2 | 3 }).run();
              }
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Blockquote & Code Block */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Table */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Table Controls (shown when table is active) */}
      {editor.isActive('table') && (
        <div className="border-b border-gray-200 bg-yellow-50 p-2 flex gap-2 text-sm">
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Column Before
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Column After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Delete Column
          </button>
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Row Before
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Add Row After
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Delete Row
          </button>
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-1 bg-red-50 border border-red-300 text-red-600 rounded hover:bg-red-100"
          >
            Delete Table
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="min-h-[200px] max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Footer with word count */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex justify-between items-center text-sm text-gray-600">
        <span>
          {editor.storage.characterCount?.characters() || 0} characters, {editor.storage.characterCount?.words() || 0} words
        </span>
        <span className="text-xs">
          Tip: Use tables for Excel-like data structure
        </span>
      </div>
    </div>
  );
}