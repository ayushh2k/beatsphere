// components/RemappedIntroSlide.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface IntroSlideProps {
    onStart: () => void;
}

const RemappedIntroSlide = ({ onStart }: IntroSlideProps) => {
    return (
        <View style={styles.container}>
            {/* Background glow */}
            <MotiView
                from={{ opacity: 0.3, scale: 1 }}
                animate={{ opacity: 0.6, scale: 1.2 }}
                transition={{
                    type: 'timing',
                    duration: 3000,
                    loop: true,
                }}
                style={styles.backgroundGlow}
            />

            <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 800 }}
                style={styles.content}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoGlow} />
                    <Image
                        source={require('../assets/images/logo.jpg')}
                        style={styles.logoImage}
                        contentFit="cover"
                    />
                </View>

                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={300}
                    transition={{ type: 'spring' }}
                    style={{ width: '100%', paddingHorizontal: 20 }}
                >
                    <Text 
                        style={styles.title} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true}
                    >
                        REMAPPED
                    </Text>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={600}
                >
                    <Text style={styles.subtitle}>Your 2025 Year in Review</Text>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={900}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity style={styles.startButton} onPress={onStart}>
                        <Text style={styles.startButtonText}>Start the Journey</Text>
                        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </MotiView>
            </MotiView>
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
    backgroundGlow: {
        position: 'absolute',
        width: 300,
        height: 300,
        backgroundColor: '#D51007',
        opacity: 0.3,
        borderRadius: 150,
        top: '20%',
        left: '10%',
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        marginBottom: 40,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        backgroundColor: '#D51007',
        opacity: 0.4,
        borderRadius: 70,
        shadowColor: '#D51007',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        zIndex: 10,
        shadowColor: '#D51007',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 56,
        color: '#D51007',
        textAlign: 'center',
        letterSpacing: 4,
        textShadowColor: '#D51007',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 20,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 12,
        letterSpacing: 1,
    },
    buttonContainer: {
        marginTop: 60,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D51007',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 8,
        shadowColor: '#D51007',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    startButtonText: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
});

export default RemappedIntroSlide;
