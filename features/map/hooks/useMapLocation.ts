/**
 * Hook for managing user's current location with permissions.
 * Handles location permission requests and position watching.
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export function useMapLocation() {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const latestLocationRef = useRef<Location.LocationObject | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      latestLocationRef.current = initialLocation;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // Update every minute
          distanceInterval: 100, // Or every 100 meters
        },
        (location) => {
          latestLocationRef.current = location;
        }
      );
    };

    initialize();
  }, []);

  return {
    permissionDenied,
    latestLocationRef,
  };
}
