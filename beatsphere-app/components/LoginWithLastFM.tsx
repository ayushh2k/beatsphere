// components/LoginWithLastFM.tsx

import React, { useEffect } from 'react';
import { TouchableOpacity, Text, Linking, View, StyleSheet, Dimensions, Animated } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMobileSession, getUserInfo } from '../utils/lastFmHelpers';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginWithLastFM() {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key';
  const sharedSecret = process.env.EXPO_PUBLIC_LASTFM_SECRET || 'default_shared_secret';
  const redirectUri = 'exp://192.168.115.201:8081';

  const buttonScale = new Animated.Value(1);

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
          const userInfo = await getUserInfo(apiKey, sessionKey);
          await SecureStore.setItemAsync('lastfm_username', userInfo.name);
          const userImageUrl = userInfo.image.find((img: { size: string; }) => img.size === 'large')['#text'];
          await SecureStore.setItemAsync('lastfm_user_image', userImageUrl);
          await AsyncStorage.setItem('lastfm_profile_url', userInfo.url);
          router.replace('/home');
        } catch (error) {
          console.error('Failed to get mobile session:', error);
        }
      }
    };

    const listener = Linking.addListener('url', handleOpenURL);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleOpenURL({ url });
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.glassCard}>
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            onPress={handleLogin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.loginButton}
          >
            {/* <Ionicons name="musical-notes" size={24} color="#FFFFFF" style={styles.icon} /> */}
            <Text style={styles.buttonText}>Login with Last.fm</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.guideText}>
          New to Last.fm?{'\n'}Learn how to connect{' '}
          <Text
            style={styles.spotifyLink}
            onPress={() => Linking.openURL('https://community.spotify.com/t5/FAQs/How-can-I-connect-Spotify-to-Last-fm/ta-p/4795301')}
          >
            Spotify to Last.fm
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.8,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontFamily: 'AvenirNextLTPro-Bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 64, 64, 0.8)',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'AvenirNextLTPro-Bold',
    textAlign: 'center',
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  spotifyLink: {
    color: '#1DB954',
    fontFamily: 'AvenirNextLTPro-Bold',
    textDecorationLine: 'underline',
  },
});