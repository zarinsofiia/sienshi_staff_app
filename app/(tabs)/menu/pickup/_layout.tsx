// app/(tabs)/menu/pickup/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function PickupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Pickup operation screen (your existing: app/(tabs)/menu/pickup/index.tsx) */}
      <Stack.Screen name="index" />

    </Stack>
  );
}
