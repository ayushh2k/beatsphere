/**
 * MusicBrainz API client for music metadata enrichment.
 * Includes integrations with Cover Art Archive, Wikidata, and iTunes.
 */

import axios from 'axios';
import { env } from '@/config/env';
import {
  API_ENDPOINTS,
  MUSICBRAINZ_CONFIG,
  RATE_LIMITS,
  TIMEOUTS,
} from '@/config/constants';
import {
  MusicBrainzArtistSearchSchema,
  MusicBrainzArtistDetailSchema,
  MusicBrainzReleaseGroupSearchSchema,
  MusicBrainzReleaseSearchSchema,
  MusicBrainzRecordingSearchSchema,
  CoverArtArchiveSchema,
  WikidataEntitySchema,
  ITunesSearchSchema,
} from './schemas';

// Type for enrichable items (used in Remapped feature)
export interface EnrichableItem {
  name: string;
  artist?: string | { name: string; '#text'?: string };
  image?: Array<{ '#text': string; size: string }>;
  previewUrl?: string;
}

/**
 * Helper to delay for rate limiting.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch from MusicBrainz API with retry logic and exponential backoff.
 */
async function fetchMusicBrainz(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  let retries = MUSICBRAINZ_CONFIG.MAX_RETRIES;
  let delayMs = MUSICBRAINZ_CONFIG.INITIAL_RETRY_DELAY;

  while (retries > 0) {
    try {
      const response = await axios.get(`${API_ENDPOINTS.MUSICBRAINZ}${path}`, {
        params: { ...params, fmt: 'json' },
        headers: {
          'User-Agent': MUSICBRAINZ_CONFIG.USER_AGENT,
          Accept: 'application/json',
        },
        timeout: TIMEOUTS.MUSICBRAINZ_API,
      });
      return response.data;
    } catch (error: any) {
      const isRetryable =
        error.code === 'ECONNRESET' ||
        error.response?.status === 503 ||
        error.response?.status === 429;

      if (isRetryable && retries > 1) {
        console.warn(`MusicBrainz retry (${retries}) for ${path}: ${error.message}`);
        await delay(delayMs);
        delayMs *= 2; // Exponential backoff
        retries--;
        continue;
      }

      console.warn(`MusicBrainz fetch failed for ${path}:`, error.message);
      return null;
    }
  }
  return null;
}

/**
 * Get artist MusicBrainz ID by name.
 */
export async function getArtistMbid(artistName: string): Promise<string | null> {
  const data = await fetchMusicBrainz('/artist', {
    query: `artist:"${artistName}"`,
    limit: '1',
  });
  const validated = MusicBrainzArtistSearchSchema.safeParse(data);
  if (!validated.success) return null;
  return validated.data.artists?.[0]?.id || null;
}

/**
 * Get artist image from MusicBrainz relations or Wikidata.
 */
export async function getArtistImage(artistMbid: string): Promise<string | null> {
  if (!artistMbid) return null;

  const data = await fetchMusicBrainz(`/artist/${artistMbid}`, { inc: 'url-rels' });
  const validated = MusicBrainzArtistDetailSchema.safeParse(data);
  if (!validated.success) return null;

  const relations = validated.data.relations || [];

  // 1. Check for direct image relation
  for (const rel of relations) {
    if (rel.type === 'image') {
      const resource = rel.url?.resource;
      if (resource) return normalizeWikiCommons(resource);
    }
  }

  // 2. Check for Wikidata relation
  const wikidataRel = relations.find((r) => r.type === 'wikidata');
  if (wikidataRel) {
    const qid = wikidataRel.url?.resource?.split('/').pop();
    if (qid) {
      const wikiImage = await getWikidataImage(qid);
      if (wikiImage) return wikiImage;
    }
  }

  // 3. Fallback: Try to find a release (album) and use its cover art
  return await getArtistReleaseImage(artistMbid);
}

/**
 * Get artist image from their release cover art.
 */
