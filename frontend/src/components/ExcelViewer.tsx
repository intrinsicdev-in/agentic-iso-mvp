'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

interface ExcelViewerProps {
  fileUrl?: string;
  data?: any[][];
  onDataChange?: (data: any[][]) => void;
  editable?: boolean;
  title?: string;
}

interface CellPosition {
  row: number;
  col: number;
}

export default function ExcelViewer({ 
  fileUrl, 
  data: initialData, 
  onDataChange, 
  editable = false,
  title = "Excel Data"
}: ExcelViewerProps) {
  const [data, setData] = useState<any[][]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [allSheetData, setAllSheetData] = useState<any[][][]>([]);

  useEffect(() => {
    if (fileUrl) {
      loadExcelFile();
    }
  }, [fileUrl]);

  const loadExcelFile = async () => {
    if (!fileUrl) {
      setError('No file URL provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading Excel file:', fileUrl);
      
      let response;
      
      // Check if it's a local file or external URL
      if (fileUrl.startsWith('http') && !fileUrl.includes(window.location.hostname)) {
        // External URL - use proxy
        console.log('Using proxy for external file:', fileUrl);
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(fileUrl)}`;
        try {
          response = await fetch(proxyUrl);
        } catch (proxyError) {
          console.log('Proxy failed, trying direct fetch:', proxyError);
          response = await fetch(fileUrl, {
            mode: 'cors',
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
            }
          });
        }
      } else {
        // Local file - direct fetch
        console.log('Direct fetch for local file:', fileUrl);
        response = await fetch(fileUrl, {
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
          }
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Excel fetch error:', {
          status: response.status,
          statusText: response.statusText,
          url: fileUrl,
          errorText
        });
        
        // More specific error messages
        if (response.status === 404) {
          throw new Error(`Excel file not found: ${fileUrl}`);
        } else if (response.status === 500) {
          throw new Error(`Server error loading Excel file. Check if the file exists and is accessible.`);
        } else {
          throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
        }
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets = workbook.SheetNames;
      setSheetNames(sheets);
      
      const allData = sheets.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      });
      
      setAllSheetData(allData as any[][][]);
      setData((allData[0] || []) as any[][]);
      setActiveSheet(0);
    } catch (err) {
      console.error('Excel loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!editable) return;
    
    setEditingCell({ row, col });
    setEditValue(data[row]?.[col] || '');
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const newData = [...data];
    const { row, col } = editingCell;

    // Ensure the row exists
    while (newData.length <= row) {
      newData.push([]);
    }

    // Ensure the column exists in the row
    while (newData[row].length <= col) {
      newData[row].push('');
    }

    newData[row][col] = editValue;
    setData(newData);
    setEditingCell(null);
    setEditValue('');

    if (onDataChange) {
      onDataChange(newData);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const addRow = () => {
    const maxCols = Math.max(...data.map(row => row.length), 0);
    const newRow = new Array(maxCols).fill('');
    const newData = [...data, newRow];
    setData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    setData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const deleteRow = (rowIndex: number) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const deleteColumn = (colIndex: number) => {
    if (!confirm('Are you sure you want to delete this column?')) return;
    
    const newData = data.map(row => row.filter((_, index) => index !== colIndex));
    setData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const handleSheetChange = (sheetIndex: number) => {
    setActiveSheet(sheetIndex);
    setData(allSheetData[sheetIndex] || []);
    setEditingCell(null);
    if (onDataChange) onDataChange(allSheetData[sheetIndex] || []);
  };

  const getColumnLabel = (index: number) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode(65 + (index % 26)) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-4 bg-red-50">
        <p className="text-red-600 font-medium">Error loading Excel file</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        {fileUrl && (
          <div className="mt-2 flex space-x-2">
            <button
              onClick={loadExcelFile}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Download Original
            </a>
          </div>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4">No Excel data to display</p>
        {editable && (
          <button
            onClick={() => setData([['Column A', 'Column B', 'Column C'], ['', '', ''], ['', '', '']])}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create New Spreadsheet
          </button>
        )}
      </div>
    );
  }

  const maxCols = Math.max(...data.map(row => row.length), 0);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium">{title}</h3>
          {sheetNames.length > 1 && (
            <div className="flex space-x-1">
              {sheetNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => handleSheetChange(index)}
                  className={`px-3 py-1 text-sm rounded ${
                    activeSheet === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {editable && (
            <>
              <button
                onClick={addRow}
                title="Add Row"
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={addColumn}
                title="Add Column"
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-4 h-4 rotate-90" />
              </button>
            </>
          )}
          <button
            onClick={exportToExcel}
            title="Export to Excel"
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-auto max-h-96">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium"></th>
              {Array.from({ length: maxCols }, (_, col) => (
                <th
                  key={col}
                  className="min-w-24 h-8 bg-gray-100 border border-gray-300 text-xs font-medium px-2 relative group"
                >
                  {getColumnLabel(col)}
                  {editable && (
                    <button
                      onClick={() => deleteColumn(col)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      title="Delete Column"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="group">
                <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs font-medium text-center relative">
                  {rowIndex + 1}
                  {editable && (
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      title="Delete Row"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </td>
                {Array.from({ length: maxCols }, (_, colIndex) => {
                  const cellValue = row[colIndex] || '';
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                  return (
                    <td
                      key={colIndex}
                      className={`h-8 border border-gray-300 px-2 text-sm ${
                        editable ? 'cursor-pointer hover:bg-blue-50' : ''
                      } ${isEditing ? 'bg-blue-100' : ''}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave();
                              if (e.key === 'Escape') handleCellCancel();
                            }}
                            autoFocus
                            className="w-full px-1 py-0 text-xs border-none bg-transparent focus:outline-none"
                          />
                          <button
                            onClick={handleCellSave}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCellCancel}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate block">{cellValue}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-600">
        {data.length} rows × {maxCols} columns
        {editable && (
          <span className="ml-4">
            Click any cell to edit • Use Enter to save, Escape to cancel
          </span>
        )}
      </div>
    </div>
  );
}