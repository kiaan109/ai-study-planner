'use client';
import 'katex/dist/katex.min.css';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Lightbulb, Layers, BookOpenCheck } from 'lucide-react';
import Header from '@/components/layout/Header';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import FormulaBlock from '@/components/ask/FormulaBlock';
import DiagramBlock from '@/components/ask/DiagramBlock';
import MarkdownLite from '@/components/ask/MarkdownLite';
import { createClient } from '@/lib/supabase/client';
import { ExplainResult } from '@/types';

const SUGGESTIONS = [
  "Explain Newton's second law",
  'Derive the quadratic formula',
  'Causes of World War I',
  'How does photosynthesis work?',
];

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);

  async function authHeaders() {
    const { data: { session } } = await createClient().auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  }

  async function handleSend(message: string, files: File[]) {
    if (!message.trim() && files.length === 0) return;
    if (!message.trim()) { toast.error('Type a question or topic first'); return; }

    setLoading(true);
    setResult(null);
    try {
      let context = '';
      const images: string[] = [];

      for (const file of files) {
        if (file.type === 'application/pdf') {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/syllabus/parse-pdf', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.text) context += `\n\n${data.text}`;
        } else if (file.type.startsWith('image/')) {
          if (images.length < 4) images.push(await fileToDataUrl(file));
        } else if (file.type.startsWith('text/')) {
          context += `\n\n${await file.text()}`;
        }
      }

      const res = await fetch('/api/ask/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ question: message, context: context.trim(), images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setQuestion('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function handleVoiceMessage(audio: Blob, duration: number) {
    if (duration < 1) return;
    const toastId = toast.loading('Transcribing your recording…');
    try {
      const fd = new FormData();
      fd.append('file', new File([audio], 'recording.webm', { type: 'audio/webm' }));
      const res = await fetch('/api/ask/transcribe', { method: 'POST', headers: await authHeaders(), body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestion((prev) => (prev ? `${prev} ${data.text}` : data.text));
      toast.success('Transcribed — review and hit send', { id: toastId });
    } catch {
      toast.error('Transcription failed', { id: toastId });
    }
  }

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Ask AI" subtitle="Any subject, any format — get explanations, formulas, diagrams and examples instantly" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {!result && !loading && (
            <div className="text-center pt-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <Sparkles className="w-3.5 h-3.5" /> Any subject, instantly
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-2">What do you want to understand?</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Type a question, attach a textbook page or photo, or record yourself asking it.
              </p>
            </div>
          )}

          <PromptInputBox
            value={question}
            onValueChange={setQuestion}
            onSend={handleSend}
            onVoiceMessage={handleVoiceMessage}
            isLoading={loading}
            placeholder="Ask about any subject — formulas, diagrams, concepts…"
          />

          {!result && !loading && (
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="px-3.5 py-2 rounded-full text-xs font-medium border transition-colors hover:border-purple-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
