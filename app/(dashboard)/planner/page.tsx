'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Loader2, CheckCircle, Circle, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function PlannerPage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [dailyPlans, setDailyPlans] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [title, setTitle] = useState('');

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('subjects').select('*, chapters(id,name)').eq('user_id', user.id),
      supabase.from('study_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setSubjects(s ?? []);
    setPlans(p ?? []);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function selectPlan(plan: any) {
    setSelectedPlan(plan);
    const { data } = await supabase.from('daily_plans').select('*').eq('plan_id', plan.id).order('date');
    setDailyPlans(data ?? []);
  }

  async function generatePlan() {
    if (!examDate || !title) { toast.error('Fill in the title and exam date'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, examDate, hoursPerDay,
          subjects: subjects.map(s => ({ name: s.name, chapters: s.chapters?.map((c: any) => c.name) ?? [] })),
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const { planId } = await res.json();
      toast.success('Study plan generated!');
      setShowForm(false);
      await fetchData();
      const { data: newPlan } = await supabase.from('study_plans').select('*').eq('id', planId).single();
      if (newPlan) selectPlan(newPlan);
    } catch {
      toast.error('Failed to generate plan. Please try again.');
    }
    setGenerating(false);
  }

  async function toggleDay(dp: any) {
    await supabase.from('daily_plans').update({ is_completed: !dp.is_completed }).eq('id', dp.id);
    setDailyPlans(prev => prev.map(d => d.id === dp.id ? { ...d, is_completed: !d.is_completed } : d));
  }

  async function deletePlan(id: string) {
    await supabase.from('study_plans').delete().eq('id', id);
    setPlans(prev => prev.filter(p => p.id !== id));
    if (selectedPlan?.id === id) { setSelectedPlan(null); setDailyPlans([]); }
    toast.success('Plan deleted');
  }

  const groupedByDate = dailyPlans.reduce((acc: any, dp) => {
    (acc[dp.date] = acc[dp.date] ?? []).push(dp);
    return acc;
  }, {});

  return (
    <div className="animate-in h-full flex flex-col">
      <Header title="Study Planner" subtitle="AI-generated day-by-day study schedules" />
      <div className="flex-1 flex overflow-hidden">
        {/* Plans sidebar */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              <Sparkles className="w-4 h-4" /> Generate Plan
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {plans.map(plan => (
              <div key={plan.id} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} onClick={() => selectPlan(plan)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{plan.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Exam: {formatDate(plan.exam_date)}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{plan.hours_per_day}h/day</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deletePlan(plan.id); }} className="p-1 rounded text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No plans yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <div className="max-w-lg animate-in">
              <h2 className="text-2xl font-bold mb-6">Generate Study Plan</h2>
              <div className="card space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Plan Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. IGCSE Finals 2026" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Exam Date</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Hours available per day: <strong>{hoursPerDay}h</strong></label>
                  <input type="range" min={1} max={10} step={0.5} value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}><span>1h</span><span>10h</span></div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <p className="text-sm font-medium mb-2">Subjects to include:</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => <span key={s.id} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{s.icon} {s.name}</span>)}
                  </div>
                  {subjects.length === 0 && <p className="text-xs" style={{ color: 'var(--muted)' }}>No subjects yet — upload your syllabus first</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={generatePlan} disabled={generating || subjects.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-70">
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-secondary py-3 px-5">Cancel</button>
                </div>
              </div>
            </div>
          ) : selectedPlan ? (
            <div className="animate-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPlan.title}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Exam: {formatDate(selectedPlan.exam_date)} · {selectedPlan.hours_per_day}h/day</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {dailyPlans.filter(d => d.is_completed).length}/{dailyPlans.length} tasks completed
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dps]: [string, any]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-sm font-bold" style={{ color: 'var(--muted)' }}>{formatDate(date)}</div>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                    <div className="space-y-2">
                      {dps.map((dp: any) => (
                        <div key={dp.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${dp.is_completed ? 'opacity-60' : ''}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                          <button onClick={() => toggleDay(dp)} className="flex-shrink-0">
                            {dp.is_completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" style={{ color: 'var(--muted)' }} />}
                          </button>
                          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${dp.is_completed ? 'line-through' : ''}`}>{dp.subject_name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{dp.chapter_name}</p>
                            {dp.notes && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>{dp.notes}</p>}
                          </div>
                          <span className="text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {dp.duration_minutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No plan selected</h3>
                <p className="mb-6" style={{ color: 'var(--muted)' }}>Generate an AI study plan or select an existing one</p>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 mx-auto">
                  <Sparkles className="w-4 h-4" /> Generate Study Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
