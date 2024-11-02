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
  StyleSheet
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface GlobalChatroomState {
  messages: Message[];
  inputText: string;
  userId: string;
  userName: string;
}

class GlobalChatroom extends React.Component<{}, GlobalChatroomState> {
  state: GlobalChatroomState = {
    messages: [],
    inputText: '',
    userId: '',
    userName: ''
  };

  ws: WebSocket | null = null;
  flatListRef: FlatList | null = null;

  componentDidMount() {
    this.initChat();
  }

  componentWillUnmount() {
    if (this.ws) {
      this.ws.close();
    }
  }

  initChat = async () => {
    try {
      const currentUserId = await SecureStore.getItemAsync('lastfm_username');
      const displayName = await SecureStore.getItemAsync('display_name') || currentUserId;
      this.setState({ userId: currentUserId || '', userName: displayName || '' });

      this.ws = new WebSocket(`ws://192.168.1.8:3000/chat`);

      this.ws.onopen = () => {
        if (this.ws) {
          this.ws.send(JSON.stringify({
            type: 'join',
            userId: currentUserId,
            room: 'global'
          }));
        }
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'globalMessage') {
          this.setState(prevState => ({
            messages: [...prevState.messages, {
              id: data.id,
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              timestamp: data.timestamp
            }]
          }));
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  sendMessage = () => {
    if (!this.state.inputText.trim() || !this.ws) return;

    const message = {
      type: 'message',
      id: Date.now().toString(),
      senderId: this.state.userId,
      senderName: this.state.userName,
      text: this.state.inputText.trim(),
      timestamp: Date.now(),
      room: 'global'
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.setState({ inputText: '' });
    }
  };

  renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === this.state.userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          ref={(ref) => this.flatListRef = ref}
          data={this.state.messages}
          renderItem={this.renderMessage}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => this.flatListRef?.scrollToEnd()}
          contentContainerStyle={styles.messagesList}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={this.state.inputText}
              onChangeText={(text) => this.setState({ inputText: text })}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={this.sendMessage}
              style={[
                styles.sendButton,
                !this.state.inputText.trim() && styles.sendButtonDisabled
              ]}
              disabled={!this.state.inputText.trim()}
            >
              <Ionicons name="send" size={24} color="white" />
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
    backgroundColor: '#121212',
    width: '100%'
  },
  messagesList: {
    padding: 16
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '80%'
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1ED760'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333'
  },
  senderName: {
    color: '#1ED760',
    fontSize: 12,
    marginBottom: 4
  },
  messageText: {
    color: 'white',
    fontSize: 16
  },
  timestamp: {
    color: '#DDD',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#1ED760',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: 'white',
    marginRight: 8
  },
  sendButton: {
    backgroundColor: '#1ED760',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    opacity: 0.5
  }
});

export default GlobalChatroom;