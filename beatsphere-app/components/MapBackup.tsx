// components/Map.tsx

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapCluster from 'react-native-map-clustering';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import EventSource from 'react-native-event-source';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentlyPlayingTrack } from '../utils/lastFmHelpers';
import mapStyle from '../utils/mapStyle.json';
import CustomMarker from './CustomMarker';
import UserCard from './UserCard';

// const BACKEND_URL = 'https://beatsphere-backend.onrender.com';
const BACKEND_URL = 'http://192.168.1.6:3000';


interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  currentlyPlaying?: any;
  username?: string;
}

const MapViewComponent = () => {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [otherUsers, setOtherUsers] = useState<UserLocation[]>([]);
    const [permissionDenied, setPermissionDenied] = useState(false);
    
    const [selectedCluster, setSelectedCluster] = useState<UserLocation[] | null>(null);
    const snapPoints = useMemo(() => ['25%', '50%'], []);
    
    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    
    const isListeningRef = useRef(false);
    const latestLocationRef = useRef<Location.LocationObject | null>(null);
    
    const checkListeningStatus = useCallback(async () => {
        if (!latestLocationRef.current) return;

        const { latitude, longitude } = latestLocationRef.current.coords;
        const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');
        const username = await SecureStore.getItemAsync('lastfm_username');
        
        if (!sessionKey || !username) return;

        const currentlyPlaying = await getCurrentlyPlayingTrack(process.env.EXPO_PUBLIC_LASTFM_KEY!, sessionKey, username);
        
        if (currentlyPlaying && !isListeningRef.current) {
            isListeningRef.current = true;
            const userImage = await SecureStore.getItemAsync('lastfm_user_image');
            const locationData = { id: username, name: username, latitude, longitude, imageUrl: userImage, currentlyPlaying, username };
            setUserLocation(locationData);
            axios.post(`${BACKEND_URL}/api/location`, locationData).catch(e => console.error(e));
        } else if (!currentlyPlaying && isListeningRef.current) {
            isListeningRef.current = false;
            setUserLocation(null);
            axios.delete(`${BACKEND_URL}/api/location/${username}`).catch(e => console.error(e));
        }
    }, []);

    const initializeSSE = useCallback(async () => {
        if (eventSourceRef.current) eventSourceRef.current.close();
        const username = await SecureStore.getItemAsync('lastfm_username');
        if (!username) return;

        const source = new EventSource(`${BACKEND_URL}/api/locations/stream`);
        source.addEventListener('message', (event) => {
            if (event.data) {
                try {
                    const locations: UserLocation[] = JSON.parse(event.data);
                    setOtherUsers(locations.filter(loc => loc.id !== username));
                } catch (e) { console.error("SSE parse error:", e); }
            }
        });
        eventSourceRef.current = source;
    }, []);

    useEffect(() => {
        const initialize = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionDenied(true);
                return;
            }

            const initialLocation = await Location.getCurrentPositionAsync({});
            latestLocationRef.current = initialLocation;

            Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 60000, distanceInterval: 100 }, 
                (location) => { latestLocationRef.current = location; }
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

    const handleRefresh = () => {
        checkListeningStatus();
    };
    
    const handleLocateMe = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    };
    
    const handleMarkerPress = (users: UserLocation[]) => {
        setSelectedCluster(users);
        bottomSheetRef.current?.expand();
    };

    if (permissionDenied) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>Location permission is required to use the map.</Text></View>;
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
                initialRegion={{ latitude: 40.7128, longitude: -74.0060, latitudeDelta: 25, longitudeDelta: 25 }}
                onClusterPress={(cluster, markers) => {
                    const users = markers
                        ?.map(marker => marker.properties?.user)
                        .filter((user): user is UserLocation => !!user);

                    if (users && users.length > 0) {
                        handleMarkerPress(users);
                    }
                    return true;
                }}
            >
                {userLocation && <CustomMarker 
                //@ts-ignore
                properties={{ user: userLocation }} coordinate={userLocation} onPress={() => handleMarkerPress([userLocation])} {...userLocation} />}
                {otherUsers.map(user => <CustomMarker key={user.id} 
                //@ts-ignore
                properties={{ user }} coordinate={user} onPress={() => handleMarkerPress([user])} {...user} />)}
            </MapCluster>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.fab} onPress={handleLocateMe} disabled={!userLocation}>
                    <Ionicons name="locate" size={24} color={!userLocation ? "#6E6E6E" : "#fff"} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* {selectedCluster && (
                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} onClose={() => setSelectedCluster(null)} backgroundStyle={styles.bottomSheet} handleIndicatorStyle={{ backgroundColor: '#4A4A4A' }}>
                    <BottomSheetFlatList data={selectedCluster} keyExtractor={(item) => item.id} renderItem={({ item }) => <UserCard user={item} />} contentContainerStyle={styles.bottomSheetContent} />
                </BottomSheet>
            )} */}
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  errorText: { color: '#A0A0A0', fontSize: 16, textAlign: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  buttonContainer: { position: 'absolute', bottom: 30, right: 20, alignItems: 'center' },
  fab: { backgroundColor: 'rgba(18, 18, 18, 0.9)', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, marginBottom: 10 },
  bottomSheet: { backgroundColor: '#181818' },
  bottomSheetContent: { padding: 16 },
});

export default MapViewComponent;

