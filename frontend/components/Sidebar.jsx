import { useState } from 'react';
import {
  FileText,
  Plus,
  Link2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PROTOTYPE_AGENT_ID = 'alex-johnson';

export default function Sidebar({
  open,
  onToggle,
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyProfileUrl = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/profile/${PROTOTYPE_AGENT_ID}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('URL 복사 실패:', err);
    }
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col h-screen bg-[#f7f7f5] border-r border-gray-200 transition-all duration-300 ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200">
        {open && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold text-gray-800 truncate text-sm">
              Meet my agent
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
          aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {open && (
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={handleCopyProfileUrl}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            {copied ? <Check size={16} /> : <Link2 size={16} />}
            {copied ? '복사 완료' : '프로필 URL 복사'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {open && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Workspace
            </div>

            {files.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                업로드된 파일이 없습니다.
                <br />
                새 파일을 만들어 보세요.
              </div>
            ) : (
              <nav className="px-2 space-y-0.5">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                      activeFileId === file.id
                        ? 'bg-gray-200/70 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    <FileText size={16} className="flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>

      {open && (
        <div className="p-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onCreateFile}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Plus size={18} />
            새 파일
          </button>
        </div>
      )}
    </aside>
  );
}
