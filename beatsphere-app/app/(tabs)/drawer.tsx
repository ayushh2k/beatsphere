// app/(tabs)/drawer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';

const DrawerContent = () => {
  const navigation = useNavigation<DrawerNavigationHelpers>();

  return (
    <DrawerContentScrollView style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={styles.appName}>BeatSphere</Text>
      </View>
      <DrawerItem
        label="Home"
        onPress={() => navigation.navigate('home')}
      />
      <DrawerItem
        label="Map"
        onPress={() => navigation.navigate('map')}
      />
      <DrawerItem
        label="Global Chatroom"
        onPress={() => navigation.navigate('chat')}
      />
      <DrawerItem
        label="Profile"
        onPress={() => navigation.navigate('profile')}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>Support: support@beatsphere.com</Text>
        <Text style={styles.footerText}>Privacy Policy</Text>
        <Text style={styles.footerText}>Terms of Service</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#121212',
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D92323',
  },
  footer: {
    marginTop: 'auto',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default DrawerContent;