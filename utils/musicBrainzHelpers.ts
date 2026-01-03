// utils/musicBrainzHelpers.ts
import axios from 'axios';
import { LastFmItem } from './remappedHelpers';

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';
const COVER_ART_ARCHIVE_API = 'https://coverartarchive.org';
const WIKIDATA_ENTITY_API = 'https://www.wikidata.org/wiki/Special:EntityData';
const USER_AGENT = 'BeatSphere/1.2.0 (beatspherecommunity@gmail.com)';

// Helper to delay for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchMusicBrainz(path: string, params: Record<string, string> = {}) {
    let retries = 3;
    let delayMs = 2000;

    while (retries > 0) {
        try {
            const response = await axios.get(`${MUSICBRAINZ_API}${path}`, {
                params: { ...params, fmt: 'json' },
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });
            return response.data;
        } catch (error: any) {
            const isRetryable = error.code === 'ECONNRESET' || error.response?.status === 503 || error.response?.status === 429;
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

export async function getArtistMbid(artistName: string): Promise<string | null> {
    const data = await fetchMusicBrainz('/artist', { query: `artist:"${artistName}"`, limit: '1' });
    return data?.artists?.[0]?.id || null;
}

export async function getArtistImage(artistMbid: string): Promise<string | null> {
    if (!artistMbid) return null;

    const data = await fetchMusicBrainz(`/artist/${artistMbid}`, { inc: 'url-rels' });
    const relations = data?.relations || [];

    // 1. Check for direct image relation
    for (const rel of relations) {
        if (rel.type === 'image') {
            const resource = rel.url?.resource;
            if (resource) return normalizeWikiCommons(resource);
        }
    }

    // 2. Check for Wikidata relation
    const wikidataRel = relations.find((r: any) => r.type === 'wikidata');
    if (wikidataRel) {
        const qid = wikidataRel.url.resource.split('/').pop();
        const wikiImage = await getWikidataImage(qid);
        if (wikiImage) return wikiImage;
    }

    // 3. Fallback: Try to find a release (album) and use its cover art
    return await getArtistReleaseImage(artistMbid);
}

export async function getArtistReleaseImage(artistMbid: string): Promise<string | null> {
    const data = await fetchMusicBrainz('/release-group', {
        artist: artistMbid,
        limit: '3',
        type: 'album|ep'
    });
    const releaseGroups = data?.['release-groups'] || [];

    for (const rg of releaseGroups) {
        if (rg.id) {
            try {
                const res = await axios.get(`${COVER_ART_ARCHIVE_API}/release-group/${rg.id}`, {
                    headers: { 'User-Agent': USER_AGENT },
                    timeout: 10000
                });
                const front = res.data.images.find((i: any) => i.front);
                if (front) return front.thumbnails?.['500'] || front.image;
            } catch (e) {
                // ignore
            }
        }
    }
    return null;
}

async function getWikidataImage(qid: string): Promise<string | null> {
    if (!qid) return null;
    try {
        const res = await axios.get(`${WIKIDATA_ENTITY_API}/${qid}.json`, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });
        const entity = res.data.entities[qid];
        const claims = entity.claims;

        // P18 is the "image" property
        const imageProp = claims.P18?.[0];
        if (imageProp) {
            const fileName = imageProp.mainsnak.datavalue.value;
            return getCommonsUrl(fileName);
        }
    } catch (err) {
        // Silent fail
    }
    return null;
}

function getCommonsUrl(filename: string, width: number = 800): string {
    const safeName = encodeURIComponent(filename.replace(/ /g, '_'));
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${safeName}?width=${width}`;
}

function normalizeWikiCommons(url: string): string {
    if (url.includes('commons.wikimedia.org/wiki/File:')) {
        const parts = url.split('File:');
        return getCommonsUrl(parts[1]);
    }
    return url;
}

// Cover Art Functions
export async function getCoverArt(artistName: string, trackName: string): Promise<string | null> {
    const query = `artist:"${artistName}" AND recording:"${trackName}"`;
    const data = await fetchMusicBrainz('/recording', { query, limit: '3' });
    const recordings = data?.recordings || [];

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

async function checkCoverArtArchive(releaseMbid: string): Promise<string | null> {
    try {
        const res = await axios.get(`${COVER_ART_ARCHIVE_API}/release/${releaseMbid}`, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });
        const images = res.data.images;
        const front = images.find((i: any) => i.front);
        return front?.thumbnails?.['500'] || front?.image || null;
    } catch (err) {
        return null;
    }
}

export async function getAlbumCover(artistName: string, albumName: string): Promise<string | null> {
    const query = `artist:"${artistName}" AND releasegroup:"${albumName}"`;
    const data = await fetchMusicBrainz('/release-group', { query, limit: '3' });
    const releaseGroups = data?.['release-groups'] || [];

    for (const rg of releaseGroups) {
        if (rg.id) {
            try {
                const res = await axios.get(`${COVER_ART_ARCHIVE_API}/release-group/${rg.id}`, {
                    headers: { 'User-Agent': USER_AGENT },
                    timeout: 10000
                });
                const front = res.data.images.find((i: any) => i.front);
                if (front) return front.thumbnails?.['500'] || front.image;
            } catch (e) {
                // ignore
            }
        }
    }

    // Fallback: Search for release
    const releaseQuery = `artist:"${artistName}" AND release:"${albumName}"`;
    const releaseData = await fetchMusicBrainz('/release', { query: releaseQuery, limit: '3' });
    const releases = releaseData?.releases || [];

    for (const release of releases) {
        if (release.id) {
            const cover = await checkCoverArtArchive(release.id);
            if (cover) return cover;
        }
    }

    return null;
}

// Helper to getting artist's top album image from Last.fm as fallback
async function getArtistTopAlbumImage(artistName: string): Promise<string | null> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
        const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'artist.gettopalbums',
                artist: artistName,
                api_key: apiKey,
                limit: '1',
                format: 'json'
            }
        });
        const album = response.data?.topalbums?.album?.[0];
        return album?.image?.[2]?.['#text'] || null;
    } catch (e) {
        return null;
    }
}

// Helper to getting artist's info image from Last.fm as final fallback
async function getArtistInfoImage(artistName: string): Promise<string | null> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
        const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: {
                method: 'artist.getinfo',
                artist: artistName,
                api_key: apiKey,
                format: 'json'
            }
        });
        return response.data?.artist?.image?.[2]?.['#text'] || null;
    } catch (e) {
        return null;
    }
}

// Helper to get audio preview from iTunes
async function getAudioPreview(artist: string, track?: string): Promise<string | null> {
    try {
        if (!track) {
            // 2-Step Artist Search
            const artistQuery = encodeURIComponent(artist);
            const artistRes = await axios.get(`https://itunes.apple.com/search?term=${artistQuery}&entity=musicArtist&limit=1`);

            if (artistRes.data.resultCount > 0) {
                const artistId = artistRes.data.results[0].artistId;
                const lookupRes = await axios.get(`https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=1`);

                if (lookupRes.data.resultCount > 1) {
                    return lookupRes.data.results[1].previewUrl;
                }
            }
            return null;
        }

        // Specific Track Search
        const queryTerm = `${artist} ${track}`;
        const query = encodeURIComponent(queryTerm);
        const res = await axios.get(`https://itunes.apple.com/search?term=${query}&media=music&limit=5`);

        if (res.data.resultCount > 0) {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetArtist = normalize(artist);

            const match = res.data.results.find((r: any) => {
                const resArtist = normalize(r.artistName);
                return resArtist.includes(targetArtist) || targetArtist.includes(resArtist);
            });

            return match ? match.previewUrl : null;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Enrichment functions
export async function enrichArtistImages(artists: LastFmItem[]): Promise<LastFmItem[]> {
    const enriched: LastFmItem[] = [];

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
                let betterImage = null;
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

                if (betterImage) {
                    artist.image = artist.image.map(i => ({ ...i, '#text': betterImage }));
                }
            } catch (e) {
                console.warn(`Failed to improve image for artist ${artist.name}`);
            }
        }
        enriched.push(artist);
        await delay(1500); // Rate limiting
    }
    return enriched;
}

