import React, { useState, useCallback, useRef } from 'react';
import { SparklesIcon, UploadIcon, FileIcon, TrashIcon } from './Icons';

// Since XLSX is loaded from a CDN, we need to declare it for TypeScript
declare var XLSX: any;

interface DataInputProps {
  onFileProcessed: (data: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasData: boolean;
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  onClearFile: () => void;
}

const DataInput: React.FC<DataInputProps> = ({ 
    onFileProcessed, 
    onGenerate, 
    isLoading, 
    hasData, 
    customPrompt,
    onPromptChange,
    onClearFile,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file) return;

    const allowedTypes = [
        'text/csv', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Invalid file type. Please upload a CSV or XLSX file.');
        return;
    }

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvString = XLSX.utils.sheet_to_csv(worksheet);
        onFileProcessed(csvString);
      } catch (err) {
        console.error("Error parsing file:", err);
        setError("Could not parse the file. Please ensure it's a valid CSV or XLSX.");
        onFileProcessed('');
        setFileName(null);
      }
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
        onFileProcessed('');
        setFileName(null);
    }
    reader.readAsBinaryString(file);
  }, [onFileProcessed]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onClearFile();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
      <div className="mb-4">
        {!fileName ? (
            <>
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isDragging ? 'border-brand-500 bg-slate-700/50' : 'border-slate-600 hover:border-brand-600 hover:bg-slate-700/30'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                    <UploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                    <p className="text-lg font-medium text-slate-300">
                        <span className="text-brand-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-slate-500">CSV or XLSX file</p>
                </div>
                {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </>
        ) : (
            <div className="bg-slate-900/70 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-8 h-8 text-brand-400 flex-shrink-0" />
                    <div className="truncate">
                        <p className="text-sm font-medium text-slate-300 truncate" title={fileName}>{fileName}</p>
                        <p className="text-xs text-slate-500">Ready to process</p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/50 rounded-full disabled:opacity-50 transition-colors flex-shrink-0 ml-2"
                    aria-label="Remove file"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="custom-prompt" className="block text-sm font-medium text-slate-300 mb-2">
            Custom Cleaning Instructions (Optional)
        </label>
        <textarea
            id="custom-prompt"
            rows={3}
            value={customPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            disabled={!hasData || isLoading}
            className="w-full bg-slate-900/70 border border-slate-600 rounded-md p-3 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g., Merge 'first_name' and 'last_name' into a 'full_name' column. Convert all dates to YYYY-MM-DD format."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading || !hasData}
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
        >
          <SparklesIcon className="w-5 h-5" />
          {isLoading ? 'Processing...' : 'Clean & Generate SQL'}
        </button>
      </div>
    </div>
  );
};

export default DataInput;