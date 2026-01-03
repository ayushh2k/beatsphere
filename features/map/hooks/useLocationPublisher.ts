/**
 * Hook for publishing user's location when actively listening.
 * Checks Last.fm listening status and updates backend with current location.
 */

import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { getListeningStatus } from '@/lib/lastfm';
import api from '@/utils/api';
import { STORAGE_KEYS } from '@/config/constants';
import type { UserLocation } from '../types';

interface UseLocationPublisherProps {
  latestLocationRef: MutableRefObject<Location.LocationObject | null>;
}

export function useLocationPublisher({ latestLocationRef }: UseLocationPublisherProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const isListeningRef = useRef(false);

  const checkListeningStatus = useCallback(async () => {
    if (!latestLocationRef.current) return;

    const { latitude, longitude } = latestLocationRef.current.coords;
    const sessionKey = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_SESSION);
    const username = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USERNAME);

    if (!sessionKey || !username) return;

    const listeningStatusResult = await getListeningStatus(username);

    if (listeningStatusResult) {
      isListeningRef.current = true;
      const userImage = await SecureStore.getItemAsync(STORAGE_KEYS.LASTFM_USER_IMAGE);

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
      api
        .patch(`/users/${username}/location`, {
          lat: latitude,
          lon: longitude,
          status: listeningStatusResult.status,
          imageUrl: userImage,
          currentlyPlaying: listeningStatusResult.track,
        })
        .then((response) => {
          const generalizedLocation = response.data;
          generalizedLocation.username = generalizedLocation.name;
          setUserLocation(response.data);
        })
        .catch((e) => console.error('Error updating location:', e.response?.data || e.message));
    } else {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setUserLocation(null);
        // Backend handles cleanup
      }
    }
  }, [latestLocationRef]);

  useEffect(() => {
    checkListeningStatus();

    const interval = setInterval(checkListeningStatus, 20000); // Check every 20 seconds

    return () => {
      clearInterval(interval);
    };
  }, [checkListeningStatus]);

  return {
    userLocation,
    checkListeningStatus,
  };
}
