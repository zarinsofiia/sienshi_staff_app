// app/(tabs)/stock/view.tsx
import { useLocalSearchParams } from "expo-router";
import { Info, MapPin } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";
import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";
import { useLanguage } from "../../../contexts/LanguageContext";

const ORANGE = "#EE9328";
const PAGE_SIZE = 10;
const UNKNOWN_LOC_KEY = "__unknown__";

type WarehouseLoc = {
  id: number;
  code: string;
  name?: string | null;
  display_status?: string | null;
};

type ApiParcelItem = {
  id?: number;
  parcel_description?: string | null;

  // ✅ include requested fields (item-level)
  amt_per_box?: string | number | null;
  total_qty?: string | number | null;
  total_amt?: string | number | null;
  material?: string | null;
  remarks?: string | null;
  unit_price?: string | number | null;
  warehouse_date?: string | null;

  parcel_id?: number | null;
};

type ApiStockinItem = {
  id: number;

  // ✅ include requested fields (parcel-level)
  cust_code?: string | null;
  parcel_no?: string | null;
  parcel_tracking?: string | null;

  box_amt?: string | number | null;
  gross_weight?: string | null;
  total_weight?: string | null;

  box_height?: string | null;
  box_width?: string | null;
  box_length?: string | null;

  box_m3?: string | null;
  status?: string | null;

  // ✅ IMPORTANT: backend returns stockin_location
  stockin_location?: number | null;

  items?: ApiParcelItem[];
};

type ApiViewStockinResponse = {
  id: number;
  stockin_code?: string | null;
  status?: string | null;
  items?: ApiStockinItem[];
};

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function normalizeUpper(v: string) {
  return v.trim().toUpperCase();
}

function formatM3(v?: string | null) {
  const raw = (v ?? "").toString().trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
}

function fmtNum(v: any, fallback = "-") {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v);
}

