/**
 * Chat input component with send and GIF buttons.
 * Handles text input and message sending.
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectionStatus } from '../types';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSendPress: () => void;
  onGifPress: () => void;
  connectionStatus: ConnectionStatus;
}

export default function ChatInput({
  inputText,
  onInputChange,
  onSendPress,
  onGifPress,
  connectionStatus,
}: ChatInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={onInputChange}
        placeholder="Type a message..."
        placeholderTextColor="#888"
        multiline
        editable={connectionStatus === 'connected'}
      />
      <TouchableOpacity onPress={onGifPress} style={styles.gifButton}>
        <Ionicons name="link-outline" size={24} color="#A0A0A0" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSendPress}
        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
        disabled={!inputText.trim()}
      >
        <Ionicons name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#282828',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 40,
    maxHeight: 100,
    color: 'white',
    marginRight: 8,
    fontSize: 15,
  },
  gifButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#D92323',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.4 },
});
