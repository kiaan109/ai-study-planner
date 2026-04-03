import { callAI } from './client';
import { GeneratedNotes } from '@/types';

export async function generateNotes(
  subject: string,
  chapter: string,
  topics: string[]
): Promise<GeneratedNotes> {
  const system = `You are an expert teacher who creates comprehensive study materials for students.
Return ONLY valid JSON — no markdown, no extra text:
{
  "shortNotes": "concise summary (200-300 words)",
  "detailedNotes": "comprehensive explanation (500-800 words)",
  "importantPoints": ["point 1", "point 2", ...],
  "examQuestions": [{"question": "...", "answer": "..."}],
  "flashcards": [{"front": "term or question", "back": "definition or answer"}]
}`;

  const prompt = `Generate study notes for:
Subject: ${subject}
Chapter: ${chapter}
Topics: ${topics.join(', ')}

Create 8-10 important points, 5-7 exam questions with answers, and 8-10 flashcards.`;

  try {
    const raw = await callAI(system, prompt);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as GeneratedNotes;
  } catch {
    return {
      shortNotes: 'Failed to generate notes. Please try again.',
      detailedNotes: '',
      importantPoints: [],
      examQuestions: [],
      flashcards: [],
    };
  }
}
