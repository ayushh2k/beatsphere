import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, View, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const lastFm_Key = process.env.EXPO_PUBLIC_LASTFM_KEY;

  const clearData = () => {
    setUserInfo(null);
    setCurrentlyPlaying(null);
    setTopAlbums([]);
    setRecentTracks([]);
  };

  // Fetcher for currently playing track (can be called by interval)
  const fetchCurrentlyPlaying = useCallback(async (apiKey: string, sessionKey: string, username: string) => {
    try {
      const track = await getCurrentlyPlayingTrack(apiKey, sessionKey, username);
      setCurrentlyPlaying(track);
    } catch (err) {
      console.error('Failed to fetch currently playing track (interval/update):', err);
    }
  }, []);


  // Main data loading function
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) {
        setLoading(true);
    } else {
        setLoading(true); // Ensure our internal loading state is true
    }
    setError(null);
    retryCountRef.current = 0;

    if (!lastFm_Key) {
      setError("Last.fm API key is missing. Please configure it.");
      setLoading(false);
      setIsInitialLoad(false);
      clearData();
      return;
    }

    const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
    const username = await SecureStore.getItemAsync('lastfm_username');

    console.log('Attempting to load data. Username:', username, 'SessionKey present:', !!sessionKey);


    if (!sessionKey || !username) {
      setError('Please log in to Last.fm to see your data.');
      clearData();
      setLoading(false);
      setIsInitialLoad(false); // Initial load attempt finished (auth failed)
      if (intervalRef.current) clearInterval(intervalRef.current); // Stop interval if not logged in
      return;
    }

    try {
      // Fetch User Info
      const userResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastFm_Key}&sk=${sessionKey}&format=json`
      );
      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({ message: 'Unknown API error' }));
        throw new Error(`Failed to fetch user info: ${errorData.message || userResponse.status}`);
      }
      const userData = await userResponse.json();
      setUserInfo(userData.user);

      // Fetch other data in parallel
      const [albumsData, recentTracksData, currentTrackData] = await Promise.all([
        getTopAlbums(lastFm_Key, sessionKey, username),
        getRecentTracks(lastFm_Key, sessionKey, username),
        getCurrentlyPlayingTrack(lastFm_Key, sessionKey, username)
      ]);

      setTopAlbums(albumsData || []);
      setRecentTracks(recentTracksData || []);
      setCurrentlyPlaying(currentTrackData);

      // Clear previous interval and set new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        fetchCurrentlyPlaying(lastFm_Key, sessionKey, username);
      }, 15 * 1000);

    } catch (err: any) {
      console.error('Failed to fetch Last.fm data:', err);
      setError(err.message || 'Failed to fetch data. Please try again.');
      if (intervalRef.current) clearInterval(intervalRef.current); // Stop interval on error
    } finally {
      setLoading(false);
      setIsInitialLoad(false); // Initial load sequence is complete
    }
  }, [fetchCurrentlyPlaying, lastFm_Key]); // Add lastFm_Key to dependencies

  // Effect for initial data load
  useEffect(() => {
    loadData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadData]); // `loadData` is memoized with useCallback

  const handleRefresh = () => {
    loadData(true); // Pass true to indicate manual refresh
  };


  if (isInitialLoad && loading) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer} className="bg-primary">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.messageText} className="color-green mt-4">Loading your Last.fm data...</Text>
      </SafeAreaView>
    );
  }

  // If error and no user info (e.g., login required or major fetch failure)
  if (error && !userInfo) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer} className="bg-primary">
        <Ionicons name="alert-circle-outline" size={48} color="#D92323" />
        <Text style={styles.errorText} className="color-red-500 mt-2">{error}</Text>
        {/* Optionally, add a "Try Again" or "Login" button here */}
        <TouchableOpacity onPress={handleRefresh} style={[styles.refreshButton, styles.tryAgainButton]}>
            <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && !isInitialLoad}
            onRefresh={handleRefresh}
            tintColor="#1DB954" // iOS
            colors={['#1DB954']} // Android
          />
        }
      >
        {/* Display error as a banner if data is already present but a refresh failed */}
        {error && userInfo && (
            <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>{error}</Text>
            </View>
        )}

        {userInfo ? (
          <View className="items-center px-4 pt-4">
            <Text className="text-2xl font-abold color-green mb-2 text-center">
              Welcome, {userInfo.name}!
            </Text>
            {currentlyPlaying ? (
              <View className="w-full my-4">
                {/*<Text className="text-lg font-asemi color-green mb-2 text-center">Now Playing:</Text>*/}
                <SongCard track={currentlyPlaying} />
              </View>
            ) : (
              <Text className="text-lg font-aregular color-gray-400 my-4 text-center">No track is currently playing</Text>
            )}
          </View>
        ) : (
          !loading && <Text style={styles.messageText} className="color-green text-center mt-10">No user information available.</Text>
        )}

        {userInfo && (
          <>
            <View className="mt-6 px-4">
              <Text className="text-xl font-abold color-green mb-3">Your Top Albums</Text>
              {topAlbums.length > 0 ? (
                <FlatList
                  horizontal
                  data={topAlbums}
                  renderItem={({ item }) => <AlbumCard album={item} />}
                  keyExtractor={(item, index) => `${item.name}-${item.artist.name}-${index}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 2 }}
                />
              ) : (
                !loading && <Text className="text-md font-aregular color-gray-400">No top albums found.</Text>
              )}
            </View>

            <View className="mt-8 px-4">
              <Text className="text-xl font-abold color-green mb-3">Your Recent Tracks</Text>
              {recentTracks.length > 0 ? (
                recentTracks.map((track, index) => (
                  <SongCard key={`${track.name}-${track.artist['#text']}-${index}`} track={track} />
                ))
              ) : (
                !loading && <Text className="text-md font-aregular color-gray-400">No recent tracks found.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <TouchableOpacity onPress={handleRefresh} disabled={loading && !isInitialLoad} style={styles.refreshButton}>
        <Ionicons name="refresh" size={24} color={loading && !isInitialLoad ? "#aaa" : "#fff"} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centeredMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D92323',
    borderRadius: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
      color: '#fff',
      fontFamily: 'AvenirNextLTPro-Bold',
      fontSize: 16,
  },
  tryAgainButton: {
    position: 'relative',
    bottom: 'auto',
    right: 'auto',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bannerError: {
    backgroundColor: '#D92323',
    padding: 10,
    margin: 16,
    borderRadius: 5,
  },
  bannerErrorText: {
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Regular',
  },
});

export default Home;