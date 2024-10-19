// app/index.tsx

import { ImageBackground, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginWithLastFM from "@/components/LoginWithLastFM";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  return (
       <ImageBackground source={require('../assets/images/bg.png')} resizeMode="cover">
    <SafeAreaView className="h-full">
      <View className="w-full h-full min-h-[85vh] px-8 flex-1 items-center justify-center">
        <StatusBar style="light" />
        <LoginWithLastFM />
      </View>
    </SafeAreaView>
      </ImageBackground>
  );
}