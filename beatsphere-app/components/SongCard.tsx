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
            <Text style={styles.title}>{track.name}</Text>
            <Text style={styles.artist}>{track.artist['#text']}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        // width: '100%',
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 8,
        // marginBottom: 8,
    },
    title: {
        fontSize: 16,
        // fontWeight: 'bold',
        fontFamily: 'AvenirNextLTPro-Bold',
        marginBottom: 4,
    },
    artist: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
        fontFamily: 'AvenirNextLTPro-Regular',
    },
});

export default SongCard;