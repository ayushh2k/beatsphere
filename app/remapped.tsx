// app/remapped.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { getRemappedStats, RemappedStats } from '../utils/remappedHelpers';
import { audioManager } from '../utils/audioManager';
import RemappedLoadingScreen from '../components/RemappedLoadingScreen';
import RemappedProgressBar from '../components/RemappedProgressBar';
import RemappedIntroSlide from '../components/RemappedIntroSlide';
import RemappedMinutesSlide from '../components/RemappedMinutesSlide';
import RemappedGenreSlide from '../components/RemappedGenreSlide';
import RemappedArtistsSlide from '../components/RemappedArtistsSlide';
import RemappedTracksSlide from '../components/RemappedTracksSlide';
import RemappedAlbumsSlide from '../components/RemappedAlbumsSlide';
import RemappedSummarySlide from '../components/RemappedSummarySlide';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ErrorType = 'unauthenticated' | 'insufficient_data' | 'failed' | null;

export default function RemappedScreen() {
    const [stats, setStats] = useState<RemappedStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ErrorType>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const autoProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize audio on mount
    useEffect(() => {
        audioManager.initialize();
        return () => {
            audioManager.stop();
        };
    }, []);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const username = await SecureStore.getItemAsync('lastfm_username');
            if (!username) {
                setError('unauthenticated');
                setLoading(false);
                return;
            }

            const data = await getRemappedStats(username);

            // Validate minimum data requirements
            const hasMinimalData =
                data.topArtists.length >= 1 &&
                data.topTracks.length >= 1 &&
                data.totalMinutes !== '0';

            if (!hasMinimalData) {
                setError('insufficient_data');
                setLoading(false);
                return;
            }

            setStats(data);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to load remapped data:', err);
            setError('failed');
            setLoading(false);
        }
    };

    // Auto-progress timer
    useEffect(() => {
        if (currentSlide === 0 || !stats) return; // Don't auto-progress on intro

        autoProgressTimerRef.current = setTimeout(() => {
            if (currentSlide < 6) {
                goToSlide(currentSlide + 1);
            }
        }, 8000);

        return () => {
            if (autoProgressTimerRef.current) {
                clearTimeout(autoProgressTimerRef.current);
            }
        };
    }, [currentSlide, stats]);

    // Audio playback logic per slide
    useEffect(() => {
        if (!stats) return;

        const playAudioForSlide = async () => {
            switch (currentSlide) {
                case 0: // Intro - silence
                    await audioManager.stop();
                    break;
                case 1: // Minutes
                case 2: // Genre
                    await audioManager.playPreview(stats.topTracks[0]?.previewUrl);
                    break;
                case 3: // Artists
                    await audioManager.playPreview(stats.topArtists[0]?.previewUrl || stats.topTracks[0]?.previewUrl);
                    break;
                case 4: // Tracks
                    await audioManager.playPreview(stats.topTracks[1]?.previewUrl || stats.topTracks[0]?.previewUrl);
                    break;
                case 5: // Albums
                case 6: // Summary
                    await audioManager.playPreview(stats.topTracks[0]?.previewUrl);
                    break;
            }
        };

        playAudioForSlide();
    }, [currentSlide, stats]);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    }, []);

    const toggleMute = async () => {
        setIsMuted(!isMuted);
        await audioManager.setMuted(!isMuted);
    };

    const startJourney = () => {
        goToSlide(1);
    };

    const handleShare = () => {
        // Share logic will be in RemappedSummarySlide
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <RemappedLoadingScreen />
            </>
        );
    }

    if (error === 'unauthenticated') {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.errorContainer} edges={['top']}>
                    <Ionicons name="log-in-outline" size={80} color="#D92323" />
                    <Text style={styles.errorTitle}>Not Logged In</Text>
                    <Text style={styles.errorSubtext}>
                        Please log in with Last.fm to view your Remapped 2025
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonText}>Go Back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    if (error === 'insufficient_data') {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.errorContainer} edges={['top']}>
                    <Ionicons name="time-outline" size={80} color="#D92323" />
                    <Text style={styles.errorTitle}>Not Enough Data Yet</Text>
                    <Text style={styles.errorSubtext}>
                        You need more listening history to generate your Remapped. Keep scrobbling!
                    </Text>
                    <View style={styles.requirementsList}>
                        <View style={styles.requirement}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#A0A0A0" />
                            <Text style={styles.requirementText}>At least 3 artists in your listening history</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#A0A0A0" />
                            <Text style={styles.requirementText}>At least 3 tracks scrobbled</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#A0A0A0" />
                            <Text style={styles.requirementText}>Some listening time logged on Last.fm</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonText}>Go Back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    if (error === 'failed') {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.errorContainer} edges={['top']}>
                    <Ionicons name="alert-circle-outline" size={80} color="#D92323" />
                    <Text style={styles.errorTitle}>Something Went Wrong</Text>
                    <Text style={styles.errorSubtext}>
                        Failed to load your Remapped. Please try again.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={loadData}
                    >
                        <Ionicons name="reload-outline" size={20} color="#FFFFFF" />
                        <Text style={[styles.buttonText, { marginLeft: 8 }]}>Try Again</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </>
        );
    }

    if (!stats) return null;

    const slides = [
        { id: 0, component: <RemappedIntroSlide onStart={startJourney} /> },
        { id: 1, component: <RemappedMinutesSlide minutes={stats.totalMinutes} /> },
        { id: 2, component: <RemappedGenreSlide genre={stats.topGenre} /> },
        { id: 3, component: <RemappedArtistsSlide artists={stats.topArtists} /> },
        { id: 4, component: <RemappedTracksSlide tracks={stats.topTracks} /> },
        { id: 5, component: <RemappedAlbumsSlide albums={stats.topAlbums} /> },
        { id: 6, component: <RemappedSummarySlide stats={stats} onReplay={() => goToSlide(0)} /> },
    ];

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Progress Bar */}
                <RemappedProgressBar current={currentSlide} total={7} />

                {/* Slides */}
                <FlatList
                    ref={flatListRef}
                    horizontal
                    pagingEnabled
                    data={slides}
                    renderItem={({ item }) => (
                        <View style={styles.slideContainer}>
                            {item.component}
                        </View>
                    )}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(data, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                />

                {/* Tap Zones - Disabled on summary slide */}
                {currentSlide > 0 && currentSlide < 6 && (
                    <TouchableOpacity
                        style={[styles.tapZone, styles.tapZoneLeft]}
                        onPress={() => goToSlide(Math.max(0, currentSlide - 1))}
                        activeOpacity={1}
                    />
                )}
                {currentSlide < 6 && (
                    <TouchableOpacity
                        style={[styles.tapZone, styles.tapZoneRight]}
                        onPress={() => goToSlide(Math.min(6, currentSlide + 1))}
                        activeOpacity={1}
                    />
                )}

                {/* Exit Button */}
                <TouchableOpacity 
                    style={styles.exitButton} 
                    onPress={() => router.back()}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Mute Toggle */}
                {currentSlide > 0 && (
                    <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                        <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-medium'}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 28,
        color: '#FFFFFF',
        marginTop: 20,
        textAlign: 'center',
    },
    errorSubtext: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 16,
        color: '#A0A0A0',
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 24,
    },
    requirementsList: {
        marginTop: 30,
        width: '100%',
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    requirementText: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 16,
        color: '#A0A0A0',
        marginLeft: 12,
        flex: 1,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D92323',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 30,
    },
    buttonText: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    slideContainer: {
        width: SCREEN_WIDTH,
        flex: 1,
    },
    tapZone: {
        position: 'absolute',
        top: 60,
        bottom: 0,
    },
    tapZoneLeft: {
        left: 0,
        width: SCREEN_WIDTH * 0.33,
    },
    tapZoneRight: {
        right: 0,
        width: SCREEN_WIDTH * 0.67,
    },
    muteButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    exitButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
});
