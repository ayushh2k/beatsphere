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
  const fallbackImage = 'https://placehold.co/50';

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
    router.push("/chat")
  }

  return (
    <Marker coordinate={coordinate} title={title}>
      {/* <View style={styles.markerContainer}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.markerImage} resizeMode='cover'/>
        )}
      </View> */}
      {/* <Callout  onPress={handleCalloutPress}>
        <View style={styles.calloutContainer}>
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
                // style={styles.calloutImage}
                />
              </Svg>
              <Text style={styles.calloutLink}>
                Tap to chat
              </Text>
            </>
          ) : (
            <Text>No track is currently playing</Text>
          )}
        </View>
      </Callout> */}
      {/* <Callout > 
        <Text>Hii</Text>
      </Callout> */}
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
    width: 35,
    height: 35,
    borderRadius: 17
  },
  calloutContainer: {
    width: 200,
    height: 700,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 0,
    textAlign: 'center',
  },
  calloutSubtitle: {
    fontSize: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  calloutImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginBottom: 10,
  },
  calloutLink: {
    color: 'blue',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 10,
  },
});

export default CustomMarker;