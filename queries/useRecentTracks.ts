/**
 * Query hook for user's recent tracks.
 */

import { useQuery } from '@tanstack/react-query';
import { getRecentTracks } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';

export function useRecentTracks(username: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.lastfm.recentTracks(username, limit),
    queryFn: () => getRecentTracks(username, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes (recent data changes frequently)
    enabled: !!username,
  });
}
