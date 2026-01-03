/**
 * Centralized query key factory for TanStack Query.
 * Ensures consistent query key structure across the application.
 *
 * Usage:
 * ```typescript
 * useQuery({
 *   queryKey: queryKeys.lastfm.topTracks(username, 10),
 *   queryFn: () => getTopTracks(username, 10),
 * })
 * ```
 */

export const queryKeys = {
  // Last.fm queries
  lastfm: {
    all: ['lastfm'] as const,
    topTracks: (username: string, limit?: number) =>
      ['lastfm', 'topTracks', username, limit] as const,
    topArtists: (username: string, period?: string, limit?: number) =>
      ['lastfm', 'topArtists', username, period, limit] as const,
    topAlbums: (username: string, period?: string, limit?: number) =>
      ['lastfm', 'topAlbums', username, period, limit] as const,
    recentTracks: (username: string, limit?: number) =>
      ['lastfm', 'recentTracks', username, limit] as const,
    listeningStatus: (username: string) =>
      ['lastfm', 'listeningStatus', username] as const,
    userInfo: (username: string) =>
      ['lastfm', 'userInfo', username] as const,
    weeklyReport: () =>
      ['lastfm', 'weeklyReport'] as const,
    remappedStats: () =>
      ['lastfm', 'remappedStats'] as const,
  },

  // Authentication queries
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
    userProfile: () => ['auth', 'userProfile'] as const,
  },

  // Remapped (Year in Review) queries
  remapped: {
    all: ['remapped'] as const,
    stats: (username: string) =>
      ['remapped', 'stats', username] as const,
  },

  // Map queries
  map: {
    all: ['map'] as const,
    nearbyUsers: () =>
      ['map', 'nearbyUsers'] as const,
    listeningStatus: (username: string) =>
      ['map', 'listeningStatus', username] as const,
  },

  // Chat queries
  chat: {
    all: ['chat'] as const,
    history: (chatId: string, limit?: number) =>
      ['chat', 'history', chatId, limit] as const,
  },
} as const;
