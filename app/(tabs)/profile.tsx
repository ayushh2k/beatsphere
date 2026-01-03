// app/(tabs)/profile.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Linking, 
  ActivityIndicator, 
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUserInfo } from '../../utils/lastFmHelpers';
import analytics from '../../utils/analytics';

interface LastFmUser {
  name: string;
  image: { '#text': string; size: string; }[];
  url: string;
  playcount: string;
}

const DefaultAvatar = ({ username }: { username: string }) => {
    const initial = username ? username.charAt(0).toUpperCase() : '?';
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };
    const colors = ['#D92323', '#4A90E2', '#50E3C2', '#F5A623', '#BD10E0'];
    const color = colors[Math.abs(hashCode(username || '')) % colors.length];

    return (
        <View style={[styles.profileImage, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
    );
};

const Profile = () => {
  const [userInfo, setUserInfo] = useState<LastFmUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const cachedUserInfo = await AsyncStorage.getItem('lastfm_user_info');
      if (cachedUserInfo) {
        setUserInfo(JSON.parse(cachedUserInfo));
        setLoading(false);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY;
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');

      if (!apiKey || !sessionKey) {
          throw new Error("Credentials not found");
      }

      const data = await getUserInfo(apiKey, sessionKey);
      await AsyncStorage.setItem('lastfm_user_info', JSON.stringify(data));
      setUserInfo(data);
    } catch (err: any) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('profile');
    }, [])
  );

  const handleLogout = async () => {
    try {
      // Track logout event before clearing data
      await analytics.trackLogout();

      await Promise.all([
        // SecureStore items
        SecureStore.deleteItemAsync('lastfm_session_key'),
        SecureStore.deleteItemAsync('lastfm_username'),
        SecureStore.deleteItemAsync('lastfm_user_image'),

        // AsyncStorage items
        AsyncStorage.removeItem('lastfm_user_info'),
        AsyncStorage.removeItem('has_accepted_location_terms'),
        AsyncStorage.removeItem('currently_playing'),
      ]);

      router.replace('/');
    } catch (e) {
      console.error("Failed to clear all data on logout:", e);
      router.replace('/');
    }
  };

  const handleEditProfile = () => {
    if (userInfo?.url) {
      Linking.openURL(`${userInfo.url}`);
    }
  };
  
  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#D92323" /></View>;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={fetchProfile}>
           <Ionicons name="reload-outline" size={16} color="#FFFFFF" />
           <Text style={styles.actionButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImageUrl = userInfo?.image?.find(img => img.size === 'extralarge')?.['#text'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileCard}>
            {profileImageUrl ? (
                <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.profileImage}
                />
            ) : (
                <DefaultAvatar username={userInfo?.name || ''} />
            )}
            <Text style={styles.userName}>{userInfo?.name}</Text>
            <Text style={styles.userPlaycount}>{Number(userInfo?.playcount || 0).toLocaleString()} scrobbles</Text>
        </View>

        <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/remapped')}>
                <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>View Remapped 2025</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>View Profile on Last.fm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#212121',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#282828',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#D92323',
  },
  avatarInitial: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userPlaycount: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  actionsContainer: {
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#212121',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#D92323',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Profile;