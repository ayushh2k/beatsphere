// components/RemappedLoadingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

const RemappedLoadingScreen = () => {
    return (
        <View style={styles.container}>
            {/* Animated background blobs */}
            <MotiView
                from={{ opacity: 0.3, scale: 1 }}
                animate={{ opacity: 0.6, scale: 1.5 }}
                transition={{
                    type: 'timing',
                    duration: 3000,
                    loop: true,
                }}
                style={[styles.blob, styles.blob1]}
            />
            <MotiView
                from={{ opacity: 0.2, scale: 1 }}
                animate={{ opacity: 0.5, scale: 1.3 }}
                transition={{
                    type: 'timing',
                    duration: 4000,
                    loop: true,
                }}
                style={[styles.blob, styles.blob2]}
            />

            {/* Spinning vinyl */}
            <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{
                    type: 'timing',
                    duration: 3000,
                    loop: true,
                }}
            >
                <Ionicons name="disc-outline" size={120} color="#D92323" />
            </MotiView>

            {/* Pulsing text */}
            <MotiView
                from={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{
                    type: 'timing',
                    duration: 1500,
                    loop: true,
                }}
            >
                <Text style={styles.loadingText}>Analyzing your year...</Text>
            </MotiView>

            {/* Progress dots */}
            <View style={styles.dotsContainer}>
                {[0, 1, 2].map((i) => (
                    <MotiView
                        key={i}
                        from={{ scale: 1, opacity: 0.3 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        transition={{
                            type: 'timing',
                            duration: 1500,
                            loop: true,
                            delay: i * 200,
                        }}
                        style={styles.dot}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blob: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#D92323',
    },
    blob1: {
        top: '20%',
        left: '-10%',
    },
    blob2: {
        bottom: '20%',
        right: '-10%',
    },
    loadingText: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D92323',
    },
});

export default RemappedLoadingScreen;
