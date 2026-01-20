import React from "react";
import { Stack } from "expo-router";

export default function StockLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // you already use <AppHeader />
      }}
    >
      {/* /stock */}
      <Stack.Screen name="index" />

      {/* /stock/view */}
      <Stack.Screen name="view" />
    </Stack>
  );
}
