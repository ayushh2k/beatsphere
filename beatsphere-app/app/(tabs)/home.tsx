// app/(tabs)/home.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Text, View, ScrollView, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { getCurrentlyPlayingTrack, getTopAlbums, getRecentTracks } from '../../utils/lastFmHelpers';
import SongCard from '@/components/SongCard';
import AlbumCard from '@/components/AlbumCard';
import { Ionicons } from '@expo/vector-icons';

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
  const retryCountRef = useRef(0);

  const lastFm_Key = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_key';

  const fetchCurrentlyPlayingTrack = async () => {
    try {
      const lastfmApiKey = lastFm_Key;
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (!sessionKey || !username) {
        throw new Error('Last.fm session key or username is missing');
      }

      const currentlyPlayingTrack = await getCurrentlyPlayingTrack(lastfmApiKey, sessionKey, username);
      setCurrentlyPlaying(currentlyPlayingTrack);
    } catch (error) {
      console.error('Failed to fetch currently playing track:', error);
    }
  };

  const fetchTopAlbums = async () => {
    try {
      const lastfmApiKey = lastFm_Key;
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (!sessionKey || !username) {
        throw new Error('Last.fm session key or username is missing');
      }

      const topAlbums = await getTopAlbums(lastfmApiKey, sessionKey, username);
      setTopAlbums(topAlbums);
    } catch (error) {
      console.error('Failed to fetch top albums:', error);
    }
  };

  const fetchRecentTracks = async () => {
    try {
      const lastfmApiKey = lastFm_Key;
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (!sessionKey || !username) {
        throw new Error('Last.fm session key or username is missing');
      }

      const recentTracks = await getRecentTracks(lastfmApiKey, sessionKey, username);
      setRecentTracks(recentTracks);
    } catch (error) {
      console.error('Failed to fetch recent tracks:', error);
    }
  };

  const fetchData = async () => {
    try {
      const lastfmApiKey = lastFm_Key;
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (!sessionKey || !username) {
        throw new Error('Last.fm session key or username is missing');
      }

      const userResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastfmApiKey}&sk=${sessionKey}&format=json`
      );

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userResponse.json();
      setUserInfo(userData.user);

      await fetchCurrentlyPlayingTrack();
      await fetchTopAlbums();
      await fetchRecentTracks();

      intervalRef.current = setInterval(fetchCurrentlyPlayingTrack, 15 * 1000);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const retryFetchData = async () => {
    try {
      await fetchData();
    } catch (error) {
      if (retryCountRef.current < 5) {
        retryCountRef.current += 1;
        setTimeout(retryFetchData, 1000); // Retry after 1 second
      } else {
        console.error('Failed to fetch data after multiple retries:', error);
        setError('Failed to fetch data after multiple retries');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    retryFetchData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    retryCountRef.current = 0;
    await retryFetchData();
  };

  return (
    <SafeAreaView className="bg-primary flex-1 items-center justify-center">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {userInfo ? (
          <View className="items-center">
            <Text className="text-xl font-abold color-green mb-4">
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
          <Text className="text-xl font-abold color-green mb-4">Your Top Albums</Text>
          <FlatList
            horizontal
            data={topAlbums}
            renderItem={({ item }) => <AlbumCard album={item} />}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        <View className="mt-8">
          <Text className="text-xl font-abold color-green mb-4">Your Recent Tracks</Text>
          {recentTracks.map((track, index) => (
            <SongCard key={index} track={track} />
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  refreshButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#D92323',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Home;