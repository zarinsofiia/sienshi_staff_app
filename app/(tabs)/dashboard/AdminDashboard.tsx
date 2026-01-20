// app/(tabs)/dashboard/AdminDashboard.tsx
import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ActivityIndicator } from "react-native";
import { authedFetch } from "../../../config/mobileApiClient";
import { API_BASE_URL } from "../../../config/api";

const ORANGE = "#EE9328";

interface AdminDashboardProps {
  displayName: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ displayName }) => {
  const router = useRouter();
  const { t } = useLanguage();

  const [creatingStockIn, setCreatingStockIn] = useState(false);

  const handleScan = useCallback(async () => {
    if (creatingStockIn) return;

    setCreatingStockIn(true);
    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/create_stock_in`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.log("create_stock_in error:", res.status, text || data);
        return;
      }

      const stockinId =
        data?.id ||
        data?.stockin_id ||
        data?.stock_in_id ||
        data?.data?.id ||
        data?.data?.stockin_id ||
        null;

      router.push({
        pathname: "/scan",
        params: {
          backTo: "/dashboard",
          ...(stockinId ? { stockinId: String(stockinId) } : {}),
        },
      });
    } catch (e) {
      console.log("create_stock_in exception:", e);
    } finally {
      setCreatingStockIn(false);
    }
  }, [creatingStockIn, router]);


  const welcomeTitle = (t("staff_dashboard_welcome") || "Welcome, {name}!")
    .replace("{name}", displayName || (t("staff_dashboard_default_admin") || "Admin"));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Welcome */}
      <Text style={styles.welcome}>{welcomeTitle}</Text>

      {/* Search + Scan row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <Text style={styles.searchPlaceholder}>
            {t("staff_dashboard_search_parcel") || "Search Parcel"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScan}
          disabled={creatingStockIn}
        >
          {creatingStockIn ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
          )}
          <Text style={styles.scanButtonText}>
            {t("staff_dashboard_scan") || "Scan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top 4 stats cards */}
      <View style={styles.statsGrid}>
        <StatCard title={t("staff_stat_stock") || "Stock"} value={0} unitLabel={t("staff_unit_parcels") || "parcels"} />
        <StatCard title={t("staff_stat_unassigned_truck") || "Unassigned To Truck"} value={0} unitLabel={t("staff_unit_packing") || "packing"} />
        <StatCard title={t("staff_stat_out_for_delivery") || "Out for Delivery"} value={0} unitLabel={t("staff_unit_trucks") || "trucks"} />
        <StatCard title={t("staff_stat_today_stock_in") || "Today's Stock In"} value={0} unitLabel={t("staff_unit_parcels") || "parcels"} />
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t("staff_dashboard_quick_actions") || "QUICK ACTIONS"}
          </Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {t("staff_dashboard_shortcuts") || "Shortcuts"}
            </Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          <QuickAction
            label={t("staff_action_handle_pickup") || "Handle Pickup"}
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
            label={t("staff_action_create_packing") || "Create Packing"}
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
            label={t("staff_action_packing_list") || "Packing List"}
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
            label={t("staff_action_stock_list") || "Stock List"}
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
            label={t("staff_action_menu") || "Menu"}
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
            label={t("staff_action_settings") || "Setting"}
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
        <Text style={styles.sectionTitle}>
          {t("staff_dashboard_recent_activity") || "RECENT ACTIVITY"}
        </Text>

        <ActivityItem
          title={t("staff_recent_packing_created")?.replace("{code}", "P123455") || "Packing P123455 created"}
          by={t("staff_recent_by_admin") || "by Admin"}
          time={t("staff_recent_15m") || "15m ago"}
        />
        <ActivityItem
          title={t("staff_recent_packing_created")?.replace("{code}", "P123495") || "Packing P123495 created"}
          by={t("staff_recent_by_admin") || "by Admin"}
          time={t("staff_recent_20m") || "20m ago"}
        />
        <ActivityItem
          title={t("staff_recent_truck_out")?.replace("{code}", "T78231") || "Truck T78231 out for delivery"}
          by={t("staff_recent_by_admin") || "by Admin"}
          time={t("staff_recent_1h") || "1h ago"}
        />
      </View>
    </ScrollView>
  );
};

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

function darkenColor(hex: string, amount = 0.15): string {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color.split("").map((c) => c + c).join("");
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));

  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function applyOpacity(hex: string, alpha = 0.5): string {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color.split("").map((c) => c + c).join("");
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
  const bgWithOpacity = applyOpacity(backgroundColor, 0.5);

  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: bgWithOpacity, borderColor },
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
    textTransform: "uppercase",
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
    fontSize: 12,
    color: "#9ca3af",
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
    fontSize: 12,
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
    backgroundColor: "#ffffffff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  statTitle: {
    fontSize: 10,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    textTransform: "uppercase",
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
    fontSize: 9,
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
    borderWidth: 1,
    borderColor: "transparent",
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
    backgroundColor: "#fffafa93",
    borderWidth: 1,
    borderColor: "#c7c2c27e",
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
    fontSize: 12,
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

export default AdminDashboard;
