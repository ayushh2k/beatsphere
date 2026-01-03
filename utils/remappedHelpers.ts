// utils/remappedHelpers.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const CACHE_KEY = 'remapped_2025_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Types
export interface LastFmImage {
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
}

export interface LastFmItem {
    name: string;
    url: string;
    image: LastFmImage[];
    playcount?: string;
    previewUrl?: string;
    artist?: {
        name: string;
        url: string;
    } | string;
}

export interface RemappedStats {
    topArtists: LastFmItem[];
    topTracks: LastFmItem[];
    topAlbums: LastFmItem[];
    totalMinutes: string;
    topGenre: string;
}

const ignoredTags = new Set([
    'seen live', 'under 2000 listeners', 'female vocalists', 'favorites',
    'alternative', 'indie', 'pop', 'rock', 'electronic', 'experimental',
    '00s', '90s', '80s', '70s', '60s', 'singer-songwriter', 'ambient'
]);

// Helper to get user credentials
async function getUserCredentials() {
    const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
    const username = await SecureStore.getItemAsync('lastfm_username');

    if (!apiKey || !username) {
        throw new Error('User credentials not found');
    }

    return { apiKey, username };
}

// Helper to call Last.fm with retry logic
async function callLastFm(method: string, params: Record<string, string>, retries = 3, delay = 1000) {
    try {
        const { apiKey } = await getUserCredentials();
        const response = await axios.get(LASTFM_API_URL, {
            params: {
                method,
                api_key: apiKey,
                format: 'json',
                ...params,
            },
        });
        return response.data;
    } catch (error: any) {
        if (retries > 0 && (error.response?.status >= 500 || error.response?.status === 429 || error.code === 'ECONNRESET')) {
            console.warn(`Error calling Last.fm method ${method}: ${error.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callLastFm(method, params, retries - 1, delay * 2);
        }
        console.error(`Error calling Last.fm method ${method}:`, error.message);
        return null;
    }
}

export async function getTopArtists(username: string, limit: number = 5, period: string = '12month'): Promise<LastFmItem[]> {
    const data = await callLastFm('user.gettopartists', { user: username, limit: limit.toString(), period });
    return data?.topartists?.artist || [];
}

export async function getTopTracks(username: string, limit: number = 5, period: string = '12month'): Promise<LastFmItem[]> {
    const data = await callLastFm('user.gettoptracks', { user: username, limit: limit.toString(), period });
    return data?.toptracks?.track || [];
}

export async function getTopAlbums(username: string, limit: number = 5, period: string = '12month'): Promise<LastFmItem[]> {
    const data = await callLastFm('user.gettopalbums', { user: username, limit: limit.toString(), period });
    return data?.topalbums?.album || [];
}

// Estimate total minutes
export async function getTotalMinutes(username: string): Promise<string> {
    // 1. Calculate Average Track Duration (Sample top 50 tracks)
    const topTracksData = await callLastFm('user.gettoptracks', { user: username, limit: '50', period: '12month' });
    const tracks = topTracksData?.toptracks?.track || [];

    let totalDuration = 0;
    let trackCount = 0;

    const DEFAULT_DURATION_MS = 3.5 * 60 * 1000; // 3.5 minutes

    for (const track of tracks) {
        let duration = parseInt(track.duration || '0') * 1000;
        if (duration === 0) {
            duration = DEFAULT_DURATION_MS;
        }
        const playcount = parseInt(track.playcount || '0');
        totalDuration += duration * playcount;
        trackCount += playcount;
    }

    const averageDurationMs = trackCount > 0 ? totalDuration / trackCount : DEFAULT_DURATION_MS;

    // 2. Get Total Plays in the last year
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    const recentTracksData = await callLastFm('user.getrecenttracks', {
        user: username,
        limit: '1',
        from: oneYearAgo.toString(),
        page: '1'
    });

    const totalPlaysInYear = parseInt(recentTracksData?.recenttracks?.['@attr']?.total || '0');

    const totalMinutes = Math.round((totalPlaysInYear * averageDurationMs) / 1000 / 60);
    return totalMinutes.toLocaleString();
}

export async function getTopGenre(username: string): Promise<string> {
    const artists = await getTopArtists(username, 10, '12month');
    const tagCounts: Record<string, number> = {};

    // Fetch tags for top 5 artists
    for (const artist of artists.slice(0, 5)) {
        const artistName = typeof artist.artist === 'string' ? artist.artist : artist.name;
        const tagsData = await callLastFm('artist.gettoptags', { artist: artistName });
        const tags = tagsData?.toptags?.tag || [];

        for (const tag of tags) {
            const tagName = tag.name.toLowerCase();
            if (ignoredTags.has(tagName)) continue;

            const count = parseInt(tag.count || '0');
            tagCounts[tagName] = (tagCounts[tagName] || 0) + count;
        }
    }

    // Find top tag
    let topTag = 'Eclectic';
    let maxCount = 0;

    for (const [tag, count] of Object.entries(tagCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topTag = tag;
        }
    }

    // Capitalize
    return topTag.charAt(0).toUpperCase() + topTag.slice(1);
}

// Cache management
export async function getCachedRemappedData(): Promise<RemappedStats | null> {
    try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            await AsyncStorage.removeItem(CACHE_KEY);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Failed to get cached data:', error);
        return null;
    }
}

export async function cacheRemappedData(data: RemappedStats) {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Failed to cache data:', error);
    }
}

export async function clearRemappedCache() {
    try {
        await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

// Main function to get remapped stats
export async function getRemappedStats(username: string): Promise<RemappedStats> {
    // Check cache first
    const cached = await getCachedRemappedData();
    if (cached) {
        console.log('Using cached remapped data');
        return cached;
    }

    console.log('Fetching fresh remapped data...');

    // Fetch basic data in parallel
    const [topArtistsRaw, topTracksRaw, topAlbumsRaw, totalMinutes, topGenre] = await Promise.all([
        getTopArtists(username, 10, '12month'),
        getTopTracks(username, 10, '12month'),
        getTopAlbums(username, 5, '12month'),
        getTotalMinutes(username),
        getTopGenre(username)
    ]);

    // Import enrichment functions
    const { enrichArtistImages, enrichTrackImages, enrichAlbumImages } = await import('./musicBrainzHelpers');

    // Enrich images sequentially to respect rate limits
    console.log('Enriching images...');
    const topArtists = await enrichArtistImages(topArtistsRaw);
    const topTracks = await enrichTrackImages(topTracksRaw);
    const topAlbums = await enrichAlbumImages(topAlbumsRaw);

    const stats: RemappedStats = {
        topArtists,
        topTracks,
        topAlbums,
        totalMinutes,
        topGenre
    };

    // Cache the result
    await cacheRemappedData(stats);

    return stats;
}
