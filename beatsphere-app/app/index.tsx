// app/index.tsx

import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions, Image } from "react-native";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginWithLastFM from "@/components/LoginWithLastFM";
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fontsLoaded] = useFonts({
    'AvenirNextLTPro-Bold': require('../assets/fonts/AvenirNextLTPro-Bold.otf'),
    'AvenirNextLTPro-It': require('../assets/fonts/AvenirNextLTPro-It.otf'),
    'AvenirNextLTPro-Regular': require('../assets/fonts/AvenirNextLTPro-Regular.otf'),
  });

  useEffect(() => {
    const checkLoginStatus = async () => {
      const accessToken = await SecureStore.getItemAsync('lastfm_session_key');
      if (accessToken) {
        setIsLoggedIn(true);
        router.replace('/home');
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoggedIn) {
    return <Redirect href="/home" />;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <Image source={require('../assets/images/logo.jpg')} style={styles.logo} />
          <Text style={styles.appName}>BeatSphere</Text>
          <LoginWithLastFM />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background color
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60, // Make the logo a circle
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontFamily: 'AvenirNextLTPro-Bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
});