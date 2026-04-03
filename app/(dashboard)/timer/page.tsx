'use client';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { Subject, Chapter } from '@/types';
import { Play, Square, RotateCcw, Clock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

function pad(n: number) { return String(n).padStart(2, '0'); }

function TimerPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') ?? '');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const sessionStart = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: s }, { data: sess }] = await Promise.all([
      supabase.from('subjects').select('*, chapters(id, name)').eq('user_id', user.id),
      supabase.from('study_sessions').select('*, subjects(name,icon), chapters(name)').eq('user_id', user.id).order('started_at', { ascending: false }).limit(10),
    ]);
    setSubjects((s ?? []) as any);
    setSessions(sess ?? []);
    if (s && s.length > 0 && !selectedSubject) setSelectedSubject(s[0].id);
  }, [supabase, selectedSubject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const sub = subjects.find(s => s.id === selectedSubject) as any;
    setChapters(sub?.chapters ?? []);
    setSelectedChapter('');
  }, [selectedSubject, subjects]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  async function start() {
    if (!selectedSubject) { toast.error('Select a subject first'); return; }
    sessionStart.current = new Date();
    setRunning(true);
    toast.success('Study session started!');
  }

  async function stop() {
    if (!sessionStart.current) return;
    setRunning(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject_id: selectedSubject || null,
      chapter_id: selectedChapter || null,
      duration_seconds: seconds,
      started_at: sessionStart.current.toISOString(),
      ended_at: new Date().toISOString(),
    });
    // Award points
    const pts = Math.floor(seconds / 60);
    try { await supabase.rpc('increment_points', { user_id: user.id, points: pts }); } catch { /* optional RPC */ }
    toast.success(`Session saved! +${pts} pts`);
    setSeconds(0);
    fetchData();
  }

  function reset() { setRunning(false); setSeconds(0); sessionStart.current = null; }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const todayTotal = sessions.filter(s => s.started_at?.startsWith(new Date().toISOString().split('T')[0])).reduce((a, s) => a + s.duration_seconds, 0);
  const fmt = (sec: number) => sec >= 3600 ? `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m` : `${Math.floor(sec/60)}m`;

  return (
    <div className="animate-in">
      <Header title="Study Timer" subtitle="Track your study sessions" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Timer display */}
        <div className="card text-center py-10">
          <div className="relative inline-block mb-8">
            <div className="w-52 h-52 rounded-full flex items-center justify-center mx-auto" style={{ background: 'conic-gradient(#3b82f6 0%, #8b5cf6 100%)', padding: '4px' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                <div>
                  <div className="text-5xl font-extrabold font-mono gradient-text">{pad(h)}:{pad(m)}:{pad(s)}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{running ? 'Studying…' : 'Ready'}</div>
                </div>
              </div>
            </div>
            {running && <div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />}
          </div>

          {/* Subject/Chapter selectors */}
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={running} className="input py-2 text-sm">
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
            <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} disabled={running} className="input py-2 text-sm">
              <option value="">Select chapter…</option>
              {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!running ? (
              <button onClick={start} className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-glow-blue transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                <Play className="w-7 h-7 ml-1" />
              </button>
            ) : (
              <button onClick={stop} className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 bg-red-500">
                <Square className="w-6 h-6" />
              </button>
            )}
            <button onClick={reset} className="w-12 h-12 rounded-full flex items-center justify-center border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" style={{ borderColor: 'var(--border)' }}>
              <RotateCcw className="w-5 h-5" style={{ color: 'var(--muted)' }} />
            </button>
          </div>
        </div>

        {/* Today's summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center py-6">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-extrabold gradient-text">{fmt(todayTotal)}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Today's total</div>
          </div>
          <div className="card text-center py-6">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-extrabold gradient-text">{sessions.length}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Total sessions</div>
          </div>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="card">
            <h3 className="font-bold mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((sess: any) => (
                <div key={sess.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <span className="text-xl">{sess.subjects?.icon ?? '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{sess.subjects?.name ?? 'Unknown'}</p>
                    {sess.chapters?.name && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sess.chapters.name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold gradient-text">{fmt(sess.duration_seconds)}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(sess.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimerPage() {
  return <Suspense fallback={<div className="p-6 animate-pulse text-sm" style={{ color: 'var(--muted)' }}>Loading timer…</div>}><TimerPageInner /></Suspense>;
}
