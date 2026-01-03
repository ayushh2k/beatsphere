/**
 * Query hook for weekly listening report.
 */

import { useQuery } from '@tanstack/react-query';
import { getWeeklyReport } from '@/lib/lastfm';
import { queryKeys } from '@/config/queryKeys';

export function useWeeklyReport() {
  return useQuery({
    queryKey: queryKeys.lastfm.weeklyReport(),
    queryFn: getWeeklyReport,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
