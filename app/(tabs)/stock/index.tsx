//app/(tabs)/stock/index.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, ListRenderItem, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/button/CustomButton";
import { Eye, Printer } from "lucide-react-native";
import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";
import { useLanguage } from "../../../contexts/LanguageContext";

const ORANGE = "#EE9328";

type PalletRow = {
  id: number;
  name: string;
  updatedAt: string;
  parcelCount: number;
};

const HARD_CODED: PalletRow[] = [
  { id: 1, name: "PALLET A", updatedAt: "10:21", parcelCount: 18 },
  { id: 2, name: "PALLET B", updatedAt: "10:21", parcelCount: 18 },
  { id: 3, name: "PALLET C", updatedAt: "10:21", parcelCount: 18 },
  { id: 4, name: "PALLET D", updatedAt: "10:21", parcelCount: 18 },
  { id: 5, name: "PALLET E", updatedAt: "10:21", parcelCount: 18 },
];

export default function StockScreen() {
  const params = useLocalSearchParams<{ backTo?: string; q?: string }>();
  const backTo: string | undefined = (params.backTo ?? undefined) as string | undefined;

  const router = useRouter();
  const { t } = useLanguage();

  // ✅ initial value from dashboard param q
  const [search, setSearch] = useState(String(params.q ?? ""));

  // ✅ keep in sync when dashboard pushes new q again
  React.useEffect(() => {
    setSearch(String(params.q ?? ""));
  }, [params.q]);

  // ✅ this already "does the searching" using your current filter logic
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HARD_CODED;

    return HARD_CODED.filter((x) => {
      const hay = `${x.name} ${x.updatedAt} ${x.parcelCount}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search]);

  const onView = (row: PalletRow) => {};
  const onPrint = (row: PalletRow) => {};

  const renderItem: ListRenderItem<PalletRow> = ({ item }) => {
    return (
      <BasicCard style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.name.replace("PALLET", "Pallet").trim()} •{" "}
              {(((t("common_updated") as any) ?? "Updated") as string)}{" "}
              {item.updatedAt}
            </Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {item.parcelCount} {(((t("stock_parcels") as any) ?? "parcels") as string)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <CustomButton
            preset="view"
            icon={Eye}
            iconPosition="left"
            iconSize={14}
            onPress={() => onView(item)}
          >
            {t("common_view")}
          </CustomButton>

          <CustomButton
            preset="print"
            icon={Printer}
            iconPosition="left"
            iconSize={14}
            onPress={() => onPrint(item)}
          >
            {t("common_print")}
          </CustomButton>
        </View>
      </BasicCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_stock" showBack backTo={backTo} />

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
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

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {(((t("stock_list_empty") as any) ?? "No data found.") as string)}
            </Text>
          }
        />
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

  searchSection: { marginTop: 8, marginBottom: 6 },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchBoxWrapper: { flex: 1, marginRight: 8 },

  listContent: { paddingTop: 8, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#9ca3af" },

  card: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardLeft: { flex: 1, paddingRight: 10 },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    letterSpacing: 0.4,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#2e2f31",
  },

  countPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
  },
  countPillText: {
    fontSize: 11,
    fontFamily: "Karla-Bold",
    color: "#2e2f31",
  },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
});
