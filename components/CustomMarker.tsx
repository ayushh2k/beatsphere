// components/CustomMarker.tsx

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Marker } from 'react-native-maps';

interface CustomMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  imageUrl?: string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ coordinate, title, imageUrl }) => {
  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.markerContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.markerImage} />
        ) : (
          <View style={styles.defaultMarker} />
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  defaultMarker: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    borderRadius: 20,
  },
});

export default CustomMarker;