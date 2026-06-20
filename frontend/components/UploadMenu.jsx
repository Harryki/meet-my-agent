import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, FolderOpen, ChevronDown } from 'lucide-react';

const variants = {
  primary:
    'bg-gray-900 text-white hover:bg-gray-800 border border-transparent',
  secondary:
    'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300',
  ghost: 'hover:bg-gray-200 text-gray-700',
};

export default function UploadMenu({
  onUploadFile,
  onUploadFolder,
  variant = 'secondary',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (callback) => {
    setOpen(false);
    callback();
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]}`}
      >
        <Upload size={18} />
        <span>업로드</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            type="button"
            onClick={() => handleItemClick(onUploadFile)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
          >
            <FileText size={16} />
            파일 업로드
          </button>
          <button
            type="button"
            onClick={() => handleItemClick(onUploadFolder)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
          >
            <FolderOpen size="16" />
            폴더 업로드
          </button>
        </div>
      )}
    </div>
  );
}
