import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Pencil, Trash2, Save } from 'lucide-react';
import Sidebar from './Sidebar';
import DropOverlay from './DropOverlay';
import TopNavbar from './TopNavbar';
import { useAuth } from '../context/AuthContext';
import {
  apiListFiles,
  apiGetFile,
  apiUploadFile,
  apiDeleteFile,
} from '../lib/api';
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

function textToFile(content, filename) {
  return new File([content], filename, { type: 'text/markdown' });
}

function countWords(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatLastEdited(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `Last edited ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function Workspace() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [loadingFileId, setLoadingFileId] = useState(null);
  const [error, setError] = useState(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const titleInputRef = useRef(null);

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchFiles() {
      setIsLoadingList(true);
      setError(null);
      try {
        const data = await apiListFiles();
        if (cancelled) return;
        const mapped = data.map((f) => ({
          id: f.uuid,
          name: f.filename,
          path: f.filename,
          content: null,
          size: f.size,
          createdAt: f.created_at,
        }));
        mapped.sort((a, b) => a.name.localeCompare(b.name));
        setFiles(mapped);
        setInitialized(true);
        if (mapped.length > 0) {
          setActiveFileId(mapped[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    }

    fetchFiles();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!activeFile) {
      setDraftTitle('');
      setDraftContent('');
      setIsDirty(false);
      setSaveStatus('');
      return;
    }

    if (activeFile.content !== null) {
      setDraftTitle(stripExtension(activeFile.name));
      setDraftContent(activeFile.content);
      setIsDirty(false);
      setSaveStatus('');
      return;
    }

    let cancelled = false;

    async function fetchContent() {
      setLoadingFileId(activeFile.id);
      setError(null);
      try {
        const content = await apiGetFile(activeFile.id);
        if (cancelled) return;
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFile.id ? { ...f, content } : f))
        );
        setDraftTitle(stripExtension(activeFile.name));
        setDraftContent(content);
        setIsDirty(false);
        setSaveStatus('');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingFileId(null);
      }
    }

    fetchContent();
    return () => {
      cancelled = true;
    };
  }, [activeFile?.id]);

  const loadRecords = useCallback(async (records) => {
    const loaded = [];
    for (const { file, path } of records) {
      try {
        const content = await readFileAsText(file);
        const id = generateUUID();
        const uploadFile = textToFile(content, file.name);
        const data = await apiUploadFile(id, uploadFile);
        loaded.push({
          id: data.uuid,
          name: data.filename,
          path: data.filename,
          content,
          size: data.size,
          createdAt: data.created_at,
        });
      } catch (err) {
        console.error('파일 업로드 실패:', file.name, err);
        setError(err.message);
      }
    }

    if (loaded.length === 0) return;

    setFiles((prev) => {
      const next = [...prev, ...loaded];
      next.sort((a, b) => a.name.localeCompare(b.name));
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
    const name = '새 파일.md';
    const newFile = {
      id,
      name,
      path: name,
      content: '',
      size: 0,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };
    setFiles((prev) => [newFile, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
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

  const handleSave = useCallback(async () => {
    if (!activeFile || !isDirty) return;

    const newName = buildFileName(draftTitle, activeFile.name);
    const uploadFile = textToFile(draftContent, newName);

    try {
      const data = await apiUploadFile(activeFile.id, uploadFile);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? {
                ...f,
                name: data.filename,
                path: data.filename,
                content: draftContent,
                size: data.size,
                createdAt: data.created_at,
                isLocal: false,
              }
            : f
        )
      );
      setIsDirty(false);
      setSaveStatus('파일이 저장되었습니다.');

      const timer = setTimeout(() => setSaveStatus(''), 2000);
      return () => clearTimeout(timer);
    } catch (err) {
      setError(err.message);
    }
  }, [activeFile, draftContent, draftTitle, isDirty]);

  const handleDelete = useCallback(async () => {
    if (!activeFile) return;
    const ok = window.confirm('파일을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      if (!activeFile.isLocal) {
        await apiDeleteFile(activeFile.id);
      }
      const idx = files.findIndex((f) => f.id === activeFile.id);
      const nextId =
        files[idx + 1]?.id || files[idx - 1]?.id || null;

      setActiveFileId(nextId);
      setFiles((prev) => prev.filter((f) => f.id !== activeFile.id));
    } catch (err) {
      setError(err.message);
    }
  }, [activeFile, files]);

  const handleEditNote = useCallback(() => {
    titleInputRef.current?.focus();
  }, []);

  const wordCount = useMemo(
    () => countWords(draftContent),
    [draftContent]
  );

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
        <title>Meet my agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <TopNavbar userName={user?.name || 'Alex Johnson'} onLogout={logout} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCreateFile={handleCreateFile}
            onUploadFile={() => fileInputRef.current?.click()}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-white">
            {activeFile ? (
              <>
                <header className="flex items-center justify-between h-14 px-8 border-b border-gray-200 bg-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {activeFile.name}
                    </span>
                    {saveStatus && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {saveStatus}
                      </span>
                    )}
                    {isLoadingList && (
                      <span className="text-xs text-gray-500">로딩 중...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleEditNote}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Pencil size={14} />
                      Edit Note
                    </button>
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete Note
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!isDirty}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        isDirty
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-600/50 text-white cursor-not-allowed'
                      }`}
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </header>

                {error && (
                  <div className="px-8 py-2 bg-red-50 border-b border-red-100 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-8 py-10">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={draftTitle}
                      onChange={handleTitleChange}
                      placeholder="제목 없음"
                      className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent mb-3"
                    />

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                      <span>{formatLastEdited(activeFile.createdAt)}</span>
                      <span>{wordCount} words</span>
                    </div>

                    <hr className="border-gray-200 mb-8" />

                    <div className="min-h-[50vh]">
                      {activeFile.content === null || loadingFileId === activeFile.id ? (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          파일 내용을 불러오는 중...
                        </div>
                      ) : (
                        <CrepeEditor
                          key={activeFile.id}
                          value={activeFile.content}
                          onChange={handleEditorChange}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <p className="text-gray-500 mb-6 max-w-md">
                  마크다운 파일(.md, .markdown)을 드래그 앤 드롭하거나
                  <br />
                  사이드바의 업로드 버튼을 사용하세요.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Upload File
                </button>
              </div>
            )}
          </main>
        </div>
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
