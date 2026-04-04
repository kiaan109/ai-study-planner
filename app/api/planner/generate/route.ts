import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateStudyPlan } from '@/lib/ai/generateStudyPlan';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, examDate, hoursPerDay, subjects } = await req.json();
    const plan = await generateStudyPlan({ subjects, examDate, hoursPerDay });

    const { data: savedPlan } = await supabase
      .from('study_plans')
      .insert({ user_id: user.id, title, exam_date: examDate, hours_per_day: hoursPerDay })
      .select().single();

    if (!savedPlan) return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });

    if (plan.daily_plans.length > 0) {
      await supabase.from('daily_plans').insert(
        plan.daily_plans.map((dp: any) => ({
          plan_id: savedPlan.id,
          date: dp.date,
          subject_name: dp.subject_name,
          chapter_name: dp.chapter_name,
          duration_minutes: dp.duration_minutes,
          notes: dp.notes,
        }))
      );
    }

    try { const { data: p } = await supabase.from('profiles').select('total_points').eq('id', user.id).single(); await supabase.from('profiles').update({ total_points: (p?.total_points ?? 0) + 20 }).eq('id', user.id); } catch { /* optional */ }

    return NextResponse.json({ planId: savedPlan.id, daysCount: plan.daily_plans.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
