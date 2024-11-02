// app/(tabs)/home.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Text, View, Image, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { getCurrentlyPlayingTrack, getTopAlbums, getRecentTracks } from '../../utils/lastFmHelpers';
import SongCard from '@/components/SongCard';
import AlbumCard from '@/components/AlbumCard';

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
  album?: {
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

interface LastFmAlbum {
  name: string;
  artist: {
    name: string;
  };
  image: {
    '#text': string;
    size: string;
  }[];
  playcount: string;
}

const Home = () => {
  const [userInfo, setUserInfo] = useState<LastFmUser | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<LastFmTrack | null>(null);
  const [topAlbums, setTopAlbums] = useState<LastFmAlbum[]>([]);
  const [recentTracks, setRecentTracks] = useState<LastFmTrack[]>([]);
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
        setCurrentlyPlaying(currentlyPlayingTrack);
      } catch (error) {
        console.error('Failed to fetch currently playing track:', error);
      }
    } else {
      setError('Last.fm session key or username is missing');
    }
  };

  const fetchTopAlbums = async () => {
    const lastfmApiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
    const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
    const username = await SecureStore.getItemAsync('lastfm_username');

    if (sessionKey && username) {
      try {
        const topAlbums = await getTopAlbums(lastfmApiKey, sessionKey, username);
        setTopAlbums(topAlbums);
      } catch (error) {
        console.error('Failed to fetch top albums:', error);
      }
    } else {
      setError('Last.fm session key or username is missing');
    }
  };

  const fetchRecentTracks = async () => {
    const lastfmApiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
    const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
    const username = await SecureStore.getItemAsync('lastfm_username');

    if (sessionKey && username) {
      try {
        const recentTracks = await getRecentTracks(lastfmApiKey, sessionKey, username);
        setRecentTracks(recentTracks);
      } catch (error) {
        console.error('Failed to fetch recent tracks:', error);
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

          // Fetch top albums
          await fetchTopAlbums();

          // Fetch recent tracks
          await fetchRecentTracks();

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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {userInfo ? (
          <View className="items-center">
            <Text className="text-xl font-aregular color-green mb-4">
              Welcome, {userInfo.name}!
            </Text>
            {currentlyPlaying ? (
              <SongCard track={currentlyPlaying} />
            ) : (
              <Text className="text-xl font-aregular color-green">No track is currently playing</Text>
            )}
          </View>
        ) : (
          <Text className="text-xl font-aregular color-green">No user info available</Text>
        )}

        <View className="mt-8">
          <Text className="text-xl font-aregular color-green mb-4">Your Top Albums</Text>
          <FlatList
            horizontal
            data={topAlbums}
            renderItem={({ item }) => <AlbumCard album={item} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        <View className="mt-8">
          <Text className="text-xl font-aregular color-green mb-4">Your Recent Tracks</Text>
          {recentTracks.map((track, index) => (
            <SongCard key={index} track={track} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;