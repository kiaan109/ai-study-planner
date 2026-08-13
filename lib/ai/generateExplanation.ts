import { callAI, callAIVision } from './client';
import { ExplainResult } from '@/types';

const SYSTEM = `You are an world-class teacher who can explain any subject (math, physics, chemistry, biology, history, languages, CS, economics, etc.) to a student clearly and completely.

Given the student's question and any supplied context (textbook excerpt, transcribed audio, or a photo of a page), respond with ONLY valid JSON — no markdown fences, no extra text — matching exactly this shape:
{
  "title": "short descriptive title for this topic",
  "summary": "2-3 sentence plain-English TL;DR",
  "explanation": "the full explanation in markdown. Use ## headings, **bold**, and - bullet lists to structure it into sections like Overview, How it works, Why it matters, Common mistakes. 400-900 words.",
  "formulas": [{ "name": "formula name", "latex": "valid LaTeX WITHOUT surrounding $ signs, e.g. F = ma or \\\\frac{a}{b}", "explanation": "what each symbol means and when to use it" }],
  "diagram": { "title": "diagram title", "mermaid": "a valid Mermaid.js diagram definition (flowchart TD, sequenceDiagram, mindmap, etc.) that visualizes the concept, process, or relationships" } or null if a diagram would not help,
  "examples": [{ "problem": "a worked example problem", "solution": "step-by-step solution" }],
  "keyTakeaways": ["short memorable point", ...],
  "flashcards": [{ "front": "term or question", "back": "definition or answer" }]
}

Rules:
- "formulas" should be [] for non-quantitative topics (e.g. history, literature) — do not force formulas in.
- Only include a "diagram" when it genuinely clarifies the concept (a process, cycle, hierarchy, timeline, or relationship). Prefer "flowchart TD" or "mindmap" syntax. Keep node labels short and avoid special characters that break Mermaid parsing (no parentheses or quotes inside node text).
- Escape backslashes correctly so the JSON parses (e.g. write "\\\\frac{a}{b}" for \\frac{a}{b}).
- Include 3-6 formulas max, 2-3 examples, 5-8 keyTakeaways, 6-10 flashcards.
- Ground the answer in any supplied textbook/audio/image context when present; otherwise use your own knowledge.
- If "Recent conversation" is supplied, this is a follow-up in an ongoing chat — resolve pronouns and references like "that", "it", "the second one", "go deeper on X" against it. Otherwise treat the question as standalone.`;

export interface HistoryTurn {
  question: string;
  summary: string;
}

function buildUserPrompt(question: string, context?: string, history?: HistoryTurn[]) {
  let prompt = '';
  if (history?.length) {
    prompt += `Recent conversation (oldest first):\n${history.map((h, i) => `${i + 1}. Student asked: "${h.question}" — you answered: "${h.summary}"`).join('\n')}\n\n`;
  }
  prompt += `Student's question / topic: ${question}`;
  if (context?.trim()) {
    prompt += `\n\nAdditional context extracted from the student's material (textbook page, notes, or audio transcript):\n"""\n${context.trim().slice(0, 12000)}\n"""`;
  }
  return prompt;
}

function parse(raw: string): ExplainResult {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const data = JSON.parse(cleaned);
  return {
    title: data.title ?? 'Explanation',
    summary: data.summary ?? '',
    explanation: data.explanation ?? '',
    formulas: Array.isArray(data.formulas) ? data.formulas : [],
    diagram: data.diagram && data.diagram.mermaid ? data.diagram : null,
    examples: Array.isArray(data.examples) ? data.examples : [],
    keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
    flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
  };
}

export async function generateExplanation(
  question: string,
  context?: string,
  images?: string[],
  history?: HistoryTurn[]
): Promise<ExplainResult> {
  const userPrompt = buildUserPrompt(question, context, history);
  const raw = images?.length
    ? await callAIVision(SYSTEM, userPrompt, images)
    : await callAI(SYSTEM, userPrompt);
  try {
    return parse(raw);
  } catch {
    throw new Error('The AI response wasn\'t valid — please try rephrasing your question.');
  }
}
