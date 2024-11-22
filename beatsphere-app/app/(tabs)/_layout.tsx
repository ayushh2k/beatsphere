// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import "../../global.css";

const TabsLayout = () => {
  return (
    <>
      <Tabs screenOptions={{
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
      }}>
        <Tabs.Screen name="home" options={{
          title: 'Home',
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'AvenirNextLTPro-Bold',
          },
          headerTitleAlign: 'center',
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
          title: 'Global Chatroom',
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'AvenirNextLTPro-Bold',
          },
          headerTitleAlign: 'center',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-outline" size={24} color={color} />
          )
        }} />
        <Tabs.Screen name="profile" options={{
          title: 'Profile',
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'AvenirNextLTPro-Bold',
          },
          headerTitleAlign: 'center',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          )
        }} />
        {/* Hide the [id] route from the navigation menu */}
        <Tabs.Screen name="chat/[id]" options={{
          href: null,
          headerShown: false,
        }} />
      </Tabs>
    </>
  );
};

export default TabsLayout;