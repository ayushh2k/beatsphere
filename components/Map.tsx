// components/Map.tsx

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform, Linking, Animated, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapCluster from "react-native-map-clustering";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
// import EventSource from "react-native-event-source";
import { Ionicons } from "@expo/vector-icons";
// import { Image } from 'expo-image';

import { getListeningStatus, getRecentTracks } from "../utils/lastFmHelpers";
import mapStyle from "../utils/mapStyle.json";
import api from '../utils/api';
import analytics from '../utils/analytics';
import CustomMarker from "./CustomMarker";
import UserCard from "./UserCard";

const BACKEND_URL = 'https://api.beatsphere.live';

// --- Type Definitions ---
interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  currentlyPlaying?: any;
  username?: string;
  city?: string | null;
  listeningStatus?: 'live' | 'recent';
}

const MapViewComponent = () => {
  // --- State Management ---
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [visibleUsers, setVisibleUsers] = useState<UserLocation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [bottomSheetTitle, setBottomSheetTitle] = useState("Listeners Nearby");
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [sheetMode, setSheetMode] = useState<'list' | 'detail'>('list');
  const [selectedUserHistory, setSelectedUserHistory] = useState<any[]>([]);

  // --- Refs ---
  const mapRef = useRef<MapView>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isListeningRef = useRef(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "80%"], []);
  const latestLocationRef = useRef<Location.LocationObject | null>(null);
  const sseReconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const imageUrls = otherUsers.flatMap(user => {
      const urls = [];
      if (user.imageUrl) {
        urls.push(user.imageUrl);
      }
      const albumArtUrl = user.currentlyPlaying?.image?.find(
        (img: any) => img.size === 'large'
      )?.['#text'];
      if (albumArtUrl) {
        urls.push(albumArtUrl);
      }
      return urls;
    });

    if (imageUrls.length > 0) {
      imageUrls.forEach(url => Image.prefetch(url));
    }
  }, [otherUsers]);

  useEffect(() => {
    if (selectedUser && sheetMode === 'detail') {
      const fetchHistory = async () => {
        try {
          const tracks = await getRecentTracks(process.env.EXPO_PUBLIC_LASTFM_KEY!, "", selectedUser.username || selectedUser.id);
          setSelectedUserHistory(tracks?.slice(0, 5) || []);
        } catch (e) {
          console.error("Error fetching history", e);
        }
      };
      fetchHistory();
    }
  }, [selectedUser, sheetMode]);

  // --- Core Logic ---
  const checkListeningStatus = useCallback(async () => {
    if (!latestLocationRef.current) return;

    const { latitude, longitude } = latestLocationRef.current.coords;
    const sessionKey = await SecureStore.getItemAsync("lastfm_session_key");
    const username = await SecureStore.getItemAsync("lastfm_username");

    if (!sessionKey || !username) return;

    const listeningStatusResult = await getListeningStatus(
      process.env.EXPO_PUBLIC_LASTFM_KEY!,
      sessionKey,
      username
    );

    if (listeningStatusResult) {
      isListeningRef.current = true;
      const userImage = await SecureStore.getItemAsync("lastfm_user_image");

      const locationData: UserLocation = {
        id: username,
        name: username,
        latitude,
        longitude,
        imageUrl: userImage,
        currentlyPlaying: listeningStatusResult.track,
        listeningStatus: listeningStatusResult.status as 'live' | 'recent',
        username,
      };

      // Update location on backend
      api.patch(`/users/${username}/location`, {
        lat: latitude,
        lon: longitude,
        status: listeningStatusResult.status,
        imageUrl: userImage,
        currentlyPlaying: listeningStatusResult.track,
      })
        .then(response => {
          const generalizedLocation = response.data;
          generalizedLocation.username = generalizedLocation.name;
          setUserLocation(response.data);
        })
        .catch((e) => console.error("Error updating location:", e.response?.data || e.message));

    } else {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setUserLocation(null);
        // Backend handles cleanup now
      }
    }
  }, []);

  const initializeSSE = useCallback(async () => {
    const username = await SecureStore.getItemAsync("lastfm_username");
    if (!username) {
      console.log('Location stream: No username found, cannot start');
      return;
    }

    // console.log('Location stream: Starting XHR stream from', `${BACKEND_URL}/users/stream`);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${BACKEND_URL}/users/stream`);
    xhr.setRequestHeader('Accept', 'text/event-stream');

    let processedLength = 0;
    let buffer = "";

    xhr.onreadystatechange = () => {
      // readyState 3 (LOADING) means we have partial data, 4 (DONE) means stream closed/error
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const response = xhr.responseText || "";
        const chunk = response.substring(processedLength);
        processedLength = response.length;

        if (chunk.length > 0) {
          buffer += chunk;
          
          // Split by double newline to get full events
          const parts = buffer.split("\n\n");
          
          // The last part might be incomplete, so we keep it in the buffer
          // and process the rest
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr) {
                  try {
                    const locations: UserLocation[] = JSON.parse(jsonStr);
                    
                    const validLocations = locations
                      .filter(loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number')
                      .map(loc => ({
                        ...loc,
                        username: loc.username || loc.name || loc.id,
                      }));

                    const filtered = validLocations.filter((loc) => loc.id !== username);
                    setOtherUsers(filtered);
                  } catch (e) {
                    // console.error("Location stream: Parse error", e);
                  }
                }
              }
            }
          }
        }
      }
      
      if (xhr.readyState === 4) {
        // console.log("Location stream: Connection closed (readyState 4)");
        // Optional: Implement reconnect logic here if needed
      }
    };

    xhr.onerror = (e) => {
      // console.error("Location stream: XHR Error", e);
    };

    xhr.send();

    return () => {
      // console.log('Location stream: Aborting XHR');
      xhr.abort();
    };
  }, []);

  useEffect(() => {
    let cleanupPolling: (() => void) | undefined;

    const initialize = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      latestLocationRef.current = initialLocation;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000,
          distanceInterval: 100,
        },
        (location) => {
          latestLocationRef.current = location;
        }
      );

      cleanupPolling = await initializeSSE();
      checkListeningStatus();
    };

    initialize();

    const listeningInterval = setInterval(checkListeningStatus, 20000);

    return () => {
      if (cleanupPolling) cleanupPolling();
      if (listeningInterval) clearInterval(listeningInterval);
    };
  }, [initializeSSE, checkListeningStatus]);

  // --- Debug otherUsers ---
  // useEffect(() => {
  //   console.log('Other users on map:', otherUsers.length, otherUsers.map(u => u.id));
  // }, [otherUsers]);

  // --- Marker Refreshing & Jittering Fix ---
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [otherUsers]);

  const jitteredUsers = useMemo(() => {
    const usersByCoord: { [key: string]: UserLocation[] } = {};
    otherUsers.forEach((user) => {
      const key = `${user.latitude.toFixed(4)},${user.longitude.toFixed(4)}`;
      if (!usersByCoord[key]) usersByCoord[key] = [];
      usersByCoord[key].push(user);
    });
    const finalUsers: UserLocation[] = [];
    Object.values(usersByCoord).forEach((group) => {
      if (group.length > 1) {
        group.forEach((user, index) => {
          finalUsers.push({
            ...user,
            latitude: user.latitude + index * 0.00001,
            longitude: user.longitude + index * 0.00001,
          });
        });
      } else if (group.length === 1) {
        finalUsers.push(group[0]);
      }
    });
    return finalUsers;
  }, [otherUsers]);

  // --- UI Handlers ---
  const handleRegionChange = useCallback((region: Region) => {
    const visible = otherUsers.filter(
      (user) =>
        user.latitude > region.latitude - region.latitudeDelta / 2 &&
        user.latitude < region.latitude + region.latitudeDelta / 2 &&
        user.longitude > region.longitude - region.longitudeDelta / 2 &&
        user.longitude < region.longitude + region.longitudeDelta / 2
    );
    setVisibleUsers(visible);
  }, [otherUsers]);

  const handleRefresh = useCallback(() => {
    checkListeningStatus();
  }, [checkListeningStatus]);

  const handleLocateMe = useCallback(() => {
    if (userLocation && mapRef.current) {
      analytics.trackMapInteraction('locate_me');
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
    }
  }, [userLocation]);

  const openUserList = useCallback(() => {
    analytics.trackMapInteraction('open_user_list', { user_count: visibleUsers.length });
    setSheetMode('list');
    setBottomSheetTitle(`Listeners Nearby (${visibleUsers.length})`);
    bottomSheetRef.current?.expand();
  }, [visibleUsers]);

  const flyToUser = useCallback((user: UserLocation) => {
    analytics.trackMapInteraction('fly_to_user', { target_user: user.username });
    bottomSheetRef.current?.close();
    mapRef.current?.animateToRegion(
      {
        latitude: user.latitude,
        longitude: user.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
      1000
    );
  }, []);

  const lastPressTime = useRef(0);
  const onMarkerPress = useCallback((user: UserLocation) => {
    const now = Date.now();
    if (now - lastPressTime.current > 500) {
      lastPressTime.current = now;
      setSelectedUser(user);
      setSheetMode('detail');
      // setBottomSheetTitle(`${user.username || user.name}'s History`);
      // bottomSheetRef.current?.expand();
      // Expand to index 0 (40%) or 1 (80%)?
      bottomSheetRef.current?.expand();
    }
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedUser(null);
    bottomSheetRef.current?.close();
  }, []);

  const mapComponent = useMemo(() => (
    <MapView
      ref={mapRef}
      style={styles.map}
      // mapRef={(ref) => {
      //   mapRef.current = ref as unknown as MapView;
      // }}
      provider={PROVIDER_GOOGLE}
      customMapStyle={mapStyle}
      showsCompass={false}
      toolbarEnabled={false}
      initialRegion={{
        latitude: 50,
        longitude: 10,
        latitudeDelta: 90,
        longitudeDelta: 90,
      }}
      onRegionChangeComplete={handleRegionChange}
      onPress={handleMapPress}
    >
      {jitteredUsers.map((user) => (
        <Marker
          key={user.id}
          coordinate={{
            latitude: user.latitude,
            longitude: user.longitude,
          }}
          tracksViewChanges={tracksViewChanges}
          onPress={(e) => {
            e.stopPropagation();
            onMarkerPress(user);
          }}
        >
          <CustomMarker
            {...user}
            listeningStatus={user.listeningStatus}
            id={user.id}
            username={user.name}
          />
        </Marker>
      ))}
      {userLocation && (
        <Marker
          key="user-location"
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          tracksViewChanges={tracksViewChanges}
          zIndex={9999}
          onPress={(e) => {
            e.stopPropagation();
            onMarkerPress(userLocation);
          }}
        >
          <CustomMarker
            {...userLocation}
            listeningStatus={userLocation.listeningStatus}
            username={userLocation.username}
            id={userLocation.id}
          />
        </Marker>
      )}
    </MapView>
  ), [jitteredUsers, userLocation, tracksViewChanges, handleRegionChange, handleMapPress, onMarkerPress]);

  if (permissionDenied) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location permission is required.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mapComponent}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={openUserList}
          disabled={visibleUsers.length === 0}
        >
          <Ionicons
            name="people"
            size={24}
            color={visibleUsers.length === 0 ? "#6E6E6E" : "#fff"}
          />
          {visibleUsers.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{visibleUsers.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleLocateMe}
          disabled={!userLocation}
        >
          <Ionicons
            name="locate"
            size={24}
            color={!userLocation ? "#6E6E6E" : "#fff"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        backgroundStyle={styles.bottomSheet}
        handleIndicatorStyle={{ backgroundColor: "#4A4A4A" }}
        enableContentPanningGesture={true}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {sheetMode === 'list' ? bottomSheetTitle : `${selectedUser?.username || selectedUser?.name || 'User'}'s Recently Played`}
          </Text>
        </View>
        <BottomSheetFlatList
          data={sheetMode === 'list' ? visibleUsers : selectedUserHistory}
          keyExtractor={(item: any, index: number) => sheetMode === 'list' ? item.id : (item.date?.uts || index.toString())}
          renderItem={({ item }: { item: any }) => {
            if (sheetMode === 'list') {
              return <UserCard user={item} onFlyTo={() => flyToUser(item)} />;
            } else {
              // History Item Render
              const trackName = item.name;
              const artistName = item.artist['#text'];
              const imageUrl = item.image?.find((img: any) => img.size === 'medium')?.['#text'];
              
              return (
                <View style={styles.historyItem}>
                   {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.historyImage} />
                  ) : (
                    <View style={[styles.historyImage, styles.historyPlaceholder]}>
                      <Ionicons name="musical-notes" size={20} color="#666" />
                    </View>
                  )}
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTrack} numberOfLines={1}>{trackName}</Text>
                    <Text style={styles.historyArtist} numberOfLines={1}>{artistName}</Text>
                  </View>
                </View>
              );
            } 
          }}
          ListFooterComponent={() => {
            if (sheetMode === 'detail' && selectedUser) {
              return (
                <TouchableOpacity
                  style={styles.lastFmButton}
                  onPress={() => {
                     const lastfmProfileUrl = `https://www.last.fm/user/${selectedUser.id}`;
                     Linking.openURL(lastfmProfileUrl);
                  }}
                >
                  <Text style={styles.lastFmButtonText}>View on Last.fm</Text>
                  <Ionicons name="open-outline" size={16} color="#fff" style={{marginLeft: 8}} />
                </TouchableOpacity>
              );
            }
            return null;
          }}
          contentContainerStyle={styles.bottomSheetContent}
        />
      </BottomSheet>


    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: { color: "#A0A0A0", fontSize: 16, textAlign: "center" },
  map: { ...StyleSheet.absoluteFillObject },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    alignItems: "center",
  },
  fab: {
    backgroundColor: "rgba(18, 18, 18, 0.9)",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginBottom: 10,
  },
  bottomSheet: { backgroundColor: "#181818" },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#282828",
  },
  bottomSheetTitle: {
    fontFamily: "AvenirNextLTPro-Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  bottomSheetContent: { padding: 16 },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#D92323",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#121212",
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  

  arrowIcon: { marginLeft: 10 },
  
  // History Item Styles
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  historyPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTrack: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Bold',
  },
  historyArtist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'AvenirNextLTPro-Regular',
  },
  lastFmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#D92323',
    paddingVertical: 12,
    borderRadius: 24,
  },
  lastFmButtonText: {
    color: '#fff',
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 14,
  },
});

export default MapViewComponent;
