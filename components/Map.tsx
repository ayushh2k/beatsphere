import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import mapStyle from '../utils/mapStyle.json';
import * as SecureStore from 'expo-secure-store';
import CustomMarker from './CustomMarker';

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string; // Make imageUrl optional
}

const backendUrl = 'http://192.168.15.200:3000'; // Externalize this

const Map = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setLocationPermissionDenied(true);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch user ID and image URL from SecureStore
      const storedUserId = await SecureStore.getItemAsync('lastfm_username');
      const storedUserImage = await SecureStore.getItemAsync('lastfm_user_image');

      if (storedUserId) {
        setUserId(storedUserId);
      }

      setUserLocation({
        id: storedUserId || 'currentUser',
        name: 'You',
        latitude,
        longitude,
        imageUrl: storedUserImage || '', // Set the image URL here
      });

      // Send user location to the backend
      try {
        await axios.post(`${backendUrl}/api/location`, {
          id: storedUserId || 'currentUser',
          latitude,
          longitude,
          imageUrl: storedUserImage || '', // Include image URL in the request
        });

        // Fetch other users' locations
        const response = await axios.get(`${backendUrl}/api/locations`);
        setOtherUsers(response.data);
      } catch (error) {
        console.error('Error fetching or sending location data:', error);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    const watchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setLocationPermissionDenied(true);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;

          // Fetch user ID and image URL from SecureStore
          const storedUserId = await SecureStore.getItemAsync('lastfm_username');
          const storedUserImage = await SecureStore.getItemAsync('lastfm_user_image');

          if (storedUserId) {
            setUserId(storedUserId);
          }

          setUserLocation({
            id: storedUserId || 'currentUser',
            name: 'You',
            latitude,
            longitude,
            imageUrl: storedUserImage || '', // Set the image URL here
          });

          // Send updated location to the backend
          try {
            await axios.post(`${backendUrl}/api/location`, {
              id: storedUserId || 'currentUser',
              latitude,
              longitude,
              imageUrl: storedUserImage || '', // Include image URL in the request
            });

            // Fetch updated other users' locations
            const response = await axios.get(`${backendUrl}/api/locations`);
            setOtherUsers(response.data);
          } catch (error) {
            console.error('Error fetching or sending location data:', error);
          }
        }
      );

      return () => {
        subscription.remove();
      };
    };

    watchLocation();
  }, []);

  if (locationPermissionDenied) {
    return (
      <View style={styles.container}>
        <Text>Location permission denied. Please enable location services.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
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
        {userLocation && (
          <CustomMarker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title={userLocation.name}
            imageUrl={userLocation.imageUrl}
          />
        )}
        {otherUsers.map((user) => (
          <CustomMarker
            key={user.id}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            title={user.name}
            imageUrl={user.imageUrl}
          />
        ))}
      </MapView>
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
});

export default Map;