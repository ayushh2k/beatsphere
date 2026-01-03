/**
 * Chat header with connection status and online count.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConnectionStatus } from '../types';

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  onlineCount: number;
}

export default function ChatHeader({ connectionStatus, onlineCount }: ChatHeaderProps) {
  const statusColor = {
    connected: '#2ECC71',
    connecting: '#F39C12',
    reconnecting: '#F39C12',
    disconnected: '#E74C3C',
  }[connectionStatus];

  return (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <Text style={styles.headerTitle}>Global Chat</Text>
      </View>
      <Text style={styles.onlineCount}>{onlineCount > 0 ? `${onlineCount} Online` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  onlineCount: { color: '#A0A0A0', fontSize: 14 },
});
