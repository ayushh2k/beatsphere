/**
 * Default avatar component for users without profile images.
 * Generates a colored circle with user's initial.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DefaultAvatarProps {
  username: string;
  style?: object;
}

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ username, style }) => {
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  const colors = ['#D92323', '#4A90E2', '#50E3C2', '#F5A623', '#BD10E0'];
  const color = colors[Math.abs(hashCode(username || '')) % colors.length];

  return (
    <View
      style={[
        styles.avatar,
        style,
        {
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  avatarInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DefaultAvatar;
