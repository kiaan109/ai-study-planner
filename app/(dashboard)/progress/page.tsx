'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Trophy, Flame, Target, Clock } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/utils';

const COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#22c55e','#14b8a6','#eab308','#06b6d4'];

export default function ProgressPage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: p }, { data: s }, { data: sess }, { data: ach }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subjects').select('*, chapters(id,is_completed)').eq('user_id', user.id),
      supabase.from('study_sessions').select('*, subjects(name,color)').eq('user_id', user.id).order('started_at', { ascending: false }).limit(60),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
    ]);
    setProfile(p);
    setSubjects(s ?? []);
    setSessions(sess ?? []);
    setUnlockedIds((ach ?? []).map((a: any) => a.achievement_id));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Chart: time per subject
  const subjectTime = subjects.map(s => ({
    name: s.name.substring(0, 8),
    hours: parseFloat((sessions.filter((sess: any) => sess.subject_id === s.id).reduce((a: number, sess: any) => a + sess.duration_seconds, 0) / 3600).toFixed(1)),
    color: s.color,
  }));

  // Chart: daily hours last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const ds = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const hrs = parseFloat((sessions.filter(s => s.started_at?.startsWith(ds)).reduce((a: number, s: any) => a + s.duration_seconds, 0) / 3600).toFixed(1));
    return { name: dayName, hours: hrs };
  });

  const totalHours = sessions.reduce((a: number, s: any) => a + s.duration_seconds, 0) / 3600;
  const totalChapters = subjects.flatMap(s => s.chapters ?? []).length;
  const doneChapters = subjects.flatMap(s => s.chapters ?? []).filter((c: any) => c?.is_completed).length;

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="card h-40 animate-pulse"/>)}</div>;

  return (
    <div className="animate-in">
      <Header title="Progress" subtitle="Your study stats and achievements" />
      <div className="p-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Clock,  color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',   label: 'Total Hours',   value: `${totalHours.toFixed(1)}h` },
            { icon: Target, color: 'text-green-600 bg-green-50 dark:bg-green-900/20',  label: 'Chapters Done', value: `${doneChapters}/${totalChapters}` },
            { icon: Flame,  color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',label: 'Day Streak',   value: `${profile?.streak ?? 0} 🔥` },
            { icon: Trophy, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',label: 'Points',       value: profile?.total_points ?? 0 },
          ].map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-6 h-6" /></div>
              <div><p className="text-sm" style={{color:'var(--muted)'}}>{label}</p><p className="text-2xl font-extrabold">{value}</p></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily study hours */}
          <div className="card">
            <h3 className="font-bold mb-4">Daily Study Hours (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Bar dataKey="hours" fill="url(#barGrad)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time per subject */}
          <div className="card">
            <h3 className="font-bold mb-4">Time Per Subject</h3>
            {subjectTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={subjectTime} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {subjectTime.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-sm" style={{color:'var(--muted)'}}>Start studying to see data</div>}
          </div>
        </div>

        {/* Subject progress */}
        <div className="card">
          <h3 className="font-bold mb-5">Chapter Completion by Subject</h3>
          <div className="space-y-4">
            {subjects.map(s => {
              const total = s.chapters?.length ?? 0;
              const done  = s.chapters?.filter((c: any) => c?.is_completed).length ?? 0;
              const pct   = total > 0 ? Math.round(done/total*100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm flex items-center gap-2"><span>{s.icon}</span>{s.name}</span>
                    <span className="text-sm" style={{color:'var(--muted)'}}>{done}/{total} · {pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <h3 className="font-bold mb-5 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ACHIEVEMENTS.map(ach => {
              const unlocked = unlockedIds.includes(ach.id);
              return (
                <div key={ach.id} className={`p-4 rounded-2xl border text-center transition-all ${unlocked ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'border-dashed opacity-50'}`} style={{ borderColor: unlocked ? undefined : 'var(--border)' }}>
                  <div className="text-3xl mb-2">{unlocked ? ach.icon : '🔒'}</div>
                  <p className="font-semibold text-xs mb-1">{ach.name}</p>
                  <p className="text-xs" style={{color:'var(--muted)'}}>{ach.description}</p>
                  {unlocked && <p className="text-xs text-yellow-600 font-bold mt-1">+{ach.points} pts</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
