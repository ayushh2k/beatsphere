// components/CustomMarker.tsx

import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Linking,
  // Image,
  Animated,
} from "react-native";
import { Marker, Callout } from "react-native-maps";
import { Image } from "expo-image";
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

const CustomMarker: React.FC<CustomMarkerProps> = ({
  coordinate,
  // latitude,
  // longitude,
  imageUrl,
  currentlyPlaying,
  username,
  id,
  tracksViewChanges,
  listeningStatus,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const lastfmProfileUrl = `https://www.last.fm/user/${id}`;
  const albumArtUrl = currentlyPlaying?.image?.find(
    (img: any) => img.size === "large"
  )?.["#text"];
  const borderColor = listeningStatus === "live" ? "#D92323" : "#989898";

  const handleMarkerPress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Marker
      // coordinate={{ latitude, longitude }}
      coordinate={coordinate}
      tracksViewChanges={tracksViewChanges}
      // onPress={handleMarkerPress}
    >
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
            contentFit="cover"
            // transition={300}
            cachePolicy="disk"
          />
        ) : (
          // <Image
          //   source={{ uri: imageUrl }}
          //   style={styles.markerImage}
          //   resizeMode="cover"
          // />
          <DefaultAvatar username={username || ""} />
        )}
      </Animated.View>
      <Callout tooltip onPress={() => Linking.openURL(lastfmProfileUrl)}>
        <View style={styles.calloutContainer}>
          {albumArtUrl ? (
            <Image
              source={{ uri: albumArtUrl }}
              style={styles.calloutImage}
              cachePolicy="disk"
              contentFit="cover"
              // transition={300}
            />
          ) : (
            // <Image
            //   source={{ uri: albumArtUrl }}
            //   style={styles.calloutImage}
            //   resizeMode="cover"
            // />
            // <Svg style={styles.calloutImage}>
            //   <Defs>
            //     <ClipPath id="clip">
            //       <Rect
            //         x="0"
            //         y="0"
            //         width="100%"
            //         height="100%"
            //         rx={8} // border radius
            //         ry={8}
            //       />
            //     </ClipPath>
            //   </Defs>
            //   <ImageSvg
            //     href={{ uri: albumArtUrl }}
            //     width={"100%"}
            //     height={"100%"}
            //     preserveAspectRatio="xMidYMid slice"
            //     clipPath="url(#clip)"
            //   />
            // </Svg>
            <View style={[styles.calloutImage, styles.calloutImagePlaceholder]}>
              <Ionicons
                name="musical-notes-outline"
                size={32}
                color="#4A4A4A"
              />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.calloutUsername} numberOfLines={1}>
              {username}
            </Text>
            <Text style={styles.calloutSong} numberOfLines={1}>
              {currentlyPlaying?.name || "..."}
            </Text>
            <Text style={styles.calloutArtist} numberOfLines={1}>
              {currentlyPlaying?.artist["#text"] || "..."}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color="#4A4A4A"
            style={styles.arrowIcon}
          />
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    // borderColor: "#D92323",
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  avatarInitial: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  calloutContainer: {
    width: 260,
    padding: 12,
    backgroundColor: "#181818",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#282828",
  },
  calloutImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  calloutImagePlaceholder: {
    backgroundColor: "#282828",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1 },
  calloutUsername: {
    fontFamily: "AvenirNextLTPro-Bold",
    fontSize: 14,
    color: "#A0A0A0",
  },
  calloutSong: {
    fontFamily: "AvenirNextLTPro-Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 2,
  },
  calloutArtist: {
    fontFamily: "AvenirNextLTPro-Regular",
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 2,
  },
  arrowIcon: { marginLeft: 10 },
});

export default CustomMarker;
