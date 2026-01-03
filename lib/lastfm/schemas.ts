/**
 * Zod schemas for Last.fm API responses.
 * Provides runtime validation and type inference for all Last.fm data.
 */

import { z } from 'zod';

// Common schemas
export const LastFmImageSchema = z.object({
  '#text': z.string(),
  size: z.enum(['small', 'medium', 'large', 'extralarge', 'mega', '']),
});

export const LastFmArtistSchema = z.object({
  '#text': z.string().optional(),
  name: z.string().optional(),
  mbid: z.string().optional(),
  url: z.string().optional(),
});

// Session schema
export const LastFmSessionSchema = z.object({
  session: z.object({
    name: z.string(),
    key: z.string(),
    subscriber: z.number().optional(),
  }),
});

// User info schema
export const LastFmUserSchema = z.object({
  name: z.string(),
  realname: z.string().optional(),
  image: z.array(LastFmImageSchema).optional(),
  url: z.string().optional(),
  country: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  subscriber: z.string().optional(),
  playcount: z.string().optional(),
  playlists: z.string().optional(),
  bootstrap: z.string().optional(),
  registered: z.object({
    unixtime: z.string(),
    '#text': z.number().optional(),
  }).optional(),
  type: z.string().optional(),
});

export const LastFmUserInfoResponseSchema = z.object({
  user: LastFmUserSchema,
});

// Track schema
export const LastFmTrackSchema = z.object({
  name: z.string(),
  mbid: z.string().optional(),
  url: z.string().optional(),
  duration: z.string().optional(),
  streamable: z.union([z.string(), z.object({ '#text': z.string(), fulltrack: z.string() })]).optional(),
  artist: z.union([
    z.string(),
    LastFmArtistSchema,
    z.object({
      '#text': z.string(),
      mbid: z.string().optional(),
    }),
  ]),
  image: z.array(LastFmImageSchema).optional(),
  album: z.union([
    z.string(),
    z.object({
      '#text': z.string(),
      mbid: z.string().optional(),
    }),
  ]).optional(),
  playcount: z.string().optional(),
  listeners: z.string().optional(),
  '@attr': z.object({
    rank: z.string().optional(),
    nowplaying: z.string().optional(),
  }).optional(),
  date: z.object({
    uts: z.string(),
    '#text': z.string(),
  }).optional(),
  loved: z.string().optional(),
});

// Album schema
export const LastFmAlbumSchema = z.object({
  name: z.string(),
  mbid: z.string().optional(),
  url: z.string().optional(),
  artist: z.union([
    z.string(),
    LastFmArtistSchema,
    z.object({
      name: z.string(),
      mbid: z.string().optional(),
      url: z.string().optional(),
    }),
  ]),
  image: z.array(LastFmImageSchema).optional(),
  playcount: z.string().optional(),
  '@attr': z.object({
    rank: z.string().optional(),
  }).optional(),
});

// Artist (full) schema
export const LastFmArtistFullSchema = z.object({
  name: z.string(),
  mbid: z.string().optional(),
  url: z.string().optional(),
  image: z.array(LastFmImageSchema).optional(),
  streamable: z.string().optional(),
  playcount: z.string().optional(),
  listeners: z.string().optional(),
  '@attr': z.object({
    rank: z.string().optional(),
  }).optional(),
});

// Top tracks response
export const LastFmTopTracksResponseSchema = z.object({
  toptracks: z.object({
    track: z.array(LastFmTrackSchema),
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string().optional(),
      page: z.string().optional(),
      perPage: z.string().optional(),
      total: z.string().optional(),
    }).optional(),
  }),
});

// Top artists response
export const LastFmTopArtistsResponseSchema = z.object({
  topartists: z.object({
    artist: z.array(LastFmArtistFullSchema),
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string().optional(),
      page: z.string().optional(),
      perPage: z.string().optional(),
      total: z.string().optional(),
    }).optional(),
  }),
});

// Top albums response
export const LastFmTopAlbumsResponseSchema = z.object({
  topalbums: z.object({
    album: z.array(LastFmAlbumSchema),
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string().optional(),
      page: z.string().optional(),
      perPage: z.string().optional(),
      total: z.string().optional(),
    }).optional(),
  }),
});

// Recent tracks response
export const LastFmRecentTracksResponseSchema = z.object({
  recenttracks: z.object({
    track: z.union([
      LastFmTrackSchema,
      z.array(LastFmTrackSchema),
    ]),
    '@attr': z.object({
      user: z.string(),
      totalPages: z.string().optional(),
      page: z.string().optional(),
      perPage: z.string().optional(),
      total: z.string().optional(),
    }).optional(),
  }),
});

// Weekly chart list
export const LastFmWeeklyChartSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const LastFmWeeklyChartListResponseSchema = z.object({
  weeklychartlist: z.object({
    chart: z.array(LastFmWeeklyChartSchema),
    '@attr': z.object({
      user: z.string(),
    }).optional(),
  }),
});

// Weekly artist chart
export const LastFmWeeklyArtistSchema = z.object({
  name: z.string(),
  mbid: z.string().optional(),
  playcount: z.string(),
  url: z.string().optional(),
  '@attr': z.object({
    rank: z.string(),
  }).optional(),
});

export const LastFmWeeklyArtistChartResponseSchema = z.object({
  weeklyartistchart: z.object({
    artist: z.array(LastFmWeeklyArtistSchema),
    '@attr': z.object({
      user: z.string(),
      from: z.string(),
      to: z.string(),
    }).optional(),
  }),
});

// Type exports
export type LastFmImage = z.infer<typeof LastFmImageSchema>;
export type LastFmArtist = z.infer<typeof LastFmArtistSchema>;
export type LastFmTrack = z.infer<typeof LastFmTrackSchema>;
export type LastFmAlbum = z.infer<typeof LastFmAlbumSchema>;
export type LastFmArtistFull = z.infer<typeof LastFmArtistFullSchema>;
export type LastFmUser = z.infer<typeof LastFmUserSchema>;
export type LastFmSession = z.infer<typeof LastFmSessionSchema>;
export type LastFmWeeklyChart = z.infer<typeof LastFmWeeklyChartSchema>;
export type LastFmWeeklyArtist = z.infer<typeof LastFmWeeklyArtistSchema>;
