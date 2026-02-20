// app/(tabs)/dashboard/AdminDashboard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { ImageSourcePropType } from "react-native";
const ORANGE = "#EE9328";

interface AdminDashboardProps {
  displayName: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ displayName }) => {
  const router = useRouter();
  const { t } = useLanguage();

  const [creatingStockIn, setCreatingStockIn] = useState(false);

  // ✅ NEW: dashboard search input state
  const [dashboardSearch, setDashboardSearch] = useState("");

  const handleScan = useCallback(() => {
    router.push("/scan");
  }, [router]);

  // ✅ NEW: go to stock page and trigger search there
  const goToStockSearch = useCallback(() => {
    const q = dashboardSearch.trim();
    router.push({
      pathname: "/stock",
      params: {
        backTo: "/dashboard",
        q, // ✅ pass the typed keyword
      },
    });
  }, [router, dashboardSearch]);

  const welcomeTitle = useMemo(() => {
    return (t("staff_dashboard_welcome") || "Welcome, {name}!")
      .replace(
        "{name}",
        displayName || (t("staff_dashboard_default_admin") || "Admin")
      );
  }, [t, displayName]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Welcome */}
      <Text style={styles.welcome}>{welcomeTitle}</Text>

      {/* Search + Scan row */}
      <View style={styles.searchRow}>
        {/* ✅ Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#f59e0b" />

          <TextInput
            style={styles.searchInput}
            placeholder={t("staff_dashboard_search_parcel") || "Search Parcel"}
            placeholderTextColor="#f59e0b"
            value={dashboardSearch}
            onChangeText={setDashboardSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={goToStockSearch}
          />

          {/* ✅ Clear (x) button */}
          {dashboardSearch.trim().length > 0 ? (
            <TouchableOpacity
              onPress={() => setDashboardSearch("")}
              activeOpacity={0.8}
              style={styles.searchClearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={25} color="#f59e0b" />
            </TouchableOpacity>
          ) : null}

          {/* ✅ Search button */}
          <TouchableOpacity
            style={styles.searchGoBtn}
            activeOpacity={0.85}
            onPress={goToStockSearch}
          >
            <Ionicons name="arrow-forward-circle" size={25} color="#f59e0b" />
          </TouchableOpacity>
        </View>


        {/* Scan button */}
        {/* <TouchableOpacity
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
        </TouchableOpacity> */}
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
            iconPng={require("../../../assets/icon/pickup.png")}
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
            iconPng={require("../../../assets/icon/box.png")}
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
            iconPng= {require("../../../assets/icon/list.png")}
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
            iconPng={require("../../../assets/icon/stock.png")}
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
            iconPng={require("../../../assets/icon/menu.png")}
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
            iconPng={require("../../../assets/icon/setting.png")}
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
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
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
  if (color.length === 3) color = color.split("").map((c) => c + c).join("");
  const num = parseInt(color, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function QuickAction({
  label,
  icon,
  iconPng,
  backgroundColor,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconPng?: ImageSourcePropType;
  backgroundColor: string;
  onPress?: () => void;
}) {
  const borderColor = darkenColor(backgroundColor, 0.09);
  const bgWithOpacity = applyOpacity(backgroundColor, 0.5);

  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: bgWithOpacity, borderColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {iconPng ? (
        <Image source={iconPng} style={styles.actionPngIcon} resizeMode="contain" />
      ) : (
        <Ionicons name={(icon || "cube-outline") as any} size={22} color="#374151" />
      )}      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityItem({ title, by, time }: { title: string; by: string; time: string }) {
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
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  welcome: {
    fontSize: 18,
    fontFamily: "Karla-ExtraBold",
    marginBottom: 12,
    color: "#111827",
    textTransform: "uppercase",
  },

  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },

  // ✅ upgraded to include TextInput + Go button
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 4,
  },
  searchGoBtn: {
    marginLeft: 12,
    // width: 34,
    // height: 34,
    // borderRadius: 10,
    // backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  searchClearBtn: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#ffffffff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  statTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontFamily: "Karla-ExtraBold", color: "#000000ff" },
  statUnit: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  sectionCard: {
    backgroundColor: "#ffffffff",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    fontWeight: "700",
    color: "#673800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    flex: 1,
  },
  chip: { borderRadius: 999, backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 10, color: "#92400e", fontWeight: "600" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
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
    fontSize: 13,
    fontFamily: "Karla-Medium",
    fontWeight: "500",
    color: "#000000",
    marginTop: 4,
    textAlign: "center",
  },
  actionPngIcon: {
    marginTop: 5,
    marginBottom: 5,
    width: 22,
    height: 22,
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
  activityTextBlock: { flex: 1, marginRight: 12 },
  activityTitle: { fontSize: 13, fontFamily: "Karla-ExtraBold", color: ORANGE },
  activityBy: { marginTop: 2, fontSize: 13, fontFamily: "Karla-Medium", color: "#6b7280" },
  activityTime: { fontSize: 11, fontFamily: "Karla-Medium", color: "#9ca3af" },
});

export default AdminDashboard;
