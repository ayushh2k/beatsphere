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

  // Construct the api_sig parameter
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key as keyof typeof params]}`) // Use type assertion here
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
    return sessionKey;
  } catch (error) {
    console.error('Failed to get mobile session:', error);
    throw error;
  }
};

export const getUserInfo = async (apiKey: string, sessionKey: string) => {
  const method = 'user.getInfo';
  const params = {
    method,
    api_key: apiKey,
    sk: sessionKey,
  };

  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        format: 'json',
      },
    });

    return response.data.user;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    throw error;
  }
};

export const getCurrentlyPlayingTrack = async (apiKey: string, sessionKey: string, username: string) => {
  const method = 'user.getRecentTracks';
  const params = {
    method,
    user: username,
    api_key: apiKey,
    sk: sessionKey,
    limit: 1,
    from: Math.floor(Date.now() / 1000) - 3600, // Current Unix timestamp
  };

  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        ...params,
        format: 'json',
      },
    });

    const recentTracks = response.data.recenttracks;
    const tracks = recentTracks?.track;

    if (!tracks) {
      console.error('Invalid tracks data:', tracks);
      return null;
    }

    // Handle the case where tracks is a single object
    const currentlyPlayingTrack = Array.isArray(tracks) ? tracks.find((track: any) => track['@attr']?.nowplaying === 'true') : tracks['@attr']?.nowplaying === 'true' ? tracks : null;

    // Store the currently playing track in AsyncStorage
    if (currentlyPlayingTrack) {
      await AsyncStorage.setItem('currently_playing', JSON.stringify(currentlyPlayingTrack));
    } else {
      await AsyncStorage.removeItem('currently_playing');
    }

    return currentlyPlayingTrack || null;
  } catch (error) {
    console.error('Failed to fetch currently playing track:', error);
    throw error;
  }
};