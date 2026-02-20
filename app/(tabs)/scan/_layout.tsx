import { Stack } from "expo-router";
import React from "react";

export default function StockInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // you already use <AppHeader />
      }}
    >
      {/* /stock */}
      <Stack.Screen name="index" />

      {/* /stock/view */}
      <Stack.Screen name="list" />
    </Stack>
  );
}
