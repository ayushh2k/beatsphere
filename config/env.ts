import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_LASTFM_KEY: z.string().min(1, 'Last.fm API key is required'),
  EXPO_PUBLIC_LASTFM_SECRET: z.string().min(1, 'Last.fm secret is required'),
  EXPO_PUBLIC_TENOR_API_KEY: z.string().min(1, 'Tenor API key is required'),
  EXPO_PUBLIC_BACKEND_URL: z.string().url().optional().default('https://api.beatsphere.live'),
});

/**
 * Validated environment variables.
 * Throws an error at startup if any required variables are missing or invalid.
 */
export const env = envSchema.parse({
  EXPO_PUBLIC_LASTFM_KEY: process.env.EXPO_PUBLIC_LASTFM_KEY,
  EXPO_PUBLIC_LASTFM_SECRET: process.env.EXPO_PUBLIC_LASTFM_SECRET,
  EXPO_PUBLIC_TENOR_API_KEY: process.env.EXPO_PUBLIC_TENOR_API_KEY,
  EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
});

export type Env = z.infer<typeof envSchema>;
