// components/AlbumCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface LastFmAlbum {
    name: string;
    artist: { name: string; };
    image: { '#text': string; size: string; }[];
}

const AlbumCard = ({ album }: { album: LastFmAlbum }) => {
    const imageUrl = album.image.find(img => img.size === 'extralarge')?.['#text'];

    return (
        <View style={styles.card}>
            <Image source={{ uri: imageUrl }} style={styles.image} cachePolicy="disk" transition={300} />
            <Text style={styles.name} numberOfLines={1}>{album.name}</Text>
            <Text style={styles.artist} numberOfLines={1}>{album.artist.name}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#212121',
        borderRadius: 12,
        padding: 12,
        marginLeft: 20,
        width: 150,
        alignItems: 'flex-start',
    },
    image: { width: '100%', height: 126, borderRadius: 8, marginBottom: 10 },
    name: {
        fontSize: 14,
        fontFamily: 'AvenirNextLTPro-Bold',
        color: '#FFFFFF',
    },
    artist: {
        fontSize: 12,
        fontFamily: 'AvenirNextLTPro-Bold',
        color: '#A0A0A0',
        marginTop: 2,
    },
});

export default AlbumCard;

