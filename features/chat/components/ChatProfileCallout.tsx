// ChatProfileCallout.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { LastFmTrack } from '@/lib/lastfm';

// Temporary local implementation until getUserRecentTrack is added to lib/lastfm
async function getUserRecentTrack(username: string): Promise<LastFmTrack | null> {
  // This function would need to be implemented properly
  return null;
}

interface UserProfile {
  senderId: string;
  senderName: string;
  senderImage?: string;
}

interface ChatProfileCalloutProps {
  user: UserProfile | null;
  isVisible: boolean;
  onClose: () => void;
}

const DefaultAvatar = ({ username }: { username: string }) => {
    const initial = username.charAt(0).toUpperCase();
    return <View style={[styles.profileImage, { backgroundColor: '#555', justifyContent: 'center', alignItems: 'center'}]}><Text style={styles.avatarInitial}>{initial}</Text></View>;
};

const ChatProfileCallout: React.FC<ChatProfileCalloutProps> = ({ user, isVisible, onClose }) => {
  const [lastTrack, setLastTrack] = useState<LastFmTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const fetchTrack = async () => {
        try {
          const apiKey = process.env.EXPO_PUBLIC_LASTFM_KEY!;
          const track = await getUserRecentTrack(user.senderId, apiKey);
          setLastTrack(track);
        } catch (error) {
          console.error("Failed to fetch user's last track:", error);
          setLastTrack(null);
        } finally {
          setIsLoading(false);
        }
      };
      setTimeout(fetchTrack, 100);
    }
  }, [user]);

  if (!user) return null;

  const albumArtUrl = lastTrack?.image?.find(img => img.size === 'large')?.['#text'];

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.calloutContainer}>
          <View style={styles.header}>
            {user.senderImage ? (
              <Image source={{ uri: user.senderImage }} style={styles.profileImage} contentFit="cover" />
            ) : (
              <DefaultAvatar username={user.senderName} />
            )}
            <Text style={styles.profileName} numberOfLines={1}>{user.senderName}</Text>
          </View>

          <View style={styles.lastScrobbledContainer}>
            <Text style={styles.sectionLabel}>Last Scrobbled:</Text>
            {isLoading ? (
                <View style={styles.trackInfoRow}>
                    <View style={styles.albumArtPlaceholder} />
                    <View>
                        <ActivityIndicator color="#D92323" />
                    </View>
                </View>
            ) : lastTrack ? (
              <View style={styles.trackInfoRow}>
                {albumArtUrl ? (
                  <Image source={{ uri: albumArtUrl }} style={styles.albumArtImage} contentFit="cover" />
                ) : (
                  <View style={styles.albumArtPlaceholder}>
                    <Ionicons name="musical-notes-outline" size={24} color="#555" />
                  </View>
                )}
                <View style={styles.trackTextContainer}>
                  <Text style={styles.trackName} numberOfLines={1}>{lastTrack.name}</Text>
                  <Text style={styles.artistName} numberOfLines={1}>{lastTrack.artist['#text']}</Text>
                </View>
              </View>
            ) : (
                <View style={styles.trackInfoRow}>
                    <View style={styles.albumArtPlaceholder}>
                        <Ionicons name="alert-circle-outline" size={24} color="#555" />
                    </View>
                    <View style={styles.trackTextContainer}>
                        <Text style={styles.artistName}>No recent scrobbles found.</Text>
                    </View>
                </View>
            )}
          </View>


          <TouchableOpacity 
            style={styles.button} 
            onPress={() => Linking.openURL(`https://www.last.fm/user/${user.senderId}`)}
          >
            <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calloutContainer: {
    width: '95%',
    maxWidth: 350,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282828',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#282828',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarInitial: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  lastScrobbledContainer: {
    padding: 15,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArtImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackTextContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  trackName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#D92323',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default ChatProfileCallout;