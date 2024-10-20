// app/(tabs)/home.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentlyPlayingTrack } from '../../utils/lastFmHelpers';

interface LastFmUser {
  name: string;
  image: {
    '#text': string;
  }[];
}

interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
  };
  album: {
    '#text': string;
  };
  image: {
    '#text': string;
    size: string;
  }[];
  '@attr'?: {
    nowplaying: string;
  };
}

const Home = () => {
  const [userInfo, setUserInfo] = useState<LastFmUser | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<LastFmTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentlyPlayingTrack = async () => {
    const lastfmApiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
    const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
    const username = await SecureStore.getItemAsync('lastfm_username');

    if (sessionKey && username) {
      try {
        const currentlyPlayingTrack = await getCurrentlyPlayingTrack(lastfmApiKey, sessionKey, username);
        // console.log('Currently Playing Track:', currentlyPlayingTrack);
        setCurrentlyPlaying(currentlyPlayingTrack);
      } catch (error) {
        console.error('Failed to fetch currently playing track:', error);
      }
    } else {
      setError('Last.fm session key or username is missing');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const lastfmApiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (sessionKey && username) {
        try {
          // Fetch user info
          const userResponse = await fetch(
            `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastfmApiKey}&sk=${sessionKey}&format=json`
          );
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
          }
          const userData = await userResponse.json();
          setUserInfo(userData.user);

          // Fetch currently playing track
          await fetchCurrentlyPlayingTrack();

          // Set up interval to fetch currently playing track every 30 seconds
          intervalRef.current = setInterval(fetchCurrentlyPlayingTrack, 15 * 1000); // 30 seconds
        } catch (error) {
          console.error('Failed to fetch data:', error);
          setError('Failed to fetch data');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Last.fm session key or username is missing');
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Text className="text-xl font-aregular color-green">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Text className="text-xl font-aregular color-green">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1 items-center justify-center">
      {userInfo ? (
        <View className="items-center">
          <Text className="text-xl font-aregular color-green mb-4">
            Welcome, {userInfo.name}!
          </Text>
          {currentlyPlaying ? (
            <View className="items-center">
              {currentlyPlaying.image.find(img => img.size === 'extralarge') ? (
                <Image
                  // @ts-ignore
                  source={{ uri: currentlyPlaying.image.find(img => img.size === 'extralarge')['#text'] }} // Use the appropriate image size
                  className="w-32 h-32 rounded-full mb-4"
                />
              ) : (
                <Text className="text-xl font-aregular color-green">No image available</Text>
              )}
              <Text className="text-xl font-aregular color-green mb-2">
                Currently Playing: {currentlyPlaying.name}
              </Text>
              <Text className="text-lg font-aregular color-green">
                By: {currentlyPlaying.artist['#text']}
              </Text>
            </View>
          ) : (
            <Text className="text-xl font-aregular color-green">No track is currently playing</Text>
          )}
        </View>
      ) : (
        <Text className="text-xl font-aregular color-green">No user info available</Text>
      )}
    </SafeAreaView>
  );
};

export default Home;