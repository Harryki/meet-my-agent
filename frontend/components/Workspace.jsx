import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Save, Trash2 } from 'lucide-react';
import Sidebar from './Sidebar';
import DropOverlay from './DropOverlay';
import UploadMenu from './UploadMenu';
import { useAuth } from '../context/AuthContext';
import { loadFiles, saveFiles } from '../lib/auth';
import { generateUUID } from '../lib/uuid';
import {
  isTextFile,
  readFileAsText,
  collectFilesFromDrop,
} from '../lib/fileUtils';

const CrepeEditor = dynamic(() => import('./CrepeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-gray-400">
      에디터를 불러오는 중...
    </div>
  ),
});

function stripExtension(name = '') {
  return name.replace(/\.[^/.]+$/, '');
}

function buildFileName(title, originalName) {
  const trimmed = title.trim();
  if (!trimmed) return originalName;
  if (/\.(md|markdown)$/i.test(trimmed)) return trimmed;
  return `${trimmed}.md`;
}

export default function Workspace() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  useEffect(() => {
    if (!user) return;
    const stored = loadFiles(user.email);
    setFiles(stored);
    setInitialized(true);
    if (stored.length > 0) {
      setActiveFileId(stored[0].id);
    }
  }, [user]);

  useEffect(() => {
    if (!initialized || !user) return;
    saveFiles(user.email, files);
  }, [files, initialized, user]);

  useEffect(() => {
    if (!activeFile) {
      setDraftTitle('');
      setDraftContent('');
      setIsDirty(false);
      setSaveStatus('');
      return;
    }
    setDraftTitle(stripExtension(activeFile.name));
    setDraftContent(activeFile.content);
    setIsDirty(false);
    setSaveStatus('');
  }, [activeFile?.id]);

  const loadRecords = useCallback(async (records) => {
    const loaded = [];
    for (let i = 0; i < records.length; i++) {
      const { file, path } = records[i];
      try {
        const content = await readFileAsText(file);
        loaded.push({
          id: generateUUID(),
          name: file.name,
          path: path || file.name,
          content,
        });
      } catch (err) {
        console.error('파일 읽기 실패:', file.name, err);
      }
    }

    if (loaded.length === 0) return;

    setFiles((prev) => {
      const next = [...prev, ...loaded];
      next.sort((a, b) => a.path.localeCompare(b.path));
      return next;
    });
    setActiveFileId(loaded[0].id);
  }, []);

  const handleFileSelect = useCallback(
    async (e, isFolder) => {
      const fileList = Array.from(e.target.files || []);
      const records = fileList
        .filter(isTextFile)
        .map((file) => ({
          file,
          path: isFolder ? file.webkitRelativePath : file.name,
        }));
      await loadRecords(records);
      e.target.value = '';
    },
    [loadRecords]
  );

  const handleCreateFile = useCallback(() => {
    const id = generateUUID();
    const newFile = {
      id,
      name: '새 파일.md',
      path: '새 파일.md',
      content: '',
    };
    setFiles((prev) => [newFile, ...prev]);
    setActiveFileId(id);
  }, []);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setDraftTitle(value);
    setIsDirty(
      value !== stripExtension(activeFile?.name) ||
        draftContent !== activeFile?.content
    );
  };

  const handleEditorChange = useCallback(
    (markdown) => {
      setDraftContent(markdown);
      setIsDirty(
        markdown !== activeFile?.content ||
          draftTitle !== stripExtension(activeFile?.name)
      );
    },
    [activeFile, draftTitle]
  );

  const handleSave = useCallback(() => {
    if (!activeFile || !isDirty) return;

    const newName = buildFileName(draftTitle, activeFile.name);
    const updated = {
      ...activeFile,
      name: newName,
      path: newName,
      content: draftContent,
    };

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? updated : f))
    );
    setIsDirty(false);
    setSaveStatus('파일이 저장되었습니다.');

    // TODO: 백엔드 API 연동 시 이 파일을 서버로 전송
    console.log('TODO: 백엔드 저장', updated);

    const timer = setTimeout(() => setSaveStatus(''), 2000);
    return () => clearTimeout(timer);
  }, [activeFile, draftContent, draftTitle, isDirty]);

  const handleDelete = useCallback(() => {
    if (!activeFile) return;
    const ok = window.confirm('파일을 삭제하시겠습니까?');
    if (!ok) return;

    const idx = files.findIndex((f) => f.id === activeFile.id);
    const nextId =
      files[idx + 1]?.id || files[idx - 1]?.id || null;

    setActiveFileId(nextId);
    setFiles((prev) => prev.filter((f) => f.id !== activeFile.id));
  }, [activeFile, files]);

  useEffect(() => {
    const onDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      const types = e.dataTransfer.types;
      const hasFiles =
        (typeof types.contains === 'function' && types.contains('Files')) ||
        Array.from(types).includes('Files');
      if (hasFiles) {
        setIsDragging(true);
      }
    };

    const onDragOver = (e) => {
      e.preventDefault();
    };

    const onDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsDragging(false);
        dragCounter.current = 0;
      }
    };

    const onDrop = async (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const items = e.dataTransfer.items;
      const records = items?.length
        ? await collectFilesFromDrop(items)
        : Array.from(e.dataTransfer.files || [])
            .filter(isTextFile)
            .map((file) => ({ file, path: file.name }));

      await loadRecords(records);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadRecords]);

  return (
    <>
      <Head>
        <title>Knowledge Management</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex h-screen w-screen overflow-hidden bg-[#fbfbfa]">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onCreateFile={handleCreateFile}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full">
          <header className="flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-gray-500 truncate">
                {activeFile ? activeFile.path : '새 페이지'}
              </span>
              {saveStatus && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {saveStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeFile && (
                <>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    삭제
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isDirty
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save size={16} />
                    저장
                  </button>
                </>
              )}
              <UploadMenu
                onUploadFile={() => fileInputRef.current?.click()}
                onUploadFolder={() => folderInputRef.current?.click()}
                variant="secondary"
              />
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[900px] mx-auto w-full px-8 py-12">
              {activeFile ? (
                <>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={handleTitleChange}
                    placeholder="제목 없음"
                    className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent mb-6"
                  />
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[60vh] p-6">
                    <CrepeEditor
                      key={activeFile.id}
                      value={activeFile.content}
                      onChange={handleEditorChange}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                  <p className="text-gray-500 mb-8 max-w-md">
                    마크다운 파일(.md, .markdown)이나 폴드를 드래그 앤 드롭하거나
                    <br />
                    업로드 버튼으로 선택하세요.
                  </p>
                  <UploadMenu
                    onUploadFile={() => fileInputRef.current?.click()}
                    onUploadFolder={() => folderInputRef.current?.click()}
                    variant="primary"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <DropOverlay visible={isDragging} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, false)}
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => handleFileSelect(e, true)}
      />
    </>
  );
}
