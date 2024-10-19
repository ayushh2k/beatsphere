// utils/lastfm.ts

import axios from 'axios';

const LASTFM_API_KEY = process.env.EXPO_PUBLIC_LASTFM_KEY;
const LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/';

export const getUserInfo = async (username: string) => {
  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        method: 'user.getinfo',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
      },
    });
    return response.data.user;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    throw error;
  }
};

export const getRecentTracks = async (username: string) => {
  try {
    const response = await axios.get(LASTFM_API_URL, {
      params: {
        method: 'user.getrecenttracks',
        user: username,
        api_key: LASTFM_API_KEY,
        format: 'json',
        limit: 1,
      },
    });
    return response.data.recenttracks.track[0];
  } catch (error) {
    console.error('Failed to fetch recent tracks:', error);
    throw error;
  }
};