function fmtMoney(v: any) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function formatDateOnly(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatStatusLabel(status?: string | null) {
  const raw = (status || "").toString().trim();
  if (!raw) return "-";
  return raw.replace(/[_-]+/g, " ").toUpperCase();
}

function getParcelCode(x: {
  parcel_tracking?: string | null;
  parcel_no?: string | null;
  id: number;
}) {
  const a = (x.parcel_tracking || "").trim();
  const b = (x.parcel_no || "").trim();
  return a || b || String(x.id);
}

function getWeightKg(x: { total_weight?: string | null; gross_weight?: string | null }) {
  const raw = (x.total_weight || x.gross_weight || "0").toString().trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function getDescription(x: { parcel_no?: string | null; items?: ApiParcelItem[] }) {
  const parcelNo = (x.parcel_no || "").toString().trim();
  const firstDesc = (x.items?.[0]?.parcel_description || "").toString().trim();
  if (!parcelNo && !firstDesc) return "-";
  if (parcelNo && firstDesc) return `${parcelNo} • ${firstDesc}`;
  return parcelNo || firstDesc || "-";
}

function locKeyFromItem(loc?: number | null) {
  return loc === null || loc === undefined ? UNKNOWN_LOC_KEY : String(loc);
}

function formatDim(it: ApiStockinItem) {
  const l = fmtNum(it.box_length);
  const w = fmtNum(it.box_width);
  const h = fmtNum(it.box_height);
  if (l === "-" && w === "-" && h === "-") return "-";
  return `${l}×${w}×${h}`; // L×W×H
}

// tiny template replace: "{x}"
function applyVars(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return Object.keys(vars).reduce((acc, k) => acc.replaceAll(`{${k}}`, String(vars[k])), template);
}

export default function StockViewScreen() {
  const { t } = useLanguage();

  // ✅ translation helper (no hardcoded UI strings)
  const tr = useCallback(
    (key: any, vars?: Record<string, string | number>) => {
      const raw = t(key);
      const template = raw === null || raw === undefined || raw === "" ? String(key) : String(raw);
      return applyVars(template, vars);
    },
    [t]
  );

  const params = useLocalSearchParams<{ 
    backTo?: string; 
    stockinId?: string; 
    stockinCode?: string; 
  }>();
  const backTo = (params.backTo as string) || "/stock";
  const stockinId = params.stockinId ? String(params.stockinId) : "";
  const stockinCodeParam = params.stockinCode ? String(params.stockinCode) : "";
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [warehouseLocs, setWarehouseLocs] = useState<WarehouseLoc[]>([]);
  const [stockinCode, setStockinCode] = useState("");

   const headerTitle = stockinCodeParam || stockinCode || (stockinId ? `#${stockinId}` : t("header_stock_view")); 

  const [items, setItems] = useState<ApiStockinItem[]>([]);

   useEffect(() => {
    if (!stockinId) return;

    // set from params first (instant), API will still override later
    if (stockinCodeParam) {
      setStockinCode((prev) => (prev ? prev : stockinCodeParam));
    }
  }, [stockinId, stockinCodeParam]);


  // ✅ view mode
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

  // ✅ search + debounce
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // ✅ pagination (for items inside selected location)
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [selectedLocId, debouncedQ]);

  const locCodeById = useMemo(() => {
    const map = new Map<string, string>();
    warehouseLocs.forEach((l) => map.set(String(l.id), l.code));
    return map;
  }, [warehouseLocs]);

  const getLocLabel = useCallback(
    (locKey: string) => {
      if (!locKey || locKey === UNKNOWN_LOC_KEY) return tr("stock_view_unknown_location");
      return locCodeById.get(locKey) || locKey;
    },
    [locCodeById, tr]
  );

  const fetchWarehouseLocs = useCallback(async () => {
    try {
      setLocLoading(true);
      const res = await authedFetch(
        `${API_BASE_URL}/api/presets/loc/get_warehouse_loc_list`,
        { method: "POST", body: JSON.stringify({ status: "ACTIVE" }) }
      );

      const text = await res.text().catch(() => "");
      const data = safeJsonParse(text);

      if (!res.ok) {
        console.log("get_warehouse_loc_list error:", res.status, text);
        setWarehouseLocs([]);
        return;
      }

      const list: WarehouseLoc[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
      setWarehouseLocs(list);
    } catch (e) {
      console.log("fetchWarehouseLocs exception:", e);
      setWarehouseLocs([]);
    } finally {
      setLocLoading(false);
    }
  }, []);

  const fetchStockin = useCallback(async () => {
    if (!stockinId) return;

    try {
      setLoading(true);

      const res = await authedFetch(`${API_BASE_URL}/api/stock_in/view_stockin`, {
        method: "POST",
        body: JSON.stringify({ stockin_id: stockinId }),
      });

      const text = await res.text().catch(() => "");
      const data: ApiViewStockinResponse | any = safeJsonParse(text);

      if (!res.ok || !data) {
        console.log("view_stockin error:", res.status, text);
        setStockinCode("");
        setItems([]);
        return;
      }

      setStockinCode((data.stockin_code || "").toString());
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(nextItems);

      // ✅ if user is inside a location, ensure it still exists after refresh
      if (selectedLocId) {
        const exists = nextItems.some(
          (it: ApiStockinItem) => locKeyFromItem(it.stockin_location) === selectedLocId
        );
        if (!exists) setSelectedLocId(null);
      }
    } catch (e) {
      console.log("fetchStockin exception:", e);
      setStockinCode("");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [stockinId, selectedLocId]);

  useEffect(() => {
    fetchWarehouseLocs();
  }, [fetchWarehouseLocs]);

  useEffect(() => {
    fetchStockin();
  }, [fetchStockin]);

  // ✅ local match (frontend search)
  const matchItem = useCallback((it: ApiStockinItem, query: string) => {
    const s = (query || "").toLowerCase();
    if (!s) return true;

    const code = getParcelCode(it).toLowerCase();
    const parcelNo = (it.parcel_no || "").toLowerCase();
    const tracking = (it.parcel_tracking || "").toLowerCase();
    const status = (it.status || "").toLowerCase();
    const cust = (it.cust_code || "").toLowerCase();

    const boxAmt = String(it.box_amt ?? "").toLowerCase();
    const dim = `${it.box_length ?? ""} ${it.box_width ?? ""} ${it.box_height ?? ""}`.toLowerCase();
    const m3 = String(it.box_m3 ?? "").toLowerCase();
    const gross = String(it.gross_weight ?? "").toLowerCase();
    const totalW = String(it.total_weight ?? "").toLowerCase();

    const first = it.items?.[0] || {};
    const desc = String(first.parcel_description ?? "").toLowerCase();
    const material = String(first.material ?? "").toLowerCase();
    const remarks = String(first.remarks ?? "").toLowerCase();
    const qty = String(first.total_qty ?? "").toLowerCase();
    const amt = String(first.total_amt ?? "").toLowerCase();
    const apb = String(first.amt_per_box ?? "").toLowerCase();
    const unit = String(first.unit_price ?? "").toLowerCase();
    const whDate = String(first.warehouse_date ?? "").toLowerCase();

    return (
      code.includes(s) ||
      parcelNo.includes(s) ||
      tracking.includes(s) ||
      status.includes(s) ||
      cust.includes(s) ||
      desc.includes(s) ||
      material.includes(s) ||
      remarks.includes(s) ||
      boxAmt.includes(s) ||
      dim.includes(s) ||
      m3.includes(s) ||
      gross.includes(s) ||
      totalW.includes(s) ||
      qty.includes(s) ||
      amt.includes(s) ||
      apb.includes(s) ||
      unit.includes(s) ||
      whDate.includes(s) ||
      String(it.id).includes(s)
    );
  }, []);

  // ✅ group by location
  const groupedByLoc = useMemo(() => {
    const map = new Map<string, ApiStockinItem[]>();

    items.forEach((it) => {
      const key = locKeyFromItem(it.stockin_location);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    });

    const arr = Array.from(map.entries()).map(([locKey, list]) => ({
      locKey,
      locLabel: getLocLabel(locKey),
      list,
      total: list.length,
    }));

    arr.sort((a, b) => (a.locLabel || "").localeCompare(b.locLabel || ""));
    return arr;
  }, [items, getLocLabel]);

  // ✅ if in location list view: show match counts per location + allow searching "A1"
  const locRows = useMemo(() => {
    const query = (debouncedQ || "").trim().toLowerCase();

    const rows = groupedByLoc.map((g) => {
      if (!query) return { ...g, matched: g.total };

      // match location label/code
      const locMatch = (g.locLabel || "").toLowerCase().includes(query);

      if (locMatch) return { ...g, matched: g.total };

      const matched = g.list.reduce((acc, it) => (matchItem(it, query) ? acc + 1 : acc), 0);
      return { ...g, matched };
    });

    return query ? rows.filter((r) => r.matched > 0) : rows;
  }, [groupedByLoc, debouncedQ, matchItem]);

  const selectedLoc = useMemo(() => {
    if (!selectedLocId) return null;
    return groupedByLoc.find((g) => g.locKey === selectedLocId) || null;
  }, [groupedByLoc, selectedLocId]);

  // ✅ if user searched location code (A1) while inside that location, do NOT filter items out
  const selectedFiltered = useMemo(() => {
    if (!selectedLoc) return [];
    const query = (debouncedQ || "").trim().toLowerCase();
    if (!query) return selectedLoc.list;

    const locMatch = (selectedLoc.locLabel || "").toLowerCase().includes(query);
    if (locMatch) return selectedLoc.list;

    return selectedLoc.list.filter((it) => matchItem(it, query));
  }, [selectedLoc, debouncedQ, matchItem]);

  const itemsToShow = useMemo(() => {
    return selectedFiltered.slice(0, page * PAGE_SIZE);
  }, [selectedFiltered, page]);

  const summaryText = useMemo(() => {
    if (!items.length) return tr("scan_no_parcels_yet");

    const byLoc = items.reduce<Record<string, number>>((acc, it) => {
      const key = locKeyFromItem(it.stockin_location);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const breakdown = Object.keys(byLoc)
      .map((locKey) => `${getLocLabel(locKey)}:${byLoc[locKey]}`)
      .sort()
      .join("  •  ");

    return tr("stock_view_summary_format", {
      count: items.length,
      breakdown: breakdown || "-",
    });
  }, [items, tr, getLocLabel]);

  const titleText = useMemo(() => {
    if (stockinCode) return stockinCode;
    if (stockinId) return `#${stockinId}`;
    return "-";
  }, [stockinCode, stockinId]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={headerTitle}  showBack backTo={backTo} />

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{titleText}</Text>

        <View style={{ flex: 1 }} />

        {/* <TouchableOpacity
          onPress={fetchStockin}
          activeOpacity={0.9}
          style={[styles.refreshBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={ORANGE} />
          ) : (
            <Text style={styles.refreshText}>{tr("stock_view_refresh")}</Text>
          )}
        </TouchableOpacity> */}
      </View>

      <View style={styles.content}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {/* SUMMARY */}
          <BasicCard style={{ marginBottom: 12 }}>
            <View style={styles.cardHeader}>
              <Info size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>{tr("scan_summary_title")}</Text>

              {(locLoading || loading) && (
                <View style={{ marginLeft: 10 }}>
                  <ActivityIndicator size="small" color={ORANGE} />
                </View>
              )}
            </View>

            <Text style={styles.summaryText}>{summaryText}</Text>
          </BasicCard>

          {/* SEARCH (frontend) */}
          <BasicCard style={{ marginBottom: 16 }}>
            <SearchInput
              label={tr("stock_search_label")}
              placeholder={tr("stock_view_search_placeholder")}
              value={q}
              onChangeText={setQ}
              onClear={() => setQ("")}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {selectedLocId ? (
              <Text style={styles.searchHint}>
                {tr("stock_view_search_hint_inside")}{" "}
                <Text style={styles.searchHintBold}>{selectedLoc?.locLabel || tr("stock_view_unknown_location")}</Text>
              </Text>
            ) : (
              <Text style={styles.searchHint}>{tr("stock_view_search_hint_locations")}</Text>
            )}
          </BasicCard>

          {/* MAIN */}
          <BasicCard>
            {selectedLocId === null ? (
              <>
                <Text style={styles.sectionTitle}>{tr("stock_view_locations_title")}</Text>

                {!locRows.length && !loading ? (
                  <Text style={styles.emptyText}>
                    {debouncedQ ? tr("stock_view_empty_locations_matched") : tr("stock_view_empty_locations")}
                  </Text>
                ) : (
                  locRows.map((g) => (
                    <TouchableOpacity
                      key={g.locKey}
                      activeOpacity={0.9}
                      onPress={() => setSelectedLocId(g.locKey)}
                      style={styles.locRow}
                    >
                      <View style={styles.locIcon}>
                        <MapPin size={14} color="#6b7280" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.locRowTitle}>{g.locLabel}</Text>

                        <Text style={styles.locRowSub}>
                          {debouncedQ
                            ? tr("stock_view_location_matches", { count: g.matched })
                            : tr("stock_view_location_parcels", { count: g.total })}
                        </Text>
                      </View>

                      <Text style={styles.locRowChevron}>›</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <View style={styles.locItemsHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>{selectedLoc?.locLabel || tr("stock_view_unknown_location")}</Text>

                    <Text style={styles.locItemsSub}>
                      {selectedFiltered.length <= PAGE_SIZE
                        ? tr("stock_view_items_count", { count: selectedFiltered.length })
                        : tr("stock_view_items_showing", {
                            shown: Math.min(itemsToShow.length, selectedFiltered.length),
                            total: selectedFiltered.length,
                          })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedLocId(null)}
                    activeOpacity={0.9}
                    style={styles.backBtn}
                  >
                    <Text style={styles.backText}>{tr("stock_view_back")}</Text>
                  </TouchableOpacity>
                </View>

                {!selectedFiltered.length && !loading ? (
                  <Text style={styles.emptyText}>{tr("stock_view_empty_items")}</Text>
                ) : (
                  <>
                    {itemsToShow.map((it) => {
                      const code = normalizeUpper(getParcelCode(it));
                      const desc = getDescription(it);
                      const w = getWeightKg(it);

                      const first = it.items?.[0] || null;

                      const boxAmt = fmtNum(it.box_amt);
                      const dim = formatDim(it);

                      const material = first?.material ?? "-";
                      const qty = first ? fmtNum(first.total_qty) : "-";
                      const amt = first ? fmtMoney(first.total_amt) : "-";
                      const unit = first ? fmtMoney(first.unit_price) : "-";
                      const apb = first ? fmtNum(first.amt_per_box) : "-";
                      const whDate = first ? formatDateOnly(first.warehouse_date) : "-";
                      const remarks = (first?.remarks || "").toString().trim();

                      return (
                        <View key={String(it.id)} style={styles.itemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemCode}>{code}</Text>
                            <Text style={styles.itemDesc}>{desc}</Text>

                            <Text style={styles.itemMeta}>
                              {tr("scan_weight")}: {w.toFixed(2)} kg{"  •  "}
                              {tr("scan_volume")}: {formatM3(it.box_m3)} m³
                            </Text>

                            <Text style={styles.itemMeta}>
                              {tr("stock_view_boxes")}: {boxAmt}
                              {"  •  "}
                              {tr("stock_view_dimension")}: {dim}
                            </Text>

                            {first && (
                              <Text style={styles.itemMeta}>
                                {tr("stock_view_material")}: {material}
                                {"  •  "}
                                {tr("stock_view_qty")}: {qty}
                                {"  •  "}
                                {tr("stock_view_amount")}: {amt}
                                {"  •  "}
                                {tr("stock_view_unit_price")}: {unit}
                                {"  •  "}
                                {tr("stock_view_amt_per_box")}: {apb}
                                {"  •  "}
                                {tr("stock_view_warehouse_date")}: {whDate}
                              </Text>
                            )}

                            {!!remarks && (
                              <Text style={styles.itemMeta}>
                                {tr("stock_view_remarks")}: {remarks}
                              </Text>
                            )}

                            <View style={styles.metaRow}>
                              <View style={styles.statusPill}>
                                <Text style={styles.statusText}>{formatStatusLabel(it.status)}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {itemsToShow.length < selectedFiltered.length && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setPage((p) => p + 1)}
                        style={styles.loadMoreBtn}
                      >
                        <Text style={styles.loadMoreText}>{tr("stock_view_load_more")}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            )}
          </BasicCard>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  topTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: "#111827",
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  refreshText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#374151" },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },

  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardHeaderTitle: {
    marginLeft: 8,
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    letterSpacing: 1,
    color: "#111827",
  },
  summaryText: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#6b7280",
  },

  searchHint: {
    marginTop: 8,
    fontFamily: "Karla-Regular",
    fontSize: 11,
    color: "#9ca3af",
  },
  searchHintBold: { fontFamily: "Karla-Bold", color: "#6b7280" },

  sectionTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    letterSpacing: 1,
    color: "#111827",
    marginBottom: 10,
  },

  emptyText: { fontFamily: "Karla-Regular", fontSize: 13, color: "#9ca3af" },

  // LOCATION ROWS
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  locIcon: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  locRowTitle: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: "#111827" },
  locRowSub: { marginTop: 2, fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  locRowChevron: { fontFamily: "Karla-ExtraBold", fontSize: 20, color: "#9ca3af" },

  // ITEMS HEADER
  locItemsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  locItemsSub: { marginTop: 2, fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  backText: { fontFamily: "Karla-Bold", fontSize: 11, color: ORANGE },

  // ITEM ROW
  itemRow: {
    borderWidth: 1,
    borderColor: "#918b7f31",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  itemCode: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: ORANGE,
    marginBottom: 2,
  },
  itemDesc: { fontFamily: "Karla-Regular", fontSize: 13, color: "#6b7280" },
  itemMeta: { marginTop: 6, fontFamily: "Karla-Regular", fontSize: 13, color: "#9ca3af" },

  metaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    alignSelf: "flex-start",
  },
  statusText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#9a3412" },

  loadMoreBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadMoreText: { fontFamily: "Karla-Bold", fontSize: 13, color: ORANGE },
});
