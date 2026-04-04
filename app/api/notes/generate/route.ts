import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateNotes } from '@/lib/ai/generateNotes';

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

    const { subjectId, chapterId, subjectName, chapterName, topics } = await req.json();
    const notes = await generateNotes(subjectName, chapterName, topics ?? []);
    const savedNotes = [];

    const { data: n1 } = await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, chapter_id: chapterId ?? null, title: `${chapterName} — Short Notes`, content: notes.shortNotes, type: 'short' }).select().single();
    if (n1) savedNotes.push(n1);

    const { data: n2 } = await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, chapter_id: chapterId ?? null, title: `${chapterName} — Detailed Notes`, content: notes.detailedNotes, type: 'detailed' }).select().single();
    if (n2) savedNotes.push(n2);

    const { data: n3 } = await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, chapter_id: chapterId ?? null, title: `${chapterName} — Key Points`, content: notes.importantPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n'), type: 'important' }).select().single();
    if (n3) savedNotes.push(n3);

    const { data: n4 } = await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, chapter_id: chapterId ?? null, title: `${chapterName} — Exam Questions`, content: notes.examQuestions.map((q: any, i: number) => `Q${i+1}: ${q.question}\nA: ${q.answer}`).join('\n\n'), type: 'exam_questions' }).select().single();
    if (n4) savedNotes.push(n4);

    if (notes.flashcards.length > 0) {
      const { data: n5 } = await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, chapter_id: chapterId ?? null, title: `${chapterName} — Flashcards`, content: JSON.stringify(notes.flashcards), type: 'flashcards' }).select().single();
      if (n5) {
        savedNotes.push(n5);
        await supabase.from('flashcards').insert(notes.flashcards.map((f: any) => ({ note_id: n5.id, front: f.front, back: f.back })));
      }
    }

    try { const { data: p } = await supabase.from('profiles').select('total_points').eq('id', user.id).single(); await supabase.from('profiles').update({ total_points: (p?.total_points ?? 0) + 30 }).eq('id', user.id); } catch { /* optional */ }

    return NextResponse.json({ notes: savedNotes, count: savedNotes.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
