// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import "../../global.css";
import DrawerContent from "@/components/DrawerContent";

const TabsLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

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
            <DrawerContent closeDrawer={toggleDrawer} />
          </View>
        </TouchableOpacity>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#D92323",
          tabBarStyle: {
            backgroundColor: "#121212",
            borderTopColor: "#282828",
            borderTopWidth: 1,
            borderColor: '#282828',
            height: 60,
            paddingTop: 8,

            elevation: 0, // Android shadow
            shadowOpacity: 0, // iOS shadow
            shadowOffset: { height: 0, width: 0 },
            shadowRadius: 0,
            shadowColor: "transparent",
          },
          headerStyle: {
            backgroundColor: "#121212",
            borderBottomColor: "#282828",
            borderBottomWidth: 1
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontFamily: "AvenirNextLTPro-Bold",
          },
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={toggleDrawer}
              style={styles.hamburgerIcon}
            >
              <Ionicons name="menu-outline" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
        initialRouteName="home"
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="map-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chatroom",
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubble-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="chat/[id]"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="drawer"
          options={{ href: null, headerShown: false }}
        />
      </Tabs>
    </>
  );
};

const styles = StyleSheet.create({
  hamburgerIcon: { marginLeft: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  drawerContainer: {
    width: "80%",
    maxWidth: 320,
    height: "100%",
    backgroundColor: "#121212",
  },
});

export default TabsLayout;
