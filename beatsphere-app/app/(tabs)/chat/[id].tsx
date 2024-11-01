// app/(tabs)/chat/[id].tsx

import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatScreen from '@/components/ChatScreen';

const ChatRoom = () => {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();

  // Ensure id is always a string
  const chatRoomId = Array.isArray(id) ? id[0] : id;

  // You can fetch the chat room details based on the `id` here
  const chatRoom = {
    id: chatRoomId,
    name: `Chat Room ${chatRoomId}`,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <ChatScreen
        receiverId={chatRoom.id}
        receiverName={chatRoom.name}
        onClose={() => router.back()}
      />
    </SafeAreaView>
  );
};

export default ChatRoom;