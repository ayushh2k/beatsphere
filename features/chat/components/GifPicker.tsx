// components/GifPicker.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
import axios from 'axios';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GifPickerProps {
  isVisible: boolean;
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

export default function GifPicker({ isVisible, onSelectGif, onClose }: GifPickerProps) {
  const [gifs, setGifs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const fetchGifs = async () => {
      const endpoint = query 
        ? `https://tenor.googleapis.com/v2/search?q=${query}` 
        : `https://tenor.googleapis.com/v2/featured?`;
      
      const apiKey = process.env.EXPO_PUBLIC_TENOR_API_KEY;
      
      try {
        const response = await axios.get(`${endpoint}&key=${apiKey}&limit=20`);
        setGifs(response.data.results);
      } catch (error) {
        console.error("Failed to fetch GIFs from Tenor:", error);
      }
    };

    const debounceTimeout = setTimeout(fetchGifs, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSelect = (gif: any) => {
    const gifUrl = gif.media_formats.gif.url;
    onSelectGif(gifUrl);
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput 
              style={styles.input}
              placeholder="Search for a GIF..."
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
             <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={gifs}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)} style={styles.gifContainer}>
              <Image source={{ uri: item.media_formats.tinygif.url }} style={styles.gifImage} contentFit="cover" />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181818' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#282828' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 10, paddingHorizontal: 10 },
  input: { flex: 1, height: 40, color: 'white', marginLeft: 10 },
  closeButton: { paddingLeft: 10 },
  gifContainer: { flex: 1/2, aspectRatio: 1.6, padding: 2 },
  gifImage: { flex: 1, borderRadius: 6 },
});