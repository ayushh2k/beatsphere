// app/_layout.tsx

import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Buffer } from "buffer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/config/queryClient";
import analytics from "../utils/analytics";
import { KeyboardProvider } from 'react-native-keyboard-controller';

global.Buffer = Buffer;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",

  tabs: {
    initialRouteName: "home", // <= important!
  },
};

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "AvenirNextLTPro-Bold": require("../assets/fonts/AvenirNextLTPro-Bold.otf"),
    "AvenirNextLTPro-It": require("../assets/fonts/AvenirNextLTPro-It.otf"),
    "AvenirNextLTPro-Regular": require("../assets/fonts/AvenirNextLTPro-Regular.otf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Initialize analytics
      analytics.initialize().then(() => {
        analytics.track('app_opened');
      });
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" backgroundColor="#121212" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#121212",
              },
              headerShown: false,
              headerTintColor: "#ffff",
              headerTitleAlign: "center",
              headerTitleStyle: {
                fontFamily: "AvenirNextLTPro-Bold",
                fontSize: 24,
                color: "#ffff",
              },
            }}
          >
            <Stack.Screen
              options={{
                title: "Beat Sphere",
              }}
              name="index"
            />
            <Stack.Screen
              options={{
                title: "Home",
              }}
              name="(tabs)"
            />
          </Stack>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
