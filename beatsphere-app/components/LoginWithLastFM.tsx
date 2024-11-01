// components/LoginWithLastFM.tsx

import React, { useEffect } from 'react';
import { TouchableOpacity, Text, Linking, ImageBackground, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMobileSession, getUserInfo } from '../utils/lastFmHelpers';
import { router } from 'expo-router';


export default function LoginWithLastFM() {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
  const sharedSecret = process.env.EXPO_PUBLIC_LASTFM_SECRET || 'default_shared_secret'; // Provide a fallback value
  const redirectUri = 'exp://192.168.1.8:8081'; // Replace with your correct redirect URI
  const handleLogin = async () => {
    const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(redirectUri)}`;
    Linking.openURL(authUrl);
  };

  useEffect(() => {
    const handleOpenURL = async (event: { url: string }) => {
      const url = event.url;
      const token = new URL(url).searchParams.get('token');
      if (token) {
        try {
          const sessionKey = await getMobileSession(token, apiKey, sharedSecret);
          console.log('Session Key:', sessionKey);

          // Fetch user info after getting the session key
          const userInfo = await getUserInfo(apiKey, sessionKey);
          console.log('User Info:', userInfo);

          // Store the username securely
          await SecureStore.setItemAsync('lastfm_username', userInfo.name);

          // Store the user's Last.fm image securely
          const userImageUrl = userInfo.image.find((img: { size: string; }) => img.size === 'large')['#text'];
          await SecureStore.setItemAsync('lastfm_user_image', userImageUrl);

          // Store the user's Last.fm profile URL in AsyncStorage
          await AsyncStorage.setItem('lastfm_profile_url', userInfo.url);

          router.replace('/home');
        } catch (error) {
          console.error('Failed to get mobile session:', error);
        }
      }
    };

    const listener = Linking.addListener('url', handleOpenURL);

    // Check if there's an initial URL when the app is opened
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleOpenURL({ url });
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <View>
    <TouchableOpacity
    onPress={handleLogin}
    className={`bg-buttonRed rounded-md justify-center items-center px-4 py-2 text-white`}
    >
      <Text className="text-white font-aregular text-lg">Login with Last.fm</Text>
    </TouchableOpacity>
    <Text className='text-white font-aregular text-md text-center mt-4'>
      Here's how you can connect <Text className='color-green-400'  onPress={() => Linking.openURL('https://community.spotify.com/t5/FAQs/How-can-I-connect-Spotify-to-Last-fm/ta-p/4795301')}>Spotify</Text> to Last.FM.
    </Text>
      </View>
  );
}