/**
 * Individual message item component.
 * Renders system messages, own messages, and other users' messages.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import DefaultAvatar from '../utils/DefaultAvatar';
import GifMessage from './GifMessage';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  onUserPress: (message: Message) => void;
}

export default function MessageItem({ message, isOwnMessage, onUserPress }: MessageItemProps) {
  // System messages
  if (message.isSystemMessage) {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }

  const isGif = message.text.startsWith('https://') && message.text.endsWith('.gif');

  // Own messages (right-aligned, red bubble)
  if (isOwnMessage) {
    return (
      <View style={styles.ownMessageWrapper}>
        <View style={[styles.messageBubble, styles.ownMessage, isGif && styles.gifBubble]}>
          {isGif ? (
            <View>
              <GifMessage uri={message.text} />
              <Text style={styles.gifTimestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Other users' messages
  if (isGif) {
    return (
      <View style={styles.otherMessageContainer}>
        <TouchableOpacity onPress={() => onUserPress(message)}>
          {message.senderImage ? (
            <Image source={{ uri: message.senderImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <DefaultAvatar username={message.senderName} />
          )}
        </TouchableOpacity>
        <View style={[styles.messageBubble, styles.otherMessage, styles.gifBubble]}>
          <View>
            <GifMessage uri={message.text} />
            <Text style={styles.gifTimestamp}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherMessageContainer}>
      <TouchableOpacity onPress={() => onUserPress(message)}>
        {message.senderImage ? (
          <Image source={{ uri: message.senderImage }} style={styles.avatar} contentFit="cover" />
        ) : (
          <DefaultAvatar username={message.senderName} />
        )}
      </TouchableOpacity>
      <View style={styles.messageContentContainer}>
        <View style={[styles.messageBubble, styles.otherMessage]}>
          <Text style={styles.senderName}>{message.senderName}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
          <Text style={styles.otherTimestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
  },
  systemMessageText: { color: '#B0B0B0', fontSize: 13, fontStyle: 'italic' },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  ownMessageWrapper: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 4,
  },
  ownMessage: {
    backgroundColor: '#D92323',
    borderBottomRightRadius: 5,
    maxWidth: '80%',
  },
  otherMessage: {
    backgroundColor: '#262626',
    borderBottomLeftRadius: 5,
  },
  senderName: { color: '#A0A0A0', fontSize: 13, fontWeight: 'bold', marginBottom: 3 },
  messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
  timestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  otherMessageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    marginVertical: 4,
    maxWidth: '85%',
  },
  gifBubble: {
    padding: 3,
    backgroundColor: 'transparent',
  },
  messageContentContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  otherTimestamp: {
    color: '#6e6e6e',
    fontSize: 10,
    marginTop: 4,
    marginLeft: 0,
  },
  gifTimestamp: {
    position: 'absolute',
    bottom: 5,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
