// components/Map.tsx

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomMarker from './CustomMarker';
import MapCluster from 'react-native-map-clustering';
import axios from 'axios';
import mapStyle from '../utils/mapStyle.json';
import EventSource from 'react-native-event-source';
import { getUserInfo, getCurrentlyPlayingTrack } from '../utils/lastFmHelpers';
import { Ionicons } from '@expo/vector-icons';

// const BACKEND_URL = 'http://192.168.115.201:3000';
const BACKEND_URL = 'https://34.47.235.85.nip.io';

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  currentlyPlaying?: {
    name: string;
    artist: {
      '#text': string;
    };
    album: {
      '#text': string;
    };
    image: {
      '#text': string;
      size: string;
    }[];
  } | null;
  lastfmProfileUrl?: string;
  username?: string;
  lastUpdated?: number;
}

const Map = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const mapRef = useRef(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastLocationUpdateRef = useRef<number>(0);

  const initializeSSE = async () => {
    const userId = await SecureStore.getItemAsync('lastfm_username');
    if (!userId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${BACKEND_URL}/api/locations/stream`);

    eventSource.addEventListener('message', (event) => {
      if (event.data) {
        try {
          const locations: UserLocation[] = JSON.parse(event.data);
          const now = Date.now();
          setOtherUsers(locations.filter(location =>
            location.id !== userId &&
            location.currentlyPlaying &&
            (!location.lastUpdated || now - location.lastUpdated < 300000)
          ));
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setTimeout(initializeSSE, 5000);
    });

    eventSourceRef.current = eventSource;
  };

  const updateLocation = async (
    latitude: number,
    longitude: number,
    currentlyPlaying: any = null
  ) => {
    const now = Date.now();
    if (!currentlyPlaying) {
      setUserLocation(null);
      return;
    }

    if (now - lastLocationUpdateRef.current < 5000) return;
    lastLocationUpdateRef.current = now;

    const userId = await SecureStore.getItemAsync('lastfm_username');
    const userImage = await SecureStore.getItemAsync('lastfm_user_image');
    const lastfmProfileUrl = await AsyncStorage.getItem('lastfm_profile_url');
    const userInfo = await getUserInfo(
      process.env.EXPO_PUBLIC_LASTFM_KEY!,
      await SecureStore.getItemAsync('lastfm_session_key') || ''
    );

    if (!userId) return;

    const locationData: UserLocation = {
      id: userId,
      name: userId,
      latitude,
      longitude,
      imageUrl: userImage || undefined,
      currentlyPlaying,
      lastfmProfileUrl: lastfmProfileUrl || undefined,
      username: userInfo.name,
      lastUpdated: now,
    };

    setUserLocation(locationData);

    try {
      await axios.post(`${BACKEND_URL}/api/location`, locationData);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const startLocationWatch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        return;
      }

      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
          const userId = await SecureStore.getItemAsync('lastfm_username');

          if (sessionKey && userId) {
            const currentlyPlaying = await getCurrentlyPlayingTrack(
              process.env.EXPO_PUBLIC_LASTFM_KEY!,
              sessionKey,
              userId
            );
            if (currentlyPlaying) {
              await updateLocation(latitude, longitude, currentlyPlaying);
            } else {
              setUserLocation(null);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
    }
  };

  const handleRefresh = async () => {
    eventSourceRef.current?.close();
    locationWatchRef.current?.remove();
    await initializeSSE();
    await startLocationWatch();
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        initializeSSE();
        startLocationWatch();
      } else if (nextAppState.match(/inactive|background/)) {
        eventSourceRef.current?.close();
        locationWatchRef.current?.remove();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkCurrentlyPlaying = async () => {
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const userId = await SecureStore.getItemAsync('lastfm_username');
      if (!sessionKey || !userId) return;

      const currentlyPlaying = await getCurrentlyPlayingTrack(
        process.env.EXPO_PUBLIC_LASTFM_KEY!,
        sessionKey,
        userId
      );

      if (currentlyPlaying && userLocation?.latitude && userLocation?.longitude) {
        await updateLocation(
          userLocation.latitude,
          userLocation.longitude,
          currentlyPlaying
        );
      } else if (!currentlyPlaying) {
        setUserLocation(null);
      }
    };

    const interval = setInterval(checkCurrentlyPlaying, 5000);
    return () => clearInterval(interval);
  }, [userLocation]);

  useEffect(() => {
    initializeSSE();
    startLocationWatch();

    return () => {
      eventSourceRef.current?.close();
      locationWatchRef.current?.remove();
    };
  }, []);

  if (locationPermissionDenied) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionDeniedText}>
          Location permission denied. Please enable location services.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapCluster
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        clusterColor='#D92323'
        customMapStyle={mapStyle}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: userLocation?.latitude || 48.9244,
          longitude: userLocation?.longitude || 2.1353,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {userLocation && userLocation.currentlyPlaying && (
          <CustomMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title={`${userLocation.name} - ${userLocation.currentlyPlaying.name} by ${userLocation.currentlyPlaying.artist['#text']}`}
            //@ts-ignore
            imageUrl={userLocation.imageUrl}
            currentlyPlaying={userLocation.currentlyPlaying}
            lastfmProfileUrl={userLocation.lastfmProfileUrl}
            username={userLocation.username}
          />
        )}
        {otherUsers.map((user) => (
          <CustomMarker
            key={user.id}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            title={`${user.name} - ${user.currentlyPlaying?.name} by ${user.currentlyPlaying?.artist['#text']}`}
            //@ts-ignore
            imageUrl={user.imageUrl}
            currentlyPlaying={user.currentlyPlaying}
            lastfmProfileUrl={`https://www.last.fm/user/${user.id}`}
            username={user.name}
          />
        ))
        }
      </MapCluster>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionDeniedText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#121212',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
});

export default Map;