import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await pdfParse(buffer);

    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
