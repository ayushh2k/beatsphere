// components/RemappedGenreSlide.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GenreSlideProps {
    genre: string;
}

const RemappedGenreSlide = ({ genre }: GenreSlideProps) => {
    return (
        <View style={styles.container}>
            {/* Icon with pulsing glow */}
            <MotiView
                from={{ rotate: '-180deg', scale: 0, opacity: 0 }}
                animate={{ rotate: '0deg', scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 1200 }}
                style={styles.iconWrapper}
            >
                <LinearGradient
                    colors={['#D51007', '#EA580C']}
                    style={styles.iconContainer}
                >
                    <Ionicons name="bar-chart-outline" size={64} color="#FFFFFF" />
                </LinearGradient>
            </MotiView>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={300}
                style={styles.label}
            >
                TOP GENRE
            </MotiText>

            <MotiView
                from={{ translateX: -100, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                delay={500}
                transition={{ type: 'spring' }}
                style={styles.genreContainer}
            >
                <Text style={styles.genreName} numberOfLines={2}>
                    {genre}
                </Text>
                <View style={styles.underline} />
            </MotiView>

            <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={800}
                style={styles.description}
            >
                This was the sound that defined your year
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
    iconContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#D51007',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    label: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 14,
        color: '#6B7280',
        letterSpacing: 4,
        marginBottom: 20,
    },
    genreContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    genreName: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 60,
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -1,
        paddingHorizontal: 20,
    },
    underline: {
        marginTop: 16,
        width: 96,
        height: 1,
        backgroundColor: '#D51007',
        opacity: 0.6,
    },
    description: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 40,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 40,
    },
});

export default RemappedGenreSlide;
