'use client';
import { useState } from 'react';
import { Subject, Note } from '@/types';
import { Loader2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  subjects: Subject[];
  defaultSubjectId?: string;
  defaultChapterId?: string;
  onCreated: (note: Note) => void;
  onCancel: () => void;
}

export default function NotesGenerator({ subjects, defaultSubjectId, defaultChapterId, onCreated, onCancel }: Props) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? '');
  const [chapterId, setChapterId] = useState(defaultChapterId ?? '');
  const [loading, setLoading] = useState(false);

  const subject = subjects.find(s => s.id === subjectId) as any;
  const chapters = subject?.chapters ?? [];
  const chapter  = chapters.find((c: any) => c.id === chapterId);

  async function generate() {
    if (!subjectId || !chapterId) { toast.error('Select a subject and chapter'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId, chapterId,
          subjectName: subject?.name ?? '',
          chapterName: chapter?.name ?? '',
          topics: chapter?.topics?.map((t: any) => t.name) ?? [],
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const { notes } = await res.json();
      toast.success(`Generated ${notes.length} note sets!`);
      if (notes[0]) onCreated(notes[0]);
    } catch {
      toast.error('Generation failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg animate-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Generate AI Notes</h2>
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Subject</label>
          <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(''); }} className="input">
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{(s as any).icon} {s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Chapter</label>
          <select value={chapterId} onChange={e => setChapterId(e.target.value)} className="input" disabled={!subjectId}>
            <option value="">Select chapter…</option>
            {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {chapterId && (
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
            <p className="text-sm font-medium mb-2">Will generate:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Short Notes','Detailed Notes','Key Points','Exam Questions','Flashcards'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={generate} disabled={loading || !chapterId} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI…</> : <><Sparkles className="w-4 h-4" /> Generate Notes</>}
        </button>
      </div>
    </div>
  );
}
