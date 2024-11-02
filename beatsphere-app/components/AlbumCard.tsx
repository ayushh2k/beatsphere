// components/AlbumCard.tsx

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface LastFmAlbum {
  name: string;
  artist: {
    name: string;
  };
  image: {
    '#text': string;
    size: string;
  }[];
  playcount: string;
}

interface AlbumCardProps {
  album: LastFmAlbum;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const image = album.image.find(img => img.size === 'extralarge') || album.image.find(img => img.size === 'large') || album.image.find(img => img.size === 'medium') || album.image.find(img => img.size === 'small');

  const fallbackImage = 'https://example.com/fallback-image.png';

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: image ? image['#text'] : fallbackImage }}
        style={styles.image}
        onError={(error) => console.error('Image load error:', error)}
      />
      <Text style={styles.name}>{album.name}</Text>
      <Text style={styles.artist}>{album.artist.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: 150,
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 100,
    alignContent: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Bold',
  },
  artist: {
    fontSize: 14,
    color: '#555',
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: 'AvenirNextLTPro-Regular',
  },
});

export default AlbumCard;