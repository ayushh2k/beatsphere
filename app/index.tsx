// app/index.tsx
import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { Image, MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { LoginWithLastFM, useAuth } from '@/features/auth';

export default function Index() {
  const { isLoggedIn, isProcessingAuth } = useAuth();

  if (isLoggedIn === null) {
    return <View style={styles.container} />;
  }

  return (
    // <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1e1e1e", "#121212", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 800 }}
          style={styles.contentContainer}
        >
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
          >
            <View style={styles.logoContainer}>
              {/* <Ionicons name="globe-outline" size={60} color="#D92323" /> */}
              <Image
                source={require("../assets/images/logo.jpg")}
                style={styles.logo}
              />
            </View>
          </MotiView>
          <Text style={styles.appName}>BeatSphere</Text>
          <Text style={styles.tagline}>
            Discover what the world is listening to, right now.
          </Text>

          {isProcessingAuth ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Securing your session...</Text>
            </View>
          ) : (
            <LoginWithLastFM />
          )}
        </MotiView>
      </SafeAreaView>
    </View>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  safeArea: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#181818",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#282828",
    borderWidth: 2,
  },
  appName: {
    fontSize: 42,
    fontFamily: "AvenirNextLTPro-Bold",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 16,
    fontFamily: "AvenirNextLTPro-Regular",
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 60,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#A0A0A0",
    marginTop: 15,
    fontFamily: "AvenirNextLTPro-Regular",
  },
});
