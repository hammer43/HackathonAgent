import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini')
});

export function loadEnv(raw = process.env) {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`ENV_INVALID: ${issues}`);
  }
  return parsed.data;
}