// utils/lastFmHelpers.ts

import axios from 'axios';
import { stringMd5 } from 'react-native-quick-md5';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

export const getMobileSession = async (token: string, apiKey: string, sharedSecret: string) => {
  const method = 'auth.getSession';
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
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        api_sig: apiSig,
        format: 'json',
      },
    });

    const sessionKey = response.data.session.key;
    await SecureStore.setItemAsync('lastfm_session_key', sessionKey);

    const userInfo = await getUserInfo(apiKey, sessionKey);
    if (userInfo) {
      const username = userInfo.name;
      const imageUrl = userInfo.image?.find(
        (img: any) => img.size === 'extralarge'
      )?.['#text'];

      await SecureStore.setItemAsync('lastfm_username', username);
      if (imageUrl) {
        await SecureStore.setItemAsync('lastfm_user_image', imageUrl);
        // console.log(`User info stored for ${username} with image.`);
      } else {
        console.log(`User info stored for ${username}, but no image was found.`);
      }
    }

    return sessionKey;
  } catch (error) {
    console.error('Failed to get mobile session and user info:', error);
    throw error;
  }
};

export const getUserInfo = async (apiKey: string, sessionKey: string) => {
  const method = 'user.getInfo';
  const params = {
    method,
    api_key: apiKey,
    sk: sessionKey,
    format: 'json',
  };

  try {
    const response = await axios.get(LASTFM_API_URL, { params });
    return response.data.user;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    throw error;
  }
};

export const getListeningStatus = async (apiKey: string, sessionKey: string, username: string) => {
  const method = 'user.getRecentTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    limit: 1,
    format: 'json',
  };

  try {
    const response = await axios.get(LASTFM_API_URL, { params });
    const recentTracks = response.data.recenttracks;

    const track = Array.isArray(recentTracks?.track) ? recentTracks.track[0] : recentTracks?.track;

    if (!track) {
      await AsyncStorage.removeItem('currently_playing');
      return null;
    }

    if (track['@attr']?.nowplaying === 'true') {
      await AsyncStorage.setItem('currently_playing', JSON.stringify(track));
      return { track, status: 'live' };
    }

    const trackTimestamp = track.date?.uts;
    if (trackTimestamp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const timeSinceScrobble = nowInSeconds - parseInt(trackTimestamp, 10);

      // 10 minutes = 600 seconds
      if (timeSinceScrobble < 600) {
        await AsyncStorage.setItem('currently_playing', JSON.stringify(track));
        return { track, status: 'recent' };
      }
    }

    await AsyncStorage.removeItem('currently_playing');
    return null;

  } catch (error) {
    console.error('Failed to fetch listening status:', error);
    await AsyncStorage.removeItem('currently_playing');
    throw error;
  }
};

export const getTopTracks = async (apiKey: string, sessionKey: string, username: string) => {
  const method = 'user.getTopTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit: 5,
  };

  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        format: 'json',
      },
    });

    const topTracks = response.data.toptracks.track;
    return topTracks;
  } catch (error) {
    console.error('Failed to fetch top tracks:', error);
    throw error;
  }
};

export const getTopArtists = async (apiKey: string, sessionKey: string, username: string, period: string = '1month') => {
  const params = {
    method: 'user.getTopArtists',
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit: 10,
    period,
    format: 'json',
  };
  try {
    const response = await axios.get(LASTFM_API_URL, { params });
    return response.data.topartists.artist;
  } catch (error) {
    console.error('Failed to fetch top artists:', error);
    throw error;
  }
};

export const getRecentTracks = async (apiKey: string, sessionKey: string, username: string) => {
  const method = 'user.getRecentTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit: 10,
  };

  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        format: 'json',
      },
    });

    const recentTracks = response.data.recenttracks.track;
    return recentTracks;
  } catch (error) {
    console.error('Failed to fetch recent tracks:', error);
    throw error;
  }
};

export const getTopAlbums = async (apiKey: string, sessionKey: string, username: string, period: string = '1month') => {
  const params = {
    method: 'user.getTopAlbums',
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit: 10,
    period,
    format: 'json',
  };
  try {
    const response = await axios.get(LASTFM_API_URL, { params });
    return response.data.topalbums.album;
  } catch (error) {
    console.error('Failed to fetch top albums:', error);
    throw error;
  }
};

const getUserCredentials = async () => {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
  const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
  const username = await SecureStore.getItemAsync('lastfm_username');
  if (!apiKey || !sessionKey || !username) {
    throw new Error('User credentials not found.');
  }
  return { apiKey, sessionKey, username };
};

export const getWeeklyReport = async () => {
  const { apiKey, sessionKey, username } = await getUserCredentials();

  const chartListParams = { method: 'user.getWeeklyChartList', user: username, api_key: apiKey, format: 'json' };
  const chartListResponse = await axios.get(LASTFM_API_URL, { params: chartListParams });
  const latestChart = chartListResponse.data.weeklychartlist.chart.pop();

  if (!latestChart) {
    return null;
  }

  const weeklyArtistParams = {
    method: 'user.getWeeklyArtistChart',
    user: username,
    api_key: apiKey,
    from: latestChart.from,
    to: latestChart.to,
    format: 'json'
  };
  const artistChartResponse = await axios.get(LASTFM_API_URL, { params: weeklyArtistParams });
  const artists = artistChartResponse.data.weeklyartistchart.artist;

  if (!artists || artists.length === 0) {
    return null;
  }

  const totalScrobbles = artists.reduce((sum: number, artist: any) => sum + parseInt(artist.playcount, 10), 0);
  const topArtist = artists[0];

  return {
    totalScrobbles,
    uniqueArtists: artists.length,
    topArtist: {
      name: topArtist.name,
    }
  };
};

export interface LastFmTrack {
  name: string;
  artist: { '#text': string };
  image?: { size: string; '#text': string }[];
}

export const getUserRecentTrack = async (username: string, apiKey: string): Promise<LastFmTrack | null> => {
  const params = {
    method: 'user.getRecentTracks',
    user: username,
    api_key: apiKey,
    limit: 1,
    format: 'json',
  };
  try {
    const response = await axios.get(LASTFM_API_URL, { params });
    const track = response.data.recenttracks?.track?.[0] || response.data.recenttracks?.track;
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