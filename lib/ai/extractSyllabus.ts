import { callAI } from './client';
import { SyllabusData } from '@/types';

export async function extractSyllabus(text: string): Promise<SyllabusData> {
  const system = `You are an expert academic assistant. Extract structured syllabus information from the provided text.
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "subjects": [
    {
      "name": "string",
      "description": "string",
      "chapters": [
        {
          "name": "string",
          "topics": ["string"]
        }
      ]
    }
  ]
}`;

  const prompt = `Extract all subjects, chapters, and topics from this syllabus:\n\n${text}`;

  try {
    const raw = await callAI(system, prompt);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as SyllabusData;
  } catch {
    return { subjects: [] };
  }
}
