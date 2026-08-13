import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/client';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });

    const text = await transcribeAudio(file);
    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
