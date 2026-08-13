import OpenAI from 'openai';

const USE_OPENROUTER = !!process.env.OPENROUTER_API_KEY;
// Free-tier OpenRouter models — override via env if these get renamed/retired.
// Check current free models at https://openrouter.ai/models?max_price=0
const OPENROUTER_TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.0-flash-exp:free';

function getOpenAI() {
  if (USE_OPENROUTER) {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://studyai.app',
        'X-Title': 'StudyAI',
      },
    });
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('No AI provider configured — set OPENROUTER_API_KEY (free models) or OPENAI_API_KEY in your environment variables, then redeploy.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const textModel = () => (USE_OPENROUTER ? OPENROUTER_TEXT_MODEL : 'gpt-4o');
const visionModel = () => (USE_OPENROUTER ? OPENROUTER_VISION_MODEL : 'gpt-4o');

/** Retries transient network/rate-limit/server failures — OpenAI's "Connection error." included — before giving up. */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const retryable = e instanceof OpenAI.APIConnectionError || (e instanceof OpenAI.APIError && (e.status === 429 || (e.status ?? 0) >= 500));
      if (!retryable || attempt >= retries) throw e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  return withRetry(async () => {
    const response = await getOpenAI().chat.completions.create({
      model: textModel(),
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  });
}

/** Same as callAI but lets the user turn include images (data URLs) — needs a vision-capable model. */
export async function callAIVision(systemPrompt: string, userPrompt: string, images: string[] = []): Promise<string> {
  return withRetry(async () => {
    const content: any[] = [{ type: 'text', text: userPrompt }];
    for (const url of images) content.push({ type: 'image_url', image_url: { url } });

    const response = await getOpenAI().chat.completions.create({
      model: visionModel(),
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ] as any,
    });
    return response.choices[0]?.message?.content ?? '';
  });
}

/** Transcribes audio (recording of a lecture, question, etc.) to text via Whisper — needs a real OpenAI key; OpenRouter doesn't proxy speech-to-text. */
export async function transcribeAudio(file: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Audio transcription needs an OPENAI_API_KEY specifically — OpenRouter doesn\'t support speech-to-text. Set OPENAI_API_KEY to enable it, or stick to text/photo questions.');
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return withRetry(async () => {
    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });
    return response.text ?? '';
  });
}
