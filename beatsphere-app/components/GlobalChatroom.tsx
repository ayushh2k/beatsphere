// components/GlobalChatroom.tsx

import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { filterCurseWords } from '../utils/curseWordFilter';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystemMessage?: boolean;
}

interface GlobalChatroomState {
  messages: Message[];
  inputText: string;
  userId: string;
  userName: string;
  onlineUsersCount: number | null;
  isConnecting: boolean;
  messageToSendOnConnect: string | null; // Stores the text of a message if send is clicked while disconnected
}

const HEALTH_CHECK_URL = 'https://beatsphere-backend.onrender.com/health';
const WEBSOCKET_URL = 'wss://beatsphere-backend.onrender.com/chat';

class GlobalChatroom extends React.Component<{}, GlobalChatroomState> {
  state: GlobalChatroomState = {
    messages: [],
    inputText: '',
    userId: '',
    userName: '',
    onlineUsersCount: null,
    isConnecting: false,
    messageToSendOnConnect: null,
  };

  ws: WebSocket | null = null;
  flatListRef: FlatList<Message> | null = null;
  healthInterval: NodeJS.Timeout | null = null;

  componentDidMount() {
    // Set initial connecting state and attempt to connect
    this.setState({ isConnecting: true });
    this.initChat();
    this.fetchHealthData();
    this.healthInterval = setInterval(this.fetchHealthData, 30000);
  }

