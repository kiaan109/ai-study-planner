import OpenAI from 'openai';

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set on the server — add it in your Vercel project\'s Environment Variables (and redeploy).');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? '';
}

/** Same as callAI but lets the user turn include images (data URLs) — needs a vision-capable model. */
export async function callAIVision(systemPrompt: string, userPrompt: string, images: string[] = []): Promise<string> {
  const content: any[] = [{ type: 'text', text: userPrompt }];
  for (const url of images) content.push({ type: 'image_url', image_url: { url } });

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ] as any,
  });
  return response.choices[0]?.message?.content ?? '';
}

/** Transcribes audio (recording of a lecture, question, etc.) to text via Whisper. */
export async function transcribeAudio(file: File): Promise<string> {
  const response = await getOpenAI().audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  return response.text ?? '';
}
