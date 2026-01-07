/**
 * Query hook for user's top artists.
 */

import { useQuery } from '@tanstack/react-query';
import { getTopArtists } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';
import { CACHE_DURATIONS } from '@/config/constants';

export function useTopArtists(
  username: string,
  period: string = '1month',
  limit: number = 10
) {
  return useQuery({
    queryKey: queryKeys.lastfm.topArtists(username, period, limit),
    queryFn: () => getTopArtists(username, period, limit),
    staleTime: CACHE_DURATIONS.TOP_ARTISTS,
    enabled: !!username,
  });
}