  componentWillUnmount() {
    if (this.ws) {
      // Clean up WebSocket listeners to prevent memory leaks
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
  }

  fetchHealthData = async () => {
    try {
      const response = await fetch(HEALTH_CHECK_URL);
      if (!response.ok) {
        console.warn(`Health check failed: ${response.status}`);
        // Keep old count or set to 0 if first time failing
        this.setState(prevState => ({ onlineUsersCount: prevState.onlineUsersCount ?? 0 }));
        return;
      }
      const data = await response.json();
      this.setState({ onlineUsersCount: data.wsGlobalClients });
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      this.setState(prevState => ({ onlineUsersCount: prevState.onlineUsersCount ?? 0 }));
    }
  };

  initChat = async () => {
    // Clean up any existing WebSocket instance and its listeners before creating a new one
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    
    this.setState({ isConnecting: true }); // Signal that a connection attempt is starting/active

    try {
      const currentUserId = await SecureStore.getItemAsync('lastfm_username');
      const displayName = await SecureStore.getItemAsync('display_name') || currentUserId;

      if (!currentUserId) {
        console.error('User ID (lastfm_username) not found in SecureStore.');
        this.addSystemMessage('Could not initialize chat. User ID is missing. Please log in again.', `error-no-userid-${Date.now()}`);
        this.setState({ isConnecting: false });
        return;
      }

      this.setState({ userId: currentUserId, userName: displayName || currentUserId });
      this.ws = new WebSocket(WEBSOCKET_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (!this.ws) return;

        this.ws.send(JSON.stringify({
          type: 'join',
          userId: this.state.userId,
          room: 'global'
        }));
        
        const welcomeMessage: Message = {
            id: `system-welcome-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            text: `Welcome to Global Chat, ${this.state.userName}! ✨`,
            timestamp: Date.now(),
            isSystemMessage: true,
        };

        this.setState(prevState => ({
          messages: [welcomeMessage, ...prevState.messages.filter(m =>
            !m.id.startsWith('system-welcome-') &&
            m.id !== 'system-disconnected' &&
            m.id !== 'system-attempt-reconnect' &&
            !m.id.startsWith('system-error-') &&
            !m.id.startsWith('system-init-error-')
          )],
          isConnecting: false,
        }), () => {
          this.flatListRef?.scrollToOffset({ offset: 0, animated: true });

          const { messageToSendOnConnect, userId, userName } = this.state;
          if (messageToSendOnConnect && this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending queued message:', messageToSendOnConnect);
            const message = {
              type: 'message',
              id: `${userId}-${Date.now()}`,
              senderId: userId,
              senderName: userName,
              text: messageToSendOnConnect,
              timestamp: Date.now(),
              room: 'global'
            };
            this.ws.send(JSON.stringify(message));
            this.setState({ messageToSendOnConnect: null });
            this.addSystemMessage('Your queued message has been sent.', `queued-sent-${Date.now()}`);
          }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'globalMessage') {
            const newMessage: Message = {
              id: data.id,
              senderId: data.senderId,
              senderName: data.senderName,
              text: filterCurseWords(data.text),
              timestamp: data.timestamp
            };
            this.setState(prevState => ({
              messages: [...prevState.messages, newMessage]
            }), () => this.flatListRef?.scrollToEnd({ animated: true }));
          } else if (data.type === 'userJoined' || data.type === 'userLeft') {
            this.addSystemMessage(data.message, `system-${data.type}-${data.id || Date.now()}`);
            this.fetchHealthData();
          } else if (data.type === 'chatHistory' && Array.isArray(data.messages)) {
            const historyMessages: Message[] = data.messages.map((msg: any) => ({
                ...msg,
                text: filterCurseWords(msg.text)
            }));
            this.setState(prevState => ({
                messages: [...historyMessages, ...prevState.messages.filter(m => m.isSystemMessage && !historyMessages.find(hm => hm.id === m.id))]
            }), () => this.flatListRef?.scrollToEnd({animated: false}));
          }
        } catch (e) {
          console.error("Error parsing WebSocket message or updating state:", e, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorId = `system-error-${Date.now()}`;
        if (!this.state.messages.find(m => m.id.startsWith('system-error-') && (Date.now() - m.timestamp < 5000))) {
            this.addSystemMessage('Connection error. If you had a pending message, it was not sent.', errorId);
        }
        this.setState({ isConnecting: false });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.ws = null; 
        if (!event.wasClean && !this.state.messageToSendOnConnect &&
            !this.state.messages.find(m => m.id === 'system-disconnected' && (Date.now() - m.timestamp < 10000))) {
          this.addSystemMessage('Disconnected from chat.', 'system-disconnected');
        }
        this.setState({ isConnecting: false }); 
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
      this.addSystemMessage('Failed to initialize chat. Please check your connection.', `init-error-${Date.now()}`);
      this.setState({ isConnecting: false });
    }
  };

  addSystemMessage = (text: string, id: string) => {
    const systemMessage: Message = {
      id,
      senderId: 'system',
      senderName: 'System',
      text,
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    this.setState(prevState => {
        const existingMsgIndex = prevState.messages.findIndex(m => m.id === id);
        if (existingMsgIndex !== -1 && id === 'system-attempt-reconnect') { 
            const updatedMessages = [...prevState.messages.filter(m => m.id !== id), systemMessage];
            return { messages: updatedMessages };
        } else if (existingMsgIndex === -1) {
            return { messages: [...prevState.messages, systemMessage] };
        }
        return null; 
    }, () => this.flatListRef?.scrollToEnd({ animated: true }));
  };

  sendMessage = () => {
    // Destructure only state properties
    const { inputText, userId, userName, isConnecting, messageToSendOnConnect } = this.state;
    // Access this.ws directly
    const currentWs = this.ws;

    if (!inputText.trim()) {
      return;
    }
    if (!userId) {
      this.addSystemMessage('Cannot send message: User information is missing.', `send-error-nouser-${Date.now()}`);
      return;
    }

    const filteredText = filterCurseWords(inputText.trim());

    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        id: `${userId}-${Date.now()}`,
        senderId: userId,
        senderName: userName,
        text: filteredText,
        timestamp: Date.now(),
        room: 'global'
      };
      currentWs.send(JSON.stringify(message));
      this.setState({ inputText: '', messageToSendOnConnect: null }); // Clear any pending message as well
    } else {
      // WebSocket is not open. Queue the message and attempt to connect.
      this.setState({
        inputText: '', // Clear input field
        messageToSendOnConnect: filteredText, // Store the message to be sent on connect
      });
      
      this.addSystemMessage('Connection unavailable. Attempting to send your message...', 'system-attempt-reconnect');
      
      if (!isConnecting) { // Only try to initChat if not already in the process of connecting
        this.initChat();
      }
    }
  };

  formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  renderMessage = ({ item }: { item: Message }) => {
    if (item.isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isOwnMessage = item.senderId === this.state.userId;

    return (
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {this.formatTimestamp(item.timestamp)}
        </Text>
      </View>
    );
  };

  render() {
    const { messages, inputText, onlineUsersCount, isConnecting, userId, messageToSendOnConnect } = this.state;

    const isInputEditable = !!userId && !(isConnecting && !!messageToSendOnConnect);
    const isSendButtonDisabled = !inputText.trim() || !userId || (isConnecting && !!messageToSendOnConnect);
    const showSpinnerOnButton = isConnecting && !!messageToSendOnConnect;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Global Chat</Text>
          {onlineUsersCount !== null ? (
            <Text style={styles.onlineCount}>
              {onlineUsersCount} {onlineUsersCount === 1 ? 'user' : 'users'} online
            </Text>
          ) : (
            <ActivityIndicator size="small" color="#fff" style={styles.onlineCountLoader} />
          )}
        </View>

        {isConnecting && messages.length === 0 && !messageToSendOnConnect && (
            <View style={styles.connectingContainer}>
                <ActivityIndicator size="large" color="#D92323" />
                <Text style={styles.connectingText}>Connecting to chat...</Text>
            </View>
        )}

        <FlatList
          ref={(ref) => this.flatListRef = ref as FlatList<Message> | null}
          data={[...messages].sort((a, b) => a.timestamp - b.timestamp)}
          renderItem={this.renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false} 
          onContentSizeChange={() => {
            if (this.flatListRef && messages.length > 0) {
                 this.flatListRef.scrollToEnd({animated: true});
            }
          }}
          onLayout={() => {
             if (this.flatListRef && messages.length > 0) {
                 this.flatListRef.scrollToEnd({animated: false});
             }
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={(text) => this.setState({ inputText: text })}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              multiline
              maxLength={500}
              editable={isInputEditable}
            />
            <TouchableOpacity
              onPress={this.sendMessage}
              style={[
                styles.sendButton,
                isSendButtonDisabled && styles.sendButtonDisabled
              ]}
              disabled={isSendButtonDisabled}
            >
              {showSpinnerOnButton ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    width: '100%'
  },
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
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineCount: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  onlineCountLoader: {
    marginRight: 5,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, 
  },
  connectingText: {
    marginTop: 10,
    color: '#AAA',
    fontSize: 16,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexGrow: 1, 
  },
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
  },
  systemMessageText: {
    color: '#B0B0B0',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginVertical: 4, 
    maxWidth: '80%',
    minWidth: '20%', 
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#D92323',
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#262626',
    borderBottomLeftRadius: 5,
  },
  senderName: {
    color: '#A0A0A0', 
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  messageText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    color: '#ffffff', 
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
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
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default GlobalChatroom;