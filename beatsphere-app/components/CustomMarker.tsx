// components/CustomMarker.tsx

import React from 'react';
import { View, Image, StyleSheet, Text, Linking } from 'react-native';
import { Marker, Callout } from 'react-native-maps';

interface CustomMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  imageUrl?: string;
  currentlyPlaying?: {
    name: string;
    artist: {
      '#text': string;
    };
    album: {
      '#text': string;
    };
    image: {
      '#text': string;
      size: string;
    }[];
  } | null;
  lastfmProfileUrl?: string;
  username?: string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({
  coordinate,
  title,
  imageUrl,
  currentlyPlaying,
  lastfmProfileUrl,
  username,
}) => {
  const fallbackImage = 'https://via.placeholder.com/100'; // Fallback image URL

  // Extract the extralarge image URL
  const extralargeImageUrl = currentlyPlaying?.image.find(img => img.size === 'extralarge')?.['#text'] || fallbackImage;

  const handleOpenURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    } else {
      console.error('Cannot open URL:', url);
    }
  };

  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.markerContainer}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.markerImage} />
        )}
      </View>
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{username}</Text>
          {currentlyPlaying ? (
            <>
              <Text style={styles.calloutSubtitle}>
                Currently Playing: {currentlyPlaying.name}
              </Text>
              <Text style={styles.calloutSubtitle}>
                By: {currentlyPlaying.artist['#text']}
              </Text>
              <Image
                source={{ uri: extralargeImageUrl }}
                style={styles.calloutImage}
                onError={(e) => {
                  console.error('Image load error:', e);
                  // Use fallback image on error
                  // e.currentTarget.source = { uri: fallbackImage };
                }}
              />
              {lastfmProfileUrl && (
                <Text
                  style={styles.calloutLink}
                  onPress={() => handleOpenURL(lastfmProfileUrl)}
                >
                  View on Last.fm
                </Text>
              )}
            </>
          ) : (
            <Text>No track is currently playing</Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutSubtitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  calloutImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 10,
  },
  calloutLink: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default CustomMarker;