// components/SongCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export interface LastFmTrack {
    name: string;
    artist: { '#text': string; };
    image: { '#text': string; size: string; }[];
    '@attr'?: { nowplaying: string; };
}

const SongCard = ({ track }: { track: LastFmTrack }) => {
    const imageUrl = track.image.find(img => img.size === 'extralarge')?.['#text'];
    const isPlaying = track['@attr']?.nowplaying === 'true';

    return (
        <View style={styles.card}>
            <Image source={{ uri: imageUrl }} style={styles.image} cachePolicy="disk" transition={300} />
            <View style={styles.textContainer}>
                {isPlaying && <Text style={styles.nowPlayingText}>NOW PLAYING</Text>}
                <Text style={styles.title} numberOfLines={1}>{track.name}</Text>
                <Text style={styles.artist} numberOfLines={1}>{track.artist['#text']}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#212121',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    textContainer: { flex: 1 },
    nowPlayingText: {
        fontSize: 12,
        color: '#D92323',
        fontFamily: 'AvenirNextLTPro-Bold',
        marginBottom: 2,
    },
    title: {
        fontSize: 16,
        fontFamily: 'AvenirNextLTPro-Bold',
        color: '#FFFFFF',
    },
    artist: {
        fontSize: 14,
        fontFamily: 'AvenirNextLTPro-Regular',
        color: '#A0A0A0',
        marginTop: 2,
    },
});

export default SongCard;

