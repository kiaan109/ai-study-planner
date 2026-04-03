import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractSyllabus } from '@/lib/ai/extractSyllabus';
import { randomColor, randomIcon } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text } = body;
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const syllabusData = await extractSyllabus(text);

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
            ch.topics.map((t, j) => ({ chapter_id: chapter.id, name: t, order_index: j }))
          );
        }
      }
      created.push(subject);
    }

    return NextResponse.json({ subjects: created, count: created.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
