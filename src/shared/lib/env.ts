import { z } from 'zod';

export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_API_URL is required')
    .url('NEXT_PUBLIC_API_URL must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: unknown): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  • ${issue.path.join('.') || 'NEXT_PUBLIC_API_URL'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid frontend environment configuration:\n${errorDetails}\nPlease ensure NEXT_PUBLIC_API_URL is configured in your environment or .env file.`,
    );
  }

  return Object.freeze(result.data);
}

export const env = parseEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
