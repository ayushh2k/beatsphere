// components/GifMessage.tsx
import React, { useState, useEffect } from 'react';
import { Image as RNImage, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface GifMessageProps {
  uri: string;
}

export default function GifMessage({ uri }: GifMessageProps) {
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (uri) {
      RNImage.getSize(uri, (width, height) => {
        if (height > 0) {
          setAspectRatio(width / height);
        }
      }, (error) => {
        console.error(`Failed to get GIF size for ${uri}:`, error);
      });
    }
  }, [uri]);

  return (
    <ExpoImage 
      source={{ uri }}
      style={[styles.gifImage, { aspectRatio }]} 
      contentFit="contain" 
    />
  );
}

const styles = StyleSheet.create({
  gifImage: {
    width: 250, 
    borderRadius: 12,
  },
});