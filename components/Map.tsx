// components/Map.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const Map = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);

  useEffect(() => {
    const fetchUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({
        id: 'currentUser',
        name: 'You',
        latitude,
        longitude,
      });

      // Send user location to the backend
      await axios.post('http://localhost:3000/api/location', {
        latitude,
        longitude,
      });

      // Fetch other users' locations
      const response = await axios.get('http://localhost:3000/api/locations');
      setOtherUsers(response.data);
    };

    fetchUserLocation();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 37.78825,
          longitude: userLocation?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title={userLocation.name}
          />
        )}
        {otherUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            title={user.name}
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