// app/(tabs)/home.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import {
  getTopAlbums,
  getRecentTracks,
  getUserInfo,
  getWeeklyReport,
} from "../../utils/lastFmHelpers";

import SongCard, { LastFmTrack } from "@/components/SongCard";
import AlbumCard from "@/components/AlbumCard";
import WeeklyReportCard from "@/components/WeeklyReportCard";

const useLastFmHomeData = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<LastFmTrack | null>(null);
  const [topAlbums, setTopAlbums] = useState<any[]>([]);
  const [recentTracks, setRecentTracks] = useState<LastFmTrack[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
      const sessionKey = await SecureStore.getItemAsync("lastfm_session_key");
      const username = await SecureStore.getItemAsync("lastfm_username");

      if (!apiKey || !sessionKey || !username) {
        throw new Error("Please log in to Last.fm to see your data.");
      }

      const [userInfoData, albumsData, recentTracksData, weeklyReportData] =
        await Promise.all([
          getUserInfo(apiKey, sessionKey),
          getTopAlbums(apiKey, sessionKey, username, "1month"),
          getRecentTracks(apiKey, sessionKey, username),
          getWeeklyReport(),
        ]);

      setUserInfo(userInfoData);
      setTopAlbums(albumsData || []);
      setWeeklyReport(weeklyReportData);
      setRecentTracks(recentTracksData || []);

      const nowPlaying =
        recentTracksData?.[0]?.["@attr"]?.nowplaying === "true"
          ? recentTracksData[0]
          : null;
      setCurrentlyPlaying(nowPlaying);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCurrentlyPlaying = useCallback(async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
      const sessionKey = await SecureStore.getItemAsync("lastfm_session_key");
      const username = await SecureStore.getItemAsync("lastfm_username");
      if (!apiKey || !sessionKey || !username) return;

      const recentTracksData = await getRecentTracks(apiKey, sessionKey, username);

      const nowPlaying =
        recentTracksData?.[0]?.["@attr"]?.nowplaying === "true"
          ? recentTracksData[0]
          : null;
      setCurrentlyPlaying(nowPlaying);

      setRecentTracks(nowPlaying ? recentTracksData.slice(1) : recentTracksData);
    } catch (err) {
      console.error("Failed to update currently playing track:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(updateCurrentlyPlaying, 15000); // 15s
    return () => clearInterval(interval);
  }, [loadInitialData, updateCurrentlyPlaying]);

  const refresh = async () => {
    await loadInitialData();
    await updateCurrentlyPlaying();
  };

  return {
    userInfo,
    currentlyPlaying,
    topAlbums,
    recentTracks,
    weeklyReport,
    loading,
    error,
    refresh,
  };
};

const Home = () => {
  const {
    userInfo,
    currentlyPlaying,
    topAlbums,
    recentTracks,
    weeklyReport,
    loading,
    error,
    refresh,
  } = useLastFmHomeData();

  if (loading && !userInfo) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D92323" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#A0A0A0" />
        <Text style={styles.errorText}>Request Failed</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#121212" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#D92323"
            colors={["#D92323"]}
          />
        }
      >
        <Text style={styles.welcomeText}>Welcome, {userInfo?.name}</Text>

        <Section title="Your Weekly Report">
          <WeeklyReportCard report={weeklyReport} />
        </Section>

        <Section title="Now Playing">
          {currentlyPlaying ? (
            <SongCard track={currentlyPlaying} />
          ) : (
            <Text style={styles.placeholderText}>Not currently scrobbling.</Text>
          )}
        </Section>

        <Section title="Top Monthly Albums">
          {topAlbums.length > 0 ? (
            <FlatList
              horizontal
              data={topAlbums}
              renderItem={({ item }) => <AlbumCard album={item} />}
              keyExtractor={(item) => item.name + item.artist.name}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.placeholderText}>Not enough data.</Text>
          )}
        </Section>

        <Section title="Recent Tracks">
          {recentTracks.length > 0 ? (
            recentTracks.map((track: LastFmTrack, index: number) => (
              <SongCard key={`${track.name}-${index}`} track={track} />
            ))
          ) : (
            <Text style={styles.placeholderText}>No recent tracks found.</Text>
          )}
        </Section>
      </ScrollView>

      <TouchableOpacity
        onPress={refresh}
        disabled={loading}
        style={styles.refreshButton}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons name="refresh" size={24} color={"#fff"} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  scrollContent: { paddingVertical: 20, paddingBottom: 80 },
  welcomeText: {
    fontSize: 28,
    fontFamily: "AvenirNextLTPro-Bold",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionContainer: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "AvenirNextLTPro-Bold",
    color: "#D92323",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "AvenirNextLTPro-Regular",
    color: "#A0A0A0",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "AvenirNextLTPro-Regular",
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: "#282828",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "AvenirNextLTPro-Bold",
  },
  refreshButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#D92323",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default Home;
