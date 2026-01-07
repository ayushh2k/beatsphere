// components/RemappedMinutesSlide.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MinutesSlideProps {
    minutes: string;
}

const RemappedMinutesSlide = ({ minutes }: MinutesSlideProps) => {
    const totalMinutes = parseInt(minutes.replace(/,/g, ''));
    const hours = Math.floor(totalMinutes / 60);

    return (
        <View style={styles.container}>
            {/* Icon with glow */}
            <MotiView
                from={{ scale: 0, rotate: '-180deg' }}
                animate={{ scale: 1, rotate: '0deg' }}
                transition={{ type: 'spring', duration: 1000 }}
                style={styles.iconWrapper}
            >
                <View style={styles.iconGlow} />
                <LinearGradient
                    colors={['#1F1F1F', '#000000']}
                    style={styles.iconContainer}
                >
                    <Ionicons name="time-outline" size={56} color="#D51007" />
                </LinearGradient>
            </MotiView>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={300}
                style={styles.label}
            >
                TOTAL TIME
            </MotiText>

            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                delay={400}
                transition={{ type: 'spring', stiffness: 100 }}
                style={styles.numberContainer}
            >
                <Text style={styles.bigNumber}>{minutes}</Text>
                <View style={styles.underline} />
            </MotiView>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={500}
                style={styles.subtitle}
            >
                MINUTES LISTENED
            </MotiText>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={800}
                style={styles.conversion}
            >
                That's {hours.toLocaleString()} hours of pure vibes
            </MotiText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconWrapper: {
        marginBottom: 30,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGlow: {
        position: 'absolute',
        width: 160,
        height: 160,
        backgroundColor: '#D51007',
        opacity: 0.2,
        borderRadius: 80,
    },
    iconContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(213, 16, 7, 0.3)',
        zIndex: 10,
    },
    label: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 14,
        color: '#6B7280',
        letterSpacing: 4,
        marginBottom: 20,
    },
    numberContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    bigNumber: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 80,
        color: '#FFFFFF',
        letterSpacing: -2,
    },
    underline: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 2,
        backgroundColor: '#D51007',
        opacity: 0.5,
    },
    subtitle: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#D51007',
        marginTop: 24,
        letterSpacing: 2,
    },
    conversion: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 40,
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default RemappedMinutesSlide;
