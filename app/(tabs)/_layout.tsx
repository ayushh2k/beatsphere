// app/(tabs)/_layout.tsx

import { Tabs, Redirect } from 'expo-router'
import { Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons';
import "../../global.css";

const TabsLayout = () => {
  return (
    <>
      <Tabs screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#1ED760',
        // tabBarInactiveTintColor: '',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 1,
          borderTopColor: '#1ED760',
          height: 60
        },
      }}>
        <Tabs.Screen name="home" options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          )
        }} />
        <Tabs.Screen name="map" options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={24} color={color} />
          )
        }} />
        <Tabs.Screen name="chat" options={{
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-outline" size={24} color={color} />
          )
        }} />
        <Tabs.Screen name="profile" options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          )
        }} />

      </Tabs>
    </>
  )
}

export default TabsLayout
