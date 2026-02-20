import { Stack } from "expo-router";
import React from "react";
export default function OrderLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >

            <Stack.Screen name="index" />
        </Stack>
    )

}