export async function getArtistReleaseImage(artistMbid: string): Promise<string | null> {
  const data = await fetchMusicBrainz('/release-group', {
    artist: artistMbid,
    limit: '3',
    type: 'album|ep',
  });
  const validated = MusicBrainzReleaseGroupSearchSchema.safeParse(data);
  if (!validated.success) return null;

  const releaseGroups = validated.data['release-groups'] || [];

  for (const rg of releaseGroups) {
    if (rg.id) {
      try {
        const res = await axios.get(`${API_ENDPOINTS.COVER_ART}/release-group/${rg.id}`, {
          headers: { 'User-Agent': MUSICBRAINZ_CONFIG.USER_AGENT },
          timeout: TIMEOUTS.COVER_ART_API,
        });
        const coverData = CoverArtArchiveSchema.safeParse(res.data);
        if (coverData.success) {
          const front = coverData.data.images.find((i) => i.front);
          if (front) return front.thumbnails?.['500'] || front.image;
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return null;
}

/**
 * Get image from Wikidata entity.
 */
async function getWikidataImage(qid: string): Promise<string | null> {
  if (!qid) return null;
  try {
    const res = await axios.get(`${API_ENDPOINTS.WIKIDATA}/${qid}.json`, {
      headers: { 'User-Agent': MUSICBRAINZ_CONFIG.USER_AGENT },
      timeout: TIMEOUTS.DEFAULT,
    });
    const validated = WikidataEntitySchema.safeParse(res.data);
    if (!validated.success) return null;

    const entity = validated.data.entities[qid];
    const claims = entity.claims;

    // P18 is the "image" property
    const imageProp = claims?.P18?.[0];
    if (imageProp) {
      const fileName = imageProp.mainsnak.datavalue.value;
      return getCommonsUrl(fileName);
    }
  } catch (err) {
    // Silent fail
  }
  return null;
}

/**
 * Get Wikimedia Commons URL for an image.
 */
function getCommonsUrl(filename: string, width: number = 800): string {
  const safeName = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${safeName}?width=${width}`;
}

/**
 * Normalize Wiki Commons URLs.
 */
function normalizeWikiCommons(url: string): string {
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const parts = url.split('File:');
    return getCommonsUrl(parts[1]);
  }
  return url;
}

/**
 * Get cover art for a track.
 */
export async function getCoverArt(
  artistName: string,
  trackName: string
): Promise<string | null> {
  const query = `artist:"${artistName}" AND recording:"${trackName}"`;
  const data = await fetchMusicBrainz('/recording', { query, limit: '3' });
  const validated = MusicBrainzRecordingSearchSchema.safeParse(data);
  if (!validated.success) return null;

  const recordings = validated.data.recordings || [];

  for (const recording of recordings) {
    const releases = recording.releases || [];
    for (const release of releases) {
      if (release.id) {
        const cover = await checkCoverArtArchive(release.id);
        if (cover) return cover;
      }
    }
  }
  return null;
}

/**
 * Check Cover Art Archive for release cover.
 */
async function checkCoverArtArchive(releaseMbid: string): Promise<string | null> {
  try {
    const res = await axios.get(`${API_ENDPOINTS.COVER_ART}/release/${releaseMbid}`, {
      headers: { 'User-Agent': MUSICBRAINZ_CONFIG.USER_AGENT },
      timeout: TIMEOUTS.COVER_ART_API,
    });
    const validated = CoverArtArchiveSchema.safeParse(res.data);
    if (!validated.success) return null;

    const images = validated.data.images;
    const front = images.find((i) => i.front);
    return front?.thumbnails?.['500'] || front?.image || null;
  } catch (err) {
    return null;
  }
}

/**
 * Get album cover art.
 */
export async function getAlbumCover(
  artistName: string,
  albumName: string
): Promise<string | null> {
  const query = `artist:"${artistName}" AND releasegroup:"${albumName}"`;
  const data = await fetchMusicBrainz('/release-group', { query, limit: '3' });
  const validated = MusicBrainzReleaseGroupSearchSchema.safeParse(data);
  if (!validated.success) return null;

  const releaseGroups = validated.data['release-groups'] || [];

  for (const rg of releaseGroups) {
    if (rg.id) {
      try {
        const res = await axios.get(`${API_ENDPOINTS.COVER_ART}/release-group/${rg.id}`, {
          headers: { 'User-Agent': MUSICBRAINZ_CONFIG.USER_AGENT },
          timeout: TIMEOUTS.COVER_ART_API,
        });
        const coverData = CoverArtArchiveSchema.safeParse(res.data);
        if (coverData.success) {
          const front = coverData.data.images.find((i) => i.front);
          if (front) return front.thumbnails?.['500'] || front.image;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // Fallback: Search for release
  const releaseQuery = `artist:"${artistName}" AND release:"${albumName}"`;
  const releaseData = await fetchMusicBrainz('/release', { query: releaseQuery, limit: '3' });
  const releaseValidated = MusicBrainzReleaseSearchSchema.safeParse(releaseData);
  if (!releaseValidated.success) return null;

  const releases = releaseValidated.data.releases || [];

  for (const release of releases) {
    if (release.id) {
      const cover = await checkCoverArtArchive(release.id);
      if (cover) return cover;
    }
  }

  return null;
}

/**
 * Get artist's top album image from Last.fm as fallback.
 */
async function getArtistTopAlbumImage(artistName: string): Promise<string | null> {
  try {
    const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
    const response = await axios.get(API_ENDPOINTS.LASTFM, {
      params: {
        method: 'artist.gettopalbums',
        artist: artistName,
        api_key: apiKey,
        limit: '1',
        format: 'json',
      },
    });
    const album = response.data?.topalbums?.album?.[0];
    return album?.image?.[2]?.['#text'] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get artist's info image from Last.fm as final fallback.
 */
async function getArtistInfoImage(artistName: string): Promise<string | null> {
  try {
    const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
    const response = await axios.get(API_ENDPOINTS.LASTFM, {
      params: {
        method: 'artist.getinfo',
        artist: artistName,
        api_key: apiKey,
        format: 'json',
      },
    });
    return response.data?.artist?.image?.[2]?.['#text'] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get audio preview from iTunes.
 */
async function getAudioPreview(artist: string, track?: string): Promise<string | null> {
  try {
    if (!track) {
      // 2-Step Artist Search
      const artistQuery = encodeURIComponent(artist);
      const artistRes = await axios.get(
        `${API_ENDPOINTS.ITUNES}?term=${artistQuery}&entity=musicArtist&limit=1`,
        { timeout: TIMEOUTS.ITUNES_API }
      );
      const artistData = ITunesSearchSchema.safeParse(artistRes.data);

      if (artistData.success && artistData.data.resultCount > 0) {
        const artistId = artistData.data.results[0].artistId;
        const lookupRes = await axios.get(
          `${API_ENDPOINTS.ITUNES.replace('/search', '/lookup')}?id=${artistId}&entity=song&limit=1`,
          { timeout: TIMEOUTS.ITUNES_API }
        );
        const lookupData = ITunesSearchSchema.safeParse(lookupRes.data);

        if (lookupData.success && lookupData.data.resultCount > 1) {
          return lookupData.data.results[1].previewUrl || null;
        }
      }
      return null;
    }

    // Specific Track Search
    const queryTerm = `${artist} ${track}`;
    const query = encodeURIComponent(queryTerm);
    const res = await axios.get(`${API_ENDPOINTS.ITUNES}?term=${query}&media=music&limit=5`, {
      timeout: TIMEOUTS.ITUNES_API,
    });
    const trackData = ITunesSearchSchema.safeParse(res.data);

    if (trackData.success && trackData.data.resultCount > 0) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetArtist = normalize(artist);

      const match = trackData.data.results.find((r) => {
        const resArtist = normalize(r.artistName || '');
        return resArtist.includes(targetArtist) || targetArtist.includes(resArtist);
      });

      return match?.previewUrl || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Enrich artist items with better images and audio previews.
 */
export async function enrichArtistImages(
  artists: EnrichableItem[]
): Promise<EnrichableItem[]> {
  const enriched: EnrichableItem[] = [];

  for (const artist of artists) {
    // Fetch audio preview
    try {
      const preview = await getAudioPreview(artist.name);
      if (preview) artist.previewUrl = preview;
    } catch (e) {}

    // Check if image is valid or placeholder
    const img = artist.image?.[2]?.['#text'];
    const isPlaceholder = !img || img.includes('2a96cbd8b46e442fc41c2b86b821562f');

    if (isPlaceholder) {
      try {
        let betterImage: string | null = null;
        const mbid = await getArtistMbid(artist.name);
        if (mbid) {
          betterImage = await getArtistImage(mbid);
          if (!betterImage) {
            betterImage = await getArtistReleaseImage(mbid);
          }
        }

        if (!betterImage) {
          betterImage = await getArtistTopAlbumImage(artist.name);
        }

        if (!betterImage) {
          betterImage = await getArtistInfoImage(artist.name);
        }

        if (betterImage && artist.image) {
          artist.image = artist.image.map((i) => ({ ...i, '#text': betterImage! }));
        }
      } catch (e) {
        console.warn(`Failed to improve image for artist ${artist.name}`);
      }
    }
    enriched.push(artist);
    await delay(RATE_LIMITS.MUSICBRAINZ_DELAY); // Rate limiting
  }
  return enriched;
}

/**
 * Enrich track items with better images and audio previews.
 */
export async function enrichTrackImages(tracks: EnrichableItem[]): Promise<EnrichableItem[]> {
  const enriched: EnrichableItem[] = [];

  for (const track of tracks) {
    // Fetch audio preview
    try {
      const artistName =
        typeof track.artist === 'string' ? track.artist : track.artist?.name;
      if (artistName && track.name) {
        const preview = await getAudioPreview(artistName, track.name);
        if (preview) track.previewUrl = preview;
      }
    } catch (e) {}

    const img = track.image?.[2]?.['#text'];
    const isPlaceholder = !img || img.includes('2a96cbd8b46e442fc41c2b86b821562f');

    if (isPlaceholder) {
      try {
        const artistName =
          typeof track.artist === 'string' ? track.artist : track.artist?.name;
        if (artistName && track.name) {
          let coverArt = await getCoverArt(artistName, track.name);

          if (!coverArt) {
            coverArt = await getArtistTopAlbumImage(artistName);
          }

          if (!coverArt) {
            coverArt = await getArtistInfoImage(artistName);
          }

          if (coverArt && track.image) {
            track.image = track.image.map((i) => ({ ...i, '#text': coverArt! }));
          }
        }
      } catch (e) {
        console.warn(`Failed to improve image for track ${track.name}`);
      }
    }
    enriched.push(track);
    await delay(RATE_LIMITS.MUSICBRAINZ_SHORT_DELAY); // Rate limiting
  }
  return enriched;
}

/**
 * Enrich album items with better cover art.
 */
export async function enrichAlbumImages(albums: EnrichableItem[]): Promise<EnrichableItem[]> {
  const enriched: EnrichableItem[] = [];

  for (const album of albums) {
    const img = album.image?.[2]?.['#text'];
    const isPlaceholder =
      !img || img.includes('2a96cbd8b46e442fc41c2b86b821562f') || img === '';

    if (isPlaceholder) {
      try {
        const artistName =
          typeof album.artist === 'string' ? album.artist : album.artist?.name;
        if (artistName && album.name) {
          const cover = await getAlbumCover(artistName, album.name);
          if (cover && album.image) {
            album.image = album.image.map((i) => ({ ...i, '#text': cover }));
          }
        }
      } catch (e) {
        console.warn(`Failed to improve image for album ${album.name}`);
      }
    }
    enriched.push(album);
    await delay(RATE_LIMITS.MUSICBRAINZ_DELAY); // Rate limiting
  }
  return enriched;
}
