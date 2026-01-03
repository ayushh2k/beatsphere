// app/(tabs)/chat/[id].tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChatRoom as GlobalChatroom, ChatScreen } from '@/features/chat';

type ChatRoomParams = {
  id: string;
};

const ChatRoom = () => {
  const { id } = useLocalSearchParams<ChatRoomParams>();

  if (id === 'global') {
    return <GlobalChatroom />;
  } else {
    return <ChatScreen receiverId={id} receiverName={`User ${id}`} onClose={() => {}} />;
  }
};

export default ChatRoom;