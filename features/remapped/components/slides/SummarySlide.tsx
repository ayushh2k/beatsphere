// components/RemappedSummarySlide.tsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { cacheDirectory, deleteAsync, moveAsync } from 'expo-file-system/legacy';
import { RemappedStats } from '@/utils/remappedHelpers';

interface SummarySlideProps {
    stats: RemappedStats;
    onReplay: () => void;
}

const RemappedSummarySlide = ({ stats, onReplay }: SummarySlideProps) => {
    const summaryCardRef = useRef<View>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleShare = async () => {
        if (!summaryCardRef.current) return;

        setIsGenerating(true);
        try {
            const uri = await captureRef(summaryCardRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });

            // Rename file so user sees "remapped.png" instead of generic name
            const newUri = (cacheDirectory || '') + 'remapped.png';
            try {
                await deleteAsync(newUri, { idempotent: true });
            } catch (e) {
                console.log('File delete error (harmless):', e);
            }
            await moveAsync({ from: uri, to: newUri });

            Alert.alert(
                'Share Your Remapped',
                'How would you like to share?',
                [
                    {
                        text: 'Share to...',
                        onPress: async () => {
                            const isAvailable = await Sharing.isAvailableAsync();
                            if (isAvailable) {
                                await Sharing.shareAsync(newUri, {
                                    mimeType: 'image/png',
                                    dialogTitle: 'Share your 2025 Remapped',
                                    UTI: 'public.png', // Helps iOS
                                });
                            }
                        },
                    },
                    {
                        text: 'Save to Photos',
                        onPress: async () => {
                            const { status } = await MediaLibrary.requestPermissionsAsync();
                            if (status === 'granted') {
                                await MediaLibrary.saveToLibraryAsync(newUri);
                                Alert.alert('Saved!', 'Image saved to your photo library');
                            } else {
                                Alert.alert(
                                    'Permission Required',
                                    'BeatSphere needs access to your photo library to save your Remapped image.'
                                );
                            }
                        },
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        } catch (error) {
            console.error('Screenshot failed:', error);
            Alert.alert('Error', 'Failed to generate image');
        } finally {
            setIsGenerating(false);
        }
    };

    const heroImage = 
        stats.topArtists[0]?.image?.[3]?.['#text'] || 
        stats.topArtists[0]?.image?.[2]?.['#text'] || 
        stats.topAlbums[0]?.image?.[3]?.['#text'] || 
        stats.topTracks[0]?.image?.[3]?.['#text'] || 
        null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    delay={100}
                >
                    <View
                        ref={summaryCardRef}
                        collapsable={false}
                        style={styles.summaryCard}
                    >
                        {/* Hero Image - Top Artist */}
                        <View style={styles.heroContainer}>
                            {heroImage ? (
                                <Image
                                    source={{ uri: heroImage }}
                                    style={styles.heroImage}
                                    cachePolicy="disk"
                                />
                            ) : (
                                <View style={[styles.heroImage, { backgroundColor: '#212121', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="musical-notes" size={64} color="#333" />
                                </View>
                            )}
                            <LinearGradient
                                colors={['rgba(18,18,18,0)', 'rgba(18,18,18,1)']}
                                style={styles.gradient}
                            />
                        </View>

                        {/* Content */}
                        <View style={styles.cardContent}>
                            {/* Badge */}
                            <View style={styles.badge}>
                                <Image
                                    source={require('../../../../assets/images/logo.jpg')}
                                    style={styles.badgeLogo}
                                    contentFit="cover"
                                />
                                <Text style={styles.badgeText}>REMAPPED 2025</Text>
                            </View>

                            {/* Top Artist */}
                            <Text style={styles.topArtistName} numberOfLines={1}>
                                {stats.topArtists[0]?.name || 'Your Music'}
                            </Text>
                            <Text style={styles.topArtistLabel}>Top Artist</Text>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{stats.totalMinutes}</Text>
                                    <Text style={styles.statLabel}>Minutes</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{stats.topGenre}</Text>
                                    <Text style={styles.statLabel}>Top Genre</Text>
                                </View>
                            </View>

                            {/* Lists */}
                            <View style={styles.listsContainer}>
                                <View style={styles.listColumn}>
                                    <Text style={styles.listTitle}>Top Artists</Text>
                                    {stats.topArtists.slice(0, 5).map((artist, i) => (
                                        <Text key={i} style={styles.listItem} numberOfLines={1}>
                                            {i + 1}. {artist.name}
                                        </Text>
                                    ))}
                                </View>
                                <View style={styles.listColumn}>
                                    <Text style={styles.listTitle}>Top Tracks</Text>
                                    {stats.topTracks.slice(0, 5).map((track, i) => (
                                        <Text key={i} style={styles.listItem} numberOfLines={1}>
                                            {i + 1}. {track.name}
                                        </Text>
                                    ))}
                                </View>
                            </View>

                            {/* Footer */}
                            <Text style={styles.footer}>BeatSphere • Remapped 2025</Text>
                        </View>
                    </View>
                </MotiView>

                {/* Action Buttons */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={400}
                    style={styles.actionsContainer}
                >
                    <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={handleShare}
                        disabled={isGenerating}
                    >
                        <Ionicons name="share-social" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>
                            {isGenerating ? 'Generating...' : 'Share'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={onReplay}>
                        <Ionicons name="refresh" size={20} color="#D92323" />
                        <Text style={[styles.actionButtonText, { color: '#D92323' }]}>Replay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
                        <Ionicons name="map" size={20} color="#A0A0A0" />
                        <Text style={[styles.actionButtonText, { color: '#A0A0A0' }]}>Back to Map</Text>
                    </TouchableOpacity>
                </MotiView>
                
                {/* Spacer for bottom indicator */}
                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Scroll Indicator */}
            <MotiView
                from={{ opacity: 0.6, translateY: 0 }}
                animate={{ opacity: 1, translateY: 8 }}
                transition={{
                    type: 'timing',
                    duration: 1000,
                    loop: true,
                    repeatReverse: true,
                    easing: Easing.inOut(Easing.ease)
                }}
                style={styles.scrollIndicator}
            >
                <Text style={styles.scrollText}>Scroll to Share</Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    summaryCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        overflow: 'hidden',
    },
    heroContainer: {
        height: 200,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    cardContent: {
        padding: 20,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#D92323',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeLogo: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    badgeText: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 12,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    topArtistName: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 28,
        color: '#FFFFFF',
    },
    topArtistLabel: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 14,
        color: '#A0A0A0',
        marginTop: 4,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#212121',
        padding: 16,
        borderRadius: 12,
    },
    statValue: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    statLabel: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 4,
    },
    listsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    listColumn: {
        flex: 1,
    },
    listTitle: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 12,
    },
    listItem: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 12,
        color: '#A0A0A0',
        marginBottom: 8,
    },
    footer: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    actionsContainer: {
        marginTop: 30,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#212121',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    shareButton: {
        backgroundColor: '#D92323',
    },
    actionButtonText: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    scrollIndicator: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 20,
        pointerEvents: 'none',
    },
    scrollText: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 12,
        color: '#FFFFFF',
        marginTop: 4,
        opacity: 0.8,
    },
});

export default RemappedSummarySlide;
