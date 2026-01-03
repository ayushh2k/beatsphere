/**
 * Map control FAB buttons.
 * Provides user list, locate me, and refresh controls.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserLocation } from '../types';

interface MapControlsProps {
  visibleUsers: UserLocation[];
  userLocation: UserLocation | null;
  onOpenUserList: () => void;
  onLocateMe: () => void;
  onRefresh: () => void;
}

export default function MapControls({
  visibleUsers,
  userLocation,
  onOpenUserList,
  onLocateMe,
  onRefresh,
}: MapControlsProps) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenUserList}
        disabled={visibleUsers.length === 0}
      >
        <Ionicons
          name="people"
          size={24}
          color={visibleUsers.length === 0 ? '#6E6E6E' : '#fff'}
        />
        {visibleUsers.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{visibleUsers.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fab}
        onPress={onLocateMe}
        disabled={!userLocation}
      >
        <Ionicons name="locate" size={24} color={!userLocation ? '#6E6E6E' : '#fff'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.fab} onPress={onRefresh}>
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    marginBottom: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D92323',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});
