// components/LoginWithLastFM.tsx

import React from 'react';
import { TouchableOpacity, Text, Linking, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginWithLastFM() {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY || 'default_api_key';
  const sharedSecret = process.env.EXPO_PUBLIC_LASTFM_SECRET || 'default_shared_secret';
  const redirectUri = 'beatsphere://';
  // const redirectUri = 'exp://192.168.1.6:8081';

  const buttonScale = new Animated.Value(1);

  const handleLogin = async () => {
    const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(redirectUri)}`;
    Linking.openURL(authUrl);
  };

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
      <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
        <TouchableOpacity
          onPress={handleLogin}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.loginButton}
        >
          <Ionicons name="musical-notes" size={24} color="#FFFFFF" style={styles.icon} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.8,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#D92323',
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