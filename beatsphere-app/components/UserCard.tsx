//components/UserCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface UserLocation {
    id: string;
    name: string;
    imageUrl?: string | null;
    currentlyPlaying?: any;
    city?: string | null;
}

const DefaultArt = ({ seed }: { seed: string }) => {
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
        return hash;
    };
    const colors = ['#3D1D1D', '#1D3C52', '#1E4C41', '#5A421A', '#491954'];
    const color = colors[Math.abs(hashCode(seed || '')) % colors.length];
    return (
        <View style={[styles.image, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="musical-notes-outline" size={32} color="rgba(255, 255, 255, 0.5)" />
        </View>
    );
};

const UserCard = ({ user, onFlyTo }: { user: UserLocation; onFlyTo: () => void; }) => {
    const songImageUrl = user.currentlyPlaying?.image?.find((img: any) => img.size === 'extralarge')?.['#text'];
    const lastfmProfileUrl = `https://www.last.fm/user/${user.id}`;

    return (
        <View style={styles.card}>
            {songImageUrl ? (
                <Image source={{ uri: songImageUrl }} style={styles.image} cachePolicy="disk" transition={300} />
            ) : (
                <DefaultArt seed={user.currentlyPlaying?.name || 'default'} />
            )}
            <View style={styles.textContainer}>
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.songTitle} numberOfLines={1}>{user.currentlyPlaying?.name || 'Unknown Track'}</Text>
                <Text style={styles.artistName} numberOfLines={1}>{user.currentlyPlaying?.artist['#text'] || 'Unknown Artist'}</Text>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={onFlyTo} style={styles.actionButton}>
                    <Ionicons name="navigate-outline" size={24} color="#A0A0A0" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(lastfmProfileUrl)} style={styles.actionButton}>
                    <Ionicons name="link-outline" size={24} color="#A0A0A0" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#282828', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#3a3a3a' },
    textContainer: { flex: 1, marginRight: 10 },
    userName: { fontFamily: 'AvenirNextLTPro-Bold', fontSize: 16, color: '#FFFFFF' },
    songTitle: { fontFamily: 'AvenirNextLTPro-Regular', fontSize: 14, color: '#E0E0E0', marginTop: 2 },
    artistName: { fontFamily: 'AvenirNextLTPro-Regular', fontSize: 12, color: '#A0A0A0', marginTop: 2 },
    actionsContainer: { flexDirection: 'row' },
    actionButton: { padding: 8, marginLeft: 4 },
});

export default UserCard;

