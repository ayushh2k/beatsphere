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
    if (lastfmProfileUrl) {
      handleOpenURL(lastfmProfileUrl);
    }
  }

  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={styles.markerContainer}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.markerImage} resizeMode='cover'/>
        )}
      </View>
      <Callout onPress={handleCalloutPress}>
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
              <Svg style={styles.calloutImage} width={180} height={125}>
                <ImageSvg
                  href={{ uri: extralargeImageUrl }}
                  width={'100%'}
                  height={'100%'}
                  preserveAspectRatio="xMidYMid slice"
                />
              </Svg>
              <Text style={styles.calloutLink}>
                Go to profile
              </Text>
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
  calloutStyle: {
    color: 'red',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#D92323',
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 22.5,
  },
  calloutImage: {
    borderRadius: 20
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    backgroundColor: '#121212',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#ffff',
  },
  calloutSubtitle: {
    fontSize: 12,
    fontFamily: 'AvenirNextLTPro-Bold',
    marginBottom: 2,
    textAlign: 'center',
    color: '#cccccc',
  },
  calloutLink: {
    color: '#D92323',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
    // fontWeight: 'bold',
    fontFamily: 'AvenirNextLTPro-Bold',
    // textDecorationLine: 'underline',
  },
});

export default CustomMarker;