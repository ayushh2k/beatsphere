/**
 * Zod schemas for MusicBrainz API responses.
 * MusicBrainz has very flexible response structures, so we use loose schemas.
 */

import { z } from 'zod';

// Artist search response
export const MusicBrainzArtistSearchSchema = z.object({
  artists: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      score: z.number().optional(),
    })
  ).optional(),
});

// Artist detail response with relations
export const MusicBrainzArtistDetailSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  relations: z.array(
    z.object({
      type: z.string().optional(),
      url: z.object({
        resource: z.string().optional(),
      }).optional(),
    })
  ).optional(),
});

// Release group search response
export const MusicBrainzReleaseGroupSearchSchema = z.object({
  'release-groups': z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
    })
  ).optional(),
});

// Release search response
export const MusicBrainzReleaseSearchSchema = z.object({
  releases: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
    })
  ).optional(),
});

// Recording search response
export const MusicBrainzRecordingSearchSchema = z.object({
  recordings: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().optional(),
      releases: z.array(
        z.object({
          id: z.string(),
        })
      ).optional(),
    })
  ).optional(),
});

// Cover Art Archive response
export const CoverArtArchiveSchema = z.object({
  images: z.array(
    z.object({
      front: z.boolean().optional(),
      image: z.string(),
      thumbnails: z.object({
        '250': z.string().optional(),
        '500': z.string().optional(),
        '1200': z.string().optional(),
        large: z.string().optional(),
        small: z.string().optional(),
      }).optional(),
    })
  ),
});

// Wikidata entity response
export const WikidataEntitySchema = z.object({
  entities: z.record(
    z.object({
      claims: z.record(z.any()).optional(),
    })
  ),
});

// iTunes search response
export const ITunesSearchSchema = z.object({
  resultCount: z.number(),
  results: z.array(
    z.object({
      artistId: z.number().optional(),
      artistName: z.string().optional(),
      trackName: z.string().optional(),
      previewUrl: z.string().optional(),
    })
  ),
});

export type MusicBrainzArtistSearch = z.infer<typeof MusicBrainzArtistSearchSchema>;
export type CoverArtArchive = z.infer<typeof CoverArtArchiveSchema>;
export type ITunesSearch = z.infer<typeof ITunesSearchSchema>;
