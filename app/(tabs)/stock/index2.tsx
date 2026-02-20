// app/(tabs)/stock/index.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SegmentedTabs } from "../../../components/tab/SegmentedTabs";
import { useLanguage } from "../../../contexts/LanguageContext";

import Button from "../../../components/button/Button";
import CustomButton from "../../../components/button/CustomButton";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";

import { Eye, Plus, Trash2 } from "lucide-react-native";

import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";

import type { MobileDialogState } from "../../../components/hooks/useMobileCustomerApprovalFlow";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import MobileAlertDialog from "../../../components/modal/MobileAlertDialog";

const ORANGE = "#EE9328";
const PAGE_SIZE = 10;
type TabKey = "in_progress" | "completed";

type StockInRow = {
  id: number;
  stockin_code?: string | null;
  date_created?: string | null;
  status?: string | null;
  created_by?: number | null;
  date_completed?: string | null;
  parcel_count?: number | null;
};

function formatStatusLabel(status?: string | null) {
  const raw = (status || "").trim();
  if (!raw) return "-";
  return raw.replace(/[_-]+/g, " ").toUpperCase();
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

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
  if (v === "in_progress" || v === "in-progress" || v === "progress") return "in_progress";
  if (v === "completed" || v === "complete" || v === "done") return "completed";
  return null;
}

