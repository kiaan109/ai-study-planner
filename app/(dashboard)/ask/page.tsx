'use client';
import 'katex/dist/katex.min.css';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import ResultCard from '@/components/ask/ResultCard';
import { createClient } from '@/lib/supabase/client';
import { ExplainResult } from '@/types';

const SUGGESTIONS = [
  "Explain Newton's second law",
  'Derive the quadratic formula',
  'Causes of World War I',
  'How does photosynthesis work?',
];

const STORAGE_KEY = 'studyai_ask_messages';
const MAX_STORED = 30;
const MAX_HISTORY_TURNS = 6;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  question: string;
  attachments?: string[];
  result?: ExplainResult;
  error?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* ignore corrupt local state */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED))); } catch { /* storage full/unavailable */ }
  }, [messages, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function authHeaders() {
    const { data: { session } } = await createClient().auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  }

  async function handleSend(message: string, files: File[]) {
    if (!message.trim() && files.length === 0) return;
    if (!message.trim()) { toast.error('Type a question or topic first'); return; }

    const userMsg: ChatMessage = { id: newId(), role: 'user', question: message, attachments: files.map((f) => f.name) };
    const historyForApi = messages
      .filter((m) => m.role === 'assistant' && m.result)
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ question: m.question, summary: m.result!.summary }));

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setQuestion('');

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
        body: JSON.stringify({ question: message, context: context.trim(), images, history: historyForApi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', question: message, result: data.result }]);
    } catch (err: any) {
      const errMsg = err?.message ?? 'Something went wrong. Please try again.';
      toast.error(errMsg);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', question: message, error: errMsg }]);
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
    } catch (err: any) {
      toast.error(err?.message ?? 'Transcription failed', { id: toastId });
    }
  }

  function clearChat() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Ask AI" subtitle="Any subject, any format — get explanations, formulas, diagrams and examples instantly" />
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEmpty && !loading ? (
            <div className="text-center pt-6 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <Sparkles className="w-3.5 h-3.5" /> Any subject, instantly
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold mb-2">What do you want to understand?</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Type a question, attach a textbook page or photo, or record yourself asking it. Ask follow-ups — I remember this conversation.
              </p>
            </div>
          ) : (
            <div className="flex justify-end -mb-2">
              <button onClick={clearChat} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--muted)' }}>
                <Trash2 className="w-3.5 h-3.5" /> New chat
              </button>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="animate-in">
              {m.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                    {m.question}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {m.attachments.map((a, i) => <span key={i} className="text-[10px] bg-white/20 rounded px-1.5 py-0.5">{a}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ) : m.error ? (
                <div className="card border border-red-200 dark:border-red-900/50">
                  <p className="text-sm font-semibold text-red-500 mb-1">Couldn&apos;t answer that</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{m.error}</p>
                </div>
              ) : m.result ? (
                <ResultCard result={m.result} question={m.question} />
              ) : null}
            </div>
          ))}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Reading your material and building a full explanation…</p>
            </div>
          )}

          {isEmpty && !loading && (
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
        </div>
      </div>

      <div className="flex-shrink-0 border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto">
          <PromptInputBox
            value={question}
            onValueChange={setQuestion}
            onSend={handleSend}
            onVoiceMessage={handleVoiceMessage}
            isLoading={loading}
            placeholder="Ask about any subject — formulas, diagrams, concepts…"
          />
        </div>
      </div>
    </div>
  );
}
