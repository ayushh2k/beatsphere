/**
 * Tenor GIF API client.
 * Provides GIF search and featured GIF functionality.
 */

import axios from 'axios';
import { env } from '@/config/env';
import { TenorSearchResponseSchema, type TenorGif } from './schemas';

const TENOR_API_BASE = 'https://tenor.googleapis.com/v2';

/**
 * Search for GIFs on Tenor.
 * @param query - Search query string
 * @param limit - Number of results to fetch (default: 20)
 * @returns Array of GIFs
 */
export async function searchGifs(query: string, limit: number = 20): Promise<TenorGif[]> {
  const apiKey = env.EXPO_PUBLIC_TENOR_API_KEY;

  try {
    const response = await axios.get(`${TENOR_API_BASE}/search`, {
      params: {
        q: query,
        key: apiKey,
        limit,
      },
    });

    const validated = TenorSearchResponseSchema.parse(response.data);
    return validated.results;
  } catch (error) {
    console.error('Failed to fetch GIFs from Tenor:', error);
    return [];
  }
}

/**
 * Get featured GIFs from Tenor.
 * @param limit - Number of results to fetch (default: 20)
 * @returns Array of featured GIFs
 */
export async function getFeaturedGifs(limit: number = 20): Promise<TenorGif[]> {
  const apiKey = env.EXPO_PUBLIC_TENOR_API_KEY;

  try {
    const response = await axios.get(`${TENOR_API_BASE}/featured`, {
      params: {
        key: apiKey,
        limit,
      },
    });

    const validated = TenorSearchResponseSchema.parse(response.data);
    return validated.results;
  } catch (error) {
    console.error('Failed to fetch featured GIFs from Tenor:', error);
    return [];
  }
}

/**
 * Get GIF URL from a Tenor GIF object.
 * @param gif - Tenor GIF object
 * @param format - Format to extract ('gif' | 'tinygif' | 'nanogif', default: 'gif')
 * @returns GIF URL or null
 */
export function getGifUrl(
  gif: TenorGif,
  format: 'gif' | 'tinygif' | 'nanogif' | 'mediumgif' = 'gif'
): string | null {
  return gif.media_formats[format]?.url || null;
}
