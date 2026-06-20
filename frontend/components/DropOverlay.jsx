import { UploadCloud } from 'lucide-react';

export default function DropOverlay({ visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8">
      <div className="flex flex-col items-center justify-center w-full max-w-2xl h-96 border-4 border-dashed border-white/60 rounded-2xl bg-white/10 text-white">
        <UploadCloud size={64} className="mb-4" />
        <h2 className="text-2xl font-semibold">여기에 파일이나 폴더를 놓으세요</h2>
        <p className="mt-2 text-white/80">.md, .txt 등 텍스트 파일을 업로드할 수 있어요.</p>
      </div>
    </div>
  );
}
