import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { filterCurseWords } from '../utils/curseWordFilter';
import ChatProfileCallout from './ChatProfileCallout';

// --- Type Definitions ---
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystemMessage?: boolean;
  senderImage?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface TypingIndicator {
  isTyping: boolean;
  message: string;
}

interface UserInfo {
  id: string;
  name: string;
  image?: string | null;
}

// --- Constants ---
const WEBSOCKET_URL = 'wss://beatsphere-backend.onrender.com/chat';
// const WEBSOCKET_URL = 'wss://backend-beatsphere.onrender.com/chat';
// const WEBSOCKET_URL = 'ws://192.168.1.6:3000/chat';

const DefaultAvatar = ({ username, style }: { username: string, style?: object }) => {
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const colors = ["#D92323", "#4A90E2", "#50E3C2", "#F5A623", "#BD10E0"];
  const color = colors[Math.abs(hashCode(username || "")) % colors.length];

  return (
    <View style={[styles.avatar, style, { backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
};

// --- Main Component ---
const GlobalChatroom = () => {
  // --- State Management ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ isTyping: false, message: '' });
  const [selectedUser, setSelectedUser] = useState<Message | null>(null);

  // --- Refs for managing instances and state ---
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueueRef = useRef<string | null>(null);
  const userInfoRef = useRef<UserInfo | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const typingIndicatorAnim = useRef(new Animated.Value(0)).current;

  // --- Core Logic ---
  useEffect(() => {
    initializeUserAndConnect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    Animated.timing(typingIndicatorAnim, {
      toValue: typingIndicator.isTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [typingIndicator.isTyping]);

  // --- Helper Functions ---
  const addSystemMessage = (text: string, idPrefix = 'system') => {
    const systemMessage: Message = {
      id: `${idPrefix}-${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      text,
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const initializeUserAndConnect = async () => {
    try {
      const id = await SecureStore.getItemAsync('lastfm_username');
      const name = await SecureStore.getItemAsync('display_name') || id;
      const image = await SecureStore.getItemAsync('lastfm_user_image');
      const sessionKey = await SecureStore.getItemAsync('lastfm_session_key');

      if (!id || !name || !sessionKey) {
        addSystemMessage('Could not start chat. User credentials not found. ❌');
        setConnectionStatus('disconnected');
        return;
      }
      userInfoRef.current = { id, name, image };
      sessionKeyRef.current = sessionKey;
      
      connect(0);
    } catch (error) {
      console.error('Failed to get user info:', error);
      addSystemMessage('An error occurred while fetching your user data.');
    }
  };


  const connect = (retryCount: number) => {
    const sessionKey = sessionKeyRef.current;
    if (!userInfoRef.current || !sessionKey || ws.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus(retryCount === 0 ? 'connecting' : 'reconnecting');
    const message = retryCount === 0 ? 'Connecting to chat... 📡' : 'Connection lost. Reconnecting... 🔌';
    addSystemMessage(message);

    const authenticatedUrl = `${WEBSOCKET_URL}?token=${sessionKey}`;
    ws.current = new WebSocket(authenticatedUrl);

    ws.current.onopen = () => {
      setConnectionStatus('connected');
      addSystemMessage('Connection established. Welcome! ✅');
      ws.current?.send(JSON.stringify({
        type: 'join',
        senderId: userInfoRef.current!.id,
        senderName: userInfoRef.current!.name,
        senderImage: userInfoRef.current!.image,
      }));
      if (messageQueueRef.current) {
        sendMessage(messageQueueRef.current);
        messageQueueRef.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'globalMessage':
          setMessages(prev => [...prev, { ...data, text: filterCurseWords(data.text) }]);
          break;
        case 'userCountUpdate':
          setOnlineCount(data.count);
          break;
        case 'typingUpdate':
          const { users = [] } = data;
          const otherTypers = users.filter((typer: UserInfo) => typer.id !== userInfoRef.current?.id);
          let indicatorMessage = '';
          if (otherTypers.length === 1) {
            indicatorMessage = `${otherTypers[0].name} is typing...`;
          } else if (otherTypers.length > 1) {
            indicatorMessage = 'Several people are typing...';
          }
          setTypingIndicator({ isTyping: otherTypers.length > 0, message: indicatorMessage });
          break;
      }
    };

    ws.current.onclose = () => {
      setTypingIndicator({ isTyping: false, message: '' });
      if (connectionStatus !== 'disconnected') {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => connect(retryCount + 1), delay);
      }
    };
  };

  const handleSendPress = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const sendMessage = (text: string) => {
    if (!userInfoRef.current) return;
    if (ws.current?.readyState === WebSocket.OPEN) {
      const filteredText = filterCurseWords(text.trim());
      ws.current.send(JSON.stringify({ type: 'message', text: filteredText }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
    } else {
      messageQueueRef.current = text;
      addSystemMessage('Message queued. Will send upon reconnection.');
      if (connectionStatus !== 'reconnecting' && connectionStatus !== 'connecting') {
        connect(0);
      }
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing', isTyping }));
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(text.length > 0);
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2000);
    }
  };
  
  // --- UI Rendering ---
  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }
    const isOwnMessage = item.senderId === userInfoRef.current?.id;
    if (isOwnMessage) {
      // Render own messages without an avatar
      return (
        <View style={[styles.messageBubble, styles.ownMessage]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      );
    }

    // Render other users messages with an avatar
    return (
      <View style={styles.otherMessageContainer}>
        <TouchableOpacity onPress={() => setSelectedUser(item)}>
          {item.senderImage ? (
            <Image source={{ uri: item.senderImage }} style={styles.avatar} contentFit="cover" />
          ) : (
            <DefaultAvatar username={item.senderName} />
          )}
        </TouchableOpacity>
        <View style={[styles.messageBubble, styles.otherMessage]}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    const statusColor = { connected: '#2ECC71', connecting: '#F39C12', reconnecting: '#F39C12', disconnected: '#E74C3C' }[connectionStatus];
    return (
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={styles.headerTitle}>Global Chat</Text>
        </View>
        <Text style={styles.onlineCount}>{onlineCount > 0 ? `${onlineCount} Online` : ''}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {connectionStatus === 'connecting' && messages.length <= 1 && (
        <View style={styles.fullScreenLoader}><ActivityIndicator size="large" color="#D92323" /></View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <Animated.View style={[styles.typingIndicatorContainer, { opacity: typingIndicatorAnim, transform: [{ translateY: typingIndicatorAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <Text style={styles.typingIndicatorText}>{typingIndicator.message}</Text>
        </Animated.View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            editable={connectionStatus === 'connected'}
          />
          <TouchableOpacity
            onPress={handleSendPress}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim()}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ChatProfileCallout
        user={selectedUser}
        isVisible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  onlineCount: { color: '#A0A0A0', fontSize: 14 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 10, paddingVertical: 10, flexGrow: 1 },
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
  ownMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#D92323', 
    borderBottomRightRadius: 5,
    marginVertical: 4,
    maxWidth: '80%',
  },
  otherMessage: { 
    backgroundColor: '#262626', 
    borderBottomLeftRadius: 5,
  },
  senderName: { color: '#A0A0A0', fontSize: 13, fontWeight: 'bold', marginBottom: 3 },
  messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
  timestamp: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#282828',
    alignItems: 'flex-end',
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
  sendButton: {
    backgroundColor: '#D92323',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  typingIndicatorContainer: {
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#181818',
  },
  typingIndicatorText: { color: '#A0A0A0', fontStyle: 'italic' },
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
  otherMessageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    marginVertical: 4,
    maxWidth: '85%',
  },
});

export default GlobalChatroom;

