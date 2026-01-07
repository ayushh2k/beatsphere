/**
 * Bottom sheet displaying user's recent listening history.
 */

import React, { forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, Linking, TouchableOpacity } from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { getRecentTracks } from '@/lib/lastfm';
import type { UserLocation } from '../types';

interface UserDetailBottomSheetProps {
  selectedUser: UserLocation | null;
  snapPoints: string[];
  onClose: () => void;
}

const UserDetailBottomSheet = forwardRef<BottomSheet, UserDetailBottomSheetProps>(
  ({ selectedUser, snapPoints, onClose }, ref) => {
    const [selectedUserHistory, setSelectedUserHistory] = useState<any[]>([]);

    useEffect(() => {
      if (selectedUser) {
        const fetchHistory = async () => {
          try {
            const tracks = await getRecentTracks(
              selectedUser.username || selectedUser.id,
              10
            );
            setSelectedUserHistory(tracks?.slice(0, 5) || []);
          } catch (e) {
            console.error('Error fetching history', e);
            setSelectedUserHistory([]);
          }
        };
        fetchHistory();
      } else {
        setSelectedUserHistory([]);
      }
    }, [selectedUser]);

    const title = selectedUser
      ? `${selectedUser.username || selectedUser.name || 'User'}'s Recently Played`
      : 'User History';

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        backgroundStyle={styles.bottomSheet}
        handleIndicatorStyle={{ backgroundColor: '#4A4A4A' }}
        enableContentPanningGesture={true}
        onClose={onClose}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>{title}</Text>
        </View>
        <BottomSheetFlatList
          data={selectedUserHistory}
          keyExtractor={(item: any, index: number) => item.date?.uts || index.toString()}
          renderItem={({ item }: { item: any }) => {
            const trackName = item.name;
            const artistName = item.artist?.['#text'] || item.artist?.name || 'Unknown Artist';
            const imageUrl = item.image?.find((img: any) => img.size === 'medium')?.['#text'];

            return (
              <View style={styles.historyItem}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.historyImage} />
                ) : (
                  <View style={[styles.historyImage, styles.historyPlaceholder]}>
                    <Ionicons name="musical-notes" size={20} color="#666" />
                  </View>
                )}
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTrack} numberOfLines={1}>
                    {trackName}
                  </Text>
                  <Text style={styles.historyArtist} numberOfLines={1}>
                    {artistName}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={() => {
            if (selectedUser) {
              return (
                <TouchableOpacity
                  style={styles.lastFmButton}
                  onPress={() => {
                    const lastfmProfileUrl = `https://www.last.fm/user/${selectedUser.id}`;
                    Linking.openURL(lastfmProfileUrl);
                  }}
                >
                  <Text style={styles.lastFmButtonText}>View on Last.fm</Text>
                  <Ionicons name="open-outline" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              );
            }
            return null;
          }}
          contentContainerStyle={styles.bottomSheetContent}
        />
      </BottomSheet>
    );
  }
);

UserDetailBottomSheet.displayName = 'UserDetailBottomSheet';

const styles = StyleSheet.create({
  bottomSheet: { backgroundColor: '#181818' },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  bottomSheetTitle: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  bottomSheetContent: { padding: 16 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  historyPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTrack: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Bold',
  },
  historyArtist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'AvenirNextLTPro-Regular',
  },
  lastFmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#D92323',
    paddingVertical: 12,
    borderRadius: 24,
  },
  lastFmButtonText: {
    color: '#fff',
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 14,
  },
});

export default UserDetailBottomSheet;
