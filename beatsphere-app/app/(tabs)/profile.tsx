// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, Linking, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo, getRecentTracks, getTopAlbums } from '../../utils/lastFmHelpers';
import { router } from 'expo-router';

interface LastFmUser {
  name: string;
  image: {
    '#text': string;
    size: string;
  }[];
  url: string;
  country: string;
  playcount: string;
}

interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
  };
  playcount: string;
  url: string;
}

interface LastFmAlbum {
  name: string;
  artist: {
    name: string;
  };
  playcount: string;
  url: string;
  image: {
    '#text': string;
    size: string;
  }[];
}

const Profile = () => {
  const [userInfo, setUserInfo] = useState<LastFmUser | null>(null);
  const [recentTracks, setRecentTracks] = useState<LastFmTrack[]>([]);
  const [topAlbums, setTopAlbums] = useState<LastFmAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const lastfmApiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const username = await SecureStore.getItemAsync('lastfm_username');

      if (sessionKey && username) {
        try {
          // Check if user info is cached in AsyncStorage
          const cachedUserInfo = await AsyncStorage.getItem('lastfm_user_info');
          if (cachedUserInfo) {
            setUserInfo(JSON.parse(cachedUserInfo));
            setLoading(false);
            return;
          }

          const userInfo = await getUserInfo(lastfmApiKey, sessionKey);

          // Cache the user info in AsyncStorage
          await AsyncStorage.setItem('lastfm_user_info', JSON.stringify(userInfo));

          setUserInfo(userInfo);

          // Fetch recent tracks and top albums
          const recentTracks = await getRecentTracks(lastfmApiKey, sessionKey, username);
          const topAlbums = await getTopAlbums(lastfmApiKey, sessionKey, username);

          setRecentTracks(recentTracks);
          setTopAlbums(topAlbums);
        } catch (error: unknown) {
          console.error('Failed to fetch user info:', error);
          setError('Failed to fetch user info');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Last.fm session key or username is missing');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('lastfm_session_key');
    await SecureStore.deleteItemAsync('lastfm_username');

    await AsyncStorage.removeItem('lastfm_user_info');

    router.replace('/');
  };

  const handleEditProfile = () => {
    if (userInfo?.url) {
      Linking.openURL(userInfo.url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {userInfo ? (
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: userInfo.image.find(img => img.size === 'extralarge')?.['#text'] || 'https://placehold.co/100x100' }}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userInfo}>Playcount: {userInfo.playcount}</Text>
            {/* <Text style={styles.userInfo}>Country: {userInfo.country}</Text> */}
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editProfileButton}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>

            {/* <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recent Tracks</Text>
              {recentTracks.map((track, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(track.url)}
                  style={styles.listItem}
                >
                  <Text style={styles.listItemText}>{track.name} by {track.artist['#text']}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Top Albums</Text>
              {topAlbums.map((album, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(album.url)}
                  style={styles.listItem}
                >
                  <Image
                    source={{ uri: album.image.find(img => img.size === 'extralarge')?.['#text'] || 'https://placehold.co/100x100' }}
                    style={styles.albumImage}
                  />
                  <Text style={styles.listItemText}>{album.name} by {album.artist.name}</Text>
                </TouchableOpacity>
              ))}
            </View> */}
          </View>
        ) : (
          <Text style={styles.noUserText}>No user info available</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'AvenirNextLTPro-Bold',
    // fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffff',
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 5,
    fontFamily: 'AvenirNextLTPro-Bold',
    color: '#595959',
  },
  editProfileButton: {
    backgroundColor: '#D92323',
    fontFamily: 'AvenirNextLTPro-Bold',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#D92323',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'AvenirNextLTPro-Bold',

    fontSize: 16,
    // fontWeight: 'bold',
  },
  sectionContainer: {
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listItemText: {
    fontSize: 16,
    color: '#555',
  },
  albumImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
  },
  noUserText: {
    fontSize: 18,
    color: '#555',
  },
});

export default Profile;