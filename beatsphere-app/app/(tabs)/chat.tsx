// app/(tabs)/chat.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalChatroom from '@/components/GlobalChatroom';

const Chat = () => {
  return (
    <SafeAreaView className="bg-primary flex-1 items-center justify-center">
      <GlobalChatroom />
    </SafeAreaView>
  );
};

export default Chat;