export default function StockScreen() {
  const params = useLocalSearchParams<{ backTo?: string; tab?: string | string[] }>();
  const backTo: string | undefined = (params.backTo ?? undefined) as string | undefined;

  const router = useRouter();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    return normalizeTab(params.tab) ?? "in_progress";
  });

  useEffect(() => {
    const next = normalizeTab(params.tab);
    if (!next) return;
    setActiveTab((prev) => (prev === next ? prev : next));
  }, [params.tab]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<StockInRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<{ in_progress: number; completed: number }>({
    in_progress: 0,
    completed: 0,
  });

  // ✅ Delete flow
  const [deleteTarget, setDeleteTarget] = useState<StockInRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Alert dialog
  const [dialog, setDialog] = useState<MobileDialogState | null>(null);
  const closeDialog = () => setDialog(null);

  const showError = (title: string, message: string) => {
    setDialog({ open: true, type: "error", title, message } as any);
  };
  const showSuccess = (title: string, message: string) => {
    setDialog({ open: true, type: "success", title, message } as any);
  };

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

        const list: StockInRow[] = Array.isArray(data)
          ? (data as any[]).map((r) => ({
            ...r,
            parcel_count:
              r?.parcel_count === null || r?.parcel_count === undefined || r?.parcel_count === ""
                ? null
                : Number(r.parcel_count),
          }))
          : [];

        // newest first by date_created
        list.sort((a, b) => {
          const ta = a.date_created ? new Date(a.date_created).getTime() : 0;
          const tb = b.date_created ? new Date(b.date_created).getTime() : 0;
          return tb - ta;
        });

        setRows(list);
        setPage(1);
        setCounts((prev) => ({ ...prev, [tab]: list.length }));
      } catch (e) {
        console.log("fetchListing exception:", e);
        setError(((t("stock_list_error") as any) ?? "Failed to load stock-in listing") as string);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const fetchCounts = useCallback(async () => {
    const tabs: TabKey[] = ["in_progress", "completed"];
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
            return Array.isArray(data) ? (data as StockInRow[]) : [];
          } catch {
            return [];
          }
        })
      );

      setCounts({
        in_progress: results[0]?.length || 0,
        completed: results[1]?.length || 0,
      });
    } catch (e) {
      console.log("fetchCounts exception:", e);
    }
  }, []);

  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }

      fetchListing(activeTab);
      fetchCounts();
    }, [activeTab, fetchListing, fetchCounts])
  );

  useEffect(() => {
    fetchListing(activeTab);
  }, [activeTab, fetchListing]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((x) => {
      const hay = [
        x.stockin_code || "",
        formatDateTime(x.date_created),
        formatStatusLabel(x.status),
        String(x.id),
        // optional: allow searching parcel count
        x.parcel_count == null ? "" : String(x.parcel_count),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search]);

  const rowsToShow = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const handleLoadMore = () => {
    if (loading) return;
    if (rowsToShow.length >= filtered.length) return;
    setPage((prev) => prev + 1);
  };

  // ✅ IMPORTANT: use absolute tab route for nested tabs
  const stockBackTo = useMemo(() => `/(tabs)/stock?tab=${activeTab}`, [activeTab]);

  const goToStockin = useCallback(
    (item: StockInRow) => {
      const isCompletedTab = activeTab === "completed";

      router.push({
        pathname: isCompletedTab ? "/stock/view" : "/scan",
        params: {
          backTo: stockBackTo,
          stockinId: String(item.id),
          stockinCode: String(item.stockin_code || ""),
        },
      });
    },
    [activeTab, router, stockBackTo]
  );

  const handleCreateStockIn = async () => {
    try {
      const res = await authedFetch(`${API_BASE_URL}/api/stock_in/create_stock_in`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse(text);

      if (!res.ok) {
        console.log("create_stock_in error:", res.status, text || data);
        return;
      }

      const stockinId =
        data?.id || data?.stockin_id || data?.stock_in_id || data?.data?.id || data?.data?.stockin_id || null;

      router.push({
        pathname: "/scan",
        params: {
          backTo: stockBackTo,
          ...(stockinId ? { stockinId: String(stockinId) } : {}),
        },
      });
    } catch (e) {
      console.log("create_stock_in exception:", e);
    }
  };

  const doDeleteStockIn = async (row: StockInRow) => {
    if (deletingId) return;

    setDeletingId(row.id);
    try {
      const res = await authedFetch(`${API_BASE_URL}/api/stock_in/delete_stockin`, {
        method: "POST",
        body: JSON.stringify({ stockin_id: String(row.id) }),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse(text);

      if (!res.ok) {
        console.log("delete_stockin error:", res.status, text || data);
        showError(
          (((t("stock_delete_failed_title") as any) ?? "Delete failed") as string),
          (((t("stock_delete_failed_message") as any) ?? "Unable to delete this stock-in. Please try again.") as string)
        );
        return;
      }

      // ✅ optimistic remove from list
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      setPage(1);
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, (prev as any)[activeTab] - 1),
      }));

      showSuccess(
        (((t("stock_delete_success_title") as any) ?? "Deleted") as string),
        (((t("stock_delete_success_message") as any) ?? "Stock-in has been deleted.") as string)
      );

      fetchCounts();
    } catch (e) {
      console.log("delete_stockin exception:", e);
      showError(
        (((t("stock_delete_failed_title") as any) ?? "Delete failed") as string),
        (((t("stock_delete_failed_message") as any) ?? "Unable to delete this stock-in. Please try again.") as string)
      );
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  function getStatusPillStyle(status?: string | null) {
    const s = (status || "").toLowerCase().trim();
    const base = { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" };

    if (s === "in_progress" || s === "in progress") return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412" };
    if (s === "complete" || s === "completed") return { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" };
    if (s === "cancelled" || s === "canceled" || s === "rejected")
      return { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" };

    return base;
  }

  const renderItem: ListRenderItem<StockInRow> = ({ item }) => {
    const code = (item.stockin_code || `#${item.id}`).toString();
    const created = formatDateTime(item.date_created);
    const statusLabel = formatStatusLabel(item.status);
    const isDeletingThis = deletingId === item.id;
    const pill = getStatusPillStyle(item.status);

    const parcelCountText =
      item.parcel_count === null || item.parcel_count === undefined ? "-" : String(item.parcel_count);

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => goToStockin(item)} style={styles.cardPressWrap}>
        <BasicCard style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.leftBlock}>
              <Text style={styles.title}>{code}</Text>

              <Text style={styles.subText}>
                {(((t("stock_created") as any) ?? "Created") as string)}: {created}
              </Text>

              <Text style={styles.subText}>
                {(((t("stock_parcels") as any) ?? "Parcels") as string)}:{" "}
                {item.parcel_count == null || Number.isNaN(item.parcel_count) ? "-" : String(item.parcel_count)}
              </Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
              <Text style={[styles.statusPillText, { color: pill.text }]}>{statusLabel}</Text>
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
                goToStockin(item);
              }}
            >
              {(((t("common_view") as any) ?? "View") as string)}
            </CustomButton>

            <CustomButton
              preset="danger"
              style={styles.deleteBtn}
              icon={Trash2}
              iconPosition="left"
              iconSize={14}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                setDeleteTarget(item);
              }}
              disabled={isDeletingThis}
            >
              {isDeletingThis
                ? (((t("common_deleting") as any) ?? "Deleting...") as string)
                : (((t("common_delete") as any) ?? "Delete") as string)}
            </CustomButton>
          </View>
        </BasicCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_stock" showBack backTo={backTo} />

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
              key: "in_progress",
              label: (((t("stock_tab_in_progress") as any) ?? "In Progress") as string),
              count: counts.in_progress,
            },
            {
              key: "completed",
              label: (((t("stock_tab_complete") as any) ?? "Complete") as string),
              count: counts.completed,
            },
          ]}
        />

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <SearchInput
              label={(((t("stock_search_label") as any) ?? "SEARCH") as string)}
              placeholder={(((t("stock_search_placeholder") as any) ?? "Search") as string)}
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch("")} // ✅ if you already added X clear button
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
              onPress={handleCreateStockIn}
            >
              {(((t("common_new") as any) ?? "New") as string)}
            </Button>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#f59e0b" />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.center} onPress={() => fetchListing(activeTab)} activeOpacity={0.9}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>{(((t("stock_list_retry") as any) ?? "Tap to retry") as string)}</Text>
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
                {(((t("stock_list_empty") as any) ?? "No stock-in found.") as string)}
              </Text>
            }
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              rowsToShow.length < filtered.length ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#f59e0b" />
                </View>
              ) : null
            }
          />
        )}
      </View>

      <ConfirmModal
        visible={!!deleteTarget}
        title={(((t("stock_delete_confirm_title") as any) ?? "Confirm Delete") as string)}
        message={
          deleteTarget
            ? `${(((t("stock_delete_confirm_message") as any) ?? "Delete this stock-in?") as string)}\n\n${deleteTarget.stockin_code || `#${deleteTarget.id}`
            }`
            : (((t("stock_delete_confirm_message") as any) ?? "Delete this stock-in?") as string)
        }
        cancelLabel={(((t("common_cancel") as any) ?? "Cancel") as string)}
        confirmLabel={(((t("common_delete") as any) ?? "Delete") as string)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          doDeleteStockIn(deleteTarget);
        }}
      />

      <MobileAlertDialog dialog={dialog} onClose={closeDialog} />
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
  newButton: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
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
  footerLoading: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

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

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: "Karla-Bold",
    color: "#374151",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  viewBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 10 },
});
