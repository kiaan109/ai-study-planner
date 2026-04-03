'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, AlignLeft, Loader2, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Mode = 'upload' | 'paste';

export default function SyllabusUpload({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<Mode>('upload');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        // Extract text from PDF via API
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/syllabus/parse-pdf', { method: 'POST', body: fd });
        const { text: extracted } = await res.json();
        await submitText(extracted);
      } else {
        // Read as text
        const t = await file.text();
        await submitText(t);
      }
    } catch {
      toast.error('Failed to process file');
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/*': ['.txt'], 'image/*': ['.png','.jpg','.jpeg'] },
    maxFiles: 1,
  });

  async function submitText(content: string) {
    if (!content.trim()) { toast.error('No content to process'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/syllabus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Created ${data.count} subject${data.count !== 1 ? 's' : ''}!`);
      onSuccess();
    } catch {
      toast.error('Failed to extract syllabus. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Upload Syllabus</h3>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg)' }}>
        {(['upload','paste'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${mode === m ? 'text-white shadow-sm' : ''}`} style={mode === m ? { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' } : { color: 'var(--muted)' }}>
            {m === 'upload' ? '📤 Upload File' : '✍️ Paste Text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`} style={{ borderColor: isDragActive ? '#3b82f6' : 'var(--border)' }}>
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="font-medium">Processing {fileName}…</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-medium">{fileName}</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Processing complete</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
              <p className="font-bold text-lg mb-2">{isDragActive ? 'Drop it here!' : 'Drop your syllabus here'}</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>PDF, image, or text file</p>
              <span className="btn-secondary text-sm inline-block">Browse files</span>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your syllabus text here…&#10;&#10;Example:&#10;Mathematics&#10;Chapter 1: Algebra&#10;  - Linear equations&#10;  - Quadratic equations&#10;&#10;Chapter 2: Geometry..."
            className="input min-h-[200px] resize-y font-mono text-sm"
            style={{ height: '240px' }}
          />
          <button
            onClick={() => submitText(text)}
            disabled={!text.trim() || loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><AlignLeft className="w-4 h-4" /> Extract Subjects</>}
          </button>
        </div>
      )}
    </div>
  );
}
