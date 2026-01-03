// app/(tabs)/chat.tsx

import React, { useCallback } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChatRoom } from '@/features/chat';
import analytics from '@/utils/analytics';

const ChatScreen = () => {
  useFocusEffect(
    useCallback(() => {
      analytics.trackScreenView('chat');
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212"/>
      <ChatRoom />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
});

export default ChatScreen;

