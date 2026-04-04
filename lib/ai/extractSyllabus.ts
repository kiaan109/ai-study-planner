import { callAI } from './client';
import { SyllabusData } from '@/types';

export async function extractSyllabus(text: string): Promise<SyllabusData> {
  const system = `You are an expert academic assistant. Extract ALL subjects/courses from the provided document — it could be a syllabus, schedule, timetable, or any academic document.

IMPORTANT RULES:
- Extract EVERY subject/course you can find, even if it's just a list
- If no chapters are listed, create 3-5 sensible chapter names based on the subject
- If topics aren't listed, create 3-5 relevant topic names for each chapter
- A schedule with subject names like "Mathematics", "Science" etc. is valid input — extract all subjects
- NEVER return an empty subjects array — always find at least something to extract
- Return ONLY valid JSON, no markdown, no explanation

JSON schema:
{
  "subjects": [
    {
      "name": "Subject name",
      "description": "Brief description",
      "chapters": [
        {
          "name": "Chapter name",
          "topics": ["topic 1", "topic 2", "topic 3"]
        }
      ]
    }
  ]
}`;

  const prompt = `Extract all subjects and create a structured study plan from this academic document. Even if it's a schedule or timetable, extract every subject listed and generate appropriate chapters and topics for each:\n\n${text.slice(0, 8000)}`;

  try {
    const raw = await callAI(system, prompt);
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON even if there's extra text around it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]) as SyllabusData;

    // If AI still returned empty, throw so we can retry
    if (!parsed.subjects || parsed.subjects.length === 0) {
      throw new Error('No subjects extracted');
    }

    return parsed;
  } catch (e) {
    console.error('extractSyllabus error:', e);
    // Fallback: ask AI more directly
    try {
      const fallbackPrompt = `List all school subjects/courses found in this text as JSON. Create chapters if none exist:\n\n${text.slice(0, 4000)}`;
      const raw2 = await callAI(system, fallbackPrompt);
      const cleaned2 = raw2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch2 = cleaned2.match(/\{[\s\S]*\}/);
      if (jsonMatch2) return JSON.parse(jsonMatch2[0]) as SyllabusData;
    } catch {}
    return { subjects: [] };
  }
}
