// app/(tabs)/map.tsx

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Map from '../../components/Map';

const MapScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Map />
    </SafeAreaView>
  );
};

export default MapScreen;