// components/CustomMarker.tsx

import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Linking,
  // Image,
  Animated,
  Image,
} from "react-native";
import { Marker, Callout } from "react-native-maps";
// import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  Svg,
  Image as ImageSvg,
  // Image,
  Defs,
  Rect,
  ClipPath,
} from "react-native-svg";

interface CustomMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  currentlyPlaying?: any;
  lastfmProfileUrl?: string;
  username?: string;
  tracksViewChanges?: boolean;
  id?: string;
  listeningStatus?: "live" | "recent";
}

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
        styles.markerImage,
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

const CustomMarker: React.FC<Omit<CustomMarkerProps, 'coordinate' | 'onSelect'>> = ({
  imageUrl,
  currentlyPlaying,
  username,
  id,
  tracksViewChanges,
  listeningStatus,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const borderColor = listeningStatus === "live" ? "#D92323" : "#989898";
  
  React.useEffect(() => {
    // console.log(`CustomMarker mounted for ${username}`);
  }, [username]);

  return (
    <Animated.View
      style={[
        styles.markerContainer,
        { transform: [{ scale: scaleValue }], borderColor: borderColor },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.markerImage}
          resizeMode="cover"
        />
      ) : (
        <DefaultAvatar username={username || ""} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    // borderColor: "#D92323",
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  avatarInitial: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default React.memo(CustomMarker);
