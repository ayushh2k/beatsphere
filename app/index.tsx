import { Text, View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";

export default function Index() {
  return (
    <SafeAreaView className="bg-primary h-full">
      {/* <ScrollView contentContainerStyle={{ height: "100%" }}> */}
      <View className="w-full h-full px-3 flex-1 items-center justify-center">
        <Text className="text-xl font-aregular color-green">Edit app/index.tsx to edit this screen.</Text>
        <StatusBar style="light" />
        <Link href="/home" className="font-aregular color-green">Go to Home</Link>
      {/* </ScrollView> */}
      </View>
    </SafeAreaView>
  );
}
