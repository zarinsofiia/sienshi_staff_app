// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Karla_400Regular,
  Karla_500Medium,
  Karla_700Bold,
  Karla_800ExtraBold,
} from "@expo-google-fonts/karla";
import { LanguageProvider } from "../contexts/LanguageContext";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Karla-Regular": Karla_400Regular,
    "Karla-Medium": Karla_500Medium,
    "Karla-Bold": Karla_700Bold,
    "Karla-ExtraBold": Karla_800ExtraBold,
  });

  if (!fontsLoaded) {
    // simple loading screen while fonts are loading
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

   return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </LanguageProvider>
  );
}
