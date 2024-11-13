// components/CustomMarker.tsx

import { router } from 'expo-router';
import React from 'react';
import { View, Image, StyleSheet, Text, Linking } from 'react-native';
import { Marker, Callout, CalloutPressEvent } from 'react-native-maps';
import { Svg, Image as ImageSvg } from 'react-native-svg';

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
  const fallbackImage = 'https://placehold.co/20x30'; // Fallback image URL

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

  function handleCalloutPress(event: CalloutPressEvent): void {
    router.push("/chat");
  }

  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.markerContainer}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.markerImage} />
        )}
      </View>
      <Callout onPress={handleCalloutPress}>
        {/* <View style={styles.calloutContainer}> */}
          <Text style={styles.calloutTitle}>{username}</Text>
          {currentlyPlaying ? (
            <>
              <Text style={styles.calloutSubtitle}>
                {currentlyPlaying.name}
              </Text>
              <Text style={styles.calloutSubtitle}>
                {currentlyPlaying.artist['#text']}
              </Text>
              <Svg width={180} height={110}>
                <ImageSvg
                  href={{ uri: extralargeImageUrl }}
                  width={'100%'}
                  height={'100%'}
                  preserveAspectRatio="xMidYMid slice"
                />
              </Svg>
              <Text style={styles.calloutLink}>
                Tap to chat
              </Text>
            </>
          ) : (
            <Text>No track is currently playing</Text>
          )}
        {/* </View> */}
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 100,
    height: 100,
    // borderRadius: 20,
    // backgroundColor: 'white',
    // justifyContent: 'center',
    // alignItems: 'center',
    // borderWidth: 2,
    // borderColor: '#f4511e',
    // overflow: 'hidden',
  },
  markerImage: {
    width: 35,
    height: 35,
    // borderRadius: 17,
  },
  calloutContainer: {
    width: 200,
    height: 100,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10, // Add margin to avoid clipping
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 10,
  },
  calloutLink: {
    color: '#f4511e', // Customize the link color
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
});

export default CustomMarker;