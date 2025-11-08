import React, { useState, useCallback } from 'react';
import { generateSqlFromData } from './services/geminiService';
import { type ProcessedData } from './types';
import { DatabaseIcon, LoaderIcon, ErrorIcon } from './components/Icons';
import DataInput from './components/DataInput';
import ResultsDisplay from './components/ResultsDisplay';

type Tab = 'data' | 'create' | 'insert' | 'explanation';

export default function App() {
  const [csvData, setCsvData] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('data');

  const handleGenerate = useCallback(async () => {
    if (!csvData.trim()) {
      setError('Please upload a file to process.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const processedResult = await generateSqlFromData(csvData, customPrompt);
      setResult(processedResult);
      setActiveTab('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [csvData, customPrompt]);

  const handleFileProcessed = (data: string) => {
    setCsvData(data);
    // Clear previous results when a new file is uploaded
    setResult(null);
    setError(null);
  };
  
  const handleClearFile = () => {
    setCsvData('');
    setCustomPrompt('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-200 antialiased">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-4">
            <DatabaseIcon className="w-12 h-12 text-brand-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-sky-400 text-transparent bg-clip-text">
              AI Data Cleaner & SQL Generator
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
            Upload your raw CSV or Excel file. Our AI will automatically clean it, infer data types, and generate MySQL `CREATE TABLE` and `INSERT` statements.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <DataInput
            onFileProcessed={handleFileProcessed}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            hasData={!!csvData.trim()}
            customPrompt={customPrompt}
            onPromptChange={setCustomPrompt}
            onClearFile={handleClearFile}
          />
          
          <div className="mt-8">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-lg">
                <LoaderIcon className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium text-brand-400">AI is analyzing your data...</p>
                <p className="text-slate-400">This might take a moment.</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-4 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                <ErrorIcon className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">An Error Occurred</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}
            {result && (
              <ResultsDisplay 
                result={result}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Powered by Gemini API. Designed for demonstration purposes.</p>
      </footer>
    </div>
  );
}