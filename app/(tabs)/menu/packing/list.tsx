// app/(tabs)/menu/packing/list.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../../components/AppHeader";
import { useLocalSearchParams, router } from "expo-router";
import { SegmentedTabs } from "../../../../components/tab/SegmentedTabs";
import SearchInput from "../../../../components/input/SearchInput";
import BasicCard from "../../../../components/card/BasicCard";
import Button from "../../../../components/button/Button";
import CustomButton from "../../../../components/button/CustomButton";
import { Plus, Printer, Truck, Eye } from "lucide-react-native";

type PackingTabKey = "all" | "draft" | "assigned" | "complete";
type PackingStatus = "draft" | "assigned" | "complete";

interface PackingItem {
  id: string;
  code: string;
  status: PackingStatus;
  createdAt: string;
  itemCount: number;
  weightKg: number;
  truckLabel: string;
}

const ORANGE = "#f59e0b";

// 🔸 TEMP MOCK DATA – replace with real API later
const MOCK_ITEMS: PackingItem[] = [
  {
    id: "1",
    code: "PL-000003",
    status: "assigned",
    createdAt: "2025-11-04 11:20",
    itemCount: 5,
    weightKg: 12.4,
    truckLabel: "TRK-12",
  },
  {
    id: "2",
    code: "PL-000002",
    status: "draft",
    createdAt: "2025-11-04 11:20",
    itemCount: 5,
    weightKg: 12.4,
    truckLabel: "-",
  },
  {
    id: "3",
    code: "PL-000001",
    status: "complete",
    createdAt: "2025-11-04 11:20",
    itemCount: 5,
    weightKg: 12.4,
    truckLabel: "TRK-12",
  },
  {
    id: "4",
    code: "PL-000001",
    status: "complete",
    createdAt: "2025-11-04 11:20",
    itemCount: 5,
    weightKg: 12.4,
    truckLabel: "TRK-12",
  },
  {
    id: "5",
    code: "PL-000001",
    status: "complete",
    createdAt: "2025-11-04 11:20",
    itemCount: 5,
    weightKg: 12.4,
    truckLabel: "TRK-12",
  },
];

