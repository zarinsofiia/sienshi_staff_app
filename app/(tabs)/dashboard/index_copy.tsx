// app/(tabs)/dashboard/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../components/AppHeader";

const ORANGE = "#EE9328";

export default function DashboardScreen() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem("currentUser");
        console.log("Dashboard currentUser raw:", json);
        if (json) {
          const user = JSON.parse(json);
          console.log("Dashboard parsed user:", user);
          const name =
            user?.full_name || user?.name || user?.username || null;
          setDisplayName(name);
        }
      } catch (e) {
        console.log("Failed to load currentUser:", e);
      }
    };

    loadUser();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_dashboard" showNotification />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome */}
        <Text style={styles.welcome}>
          Welcome, {displayName || "Admin"}!
        </Text>

        {/* Search + Scan row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9ca3af" />
            <Text style={styles.searchPlaceholder}>Search Parcel</Text>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() =>
              router.push({
                pathname: "/scan",
                params: { backTo: "/dashboard" },
              })
            }
          >
            <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Top 4 stats cards */}
        <View style={styles.statsGrid}>
          <StatCard title="stock" value={0} unitLabel="parcels" />
          <StatCard
            title="Unassigned To Truck"
            value={0}
            unitLabel="packing"
          />
          <StatCard
            title="Out for Delivery"
            value={0}
            unitLabel="trucks"
          />
          <StatCard
            title="Today's Stock In"
            value={0}
            unitLabel="parcels"
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Shortcuts</Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            <QuickAction
              label="Handle Pickup"
              icon="clipboard-outline"
              backgroundColor="#e0f2f1"
              onPress={() =>
                router.push({
                  pathname: "/menu/pickup",
                  params: { backTo: "/dashboard" },
                })
              }
            />

            <QuickAction
              label="Create Packing"
              icon="cube-outline"
              backgroundColor="#e5e0ff"
              onPress={() =>
                router.push({
                  pathname: "/menu/packing/create",
                  params: { backTo: "/dashboard" },
                })
              }
            />

            <QuickAction
              label="Packing List"
              icon="document-text-outline"
              backgroundColor="#ffe4f0"
              onPress={() =>
                router.push({
                  pathname: "/menu/packing/list",
                  params: { backTo: "/dashboard" },
                })
              }
            />

            <QuickAction
              label="Stock List"
              icon="list-outline"
              backgroundColor="#fff7cc"
              onPress={() =>
                router.push({
                  pathname: "/stock",
                  params: { backTo: "/dashboard" },
                })
              }
            />

            <QuickAction
              label="Menu"
              icon="apps-outline"
              backgroundColor="#ffe7dc"
              onPress={() =>
                router.push({
                  pathname: "/menu",
                  params: { backTo: "/dashboard" },
                })
              }
            />

            <QuickAction
              label="Setting"
              icon="settings-outline"
              backgroundColor="#e0f2ff"
              onPress={() =>
                router.push({
                  pathname: "/me/settings",
                  params: { backTo: "/dashboard" },
                })
              }
            />
          </View>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>

          <ActivityItem
            title="Packing P123455 created"
            by="by Admin"
            time="15m ago"
          />
          <ActivityItem
            title="Packing P123495 created"
            by="by Admin"
            time="20m ago"
          />
          <ActivityItem
            title="Truck T78231 out for delivery"
            by="by Admin"
            time="1h ago"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Small UI helpers */

function StatCard({
  title,
  value,
  unitLabel,
}: {
  title: string;
  value: number;
  unitLabel: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unitLabel}</Text>
    </View>
  );
}

/**
 * Darken a hex color slightly (used for QuickAction borders)
 */
function darkenColor(hex: string, amount = 0.15): string {
  let color = hex.replace("#", "");

  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));

  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
function applyOpacity(hex: string, alpha = 0.5): string {
  let color = hex.replace("#", "");

  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(color, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function QuickAction({
  label,
  icon,
  backgroundColor,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  backgroundColor: string;
  onPress?: () => void;
}) {
  const borderColor = darkenColor(backgroundColor, 0.09);
  const bgWithOpacity = applyOpacity(backgroundColor, 0.5); // 👈 lower opacity here

  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        {
          backgroundColor: bgWithOpacity,
          borderColor,
        },
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color="#374151" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityItem({
  title,
  by,
  time,
}: {
  title: string;
  by: string;
  time: string;
}) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityTextBlock}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityBy}>{by}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcome: {
    fontSize: 18,
    fontFamily: "Karla-ExtraBold",
    marginBottom: 12,
    color: "#111827",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 13,
    color: ORANGE,
  },
  scanButton: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E89923",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scanButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  statTitle: {
    fontSize: 11,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    textTransform: "capitalize",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Karla-ExtraBold",
    color: "#000000ff",
  },
  statUnit: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#ffffffff",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    fontWeight: "700",
    color: "#673800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    flex: 1,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionCard: {
    width: "32%",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1, // border enabled for all quick actions
    borderColor: "transparent", // will be overridden dynamically
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: "Karla-Medium",
    fontWeight: "500",
    color: "#000000",
    marginTop: 4,
    textAlign: "center",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f5f5f593",
    borderWidth: 1,
    borderColor: "#f5f5f5b7",
    // soft shadow like the screenshot
    shadowColor: "#ffffffff",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  activityTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
  },
  activityBy: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Karla-Medium",
    color: "#6b7280",
  },
  activityTime: {
    fontSize: 11,
    fontFamily: "Karla-Medium",
    color: "#9ca3af",
  },
});
