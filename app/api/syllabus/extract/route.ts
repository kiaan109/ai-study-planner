import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractSyllabus } from '@/lib/ai/extractSyllabus';
import { randomColor, randomIcon } from '@/lib/utils';

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

    // Ensure profile exists (in case the signup trigger didn't fire)
    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
    }

    const body = await req.json();
    const { text } = body;
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const syllabusData = await extractSyllabus(text);
    console.log('Extracted subjects:', syllabusData.subjects?.length, syllabusData.subjects?.map((s: any) => s.name));

    const created = [];
    for (const subj of syllabusData.subjects) {
      const { data: subject } = await supabase
        .from('subjects')
        .insert({ user_id: user.id, name: subj.name, description: subj.description, color: randomColor(), icon: randomIcon() })
        .select().single();

      if (!subject) continue;

      for (let i = 0; i < subj.chapters.length; i++) {
        const ch = subj.chapters[i];
        const { data: chapter } = await supabase
          .from('chapters')
          .insert({ subject_id: subject.id, name: ch.name, order_index: i })
          .select().single();

        if (chapter && ch.topics?.length) {
          await supabase.from('topics').insert(
            ch.topics.map((t: string, j: number) => ({ chapter_id: chapter.id, name: t, order_index: j }))
          );
        }
      }
      created.push(subject);
    }

    if (created.length === 0) {
      return NextResponse.json({
        error: `AI found ${syllabusData.subjects?.length ?? 0} subjects but could not save them. Check Supabase connection.`,
        debug: syllabusData.subjects?.map((s: any) => s.name)
      }, { status: 422 });
    }
    return NextResponse.json({ subjects: created, count: created.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
