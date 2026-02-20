// app/(tabs)/menu/pickup/index.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../../../components/AppHeader";
import Button from "../../../../components/button/Button";
import CustomButton from "../../../../components/button/CustomButton";
import BasicCard from "../../../../components/card/BasicCard";
import SearchInput from "../../../../components/input/SearchInput";

import { Eye, Plus } from "lucide-react-native";

const ORANGE = "#EE9328";
const PAGE_SIZE = 10;

type PickupRow = {
  id: number;
  pickup_code?: string | null;
  customer_code?: string | null;
  customer_name?: string | null;
  date_completed?: string | null;
  parcel_count?: number | null;
  total_weight?: number | null;
  total_m3?: number | null;

  // future-proof:
  fulfilment_method?: "pickup" | "delivery" | null;
};

function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function PickupHistoryScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ✅ empty by default (no API yet, no mock)
  const [rows, setRows] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  // ✅ if backend returns mixed methods later, keep only pickup-completed here
  const pickupOnly = useMemo(() => {
    return rows.filter((r) => (r.fulfilment_method ?? "pickup") === "pickup");
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pickupOnly;

    return pickupOnly.filter((x) => {
      const hay = [
        x.pickup_code || "",
        x.customer_code || "",
        x.customer_name || "",
        formatDateTime(x.date_completed),
        String(x.id),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [pickupOnly, search]);

  const rowsToShow = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleLoadMore = () => {
    if (loading) return;
    if (rowsToShow.length >= filtered.length) return;
    setPage((prev) => prev + 1);
  };

  const goToPickupView = useCallback(
    (row: PickupRow) => {
      const pickupCode = (row.pickup_code || `PU-${String(row.id).padStart(6, "0")}`).toString();

      router.push({
        pathname: "/menu/pickup/view",
        params: {
          backTo: "/menu/pickup",
          pickupId: String(row.id),
          pickupCode, // ✅ view page header will use this
        },
      });
    },
    [router]
  );

  const handleNewPickup = () => {
    router.push({
      pathname: "/menu/pickup/add", // ✅ your existing scan+confirm page
      params: { backTo: "/menu/pickup" },
    });
  };

  const renderItem: ListRenderItem<PickupRow> = ({ item }) => {
    const code = (item.pickup_code || `PU-${String(item.id).padStart(6, "0")}`).toString();
    const completed = formatDateTime(item.date_completed);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => goToPickupView(item)}
        style={styles.cardPressWrap}
      >
        <BasicCard style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.leftBlock}>
              <Text style={styles.title}>{code}</Text>

              <Text style={styles.subText}>
                Customer: {item.customer_code || "-"}{" "}
                {item.customer_name ? `• ${item.customer_name}` : ""}
              </Text>

              <Text style={styles.subText}>Completed: {completed}</Text>

              <Text style={styles.subText}>
                Parcels: {item.parcel_count ?? "-"}
                {"  •  "}Weight:{" "}
                {typeof item.total_weight === "number"
                  ? `${item.total_weight.toFixed(2)} kg`
                  : "-"}
                {"  •  "}m³:{" "}
                {typeof item.total_m3 === "number"
                  ? item.total_m3.toFixed(2)
                  : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <CustomButton
              preset="view"
              style={styles.viewBtn}
              icon={Eye}
              iconPosition="left"
              iconSize={14}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                goToPickupView(item);
              }}
            >
              View
            </CustomButton>
          </View>
        </BasicCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="menu_pickup" showBack backTo={backTo} />

      <View style={styles.content}>
        {/* Search + New button (same layout style as stock page) */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <SearchInput
              label="SEARCH"
              placeholder="Search pickup, customer, date..."
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch("")}
              containerStyle={styles.searchBoxWrapper}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <Button
              size="sm"
              rounded="md"
              variant="orange"
              bgColor={ORANGE}
              icon={Plus}
              iconPosition="left"
              style={styles.newButton}
              textStyle={styles.newButtonText}
              onPress={handleNewPickup}
            >
              New
            </Button>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#f59e0b" />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.center} activeOpacity={0.9}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={rowsToShow}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              filtered.length === 0 ? styles.emptyContainer : styles.listContent
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No pickup record found.</Text>
            }
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 16,
  },

  searchSection: { marginTop: 8, marginBottom: 2 },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchBoxWrapper: { flex: 1, marginRight: 8 },
  newButton: { height: 40, borderRadius: 10, paddingHorizontal: 16 },
  newButtonText: { fontFamily: "Karla-Bold", fontSize: 13 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#b91c1c",
    marginBottom: 4,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#f97316",
  },

  listContent: { paddingTop: 8, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#9ca3af" },

  card: { marginBottom: 0 },
  cardPressWrap: { marginBottom: 14 },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  leftBlock: { flex: 1, paddingRight: 10 },
  title: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    letterSpacing: 0.3,
  },
  subText: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  viewBtn: { paddingHorizontal: 14, paddingVertical: 10 },
});
