//components/DrawerContent.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

interface UserInfo {
  name: string;
  image: { "#text": string; size: string }[];
}

const DrawerItem = ({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
    <Ionicons name={icon} size={24} color="#A0A0A0" />
    <Text style={styles.drawerItemLabel}>{label}</Text>
  </TouchableOpacity>
);

const DefaultAvatar = ({ username }: { username: string }) => {
  const initial = username ? username.charAt(0).toUpperCase() : "?";
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const colors = ["#D92323", "#4A90E2", "#50E3C2", "#F5A623", "#BD10E0"];
  const color = colors[Math.abs(hashCode(username || "")) % colors.length];

  return (
    <View
      style={[
        styles.profileImage,
        {
          backgroundColor: color,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
};

const DrawerContent = ({ closeDrawer }: { closeDrawer: () => void }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const [username, imageUrl] = await Promise.all([
        SecureStore.getItemAsync("lastfm_username"),
        SecureStore.getItemAsync("lastfm_user_image"),
      ]);

      if (username) {
        const constructedUserInfo: UserInfo = {
          name: username,
          image: imageUrl ? [{ "#text": imageUrl, size: "large" }] : [],
        };
        setUserInfo(constructedUserInfo);
      }
    };
    loadUserData();
  }, []);

  const onShare = async () => {
    try {
      await Share.share({
        message:
          "Check out BeatSphere! Discover what the world is listening to, in real-time. \n https://play.google.com/store/apps/details?id=com.beatsphere.beatsphere",
      });
    } catch (error) {
      console.error("Error sharing app:", error);
    }
  };

  const profileImageUrl = userInfo?.image?.find(
    (img) => img.size === "large"
  )?.["#text"];

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <View style={styles.profileHeader}>
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl }}
            style={styles.profileImage}
            cachePolicy="disk"
          />
        ) : (
          <DefaultAvatar username={userInfo?.name || ""} />
        )}
        <Text style={styles.profileName}>{userInfo?.name || "Welcome"}</Text>
      </View>

      {/* Actions & Links Section */}
      <View style={styles.actionsSection}>
        <DrawerItem
          icon="share-social-outline"
          label="Share BeatSphere"
          onPress={onShare}
        />
        <DrawerItem
          icon="logo-discord"
          label="Join our Discord"
          onPress={() => Linking.openURL("https://discord.gg/WK7zF7PXqw")}
        />
        <DrawerItem
          icon="cafe-outline"
          label="Support Us"
          onPress={() => Linking.openURL("https://ko-fi.com/beatsphere")}
        />
        <DrawerItem
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() =>
            Linking.openURL("https://beatsphere.live/legal/terms")
          }
        />
        <DrawerItem
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() =>
            Linking.openURL("https://beatsphere.live/legal/privacy")
          }
        />
        <DrawerItem
          icon="help-circle-outline"
          label="How to Connect Spotify"
          onPress={() =>
            Linking.openURL(
              "https://community.spotify.com/t5/FAQs/How-can-I-connect-Spotify-to-Last-fm/ta-p/4795301"
            )
          }
        />
        <DrawerItem
          icon="thumbs-up-outline"
          label="Leave a Review"
          onPress={() =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=com.beatsphere.beatsphere"
            )
          }
        />
        <DrawerItem
          icon="mail-outline"
          label="Contact Us"
          onPress={() =>
            Linking.openURL("mailto:beatspherecommunity@gmail.com")
          }
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.2.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#282828",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#D92323",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "AvenirNextLTPro-Bold",
  },
  actionsSection: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#282828",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  drawerItemLabel: {
    color: "#A0A0A0",
    fontSize: 16,
    fontFamily: "AvenirNextLTPro-Regular",
    marginLeft: 20,
  },
  footer: {
    marginTop: "auto",
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#6E6E6E",
    fontSize: 12,
    fontFamily: "AvenirNextLTPro-Regular",
  },
});

export default DrawerContent;
