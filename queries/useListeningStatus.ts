/**
 * Query hook for user's current listening status.
 */

import { useQuery } from '@tanstack/react-query';
import { getListeningStatus } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';
import { CACHE_DURATIONS } from '@/config/constants';

export function useListeningStatus(username: string) {
  return useQuery({
    queryKey: queryKeys.lastfm.listeningStatus(username),
    queryFn: () => getListeningStatus(username),
    staleTime: 30 * 1000, // 30 seconds (real-time data)
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    enabled: !!username,
  });
}
