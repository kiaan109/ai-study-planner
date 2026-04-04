import { callAI } from './client';
import { SyllabusData } from '@/types';

export async function extractSyllabus(text: string): Promise<SyllabusData> {
  const system = `You are an expert academic assistant. Extract structured syllabus information from the provided text.

CRITICAL RULES — READ CAREFULLY:
- Extract EVERY subject listed in the document
- For each subject, extract EVERY chapter/unit/section/topic listed — do NOT skip any, do NOT summarize
- If a subject lists 12 chapters, return ALL 12. If it lists 20, return ALL 20.
- Use the exact names from the document — do not paraphrase or rename
- If topics are listed under a chapter, include them all
- If no sub-topics are listed, set "topics" to an empty array []
- Return ONLY valid JSON, absolutely no markdown or extra text

JSON schema:
{
  "subjects": [
    {
      "name": "exact subject name from document",
      "description": "brief one-line description",
      "chapters": [
        {
          "name": "exact chapter/unit name from document",
          "topics": ["exact topic if listed", "another topic"]
        }
      ]
    }
  ]
}`;

  const prompt = `Extract ALL subjects and ALL their chapters/units from this academic document. Include every single chapter listed for each subject — do not limit or summarize:\n\n${text}`;

  try {
    const raw = await callAI(system, prompt);
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]) as SyllabusData;
    if (!parsed.subjects || parsed.subjects.length === 0) throw new Error('Empty subjects');

    return parsed;
  } catch (e) {
    console.error('extractSyllabus failed:', e);
    return { subjects: [] };
  }
}
