// components/Map.tsx

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapCluster from "react-native-map-clustering";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import EventSource from "react-native-event-source";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';

import { getListeningStatus  } from "../utils/lastFmHelpers";
import mapStyle from "../utils/mapStyle.json";
import api from '../utils/api';
import CustomMarker from "./CustomMarker";
import UserCard from "./UserCard";

const BACKEND_URL = 'https://beatsphere-backend.onrender.com';
// const BACKEND_URL = "https://backend-beatsphere.onrender.com";
// const BACKEND_URL = "http://192.168.1.6:3000";

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
  const [bottomSheetTitle, setBottomSheetTitle] = useState("Listeners Nearby");
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // --- Refs ---
  const mapRef = useRef<MapView>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isListeningRef = useRef(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["40%", "80%"], []);
  const latestLocationRef = useRef<Location.LocationObject | null>(null);


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
      Image.prefetch(imageUrls);
    }
  }, [otherUsers]);

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

    // setUserLocation(locationData);
    // api.post('/api/location', locationData)
    //     .catch((e) => console.error("Error posting location:", e.response?.data || e.message));
    api.post('/api/location', locationData)
        .then(response => {
          const generalizedLocation = response.data;
          generalizedLocation.username = generalizedLocation.name; 
          setUserLocation(response.data);
        })
        .catch((e) => console.error("Error posting location:", e.response?.data || e.message));

  } else {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setUserLocation(null);
      api.delete(`/api/location/${username}`)
          .catch((e) => console.error("Error deleting location:", e.response?.data || e.message));
    }
  }
}, []);

  const initializeSSE = useCallback(async () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const username = await SecureStore.getItemAsync("lastfm_username");
    if (!username) return;
    const source = new EventSource(`${BACKEND_URL}/api/locations/stream`);
    source.addEventListener("message", (event) => {
      if (event.data) {
        try {
          const locations: UserLocation[] = JSON.parse(event.data);
          const validLocations = locations.filter(
            (loc) =>
              loc &&
              typeof loc.latitude === "number" &&
              typeof loc.longitude === "number"
          );
          setOtherUsers(validLocations.filter((loc) => loc.id !== username));
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      }
    });
    eventSourceRef.current = source;
  }, []);

  useEffect(() => {
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

      initializeSSE();
      checkListeningStatus();
    };

    initialize();

    const listeningInterval = setInterval(checkListeningStatus, 20000);

    return () => {
      eventSourceRef.current?.close();
      clearInterval(listeningInterval);
    };
  }, [initializeSSE, checkListeningStatus]);

  // --- Marker Refreshing & Jittering Fix ---
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 1000);
    return () => clearTimeout(timer);
  }, [otherUsers, userLocation]);

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
  const handleRegionChange = (region: Region) => {
    const visible = otherUsers.filter(
      (user) =>
        user.latitude > region.latitude - region.latitudeDelta / 2 &&
        user.latitude < region.latitude + region.latitudeDelta / 2 &&
        user.longitude > region.longitude - region.longitudeDelta / 2 &&
        user.longitude < region.longitude + region.longitudeDelta / 2
    );
    setVisibleUsers(visible);
  };

  const handleRefresh = () => {
    checkListeningStatus();
  };

  const handleLocateMe = () => {
    if (userLocation && mapRef.current) {
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
  };

  const openUserList = () => {
    setBottomSheetTitle(`Listeners Nearby (${visibleUsers.length})`);
    bottomSheetRef.current?.expand();
  };

  const flyToUser = (user: UserLocation) => {
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
  };

  if (permissionDenied) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location permission is required.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapCluster
        ref={mapRef}
        style={styles.map}
        // mapRef={(ref) => {
        //   mapRef.current = ref as unknown as MapView;
        // }}
        provider={PROVIDER_GOOGLE}
        clusterColor="#D92323"
        customMapStyle={mapStyle}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: 40.7128,
          longitude: 2.006,
          latitudeDelta: 25,
          longitudeDelta: 25,
        }}
        onRegionChangeComplete={handleRegionChange}
      >
        {userLocation && (
          <CustomMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            tracksViewChanges={tracksViewChanges}
            {...userLocation}
            listeningStatus={userLocation.listeningStatus}
            username={userLocation.username}
            id={userLocation.id}
          />
        )}
        {jitteredUsers.map((user) => (
          <CustomMarker
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            key={user.id}
            tracksViewChanges={tracksViewChanges}
            {...user}
            listeningStatus={user.listeningStatus}
            id={user.id}
            username={user.name}
          />
        ))}
      </MapCluster>

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
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Listeners Nearby</Text>
        </View>
        <BottomSheetFlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard user={item} onFlyTo={() => flyToUser(item)} />
          )}
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
});

export default MapViewComponent;
