// server/src/llm/client.js
import 'dotenv/config';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn(' OPENAI_API_KEY is not set. LLM calls will be stubbed. Add it to apps/server/.env to enable real calls.');
}

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * askLLM - minimal helper for chatting with the model
 * @param {Object} opts
 * @param {string} opts.prompt - user message
 * @param {string} [opts.system] - system instruction
 * @param {string} [opts.model] - override model name
 * @param {number} [opts.temperature=0.2]
 * @param {number} [opts.max_tokens=512]
 * @returns {Promise<{ text: string, usage?: any }>}
 */
export async function askLLM({
  prompt,
  system = 'You are a pricing & invoicing assistant. Be concise and actionable.',
  model = MODEL,
  temperature = 0.2,
  max_tokens = 512
}) {
  if (!prompt || !prompt.trim()) return { text: '' };

  // small retry once on transient errors
  if (!openai) {
    return { text: '[LLM disabled: set OPENAI_API_KEY to enable responses]' };
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      });

      const choice = res.choices?.[0];
      return {
        text: choice?.message?.content ?? '',
        usage: res.usage
      };
    } catch (err) {
      const transient = isTransient(err);
      if (attempt < 2 && transient) {
        await wait(250 * attempt);
        continue;
      }
      throw err;
    }
  }
}

/** Simple health check to verify the API key works */
export async function llmHealthCheck() {
  try {
    const out = await askLLM({ prompt: 'Say "ok".', max_tokens: 5 });
    return { ok: true, reply: out.text };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function isTransient(err) {
  const msg = String(err?.message || err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('rate limit') ||
    msg.includes('temporarily') ||
    msg.includes('overloaded')
  );
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
