// app/(tabs)/dashboard/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main dashboard screen (index.tsx) */}
      <Stack.Screen name="index" />
      {/* If you ever add nested routes like /dashboard/something,
          they will automatically use this Stack as well */}
    </Stack>
  );
}
