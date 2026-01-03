// components/RemappedArtistsSlide.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LastFmItem } from '../utils/remappedHelpers';

interface ArtistsSlideProps {
    artists: LastFmItem[];
}

const RemappedArtistsSlide = ({ artists }: ArtistsSlideProps) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.header}
            >
                <LinearGradient
                    colors={['#D51007', '#EA580C']}
                    style={styles.iconBadge}
                >
                    <Ionicons name="mic" size={32} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.subtitle}>YOUR OBSESSIONS</Text>
                <Text style={styles.title}>Top Artists</Text>
            </MotiView>

            {/* List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {artists.slice(0, 5).map((artist, index) => (
                    <MotiView
                        key={artist.name}
                        from={{ translateX: -50, opacity: 0 }}
                        animate={{ translateX: 0, opacity: 1 }}
                        delay={index * 150}
                        transition={{ 
                            type: 'timing', 
                            duration: 600,
                            easing: Easing.out(Easing.quad)
                        }}
                    >
                        <LinearGradient
                            colors={['#1A1A1A', '#151515']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.listItem}
                        >
                            {/* Rank */}
                            {index === 0 ? (
                                <LinearGradient
                                    colors={['#D51007', '#EA580C']}
                                    style={styles.rankBadge}
                                >
                                    <Text style={styles.rankTextFirst}>{index + 1}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.rankBadgeGray}>
                                    <Text style={styles.rankTextGray}>{index + 1}</Text>
                                </View>
                            )}

                            {/* Image */}
                            <ArtistImage image={artist.image?.[2]?.['#text']} />

                            {/* Info */}
                            <View style={styles.artistInfo}>
                                <Text style={styles.artistName} numberOfLines={1}>
                                    {artist.name}
                                </Text>
                                <Text style={styles.playcount}>
                                    {parseInt(artist.playcount || '0').toLocaleString()} plays
                                </Text>
                            </View>
                        </LinearGradient>
                    </MotiView>
                ))}
            </ScrollView>
        </View>
    );
};

const ArtistImage = ({ image }: { image?: string }) => {
    const [imageError, setImageError] = useState(false);

    if (!image || imageError) {
        return (
            <View style={styles.placeholderImage}>
                <Ionicons name="mic" size={28} color="#4B5563" />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: image }}
            style={styles.artistImage}
            cachePolicy="disk"
            transition={300}
            onError={() => setImageError(true)}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#D51007',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    subtitle: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 10,
        color: '#D51007',
        letterSpacing: 3,
        marginBottom: 4,
    },
    title: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 36,
        color: '#FFFFFF',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(75, 85, 99, 0.3)',
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankBadgeGray: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(75, 85, 99, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankTextFirst: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    rankTextGray: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#6B7280',
    },
    artistImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(107, 114, 128, 0.3)',
    },
    placeholderImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(107, 114, 128, 0.3)',
    },
    artistInfo: {
        flex: 1,
    },
    artistName: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    playcount: {
        fontFamily: 'AvenirNextLTPro-Medium',
        fontSize: 13,
        color: '#A0A0A0',
        marginTop: 4,
    },
});

export default RemappedArtistsSlide;
