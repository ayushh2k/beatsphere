// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { refreshAccessToken } from '../../utils/spotifyAuth';
import { SpotifyUser } from '../../types/spotify';
import { router } from 'expo-router';

const Profile = () => {
  const [userInfo, setUserInfo] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const accessToken = await SecureStore.getItemAsync('spotify_access_token');
      if (accessToken) {
        try {
          const response = await axios.get<SpotifyUser>('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          setUserInfo(response.data);
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              fetchUserInfo();
            } else {
              setError('Failed to refresh access token');
            }
          } else {
            console.error('Failed to fetch user info:', error);
            setError('Failed to fetch user info');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setError('Access token is missing');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('spotify_access_token');
    await SecureStore.deleteItemAsync('spotify_refresh_token');
    router.replace('/');
  };

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
          <Image
            source={{ uri: userInfo.images[0].url }}
            className="w-32 h-32 rounded-full mb-4"
          />
          <Text className="text-xl font-aregular color-green mb-2">
            {userInfo.display_name}
          </Text>
          <Text className="text-lg font-aregular color-green">
            {userInfo.email}
          </Text>
          <Text className="text-lg items-center justify-center font-aregular color-green">
            {userInfo.external_urls.spotify}
          </Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-md justify-center items-center px-4 py-2 mt-4"
          >
            <Text className="text-white font-aregular text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text className="text-xl font-aregular color-green">No user info available</Text>
      )}
    </SafeAreaView>
  );
};

export default Profile;