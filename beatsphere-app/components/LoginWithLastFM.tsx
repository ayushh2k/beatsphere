// components/LoginWithLastFM.tsx

import React from 'react';
import { TouchableOpacity, Text, Linking, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

export default function LoginWithLastFM() {
    const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY!;

    const handleLogin = () => {
        const redirectUri = 'beatsphere://';
        const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(redirectUri)}`;
        Linking.openURL(authUrl);
    };

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            style={styles.container}
        >
            <TouchableOpacity
                onPress={handleLogin}
                style={styles.loginButton}
                activeOpacity={0.8}
            >
                <Ionicons name="musical-notes-outline" size={24} color="#FFFFFF" style={styles.icon} />
                <Text style={styles.buttonText}>Connect with Last.fm</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => Linking.openURL('https://community.spotify.com/t5/FAQs/How-can-I-connect-Spotify-to-Last-fm/ta-p/4795301')}>
                 <Text style={styles.guideText}>
                  Learn how to connect <Text style={styles.spotifyLink}>Spotify to Last.fm</Text>
                </Text>
            </TouchableOpacity>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#D92323',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        width: '90%',
    },
    icon: {
        marginRight: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'AvenirNextLTPro-Bold',
    },
    guideText: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'AvenirNextLTPro-Regular',
        textAlign: 'center',
        marginTop: 25,
    },
    spotifyLink: {
        color: '#1DB954', // Spotify Green
        fontFamily: 'AvenirNextLTPro-Bold',
    },
});
