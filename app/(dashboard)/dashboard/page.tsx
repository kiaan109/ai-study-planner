'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { BookMarked, Clock, BarChart2, Calendar, ArrowRight, Flame, Trophy, Target, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      const user = session.user;
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const [{ data: profile }, { data: subjects }, { data: sessions }, { data: todayPlan }, { data: achievements }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subjects').select('id, name, color, icon, chapters(id, is_completed)').eq('user_id', user.id),
        supabase.from('study_sessions').select('duration_seconds, started_at').eq('user_id', user.id).gte('started_at', weekAgo),
        supabase.from('daily_plans').select('*, study_plans!inner(user_id)').eq('study_plans.user_id', user.id).eq('date', today).eq('is_completed', false).limit(5),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
      ]);

      setData({ profile, subjects, sessions, todayPlan, achievements, user, today });
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { profile, subjects, sessions, todayPlan, achievements, user, today } = data;
  const todaySeconds = sessions?.filter((s: any) => s.started_at.startsWith(today)).reduce((a: number, s: any) => a + s.duration_seconds, 0) ?? 0;
  const weekSeconds = sessions?.reduce((a: number, s: any) => a + s.duration_seconds, 0) ?? 0;
  const totalChapters = subjects?.flatMap((s: any) => s.chapters).length ?? 0;
  const completedChapters = subjects?.flatMap((s: any) => s.chapters).filter((c: any) => c?.is_completed).length ?? 0;
  const fmtTime = (s: number) => s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : `${Math.floor(s / 60)}m`;
  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const quickLinks = [
    { href: '/subjects', icon: BookMarked, label: 'Subjects', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { href: '/timer', icon: Clock, label: 'Start Timer', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { href: '/progress', icon: BarChart2, label: 'Progress', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { href: '/planner', icon: Calendar, label: 'Planner', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="animate-in">
      <Header title={`Good ${greeting}, ${firstName} 👋`} subtitle="Here's your study overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Today's study" value={fmtTime(todaySeconds)} sub="Keep it up!" color="text-blue-600 bg-blue-50 dark:bg-blue-900/30" />
          <StatCard icon={TrendingUp} label="This week" value={fmtTime(weekSeconds)} sub="7-day total" color="text-purple-600 bg-purple-50 dark:bg-purple-900/30" />
          <StatCard icon={Target} label="Chapters done" value={`${completedChapters}/${totalChapters}`} sub={`${totalChapters ? Math.round(completedChapters / totalChapters * 100) : 0}% complete`} color="text-green-600 bg-green-50 dark:bg-green-900/30" />
          <StatCard icon={Flame} label="Study streak" value={`${profile?.streak ?? 0} days`} sub={`${profile?.total_points ?? 0} total points`} color="text-orange-500 bg-orange-50 dark:bg-orange-900/30" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href} className="card flex items-center gap-3 hover:shadow-lg transition-all hover:-translate-y-0.5 p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Today's Study Plan</h2>
              <Link href="/planner" className="text-sm text-blue-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {todayPlan && todayPlan.length > 0 ? (
              <div className="space-y-3">
                {todayPlan.map((plan: any) => (
                  <div key={plan.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="w-2 h-12 rounded-full" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{plan.subject_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{plan.chapter_name}</p>
                    </div>
                    <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{plan.duration_minutes} min</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">No plan for today</p>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Create a study plan to see your daily schedule here</p>
                <Link href="/planner" className="btn-primary text-sm inline-flex">Create Study Plan</Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">My Subjects</h2>
                <Link href="/subjects" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              {subjects && subjects.length > 0 ? (
                <div className="space-y-2">
                  {subjects.slice(0, 4).map((s: any) => {
                    const total = s.chapters?.length ?? 0;
                    const done = s.chapters?.filter((c: any) => c?.is_completed).length ?? 0;
                    const pct = total > 0 ? Math.round(done / total * 100) : 0;
                    return (
                      <Link key={s.id} href={`/subjects/${s.id}`} className="block">
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <span className="text-xl">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{s.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="progress-bar flex-1 h-1.5"><div className="progress-fill h-1.5" style={{ width: `${pct}%` }} /></div>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{pct}%</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>No subjects yet</p>
                  <Link href="/subjects" className="btn-primary text-xs inline-flex">Upload Syllabus</Link>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="font-bold">Achievements</h2>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold gradient-text">{achievements?.length ?? 0}</div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>unlocked</p>
                <Link href="/progress" className="mt-3 text-xs text-blue-600 hover:underline block">View all achievements</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
