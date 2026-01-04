/**
 * Message list component with auto-scroll.
 * Renders FlatList of messages with automatic scroll to bottom.
 */

import React, { useRef, useCallback, memo } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View } from 'react-native';
import MessageItem from './MessageItem';
import type { Message, ConnectionStatus, UserInfo } from '../types';

interface MessageListProps {
  messages: Message[];
  connectionStatus: ConnectionStatus;
  userInfo: UserInfo | null;
  onUserPress: (message: Message) => void;
}

const MessageList = memo(function MessageList({
  messages,
  connectionStatus,
  userInfo,
  onUserPress,
}: MessageListProps) {
  const flatListRef = useRef<FlatList<Message>>(null);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage =
      item.senderId === userInfo?.id || item.senderName === userInfo?.id;
    return (
      <MessageItem message={item} isOwnMessage={isOwnMessage} onUserPress={onUserPress} />
    );
  }, [userInfo?.id, onUserPress]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleLayout = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, []);

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
        style={styles.listContainer}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        removeClippedSubviews={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </>
  );
});

export default MessageList;

const styles = StyleSheet.create({
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1 },
  messagesList: { paddingHorizontal: 10, paddingVertical: 10, flexGrow: 1 },
});
