// app/_layout.tsx

import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { View } from "react-native";
import { Buffer } from 'buffer';

global.Buffer = Buffer;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "AvenirNextLTPro-Bold": require("../assets/fonts/AvenirNextLTPro-Bold.otf"),
    "AvenirNextLTPro-It": require("../assets/fonts/AvenirNextLTPro-It.otf"),
    "AvenirNextLTPro-Regular": require("../assets/fonts/AvenirNextLTPro-Regular.otf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#121212',
      },
      headerTintColor: '#ffff',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 24,
        color: '#ffff',
      },
    }}>
      <Stack.Screen options={
        {
          title: 'Beat Sphere',
        }
      } name='index' />
    </Stack>
  );
}
