import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface ChatRoom {
  id: string;
  name: string;
}

const GlobalChatroom = () => {
  const router = useRouter();

  const chatRooms: ChatRoom[] = [
    { id: '1', name: 'Global Chatroom' },
  ];

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.chatRoomItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Text style={styles.chatRoomText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View className='w-full' style={styles.container}>
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  chatRoomItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1ED760',
  },
  chatRoomText: {
    color: '#1ED760',
    fontSize: 18,
  },
});

export default GlobalChatroom;