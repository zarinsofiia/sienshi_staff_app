// app/(tabs)/menu/pickup/view.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../../../components/AppHeader";
import BasicCard from "../../../../components/card/BasicCard";

const ORANGE = "#EE9328";

export default function PickupViewScreen() {
  const params = useLocalSearchParams<{
    backTo?: string;
    pickupId?: string;
    pickupCode?: string;
  }>();

  const backTo = params.backTo as string | undefined;
  const pickupId = params.pickupId ? String(params.pickupId) : "";
  const pickupCode = (params.pickupCode || "").toString().trim();

  // fallback title if no pickupCode passed
  const headerTitle = useMemo(() => {
    if (pickupCode) return pickupCode;
    if (pickupId) return `PU-${pickupId}`;
    return "Pickup";
  }, [pickupCode, pickupId]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* ✅ Header title = pickup no */}
      {/* If your AppHeader supports `title`, use it. */}
      <AppHeader title={headerTitle as any} showBack backTo={backTo} />

      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BasicCard style={styles.card}>
            <Text style={styles.sectionTitle}>PICKUP SUMMARY</Text>

            <Text style={styles.line}>
              <Text style={styles.label}>Pickup No:</Text> {headerTitle}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.label}>Pickup ID:</Text> {pickupId || "-"}
            </Text>

            <Text style={styles.hint}>
              (Hardcode view for now) Later you can fetch pickup detail by pickupId.
            </Text>
          </BasicCard>

          <BasicCard style={styles.card}>
            <Text style={styles.sectionTitle}>PARCELS</Text>
            <Text style={styles.hint}>
              Later show parcel list (tracking, desc, weight, m³) from API.
            </Text>
          </BasicCard>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  scrollContent: { paddingBottom: 16 },
  card: { marginBottom: 14 },

  sectionTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    letterSpacing: 1,
    color: "#111827",
    marginBottom: 10,
  },

  line: { fontFamily: "Karla-Regular", fontSize: 13, color: "#374151", marginBottom: 8 },
  label: { fontFamily: "Karla-Bold", color: ORANGE },

  hint: { fontFamily: "Karla-Regular", fontSize: 11, color: "#9ca3af", marginTop: 6 },
});
