import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateExplanation } from '@/lib/ai/generateExplanation';

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

    const { question, context, images } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    if (images?.length > 4) return NextResponse.json({ error: 'Too many images (max 4)' }, { status: 400 });

    const result = await generateExplanation(question, context, images);

    try {
      const { data: p } = await supabase.from('profiles').select('total_points').eq('id', user.id).single();
      await supabase.from('profiles').update({ total_points: (p?.total_points ?? 0) + 10 }).eq('id', user.id);
    } catch { /* optional, non-blocking */ }

    return NextResponse.json({ result });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
