// app/(tabs)/menu/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function MenuStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* main menu screen */}
      <Stack.Screen name="index" />

      {/* nested customer screens */}
      <Stack.Screen name="customer/customer-list" />
      <Stack.Screen name="customer/customer-view" />

      {/* pickup & packing screens (already created as files) */}
      <Stack.Screen name="pickup/index" />
      <Stack.Screen name="packing/list" />
      <Stack.Screen name="packing/create"  />
    </Stack>
  );
}
