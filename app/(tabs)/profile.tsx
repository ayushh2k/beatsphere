// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo } from '../../utils/lastFmAuth';
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

const Profile = () => {
  const [userInfo, setUserInfo] = useState<LastFmUser | null>(null);
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
            // @ts-ignore
            source={{ uri: userInfo.image.find(img => img.size === 'extralarge')['#text'] }}
            className="w-32 h-32 rounded-full mb-4"
          />
          <Text className="text-xl font-aregular color-green mb-2">
            {userInfo.name}
          </Text>
          <Text className="text-lg font-aregular color-green">
            Playcount: {userInfo.playcount}
          </Text>
          <Text className="text-lg font-aregular color-green">
            <Text className="underline" onPress={() => Linking.openURL(userInfo.url)}>{userInfo.url}</Text>
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