export async function enrichTrackImages(tracks: LastFmItem[]): Promise<LastFmItem[]> {
    const enriched: LastFmItem[] = [];

    for (const track of tracks) {
        // Fetch audio preview
        try {
            const artistName = typeof track.artist === 'string' ? track.artist : track.artist?.name;
            if (artistName && track.name) {
                const preview = await getAudioPreview(artistName, track.name);
                if (preview) track.previewUrl = preview;
            }
        } catch (e) {}

        const img = track.image?.[2]?.['#text'];
        const isPlaceholder = !img || img.includes('2a96cbd8b46e442fc41c2b86b821562f');

        if (isPlaceholder) {
            try {
                const artistName = typeof track.artist === 'string' ? track.artist : track.artist?.name;
                if (artistName && track.name) {
                    let coverArt = await getCoverArt(artistName, track.name);

                    if (!coverArt) {
                        coverArt = await getArtistTopAlbumImage(artistName);
                    }

                    if (!coverArt) {
                        coverArt = await getArtistInfoImage(artistName);
                    }

                    if (coverArt) {
                        track.image = track.image.map(i => ({ ...i, '#text': coverArt }));
                    }
                }
            } catch (e) {
                console.warn(`Failed to improve image for track ${track.name}`);
            }
        }
        enriched.push(track);
        await delay(1200); // Rate limiting
    }
    return enriched;
}

export async function enrichAlbumImages(albums: LastFmItem[]): Promise<LastFmItem[]> {
    const enriched: LastFmItem[] = [];

    for (const album of albums) {
        const img = album.image?.[2]?.['#text'];
        const isPlaceholder = !img || img.includes('2a96cbd8b46e442fc41c2b86b821562f') || img === '';

        if (isPlaceholder) {
            try {
                const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.name;
                if (artistName && album.name) {
                    const cover = await getAlbumCover(artistName, album.name);
                    if (cover) {
                        album.image = album.image.map(i => ({ ...i, '#text': cover }));
                    }
                }
            } catch (e) {
                console.warn(`Failed to improve image for album ${album.name}`);
            }
        }
        enriched.push(album);
        await delay(1500); // Rate limiting
    }
    return enriched;
}
