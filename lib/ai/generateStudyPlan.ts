import { callAI } from './client';

export interface PlanInput {
  subjects: { name: string; chapters: string[] }[];
  examDate: string;
  hoursPerDay: number;
  startDate?: string;
}

export interface GeneratedPlan {
  title: string;
  daily_plans: {
    date: string;
    subject_name: string;
    chapter_name: string;
    duration_minutes: number;
    notes: string;
  }[];
}

export async function generateStudyPlan(input: PlanInput): Promise<GeneratedPlan> {
  const system = `You are an academic coach who creates optimized study schedules.
Return ONLY valid JSON — no markdown, no extra text:
{
  "title": "Study Plan for [subject/exam]",
  "daily_plans": [
    {
      "date": "YYYY-MM-DD",
      "subject_name": "...",
      "chapter_name": "...",
      "duration_minutes": 60,
      "notes": "brief study tip"
    }
  ]
}`;

  const start = input.startDate ?? new Date().toISOString().split('T')[0];
  const subjectsText = input.subjects
    .map(s => `${s.name}: ${s.chapters.join(', ')}`)
    .join('\n');

  const prompt = `Create a study plan:
Start date: ${start}
Exam date: ${input.examDate}
Hours available per day: ${input.hoursPerDay}
Subjects and chapters:
${subjectsText}

Distribute chapters evenly, include revision days before the exam, and include short practical study tips. Set duration in minutes per session (max ${input.hoursPerDay * 60} total per day). Leave the last 2 days for full revision.`;

  try {
    const raw = await callAI(system, prompt);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as GeneratedPlan;
  } catch {
    return { title: 'Study Plan', daily_plans: [] };
  }
}
