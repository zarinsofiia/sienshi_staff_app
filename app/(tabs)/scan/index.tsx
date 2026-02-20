// app/(tabs)/scan/index.tsx
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

import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";
import { SegmentedTabs } from "../../../components/tab/SegmentedTabs";
import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";
import { useLanguage } from "../../../contexts/LanguageContext";

import { Eye, ScanLine } from "lucide-react-native";
import CustomButton from "../../../components/button/CustomButton";

const ORANGE = "#EE9328";
const GREEN_BG = "#EAF7D1";
const GREEN_BORDER = "#CFE8A4";
const PAGE_SIZE = 10;
type TabKey = "pending" | "completed";

type ApiManifestRow = {
  id: number;
  manifest_details?: string | null;
  created_date?: string | null;
  status?: string | null;
  date_pack?: string | null;
  total_parcels?: string | number | null;
  total_stockin_items?: string | number | null;
};

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function normalizeTab(tab?: string | string[] | null): TabKey | null {
  const raw = Array.isArray(tab) ? tab[0] : tab;
  const v = (raw || "").toLowerCase().trim();
  if (v === "pending") return "pending";
  if (v === "completed" || v === "complete" || v === "done") return "completed";
  return null;
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatTimeHHMM(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

export default function StockScreen() {
  const params = useLocalSearchParams<{ backTo?: string; tab?: string | string[] }>();
  const backTo: string | undefined = (params.backTo ?? undefined) as string | undefined;

  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabKey>(() => normalizeTab(params.tab) ?? "pending");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<ApiManifestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<{ pending: number; completed: number }>({
    pending: 0,
    completed: 0,
  });

  const [page, setPage] = useState(1);
  useEffect(() => {
    const next = normalizeTab(params.tab);
    if (!next) return;
    setActiveTab((prev) => (prev === next ? prev : next));
  }, [params.tab]);

  const fetchListing = useCallback(
    async (tab: TabKey) => {
      try {
        setLoading(true);
        setError(null);

        const res = await authedFetch(`${API_BASE_URL}/api/stock_in/get_stockin_listing`, {
          method: "POST",
          body: JSON.stringify({ status: tab }),
        });

        const text = await res.text().catch(() => "");
        const data = safeJsonParse(text);

        if (!res.ok) {
          console.log("get_stockin_listing error:", res.status, text || data);
          throw new Error("Network error");
        }

        const list: ApiManifestRow[] = Array.isArray(data) ? (data as any[]) : [];

        // newest first
        list.sort((a, b) => {
          const ta = a.created_date ? new Date(a.created_date).getTime() : 0;
          const tb = b.created_date ? new Date(b.created_date).getTime() : 0;
          return tb - ta;
        });

        setRows(list);
        setPage(1);
        setCounts((prev) => ({ ...prev, [tab]: list.length }));
      } catch (e) {
        console.log("fetchListing exception:", e);
        setRows([]);
        setError((((t("stock_list_error") as any) ?? "Failed to load listing") as string) || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const fetchCounts = useCallback(async () => {
    const tabs: TabKey[] = ["pending", "completed"];
    try {
      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            const res = await authedFetch(`${API_BASE_URL}/api/stock_in/get_stockin_listing`, {
              method: "POST",
              body: JSON.stringify({ status: tab }),
            });

            const text = await res.text().catch(() => "");
            const data = safeJsonParse(text);

            if (!res.ok) return [];
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
      );

      setCounts({
        pending: results[0]?.length || 0,
        completed: results[1]?.length || 0,
      });
    } catch (e) {
      console.log("fetchCounts exception:", e);
    }
  }, []);

  useEffect(() => {
    fetchListing(activeTab);
  }, [activeTab, fetchListing]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);
  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((x) => {
      const stockedIn = toNum(x.total_stockin_items);
      const total = toNum(x.total_parcels);

      const hay = [
        `manifest ${x.id}`,
        x.manifest_details || "",
        x.status || "",
        String(stockedIn),
        String(total),
        `${stockedIn}/${total}`,
        formatTimeHHMM(x.created_date),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search]);

  const rowsToShow = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    if (rowsToShow.length >= filtered.length) return;
    setPage((prev) => prev + 1);
  }, [loading, rowsToShow.length, filtered.length]);

  const goDetail = (row: ApiManifestRow) => {
    const isCompleted = activeTab === "completed";

    router.push({
      pathname: isCompleted ? "/scan/view_completed" : "/scan/list",
      params: {
        manifestId: String(row.id),
        manifestTitle: (row.manifest_details || "").toString(),
        backTo: `/(tabs)/scan?tab=${activeTab}`,
      },
    });
  };



  const renderItem: ListRenderItem<ApiManifestRow> = ({ item }) => {
    const title = `MANIFEST ${item.id}`;
    const updatedAt = formatTimeHHMM(item.created_date);

    const stockedIn = toNum(item.total_stockin_items);
    const total = toNum(item.total_parcels);

    const subtitleLeft = `Manifest ${item.id} • ${(((t("common_updated") as any) ?? "Updated") as string)} ${updatedAt}`;

    const isCompleted = activeTab === "completed";
    const actionLabel = isCompleted
      ? ((((t("common_view") as any) ?? "View") as string) || "View")
      : ((((t("scan") as any) ?? "Scan") as string) || "Scan");

    const ActionIcon = isCompleted ? Eye : ScanLine;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => goDetail(item)} style={styles.cardPressWrap}>
        <BasicCard style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSub}>{subtitleLeft}</Text>

              {item.manifest_details ? (
                <Text style={styles.cardDetails} numberOfLines={2}>
                  {item.manifest_details}
                </Text>
              ) : null}
            </View>

            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {stockedIn}/{total} {(((t("stock_stocked_in") as any) ?? "stocked in") as string)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <CustomButton
              preset="view"
              icon={ActionIcon as any}
              iconPosition="left"
              iconSize={14}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                goDetail(item);
              }}
            >
              {actionLabel}
            </CustomButton>
          </View>
        </BasicCard>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_stock_in" showBack backTo={backTo} />

      <View style={styles.content}>
        <SegmentedTabs
          activeKey={activeTab}
          onChange={(key) => {
            const next = key as TabKey;
            setActiveTab(next);
            router.setParams({ tab: next });
          }}
          tabs={[
            {
              key: "pending",
              label: (((t("stock_tab_pending") as any) ?? "Pending") as string),
              count: counts.pending,
            },
            {
              key: "completed",
              label: (((t("stock_tab_completed") as any) ?? "Completed") as string),
              count: counts.completed,
            },
          ]}
        />

        {/* ✅ prevent collapse/overlap on Expo Go (Android) */}
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

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={ORANGE} />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.center} onPress={() => fetchListing(activeTab)} activeOpacity={0.9}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>
              {(((t("stock_list_retry") as any) ?? "Tap to retry") as string)}
            </Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={rowsToShow}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {(((t("stock_list_empty") as any) ?? "No data found.") as string)}
              </Text>
            }
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              rowsToShow.length < filtered.length ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={ORANGE} />
                </View>
              ) : null
            }
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
    backgroundColor: "#ffffff",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#b91c1c", marginBottom: 4 },
  retryText: { fontSize: 13, fontFamily: "Karla-Bold", color: ORANGE },

  // ✅ prevent collapse/overlap on Expo Go (Android)
  searchSection: {
    marginTop: 2,
    marginBottom: 6,
    backgroundColor: "#ffffff",
    zIndex: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },
  searchBoxWrapper: { flex: 1 },

  listContent: { paddingTop: 8, paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#9ca3af" },

  cardPressWrap: { marginBottom: 14 },

  card: {
    // BasicCard already provides: bg, border, padding, radius
    // Keep only extra spacing/shadow you want on the listing screen
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  cardDetails: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#111827",
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
    fontSize: 10,
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

  


  footerLoading: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

});
