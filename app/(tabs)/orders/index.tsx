// app/(tabs)/orders/index.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard"; // ✅ use BasicCard
import SearchInput from "../../../components/input/SearchInput";
import { SegmentedTabs } from "../../../components/tab/SegmentedTabs";
import { useLanguage } from "../../../contexts/LanguageContext";

import { Pencil } from "lucide-react-native";
import CustomButton from "@/components/button/CustomButton";

const ORANGE = "#EE9328";

type TabKey = "all" | "out_for_delivery" | "completed";

type AssignedDoRow = {
  id: number;
  doNo: string; // PL-2025-01-11
  date: string; // 2025-01-11
  customers: number; // 3 customers
  weightKg: number; // 12.4
  status: "out_for_delivery" | "completed";
  truck: string; // TRK-12
};

const HARD_CODED: AssignedDoRow[] = [
  {
    id: 1,
    doNo: "PL-2025-01-11",
    date: "2025-01-11",
    customers: 3,
    weightKg: 12.4,
    status: "out_for_delivery",
    truck: "TRK-12",
  },
  {
    id: 2,
    doNo: "PL-2025-01-10",
    date: "2025-01-10",
    customers: 3,
    weightKg: 12.4,
    status: "completed",
    truck: "TRK-12",
  },
];

function statusLabel(s: AssignedDoRow["status"]) {
  return s === "completed" ? "Completed" : "Out for Delivery";
}

export default function OrdersScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const out = HARD_CODED.filter((x) => x.status === "out_for_delivery").length;
    const done = HARD_CODED.filter((x) => x.status === "completed").length;
    return { all: HARD_CODED.length, out_for_delivery: out, completed: done };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base =
      activeTab === "all"
        ? HARD_CODED
        : HARD_CODED.filter((x) => x.status === activeTab);

    if (!q) return base;

    return base.filter((x) => {
      const hay = `${x.doNo} ${x.date} ${x.customers} ${x.weightKg} ${statusLabel(x.status)} ${x.truck}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeTab, search]);

  const goDetail = (row: AssignedDoRow) => {
    router.push({
      pathname: "/orders/detail",
      params: { doNo: row.doNo, backTo: "/orders" },
    });
  };

  const renderItem: ListRenderItem<AssignedDoRow> = ({ item }) => {
    const isCompleted = item.status === "completed";

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => goDetail(item)} style={styles.cardWrap}>
        <BasicCard style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.doNo}>{item.doNo}</Text>

            <View style={styles.pillsRow}>
              <View
                style={[
                  styles.statusPill,
                  isCompleted ? styles.pillCompleted : styles.pillOutForDelivery,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isCompleted ? styles.pillCompletedText : styles.pillOutForDeliveryText,
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
              </View>

              <View style={styles.truckPill}>
                <Text style={styles.truckPillText}>Truck : {item.truck}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.metaText}>
            Date {item.date} • {item.customers} customers • {item.weightKg.toFixed(1)} kg
          </Text>

          <View style={styles.cardBottomRow}>
            <CustomButton
              preset="print"
              // icon={Pencil}
              iconPosition="left"
              iconSize={14}
              onPress={() => goDetail(item)}
            >
              {t("do_open_btn")}
            </CustomButton>
          </View>


        </BasicCard>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View style={styles.headerArea}>
      <SegmentedTabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        tabs={[
          { key: "all", label: "All", count: counts.all },
          { key: "out_for_delivery", label: "Out for Delivery", count: counts.out_for_delivery },
          { key: "completed", label: "Completed", count: counts.completed },
        ]}
      />

      <View style={styles.searchSection}>
        <SearchInput
          label={(((t("stock_search_label") as any) ?? "SEARCH") as string)}
          placeholder={(((t("stock_search_placeholder") as any) ?? "Search") as string)}
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch("")}
          containerStyle={styles.searchBoxWrapper}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="assigned_do" showBack backTo={backTo} />

      <View style={styles.content}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No data found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },

  headerArea: { paddingTop: 2, paddingBottom: 6 },
  searchSection: { marginTop: 2, marginBottom: 6 },
  searchBoxWrapper: { flex: 1 },

  listContent: { paddingBottom: 12 },
  emptyContainer: { flexGrow: 1, paddingTop: 30, paddingBottom: 20 },
  emptyText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#9ca3af" },

  cardWrap: { marginBottom: 12 },

  // ✅ BasicCard already has border/bg/radius/shadow; keep only spacing you want here
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  doNo: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    letterSpacing: 0.2,
  },

  pillsRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 12, fontFamily: "Karla-Bold" },

  pillOutForDelivery: { backgroundColor: "#E0F2FE", borderColor: "#BAE6FD" },
  pillOutForDeliveryText: { color: "#075985" },

  pillCompleted: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  pillCompletedText: { color: "#166534" },

  truckPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  truckPillText: { fontSize: 12, fontFamily: "Karla-Bold", color: ORANGE },

  metaText: { marginTop: 8, fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },

  cardBottomRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end" },
});
