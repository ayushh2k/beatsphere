// app/(tabs)/chat.tsx

import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import GlobalChatroom from '../../components/GlobalChatroom';

const ChatScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212"/>
      <GlobalChatroom />
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

