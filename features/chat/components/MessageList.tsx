/**
 * Message list component with auto-scroll.
 * Renders FlatList of messages with automatic scroll to bottom.
 */

import React, { useRef } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View } from 'react-native';
import MessageItem from './MessageItem';
import type { Message, ConnectionStatus, UserInfo } from '../types';

interface MessageListProps {
  messages: Message[];
  connectionStatus: ConnectionStatus;
  userInfo: UserInfo | null;
  onUserPress: (message: Message) => void;
}

export default function MessageList({
  messages,
  connectionStatus,
  userInfo,
  onUserPress,
}: MessageListProps) {
  const flatListRef = useRef<FlatList<Message>>(null);

  return (
    <>
      {connectionStatus === 'connecting' && messages.length <= 1 && (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#D92323" />
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => {
          const isOwnMessage =
            item.senderId === userInfo?.id || item.senderName === userInfo?.id;
          return (
            <MessageItem message={item} isOwnMessage={isOwnMessage} onUserPress={onUserPress} />
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 10, paddingVertical: 10, flexGrow: 1 },
});
