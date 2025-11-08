
import React from 'react';
import { type ProcessedData } from '../types';
import CodeBlock from './CodeBlock';

type Tab = 'data' | 'create' | 'insert' | 'explanation';

interface ResultsDisplayProps {
  result: ProcessedData;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-slate-300 hover:bg-slate-700'
    }`}
  >
    {label}
  </button>
);

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, activeTab, setActiveTab }) => {
  const headers = result.cleanedData.length > 0 ? Object.keys(result.cleanedData[0]) : [];

  return (
    <div className="bg-slate-800/80 rounded-xl shadow-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <TabButton label="Cleaned Data" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
          <TabButton label="CREATE Table" isActive={activeTab === 'create'} onClick={() => setActiveTab('create')} />
          <TabButton label="INSERT Statements" isActive={activeTab === 'insert'} onClick={() => setActiveTab('insert')} />
          <TabButton label="AI Explanation" isActive={activeTab === 'explanation'} onClick={() => setActiveTab('explanation')} />
        </div>
      </div>
      <div className="p-2 md:p-6">
        {activeTab === 'data' && (
          <div className="max-h-[500px] overflow-auto rounded-lg">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50 sticky top-0">
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {result.cleanedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-700/50">
                    {headers.map((header) => (
                      <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {String(row[header] ?? 'NULL')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'create' && (
          <CodeBlock language="sql" code={result.createTableSql} />
        )}
        {activeTab === 'insert' && (
          <CodeBlock language="sql" code={result.insertSql} />
        )}
        {activeTab === 'explanation' && (
            <div className="prose prose-invert prose-sm md:prose-base max-w-none p-4 bg-slate-900/50 rounded-lg">
              <h3 className="text-brand-400">AI Analysis</h3>
              {result.explanation.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
