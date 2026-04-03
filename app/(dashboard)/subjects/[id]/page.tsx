'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { Subject, Chapter } from '@/types';
import { ArrowLeft, CheckCircle, Circle, Plus, Trash2, FileText, Timer } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapter, setNewChapter] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: sub }, { data: chaps }] = await Promise.all([
      supabase.from('subjects').select('*').eq('id', id).single(),
      supabase.from('chapters').select('*, topics(*)').eq('subject_id', id).order('order_index'),
    ]);
    setSubject(sub);
    setChapters((chaps ?? []) as any);
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleChapter(ch: Chapter) {
    await supabase.from('chapters').update({ is_completed: !ch.is_completed }).eq('id', ch.id);
    setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, is_completed: !c.is_completed } : c));
    if (!ch.is_completed) toast.success('Chapter completed! +20 pts');
  }

  async function addChapter() {
    if (!newChapter.trim()) return;
    setAdding(true);
    const { data } = await supabase.from('chapters').insert({ subject_id: id, name: newChapter.trim(), order_index: chapters.length }).select().single();
    if (data) { setChapters(prev => [...prev, data as any]); setNewChapter(''); }
    setAdding(false);
  }

  async function deleteChapter(chapterId: string) {
    await supabase.from('chapters').delete().eq('id', chapterId);
    setChapters(prev => prev.filter(c => c.id !== chapterId));
  }

  const completed = chapters.filter(c => c.is_completed).length;
  const pct = chapters.length > 0 ? Math.round(completed / chapters.length * 100) : 0;

  if (!subject) return <div className="p-6 animate-in"><div className="card h-40 animate-pulse" /></div>;

  return (
    <div className="animate-in">
      <Header title={subject.name} subtitle={`${completed}/${chapters.length} chapters completed`} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Link href={`/notes?subject=${id}`} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
            <FileText className="w-4 h-4" /> Notes
          </Link>
          <Link href={`/timer?subject=${id}`} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
            <Timer className="w-4 h-4" /> Study Now
          </Link>
        </div>

        {/* Progress */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{subject.icon}</span>
              <div>
                <h2 className="font-bold text-lg">{subject.name}</h2>
                {subject.description && <p className="text-sm" style={{ color: 'var(--muted)' }}>{subject.description}</p>}
              </div>
            </div>
            <span className="text-3xl font-extrabold gradient-text">{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{completed} of {chapters.length} chapters done</p>
        </div>

        {/* Chapters */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg">Chapters</h3>
            <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{chapters.length} total</span>
          </div>
          <div className="space-y-2 mb-5">
            {chapters.map((ch, idx) => (
              <div key={ch.id} className="flex items-center gap-3 p-4 rounded-xl border hover:shadow-sm transition-all" style={{ borderColor: 'var(--border)', background: ch.is_completed ? 'rgba(34,197,94,0.05)' : 'var(--bg)' }}>
                <button onClick={() => toggleChapter(ch)} className="flex-shrink-0">
                  {ch.is_completed
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5" style={{ color: 'var(--muted)' }} />}
                </button>
                <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--muted)' }}>{idx + 1}</span>
                <span className={`flex-1 text-sm font-medium ${ch.is_completed ? 'line-through opacity-60' : ''}`}>{ch.name}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/notes?subject=${id}&chapter=${ch.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                    <FileText className="w-4 h-4" />
                  </Link>
                  <button onClick={() => deleteChapter(ch.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Add chapter */}
          <div className="flex gap-2">
            <input value={newChapter} onChange={e => setNewChapter(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChapter()} placeholder="Add a chapter…" className="input flex-1 py-2" />
            <button onClick={addChapter} disabled={adding} className="btn-primary flex items-center gap-1.5 py-2 px-4">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
