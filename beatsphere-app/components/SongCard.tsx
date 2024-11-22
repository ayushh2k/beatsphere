// components/SongCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface LastFmTrack {
    name: string;
    artist: {
        '#text': string;
    };
    album?: {
        '#text': string;
    };
    image: {
        '#text': string;
        size: string;
    }[];
    '@attr'?: {
        nowplaying: string;
    };
}

interface SongCardProps {
    track: LastFmTrack;
}

const SongCard: React.FC<SongCardProps> = ({ track }) => {
    const image = track.image.find(img => img.size === 'extralarge');
    const isCurrentlyPlaying = track['@attr']?.nowplaying === 'true';

    return (
        <View style={styles.card}>
            {image ? (
                <Image
                    source={{ uri: image['#text'] }}
                    style={styles.image}
                />
            ) : (
                <Text>No image available</Text>
            )}
            <View style={styles.textContainer}>
                {isCurrentlyPlaying && <Text style={styles.currentlyPlaying}>Currently Playing</Text>}
                <Text style={styles.title}>{track.name}</Text>
                <Text style={styles.artist}>{track.artist['#text']}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#262626',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    currentlyPlaying: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        fontFamily: 'AvenirNextLTPro-Regular',
    },
    title: {
        fontSize: 18,
        fontFamily: 'AvenirNextLTPro-Bold',
        marginBottom: 4,
        color: '#ffffff',
    },
    artist: {
        fontSize: 16,
        color: '#808080',
        fontFamily: 'AvenirNextLTPro-Bold',
    },
});

export default SongCard;