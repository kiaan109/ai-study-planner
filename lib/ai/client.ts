import OpenAI from 'openai';

const HAS_OPENROUTER = !!process.env.OPENROUTER_API_KEY;
const HAS_OPENAI = !!process.env.OPENAI_API_KEY;

// OpenRouter's free-tier model slugs churn — models get retired or renamed without
// notice (confirmed twice already: llama-3.3-70b-instruct:free and
// gemini-2.0-flash-exp:free both went dead mid-testing). We try these in order and
// skip any that 404, and if every single one is gone, fall through to GPT-4o below
// (only if OPENAI_API_KEY is also set) rather than just failing outright.
// Check what's currently free at https://openrouter.ai/models?max_price=0 — set
// OPENROUTER_TEXT_MODEL / OPENROUTER_VISION_MODEL to force a specific first choice.
const TEXT_MODEL_CANDIDATES = [
  process.env.OPENROUTER_TEXT_MODEL,
  'deepseek/deepseek-chat-v3.1:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
].filter((m): m is string => !!m);

const VISION_MODEL_CANDIDATES = [
  process.env.OPENROUTER_VISION_MODEL,
  'qwen/qwen2.5-vl-72b-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'google/gemini-2.0-flash-exp:free',
].filter((m): m is string => !!m);

function openRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://studyai.app',
      'X-Title': 'StudyAI',
    },
  });
}

function openAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

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

/** Tries each model in order, skipping any that 404 (retired/renamed) — any other error surfaces immediately. */
async function withModelFallback<T>(models: string[], fn: (model: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await withRetry(() => fn(model));
    } catch (e) {
      lastError = e;
      if (e instanceof OpenAI.NotFoundError) continue;
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No configured model is available right now.');
}

async function chatComplete(messages: any[], opts: { vision?: boolean } = {}): Promise<string> {
  const candidates = opts.vision ? VISION_MODEL_CANDIDATES : TEXT_MODEL_CANDIDATES;

  if (HAS_OPENROUTER) {
    try {
      return await withModelFallback(candidates, async (model) => {
        const r = await openRouterClient().chat.completions.create({
          model, max_tokens: 4096, response_format: { type: 'json_object' }, messages,
        });
        return r.choices[0]?.message?.content ?? '';
      });
    } catch (e) {
      // OpenRouter failed for any reason (model gone, rate-limited, unreachable —
      // "Connection error." included) — fall through to OpenAI below if we have a key,
      // instead of only doing that for the narrower "model not found" case.
      console.error('OpenRouter call failed, falling back to OpenAI if configured:', e);
      if (!HAS_OPENAI) throw e;
    }
  } else if (!HAS_OPENAI) {
    throw new Error('No AI provider configured — set OPENROUTER_API_KEY (free models) or OPENAI_API_KEY in your environment variables, then redeploy.');
  }

  return withRetry(async () => {
    const r = await openAIClient().chat.completions.create({
      model: 'gpt-4o', max_tokens: 4096, response_format: { type: 'json_object' }, messages,
    });
    return r.choices[0]?.message?.content ?? '';
  });
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  return chatComplete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

/** Same as callAI but lets the user turn include images (data URLs) — needs a vision-capable model. */
export async function callAIVision(systemPrompt: string, userPrompt: string, images: string[] = []): Promise<string> {
  const content: any[] = [{ type: 'text', text: userPrompt }];
  for (const url of images) content.push({ type: 'image_url', image_url: { url } });
  return chatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    { vision: true },
  );
}

/** Transcribes audio (recording of a lecture, question, etc.) to text via Whisper — needs a real OpenAI key; OpenRouter doesn't proxy speech-to-text. */
export async function transcribeAudio(file: File): Promise<string> {
  if (!HAS_OPENAI) {
    throw new Error('Audio transcription needs an OPENAI_API_KEY specifically — OpenRouter doesn\'t support speech-to-text. Set OPENAI_API_KEY to enable it, or stick to text/photo questions.');
  }
  return withRetry(async () => {
    const response = await openAIClient().audio.transcriptions.create({ file, model: 'whisper-1' });
    return response.text ?? '';
  });
}
