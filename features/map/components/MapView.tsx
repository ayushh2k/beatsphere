/**
 * Main map view orchestrator component.
 * Coordinates map rendering, user locations, and bottom sheets.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import analytics from '@/utils/analytics';
import mapStyle from '../utils/mapStyle.json';
import CustomMarker from './CustomMarker';
import MapControls from './MapControls';
import UserListBottomSheet from './UserListBottomSheet';
import UserDetailBottomSheet from './UserDetailBottomSheet';
import { useMapLocation, useUserStream, useLocationPublisher } from '../hooks';
import type { UserLocation, SheetMode } from '../types';

export default function MapViewComponent() {
  // --- Hooks ---
  const { permissionDenied, latestLocationRef } = useMapLocation();
  const { otherUsers } = useUserStream();
  const { userLocation, checkListeningStatus } = useLocationPublisher({ latestLocationRef });

  // --- State Management ---
  const [visibleUsers, setVisibleUsers] = useState<UserLocation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [bottomSheetTitle, setBottomSheetTitle] = useState('Listeners Nearby');
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [sheetMode, setSheetMode] = useState<SheetMode>('list');

  // --- Refs ---
  const mapRef = useRef<MapView>(null);
  const listBottomSheetRef = useRef<BottomSheet>(null);
  const detailBottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '80%'], []);
  const lastPressTime = useRef(0);

  // --- Image Prefetching ---
  useEffect(() => {
    const imageUrls = otherUsers.flatMap((user) => {
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
      imageUrls.forEach((url) => Image.prefetch(url));
    }
  }, [otherUsers]);

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
  const handleRegionChange = useCallback(
    (region: Region) => {
      const visible = otherUsers.filter(
        (user) =>
          user.latitude > region.latitude - region.latitudeDelta / 2 &&
          user.latitude < region.latitude + region.latitudeDelta / 2 &&
          user.longitude > region.longitude - region.longitudeDelta / 2 &&
          user.longitude < region.longitude + region.longitudeDelta / 2
      );
      setVisibleUsers(visible);
    },
    [otherUsers]
  );

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
    setSelectedUser(null);
    detailBottomSheetRef.current?.close();
    listBottomSheetRef.current?.expand();
  }, [visibleUsers]);

  const flyToUser = useCallback((user: UserLocation) => {
    analytics.trackMapInteraction('fly_to_user', { target_user: user.username });
    listBottomSheetRef.current?.close();
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

  const onMarkerPress = useCallback((user: UserLocation) => {
    const now = Date.now();
    if (now - lastPressTime.current > 500) {
      lastPressTime.current = now;
      setSelectedUser(user);
      setSheetMode('detail');
      listBottomSheetRef.current?.close();
      detailBottomSheetRef.current?.expand();
    }
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedUser(null);
    listBottomSheetRef.current?.close();
    detailBottomSheetRef.current?.close();
  }, []);

  const handleDetailClose = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // --- Map Component ---
  const mapComponent = useMemo(
    () => (
      <MapView
        ref={mapRef}
        style={styles.map}
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
    ),
    [
      jitteredUsers,
      userLocation,
      tracksViewChanges,
      handleRegionChange,
      handleMapPress,
      onMarkerPress,
    ]
  );

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

      <MapControls
        visibleUsers={visibleUsers}
        userLocation={userLocation}
        onOpenUserList={openUserList}
        onLocateMe={handleLocateMe}
        onRefresh={handleRefresh}
      />

      <UserListBottomSheet
        ref={listBottomSheetRef}
        visibleUsers={visibleUsers}
        snapPoints={snapPoints}
        title={bottomSheetTitle}
        onFlyToUser={flyToUser}
      />

      <UserDetailBottomSheet
        ref={detailBottomSheetRef}
        selectedUser={selectedUser}
        snapPoints={snapPoints}
        onClose={handleDetailClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: { color: '#A0A0A0', fontSize: 16, textAlign: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
});
