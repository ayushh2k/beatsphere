/**
 * Shared TanStack Query hooks barrel export.
 * Import data fetching hooks from this entry point.
 *
 * @example
 * ```typescript
 * import { useTopTracks, useTopArtists } from '@/queries';
 *
 * const { data: tracks, isLoading } = useTopTracks(username, 10);
 * ```
 */

export { useTopTracks } from './useTopTracks';
export { useTopArtists } from './useTopArtists';
export { useTopAlbums } from './useTopAlbums';
export { useRecentTracks } from './useRecentTracks';
export { useWeeklyReport } from './useWeeklyReport';
export { useListeningStatus } from './useListeningStatus';
export { useUserInfo } from './useUserInfo';
