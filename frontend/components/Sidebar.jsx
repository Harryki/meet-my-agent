import { useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Upload,
} from 'lucide-react';

export default function Sidebar({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onUploadFile,
}) {
  const [query, setQuery] = useState('');

  const filteredFiles = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return files;
    return files.filter((f) => f.name.toLowerCase().includes(trimmed));
  }, [files, query]);

  return (
    <aside className="w-64 flex flex-col h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Knowledge Base</h2>
          <button
            type="button"
            onClick={onCreateFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus size={14} />
            Note
          </button>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Notes
        </div>

        {filteredFiles.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400 text-center">
            {files.length === 0
              ? '업로드된 파일이 없습니다.'
              : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <nav className="px-2 space-y-0.5">
            {filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                  activeFileId === file.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText size={16} className="flex-shrink-0 text-gray-400" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onUploadFile}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>
    </aside>
  );
}
