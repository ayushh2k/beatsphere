// components/LoginWithSpotify.tsx

import React, { useEffect } from 'react';
import { TouchableOpacity, Text, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getMobileSession, getUserInfo } from '../utils/lastFmAuth';
import { router } from 'expo-router';

interface LoginWithSpotifyProps {
  containerStyle?: string;
}

export default function LoginWithSpotify({ containerStyle }: LoginWithSpotifyProps) {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key'; // Provide a fallback value
  const sharedSecret = process.env.EXPO_PUBLIC_LASTFM_SECRET || 'default_shared_secret'; // Provide a fallback value
  const redirectUri = 'exp://192.168.15.200:8081'; // Replace with your correct redirect URI

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
          // console.log('User Info:', userInfo);

          // Store the username securely
          await SecureStore.setItemAsync('lastfm_username', userInfo.name);

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
    <TouchableOpacity
      onPress={handleLogin}
      className={`bg-green rounded-md justify-center items-center px-4 py-2 text-white ${containerStyle}`}
    >
      <Text className="text-white font-aregular text-lg">Login with Last.fm</Text>
    </TouchableOpacity>
  );
}