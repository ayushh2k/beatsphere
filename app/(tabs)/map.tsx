// app/(tabs)/map.tsx

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

import MapViewComponent from '@/components/Map';
import LocationConsentModal from '@/components/LocationConsentModal';

const LOCATION_CONSENT_KEY = 'has_accepted_location_terms';

const MapScreen = () => {
  const [consentStatus, setConsentStatus] = React.useState<boolean | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const checkConsent = async () => {
        const hasConsented = await AsyncStorage.getItem(LOCATION_CONSENT_KEY);
        setConsentStatus(hasConsented === 'true');
      };
      checkConsent();
    }, [])
  );

  const handleAcceptConsent = async () => {
    await AsyncStorage.setItem(LOCATION_CONSENT_KEY, 'true');
    setConsentStatus(true);
  };

  const handleDeclineConsent = () => {
      router.replace('/(tabs)/home');
  };

  if (consentStatus === null) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#D92323" /></View>;
  }

  if (consentStatus === false) {
    return <LocationConsentModal visible={true} onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />;
  }

  return consentStatus === true ? <MapViewComponent /> : null;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

export default MapScreen;

