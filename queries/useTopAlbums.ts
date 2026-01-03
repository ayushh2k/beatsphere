/**
 * Query hook for user's top albums.
 */

import { useQuery } from '@tanstack/react-query';
import { getTopAlbums } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';
import { CACHE_DURATIONS } from '@/config/constants';

export function useTopAlbums(
  username: string,
  period: string = '1month',
  limit: number = 10
) {
  return useQuery({
    queryKey: queryKeys.lastfm.topAlbums(username, period, limit),
    queryFn: () => getTopAlbums(username, period, limit),
    staleTime: CACHE_DURATIONS.TOP_ALBUMS,
    enabled: !!username,
  });
}
