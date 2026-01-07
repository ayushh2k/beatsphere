/**
 * Query hook for user's top tracks.
 */

import { useQuery } from '@tanstack/react-query';
import { getTopTracks } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';
import { CACHE_DURATIONS } from '@/config/constants';

export function useTopTracks(username: string, limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.lastfm.topTracks(username, limit),
    queryFn: () => getTopTracks(username, limit),
    staleTime: CACHE_DURATIONS.TOP_TRACKS,
    enabled: !!username,
  });
}
