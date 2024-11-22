// app/(tabs)/_layout.tsx

import { Tabs, Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import "../../global.css";

const TabsLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const renderDrawerContent = () => (
    <SafeAreaView style={styles.drawerContent}>
      <Text style={styles.appName}>BeatSphere</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.supportEmail}>Support: support@beatsphere.com</Text>
      <Text style={styles.privacyPolicy}>Privacy Policy</Text>
      <Text style={styles.termsOfService}>Terms of Service</Text>
      <Text style={styles.about}>About Us</Text>
    </SafeAreaView>
  );

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={drawerOpen}
        onRequestClose={toggleDrawer}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        >
          <View style={styles.drawerContainer}>
            {renderDrawerContent()}
          </View>
        </TouchableOpacity>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#D92323',
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopWidth: 1,
            borderTopColor: '#D92323',
            borderColor: '#1a1a1a',
            height: 60,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'AvenirNextLTPro-Bold',
          },
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={toggleDrawer} style={styles.hamburgerIcon}>
              <Ionicons name="menu-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="map-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Global Chatroom',
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubble-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
          }}
        />
        {/* Hide the [id] route from the navigation menu */}
        <Tabs.Screen
          name="chat/[id]"
          options={{
            href: null,
            headerShown: false,
          }}
        /><Tabs.Screen
          name="drawer"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
};

const styles = StyleSheet.create({
  hamburgerIcon: {
    marginLeft: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: 300,
    height: '100%',
    backgroundColor: '#121212',
    padding: 20,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  version: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  supportEmail: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  privacyPolicy: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  termsOfService: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  about: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
});

export default TabsLayout;