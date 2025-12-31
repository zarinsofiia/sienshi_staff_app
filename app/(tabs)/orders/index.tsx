// app/(tabs)/order/index.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text } from "react-native";
import { AppHeader } from "../../../components/AppHeader";

export default function OrderScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_order" showBack />
      <View style={styles.content}>
        <Text>Driver orders list here…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { flex: 1, padding: 16 },
});
