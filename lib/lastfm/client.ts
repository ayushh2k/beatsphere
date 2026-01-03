/**
 * Last.fm API client.
 * All Last.fm API interactions with Zod validation.
 */

import axios from 'axios';
import { stringMd5 } from 'react-native-quick-md5';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';
import { API_ENDPOINTS, STORAGE_KEYS, LISTENING_CONFIG } from '@/config/constants';
import {
  LastFmSessionSchema,
  LastFmUserInfoResponseSchema,
  LastFmTopTracksResponseSchema,
  LastFmTopArtistsResponseSchema,
  LastFmTopAlbumsResponseSchema,
  LastFmRecentTracksResponseSchema,
  LastFmWeeklyChartListResponseSchema,
  LastFmWeeklyArtistChartResponseSchema,
  type LastFmTrack,
  type LastFmUser,
  type LastFmArtistFull,
  type LastFmAlbum,
} from './schemas';

/**
 * Authenticate with Last.fm and get a session key.
 * @param token - OAuth token from Last.fm authorization
 * @returns Session key
 */
export const getMobileSession = async (token: string): Promise<string> => {
  const method = 'auth.getSession';
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sharedSecret = env.EXPO_PUBLIC_LASTFM_SECRET;

  const params = {
    method,
    token,
    api_key: apiKey,
  };

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key as keyof typeof params]}`)
    .join('');
  const apiSig = stringMd5(sortedParams + sharedSecret);

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, {
      params: {
        ...params,
        api_sig: apiSig,
        format: 'json',
      },
    });

    // Validate response with Zod
    const validatedData = LastFmSessionSchema.parse(response.data);
    const sessionKey = validatedData.session.key;

    await SecureStore.setItemAsync(STORAGE_KEYS.LASTFM_SESSION, sessionKey);

    // Fetch and store user info
    const userInfo = await getUserInfo(sessionKey);
    if (userInfo) {
      const username = userInfo.name;
      const imageUrl = userInfo.image?.find(
        (img) => img.size === 'extralarge'
      )?.['#text'];

      await SecureStore.setItemAsync(STORAGE_KEYS.LASTFM_USERNAME, username);
      if (imageUrl) {
        await SecureStore.setItemAsync(STORAGE_KEYS.LASTFM_USER_IMAGE, imageUrl);
      }
    }

    return sessionKey;
  } catch (error) {
    console.error('Failed to get mobile session and user info:', error);
    throw error;
  }
};

/**
 * Get user information from Last.fm.
 * @param sessionKey - User's session key (optional, will fetch from storage if not provided)
 * @returns User information
 */
export const getUserInfo = async (sessionKey?: string): Promise<LastFmUser> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sk = sessionKey || await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

  if (!sk) {
    throw new Error('Session key not found');
  }

  const method = 'user.getInfo';
  const params = {
    method,
    api_key: apiKey,
    sk,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmUserInfoResponseSchema.parse(response.data);
    return validatedData.user;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    throw error;
  }
};

/**
 * Get user's current listening status.
 * @param username - Last.fm username
 * @returns Listening status with track or null
 */
export const getListeningStatus = async (
  username: string
): Promise<{ track: LastFmTrack; status: 'live' | 'recent' } | null> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const method = 'user.getRecentTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    limit: 1,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmRecentTracksResponseSchema.parse(response.data);
    const recentTracks = validatedData.recenttracks;

    const track = Array.isArray(recentTracks.track)
      ? recentTracks.track[0]
      : recentTracks.track;

    if (!track) {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENTLY_PLAYING);
      return null;
    }

    if (track['@attr']?.nowplaying === 'true') {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENTLY_PLAYING, JSON.stringify(track));
      return { track, status: 'live' };
    }

    const trackTimestamp = track.date?.uts;
    if (trackTimestamp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const timeSinceScrobble = nowInSeconds - parseInt(trackTimestamp, 10);

      if (timeSinceScrobble < LISTENING_CONFIG.RECENT_SCROBBLE_THRESHOLD) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENTLY_PLAYING, JSON.stringify(track));
        return { track, status: 'recent' };
      }
    }

    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENTLY_PLAYING);
    return null;
  } catch (error) {
    console.error('Failed to fetch listening status:', error);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENTLY_PLAYING);
    throw error;
  }
};

/**
 * Get user's top tracks.
 * @param username - Last.fm username
 * @param limit - Number of tracks to fetch (default: 5)
 * @returns Array of top tracks
 */
export const getTopTracks = async (
  username: string,
  limit: number = 5
): Promise<LastFmTrack[]> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

  const method = 'user.getTopTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmTopTracksResponseSchema.parse(response.data);
    return validatedData.toptracks.track;
  } catch (error) {
    console.error('Failed to fetch top tracks:', error);
    throw error;
  }
};

/**
 * Get user's top artists.
 * @param username - Last.fm username
 * @param period - Time period (1month, 3month, 6month, 12month, overall)
 * @param limit - Number of artists to fetch (default: 10)
 * @returns Array of top artists
 */
export const getTopArtists = async (
  username: string,
  period: string = '1month',
  limit: number = 10
): Promise<LastFmArtistFull[]> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

  const params = {
    method: 'user.getTopArtists',
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit,
    period,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmTopArtistsResponseSchema.parse(response.data);
    return validatedData.topartists.artist;
  } catch (error) {
    console.error('Failed to fetch top artists:', error);
    throw error;
  }
};

/**
 * Get user's recent tracks.
 * @param username - Last.fm username
 * @param limit - Number of tracks to fetch (default: 10)
 * @returns Array of recent tracks
 */
export const getRecentTracks = async (
  username: string,
  limit: number = 10
): Promise<LastFmTrack[]> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

  const method = 'user.getRecentTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmRecentTracksResponseSchema.parse(response.data);
    const tracks = validatedData.recenttracks.track;
    return Array.isArray(tracks) ? tracks : [tracks];
  } catch (error) {
    console.error('Failed to fetch recent tracks:', error);
    throw error;
  }
};

/**
 * Get user's top albums.
 * @param username - Last.fm username
 * @param period - Time period (1month, 3month, 6month, 12month, overall)
 * @param limit - Number of albums to fetch (default: 10)
 * @returns Array of top albums
 */
export const getTopAlbums = async (
  username: string,
  period: string = '1month',
  limit: number = 10
): Promise<LastFmAlbum[]> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);

  const params = {
    method: 'user.getTopAlbums',
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit,
    period,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmTopAlbumsResponseSchema.parse(response.data);
    return validatedData.topalbums.album;
  } catch (error) {
    console.error('Failed to fetch top albums:', error);
    throw error;
  }
};

/**
 * Get user credentials from secure storage.
 * @returns API key, session key, and username
 */
const getUserCredentials = async () => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);
  const username = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);
  if (!apiKey || !sessionKey || !username) {
    throw new Error('User credentials not found.');
  }
  return { apiKey, sessionKey, username };
};

/**
 * Get weekly report summary.
 * @returns Weekly listening statistics
 */
export const getWeeklyReport = async (): Promise<{
  totalScrobbles: number;
  uniqueArtists: number;
  topArtist: { name: string };
} | null> => {
  const { apiKey, username } = await getUserCredentials();

  const chartListParams = {
    method: 'user.getWeeklyChartList',
    user: username,
    api_key: apiKey,
    format: 'json',
  };

  const chartListResponse = await axios.get(API_ENDPOINTS.LASTFM, { params: chartListParams });
  const chartListData = LastFmWeeklyChartListResponseSchema.parse(chartListResponse.data);
  const latestChart = chartListData.weeklychartlist.chart.pop();

  if (!latestChart) {
    return null;
  }

  const weeklyArtistParams = {
    method: 'user.getWeeklyArtistChart',
    user: username,
    api_key: apiKey,
    from: latestChart.from,
    to: latestChart.to,
    format: 'json',
  };

  const artistChartResponse = await axios.get(API_ENDPOINTS.LASTFM, { params: weeklyArtistParams });
  const artistChartData = LastFmWeeklyArtistChartResponseSchema.parse(artistChartResponse.data);
  const artists = artistChartData.weeklyartistchart.artist;

  if (!artists || artists.length === 0) {
    return null;
  }

  const totalScrobbles = artists.reduce(
    (sum, artist) => sum + parseInt(artist.playcount, 10),
    0
  );
  const topArtist = artists[0];

  return {
    totalScrobbles,
    uniqueArtists: artists.length,
    topArtist: {
      name: topArtist.name,
    },
  };
};

/**
 * Get a specific user's most recent track.
 * @param username - Last.fm username
 * @returns Most recent track or null
 */
export const getUserRecentTrack = async (username: string): Promise<LastFmTrack | null> => {
  const apiKey = env.EXPO_PUBLIC_LASTFM_KEY;
  const params = {
    method: 'user.getRecentTracks',
    user: username,
    api_key: apiKey,
    limit: 1,
    format: 'json',
  };

  try {
    const response = await axios.get(API_ENDPOINTS.LASTFM, { params });
    const validatedData = LastFmRecentTracksResponseSchema.parse(response.data);
    const track = Array.isArray(validatedData.recenttracks.track)
      ? validatedData.recenttracks.track[0]
      : validatedData.recenttracks.track;
    return track || null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`User "${username}" not found on Last.fm.`);
    } else {
      console.error(`Failed to fetch recent track for ${username}:`, error.message);
    }
    return null;
  }
};