export default function PackingListScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const [activeTab, setActiveTab] = useState<PackingTabKey>("all");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<{
    all: number;
    draft: number;
    assigned: number;
    complete: number;
  }>({
    all: 0,
    draft: 0,
    assigned: 0,
    complete: 0,
  });

  const tabs = [
    { key: "all" as PackingTabKey, label: "All", count: counts.all },
    { key: "draft" as PackingTabKey, label: "Draft", count: counts.draft },
    {
      key: "assigned" as PackingTabKey,
      label: "Assigned",
      count: counts.assigned,
    },
    {
      key: "complete" as PackingTabKey,
      label: "Completed",
      count: counts.complete,
    },
  ];

  const handleChangeTab = (key: string) => {
    setActiveTab(key as PackingTabKey);
  };

  // 🔸 Single place to change later when you have API
  const fetchFromApi = useCallback(
    async (tab: PackingTabKey): Promise<PackingItem[]> => {
      // TODO: replace this block with your real API call
      // Example shape:
      // const res = await authedFetch(`${API_BASE_URL}/api/packing/list?status=${tab}`, { method: "GET" });
      // const data = await res.json();
      // return data as PackingItem[];

      // For now: simulate per-tab filtering using mock data
      const all = MOCK_ITEMS;

      if (tab === "all") return all;
      return all.filter((item) => item.status === tab);
    },
    []
  );

  const fetchPackingLists = useCallback(
    async (tab: PackingTabKey) => {
      try {
        setLoading(true);
        setError(null);

        const list = await fetchFromApi(tab);
        setItems(list);
      } catch (err) {
        console.log("fetchPackingLists error:", err);
        setError("Failed to load packing list. Tap to retry.");
      } finally {
        setLoading(false);
      }
    },
    [fetchFromApi]
  );

  const fetchCountsForAllTabs = useCallback(async () => {
    try {
      const allTabs: PackingTabKey[] = ["all", "draft", "assigned", "complete"];

      const results = await Promise.all(
        allTabs.map((tab) =>
          fetchFromApi(tab).catch((err) => {
            console.log("fetchCountsForAllTabs error for", tab, err);
            return null;
          })
        )
      );

      setCounts((prev) => {
        const next = { ...prev };
        allTabs.forEach((tab, index) => {
          const list = results[index];
          if (Array.isArray(list)) {
            (next as any)[tab] = list.length;
          }
        });
        return next;
      });
    } catch (err) {
      console.log("fetchCountsForAllTabs outer error:", err);
    }
  }, [fetchFromApi]);

  // Load list when tab changes
  useEffect(() => {
    fetchPackingLists(activeTab);
  }, [activeTab, fetchPackingLists]);

  // Load counts once (or if fetch function changes)
  useEffect(() => {
    fetchCountsForAllTabs();
  }, [fetchCountsForAllTabs]);

  // Search filter (on already-fetched list)
  const searchQuery = search.trim().toLowerCase();
  const filteredItems = !searchQuery
    ? items
    : items.filter((item) =>
      item.code.toLowerCase().includes(searchQuery)
    );

  const renderItem: ListRenderItem<PackingItem> = ({ item }) => {
    const statusLabel =
      item.status === "draft"
        ? "Draft"
        : item.status === "assigned"
          ? "Assigned"
          : "Completed";

    const statusStyle =
      item.status === "draft"
        ? styles.statusChipDraft
        : item.status === "assigned"
          ? styles.statusChipAssigned
          : styles.statusChipCompleted;

    return (
      <BasicCard style={styles.card}>
        {/* Top row: Code + status + truck pill */}
        <View style={styles.cardTopRow}>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{item.code}</Text>
            <View style={[styles.statusChip, statusStyle]}>
              <Text style={styles.statusChipText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.truckChip}>
            <Text style={styles.truckChipText}>{`Truck : ${item.truckLabel}`}</Text>
          </View>
        </View>

        {/* Meta row */}
        <Text style={styles.metaText}>
          {`Created ${item.createdAt} · ${item.itemCount} items · ${item.weightKg} kg`}
        </Text>

        {/* Buttons row */}
        <View style={styles.buttonRow}>
          <CustomButton
            preset="info"
            style={styles.assignBtn}
            icon={Truck}
            iconPosition="left"
            iconSize={14}
          >
            Assign
          </CustomButton>

          <CustomButton
            preset="view"
            style={styles.viewBtn}
            icon={Eye}
            iconPosition="left"
            iconSize={14}
          >
            View
          </CustomButton>

          <CustomButton
            preset="print"
            style={styles.printBtn}
            icon={Printer}
            iconPosition="left"
            iconSize={14}
          >
            Print
          </CustomButton>
        </View>

      </BasicCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Top header */}
      <AppHeader titleKey="menu_packing_list" showBack backTo={backTo} />

      {/* Main content area */}
      <View style={styles.content}>
        {/* Tabs */}
        <SegmentedTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={handleChangeTab}
        />

        {/* Search row using SearchInput */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <SearchInput
              label="SEARCH"
              placeholder="Search"
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchBoxWrapper}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <Button
              size="sm"
              rounded="md"
              variant="orange"
              bgColor="#EE9328"
              icon={Plus}
              iconPosition="left"
              style={styles.newButton}
              textStyle={styles.newButtonText}
              onPress={() => {
                router.push({
                  pathname: "/menu/packing/create",
                  params: {
                    backTo: "/menu/packing/list", // ✅ forward backTo (or default to list)
                  },
                });
              }}

            >
              New
            </Button>
          </View>
        </View>

        {/* Loading / Error / List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={ORANGE} />
          </View>
        ) : error ? (
          <TouchableOpacity
            style={styles.center}
            onPress={() => fetchPackingLists(activeTab)}
          >
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={
              filteredItems.length === 0
                ? styles.emptyContainer
                : styles.listContent
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No packing lists found.</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 16,
  },

  /* Search */
  searchSection: {
    marginTop: 8,
    marginBottom: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBoxWrapper: {
    flex: 1,
    marginRight: 8,
  },
  newButton: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  newButtonText: {
    fontFamily: "Karla-Bold",
    fontSize: 12,
  },


  /* Loading / Error */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#b91c1c",
    marginBottom: 4,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    color: "#f97316",
  },

  /* List */
  listContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#9ca3af",
  },

  /* Card */
  card: {
    marginBottom: 18,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeText: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: "Karla-Bold",
  },
  statusChipDraft: {
    backgroundColor: "#fef3c7",
  },
  statusChipAssigned: {
    backgroundColor: "#e0e7ff",
  },
  statusChipCompleted: {
    backgroundColor: "#dcfce7",
  },
  truckChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  truckChipText: {
    fontSize: 11,
    fontFamily: "Karla-Bold",
    color: "#4b5563",
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    marginBottom: 12,
    marginTop: 10
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // was 'space-between'
    marginTop: 4,
  },

  assignBtn: {
    marginRight: 8,               // remove flex: 1.1
  },

  viewBtn: {
    marginRight: 8,               // remove flex: 0.9
  },

  printBtn: {
    // no flex, let CustomButton minWidth handle it
  },

});
