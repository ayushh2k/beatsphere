/**
 * Query hook for remapped (year-end) stats.
 * Uses TanStack Query for caching with 24-hour staleTime.
 */

import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { queryKeys } from '@/config/queryKeys';
import { STORAGE_KEYS } from '@/config/constants';
import { getRemappedStats } from '../../../utils/remappedHelpers';
import type { RemappedStats } from '../../../utils/remappedHelpers';

export function useRemappedStats() {
  return useQuery({
    queryKey: queryKeys.lastfm.remappedStats(),
    queryFn: async () => {
      const username = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);
      if (!username) {
        throw new Error('No username found');
      }
      return getRemappedStats(username);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (yearly data, expensive computation)
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
}

export type { RemappedStats };
