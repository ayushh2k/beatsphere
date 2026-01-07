/**
 * Zod schemas for Tenor GIF API responses.
 */

import { z } from 'zod';

export const TenorMediaFormatSchema = z.object({
  url: z.string(),
  duration: z.number().optional(),
  preview: z.string().optional(),
  dims: z.array(z.number()).optional(),
  size: z.number().optional(),
});

export const TenorMediaFormatsSchema = z.object({
  gif: TenorMediaFormatSchema.optional(),
  tinygif: TenorMediaFormatSchema.optional(),
  nanogif: TenorMediaFormatSchema.optional(),
  mediumgif: TenorMediaFormatSchema.optional(),
  mp4: TenorMediaFormatSchema.optional(),
  tinymp4: TenorMediaFormatSchema.optional(),
  nanomp4: TenorMediaFormatSchema.optional(),
  webm: TenorMediaFormatSchema.optional(),
  tinywebm: TenorMediaFormatSchema.optional(),
});

export const TenorGifSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  media_formats: TenorMediaFormatsSchema,
  created: z.number().optional(),
  content_description: z.string().optional(),
  itemurl: z.string().optional(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  flags: z.array(z.string()).optional(),
  hasaudio: z.boolean().optional(),
});

export const TenorSearchResponseSchema = z.object({
  results: z.array(TenorGifSchema),
  next: z.string().optional(),
});

export type TenorMediaFormat = z.infer<typeof TenorMediaFormatSchema>;
export type TenorMediaFormats = z.infer<typeof TenorMediaFormatsSchema>;
export type TenorGif = z.infer<typeof TenorGifSchema>;
export type TenorSearchResponse = z.infer<typeof TenorSearchResponseSchema>;
