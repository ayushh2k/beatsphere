/**
 * Main chat room orchestrator component.
 * Coordinates WebSocket connection, messages, and UI components.
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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

  const { messages, addSystemMessage, handleMessagesUpdate } = useChatMessages();

  // Create a ref to store handleTypingUpdate to avoid circular dependency
  const handleTypingUpdateRef = React.useRef<(indicator: any) => void>(() => {});

  const { connectionStatus, sendMessage, sendTyping, userInfo } = useWebSocket({
    onMessagesUpdate: handleMessagesUpdate,
    onOnlineCountUpdate: setOnlineCount,
    onTypingUpdate: (indicator) => handleTypingUpdateRef.current(indicator),
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
    <View style={styles.container}>
      <ChatHeader connectionStatus={connectionStatus} onlineCount={onlineCount} />

      <MessageList
        messages={messages}
        connectionStatus={connectionStatus}
        userInfo={userInfo}
        onUserPress={setSelectedUser}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TypingIndicator typingIndicator={typingIndicator} />
        <ChatInput
          inputText={inputText}
          onInputChange={handleInputChangeWrapper}
          onSendPress={handleSendPress}
          onGifPress={handleGifPress}
          connectionStatus={connectionStatus}
        />
      </KeyboardAvoidingView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
});
