// components/Map.tsx

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, AppState, AppStateStatus } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomMarker from './CustomMarker';
import MapCluster from 'react-native-map-clustering';
import axios from 'axios';
import mapStyle from '../utils/mapStyle.json';
import EventSource from 'react-native-event-source'; // Use react-native-event-source
import { getUserInfo, getCurrentlyPlayingTrack } from '../utils/lastFmHelpers';

const BACKEND_URL = 'http://192.168.115.201:3000'; // Your backend URL

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null; // Allow null
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
}

const Map = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const mapRef = useRef(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Initialize SSE connection
  const initializeSSE = async () => {
    const userId = await SecureStore.getItemAsync('lastfm_username');
    if (!userId) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const eventSource = new EventSource(`${BACKEND_URL}/api/locations/stream`);

    eventSource.addEventListener('message', (event) => {
      if (event.data) {
        const locations: UserLocation[] = JSON.parse(event.data);
        setOtherUsers(locations.filter(location => 
          location.id !== userId && location.currentlyPlaying
        ));
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setTimeout(initializeSSE, 5000);
    });

    eventSourceRef.current = eventSource;
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
        initializeSSE();
        startLocationWatch();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to background
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        if (locationWatchRef.current) {
          locationWatchRef.current.remove();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Start watching location
  const startLocationWatch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        return;
      }
  
      const userId = await SecureStore.getItemAsync('lastfm_username');
      const userImage = await SecureStore.getItemAsync('lastfm_user_image');
      const lastfmProfileUrl = await AsyncStorage.getItem('lastfm_profile_url');
  
      if (!userId) {
        console.error('User ID is null');
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
          if (!sessionKey) {
            console.error('Session key is null');
            return;
          }
  
          const currentlyPlaying = await getCurrentlyPlayingTrack(process.env.EXPO_PUBLIC_LASTFM_KEY!, sessionKey, userId);
          const userInfo = await getUserInfo(process.env.EXPO_PUBLIC_LASTFM_KEY!, sessionKey);
  
          const locationData = {
            id: userId,
            name: userId,
            latitude,
            longitude,
            imageUrl: userImage || undefined,
            currentlyPlaying: currentlyPlaying,
            lastfmProfileUrl: lastfmProfileUrl || undefined,
            username: userInfo.name,
          };
  
          setUserLocation(locationData);
  
          if (currentlyPlaying) {
            try {
              await axios.post(`${BACKEND_URL}/api/location`, locationData);
            } catch (error) {
              console.error('Failed to update location:', error);
            }
          }
        }
      );
    } catch (error) {
      console.error('Error starting location watch:', error);
    }
  };

  // Listen for changes in currently playing track
  useEffect(() => {
    const checkCurrentlyPlaying = async () => {
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
      const userId = await SecureStore.getItemAsync('lastfm_username');
      if (!sessionKey || !userId) {
        console.error('Session key or user ID is null');
        return;
      }

      const currentlyPlaying = await getCurrentlyPlayingTrack(process.env.EXPO_PUBLIC_LASTFM_KEY!, sessionKey, userId);
      if (userLocation) {
        setUserLocation(prev => ({
          ...prev!,
          currentlyPlaying: currentlyPlaying,
        }));
      }
    };

    const interval = setInterval(checkCurrentlyPlaying, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userLocation]);

  // Initialize everything
  useEffect(() => {
    initializeSSE();
    startLocationWatch();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  if (locationPermissionDenied) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionDeniedText}>Location permission denied. Please enable location services.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapCluster
        ref={mapRef}
        style={styles.map}
        customMapStyle={mapStyle}
        showsCompass={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: userLocation?.latitude || 12.9244,
          longitude: userLocation?.longitude || 79.1353,
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
            // @ts-ignore
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
            // @ts-ignore
            imageUrl={user.imageUrl}
            currentlyPlaying={user.currentlyPlaying}
            lastfmProfileUrl={`https://www.last.fm/user/${user.id}`}
            username={user.name}
          />
        ))}
      </MapCluster>
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
});

export default Map;