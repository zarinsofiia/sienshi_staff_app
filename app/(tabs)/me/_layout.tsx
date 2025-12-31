// app/(tabs)/me/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function MeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
