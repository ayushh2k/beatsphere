// components/LoginWithSpotify.tsx

import React, { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { TouchableOpacity, Text } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Buffer } from 'buffer'; // Import Buffer from the buffer package

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

interface LoginWithSpotifyProps {
  containerStyle?: string;
}

export default function LoginWithSpotify({ containerStyle }: LoginWithSpotifyProps) {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || 'default_client_id'; // Provide a fallback value
  const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || 'default_client_secret'; // Provide a fallback value

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId,
      scopes: ['user-read-email', 'playlist-modify-public'],
      usePKCE: false,
      redirectUri: makeRedirectUri({
        scheme: 'beatsphere',
        native: 'beatsphere://',
      }),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Authorization code:', code);
      exchangeCodeForToken(code);
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const redirectUri = makeRedirectUri({
      scheme: 'beatsphere',
      native: 'beatsphere://',
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      console.log('Access Token:', access_token);
      console.log('Refresh Token:', refresh_token);
      console.log('Expires In:', expires_in);

      // Store the tokens securely
      await SecureStore.setItemAsync('spotify_access_token', access_token);
      await SecureStore.setItemAsync('spotify_refresh_token', refresh_token);

      // Navigate to the home page
      router.replace('/home');
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  };

  const handlePress = () => {
    promptAsync();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-green rounded-md justify-center items-center px-4 py-2 text-white ${containerStyle}`}
    >
      <Text className="text-white font-aregular text-lg">Login with Spotify</Text>
    </TouchableOpacity>
  );
}