import { Stack } from "expo-router";
import React from "react";

export default function NotificationsLayout() {
    return (
    <Stack
        screenOptions={{
            headerShown: false, // you already use <AppHeader />
        }}>
        <Stack.Screen name="index" />

    </Stack>
    )
}