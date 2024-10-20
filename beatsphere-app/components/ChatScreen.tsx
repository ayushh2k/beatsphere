// components/ChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

interface ChatScreenProps {
  receiverId: string;
  receiverName: string;
  onClose: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ receiverId, receiverName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId, setUserId] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const initChat = async () => {
      const currentUserId = await SecureStore.getItemAsync('lastfm_username');
      setUserId(currentUserId || '');

      // Load previous messages from AsyncStorage
      const chatKey = getChatKey(currentUserId || '', receiverId);
      const storedMessages = await AsyncStorage.getItem(chatKey);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      // Initialize WebSocket connection
      ws.current = new WebSocket(`ws://192.168.15.200:3000/chat`);

      ws.current.onopen = () => {
        // Send join message
        if (ws.current) {
          ws.current.send(JSON.stringify({
            type: 'join',
            userId: currentUserId,
          }));
        }
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (
          (message.senderId === receiverId && message.receiverId === currentUserId) ||
          (message.senderId === currentUserId && message.receiverId === receiverId)
        ) {
          setMessages(prev => {
            const newMessages = [...prev, message];
            // Save to AsyncStorage
            saveMessages(newMessages, currentUserId || '', receiverId);
            return newMessages;
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    initChat();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [receiverId]);

  const getChatKey = (userId1: string, userId2: string) => {
    return `chat_${[userId1, userId2].sort().join('_')}`;
  };

  const saveMessages = async (messages: Message[], userId1: string, userId2: string) => {
    const chatKey = getChatKey(userId1, userId2);
    await AsyncStorage.setItem(chatKey, JSON.stringify(messages));
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: userId,
      receiverId: receiverId,
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    ws.current.send(JSON.stringify({
      type: 'message',
      ...message,
    }));

    setMessages(prev => [...prev, message]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1ED760" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName}</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1ED760',
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ED760',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
  },
  messagesList: {
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1ED760',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    color: '#FFFFFF80',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#1ED760',
    backgroundColor: '#121212',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#1ED760',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1ED76080',
  },
});

export default ChatScreen;