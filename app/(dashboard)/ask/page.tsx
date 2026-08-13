'use client';
import 'katex/dist/katex.min.css';
import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Sparkles, Upload, Mic, Square, Loader2, FileText, Image as ImageIcon,
  X, Lightbulb, Layers, BookOpenCheck, PlayCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import FormulaBlock from '@/components/ask/FormulaBlock';
import DiagramBlock from '@/components/ask/DiagramBlock';
import MarkdownLite from '@/components/ask/MarkdownLite';
import { createClient } from '@/lib/supabase/client';
import { ExplainResult } from '@/types';

type Attachment = { id: string; name: string; kind: 'pdf' | 'text' | 'image' | 'audio'; status: 'processing' | 'done' | 'error' };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function authHeaders() {
    const { data: { session } } = await createClient().auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  }

  function updateAttachment(id: string, patch: Partial<Attachment>) {
    setAttachments(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
  }

  const onDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = `${Date.now()}-${file.name}`;
      if (file.type === 'application/pdf') {
        setAttachments(prev => [...prev, { id, name: file.name, kind: 'pdf', status: 'processing' }]);
        try {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/syllabus/parse-pdf', { method: 'POST', body: fd });
          const { text, error } = await res.json();
          if (error) throw new Error(error);
          setContext(prev => `${prev}\n\n${text}`.trim());
          updateAttachment(id, { status: 'done' });
        } catch {
          updateAttachment(id, { status: 'error' });
          toast.error(`Couldn't read ${file.name}`);
        }
      } else if (file.type.startsWith('image/')) {
        setAttachments(prev => [...prev, { id, name: file.name, kind: 'image', status: 'processing' }]);
        try {
          const dataUrl = await fileToDataUrl(file);
          setImages(prev => (prev.length >= 4 ? prev : [...prev, dataUrl]));
          updateAttachment(id, { status: 'done' });
        } catch {
          updateAttachment(id, { status: 'error' });
        }
      } else {
        setAttachments(prev => [...prev, { id, name: file.name, kind: 'text', status: 'processing' }]);
        try {
          const t = await file.text();
          setContext(prev => `${prev}\n\n${t}`.trim());
          updateAttachment(id, { status: 'done' });
        } catch {
          updateAttachment(id, { status: 'error' });
        }
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/*': ['.txt'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 4,
    noClick: true,
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribe(new File([blob], 'recording.webm', { type: 'audio/webm' }));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error('Microphone access denied or unavailable');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(file: File) {
    const id = `${Date.now()}-${file.name}`;
    setAttachments(prev => [...prev, { id, name: file.name, kind: 'audio', status: 'processing' }]);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/ask/transcribe', { method: 'POST', headers: await authHeaders(), body: fd });
      const { text, error } = await res.json();
      if (error) throw new Error(error);
      setContext(prev => `${prev}\n\n[Audio transcript]\n${text}`.trim());
      updateAttachment(id, { status: 'done' });
      toast.success('Audio transcribed');
    } catch {
      updateAttachment(id, { status: 'error' });
      toast.error('Transcription failed');
    }
  }

  function onAudioFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) transcribe(file);
    e.target.value = '';
  }

  function removeAttachment(id: string) {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  async function submit() {
    if (!question.trim()) { toast.error('Type a question or topic first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ask/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ question, context, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Ask AI" subtitle="Any subject, any format — get explanations, formulas, diagrams and examples instantly" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input card */}
          <div {...getRootProps()} className={`card relative ${isDragActive ? 'ring-2 ring-blue-400' : ''}`}>
            <input {...getInputProps()} />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold">Ask anything</h2>
            </div>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Explain Newton's second law, derive the quadratic formula, summarize the causes of WWI…"
              className="input min-h-[110px] resize-y text-sm"
            />

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)' }}>
                    {a.kind === 'pdf' || a.kind === 'text' ? <FileText className="w-3.5 h-3.5" /> : a.kind === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    {a.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {a.status === 'error' && <span className="text-red-500">!</span>}
                    <button onClick={() => removeAttachment(a.id)} className="opacity-60 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <label className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Textbook / photo (PDF, image, text)
                <input type="file" className="hidden" accept=".pdf,.txt,image/*" multiple onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))} />
              </label>

              <label className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer">
                <PlayCircle className="w-3.5 h-3.5" /> Upload audio
                <input type="file" className="hidden" accept="audio/*" onChange={onAudioFileChosen} />
              </label>

              {recording ? (
                <button onClick={stopRecording} className="py-2 px-3 text-xs rounded-xl font-semibold flex items-center gap-1.5 text-white bg-red-500 animate-pulse">
                  <Square className="w-3.5 h-3.5" /> Stop recording
                </button>
              ) : (
                <button onClick={startRecording} className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Record audio
                </button>
              )}

              <button onClick={submit} disabled={loading} className="btn-primary py-2 px-4 text-sm ml-auto flex items-center gap-2 disabled:opacity-70">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</> : <><Sparkles className="w-4 h-4" /> Explain it</>}
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Or drag & drop a file anywhere on this card.</p>
          </div>

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Reading your material and building a full explanation…</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in">
              <div className="card">
                <h1 className="text-2xl font-extrabold mb-2">{result.title}</h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{result.summary}</p>
              </div>

              <div className="card">
                <MarkdownLite content={result.explanation} />
              </div>

              {result.formulas.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-bold">Key formulas</h3>
                  </div>
                  <div className="space-y-4">
                    {result.formulas.map((f, i) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
                        <p className="font-semibold text-sm mb-1">{f.name}</p>
                        <FormulaBlock latex={f.latex} />
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.diagram && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-bold">{result.diagram.title || 'Diagram'}</h3>
                  </div>
                  <DiagramBlock code={result.diagram.mermaid} />
                </div>
              )}

              {result.examples.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpenCheck className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold">Worked examples</h3>
                  </div>
                  <div className="space-y-4">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
                        <p className="text-sm font-semibold mb-1">Q: {ex.problem}</p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{ex.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.keyTakeaways.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold">Key takeaways</h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5">
                    {result.keyTakeaways.map((k, i) => <li key={i} className="text-sm">{k}</li>)}
                  </ul>
                </div>
              )}

              {result.flashcards.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">Quick flashcards</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.flashcards.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{f.front}</p>
                        <p className="text-sm">{f.back}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
