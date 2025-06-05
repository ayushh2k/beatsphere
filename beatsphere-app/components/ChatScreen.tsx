// components/ChatScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
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

interface ChatScreenState {
  messages: Message[];
  inputText: string;
  userId: string;
}

class ChatScreen extends React.Component<ChatScreenProps, ChatScreenState> {
  ws: WebSocket | null = null;
  flatListRef: FlatList | null = null;

  constructor(props: ChatScreenProps) {
    super(props);
    this.state = {
      messages: [],
      inputText: '',
      userId: '',
    };
  }

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
      this.setState({ userId: currentUserId || '' });

      if (!this.ws) {
        this.ws = new WebSocket(`wss://beatsphere-backend.onrender.com/chat`);

        this.ws.onopen = () => {
          if (this.ws) {
            this.ws.send(JSON.stringify({
              type: 'join',
              userId: currentUserId,
            }));
          }
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          // Handle messages that are part of this conversation
          if (
            (message.senderId === this.props.receiverId && message.receiverId === this.state.userId) ||
            (message.senderId === this.state.userId && message.receiverId === this.props.receiverId)
          ) {
            this.setState((prevState: ChatScreenState) => ({
              ...prevState,
              messages: [...prevState.messages, message],
            }));
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event);
        };
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  sendMessage = () => {
    if (!this.state.inputText.trim() || !this.ws) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: this.state.userId,
      receiverId: this.props.receiverId,
      text: this.state.inputText.trim(),
      timestamp: Date.now(),
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        ...message,
      }));

      // Update local state immediately
      this.setState((prevState: ChatScreenState) => ({
        messages: [...prevState.messages, message],
        inputText: '',
      }));
    }
  };

  renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === this.state.userId;

    return (
      <View
        className={`${isOwnMessage ? 'self-end bg-green-500' : 'self-start bg-gray-700'} p-3 rounded-lg max-w-80 m-1`}
      >
        <Text className="text-white text-base">{item.text}</Text>
        <Text className="text-gray-400 text-xs mt-1">
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  render() {
    return (
      <View className="flex-1 w-full bg-gray-900">
        <StatusBar barStyle="light-content" />
        <View className="flex-row items-center justify-between p-4 border-b border-green-500 bg-gray-900">
          <TouchableOpacity onPress={this.props.onClose} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#1ED760" />
          </TouchableOpacity>
          <Text className="text-green-500 text-lg font-bold flex-1 text-center">
            {this.props.receiverName}
          </Text>
          <View className="w-10" />
        </View>

        <FlatList
          className='p-4'
          ref={(ref) => this.flatListRef = ref}
          data={this.state.messages}
          renderItem={this.renderMessage}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => this.flatListRef?.scrollToEnd()}
          contentContainerStyle={{ paddingVertical: 16 }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View className="flex-row items-center p-2 border-t border-green-500 bg-gray-900">
            <TextInput
              className="flex-1 bg-gray-700 rounded-full p-3 text-white mr-2"
              value={this.state.inputText}
              onChangeText={(text) => this.setState({ inputText: text })}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={this.sendMessage}
              className={`bg-green-500 rounded-full w-10 h-10 justify-center items-center ${!this.state.inputText.trim() && 'bg-green-300'}`}
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

export default ChatScreen;