/**
 * Main chat room orchestrator component.
 * Coordinates WebSocket connection, messages, and UI components.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import analytics from '@/utils/analytics';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import ChatProfileCallout from './ChatProfileCallout';
import GifPicker from './GifPicker';
import { useWebSocket, useChatMessages, useTypingIndicator } from '../hooks';
import type { Message } from '../types';

export default function ChatRoom() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<Message | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  const headerHeight = useHeaderHeight();
  // Safe access to tab bar height, defaulting to 0 if not available or hook fails in certain contexts
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    // Ignore error if used outside tab navigator
  }

  const offset = Platform.OS === 'ios' ? headerHeight + tabBarHeight : headerHeight;

  const { messages, addSystemMessage, handleMessagesUpdate } = useChatMessages();

  // Create a ref to store handleTypingUpdate to avoid circular dependency
  const handleTypingUpdateRef = React.useRef<(indicator: any) => void>(() => {});

  const onTypingUpdateStable = React.useCallback((indicator: any) => {
    handleTypingUpdateRef.current(indicator);
  }, []);

  const { connectionStatus, sendMessage, sendTyping, userInfo } = useWebSocket({
    onMessagesUpdate: handleMessagesUpdate,
    onOnlineCountUpdate: setOnlineCount,
    onTypingUpdate: onTypingUpdateStable,
    onSystemMessage: addSystemMessage,
  });

  const { typingIndicator, handleTypingUpdate, handleInputChange, cleanup } = useTypingIndicator({
    sendTyping,
  });

  // Update the ref
  handleTypingUpdateRef.current = handleTypingUpdate;

  const handleSendPress = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleSelectGif = (gifUrl: string) => {
    sendMessage(gifUrl);
    setIsPickerVisible(false);

    // Track GIF message analytics
    analytics.trackChatMessage('gif', 'global');
  };

  const handleInputChangeWrapper = (text: string) => {
    handleInputChange(text, setInputText);
  };

  const handleGifPress = () => {
    setIsPickerVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : offset}
    >
      <ChatHeader connectionStatus={connectionStatus} onlineCount={onlineCount} />

      <MessageList
        messages={messages}
        connectionStatus={connectionStatus}
        userInfo={userInfo}
        onUserPress={setSelectedUser}
      />

      <TypingIndicator typingIndicator={typingIndicator} />
      
      <ChatInput
        inputText={inputText}
        onInputChange={handleInputChangeWrapper}
        onSendPress={handleSendPress}
        onGifPress={handleGifPress}
        connectionStatus={connectionStatus}
      />

      <ChatProfileCallout
        user={selectedUser}
        isVisible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      <GifPicker
        isVisible={isPickerVisible}
        onSelectGif={handleSelectGif}
        onClose={() => setIsPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
});
