// app/(tabs)/scan/view_completed.tsx
import { useLocalSearchParams } from "expo-router";
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
import { useLanguage } from "../../../contexts/LanguageContext";

import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";

import { Info, MapPin } from "lucide-react-native";

const ORANGE = "#EE9328";
const PAGE_SIZE = 10;
const UNKNOWN_LOC_KEY = "__unknown__";

type WarehouseLoc = {
    id: number;
    parent_id?: number | null;
    code: string;
    name?: string | null;
    display_status?: string | null;
};

type ApiParcelItem = {
    id?: number;
    parcel_description?: string | null;
    material?: string | null;
    warehouse_date?: string | null;
};

type ApiStockinItem = {
    id: number;
    cust_code?: string | null;
    parcel_no?: string | null;
    parcel_tracking?: string | null;
    gross_weight?: string | null;
    total_weight?: string | null;
    box_m3?: string | null;
    status?: string | null;
    stockin_id?: number | null;
    stockin_item_id?: number | null;
    loc_id?: number | null;
    stockin_location?: number | null;
    items?: ApiParcelItem[];
};

type ApiViewManifestResponse = {
    id: number;
    manifest_details?: string | null;
    status?: string | null;
    created_date?: string | null;
    items?: ApiStockinItem[];
};

function safeJsonParse(text: string) {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

function formatDateTime(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    try {
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

function formatM3(v?: string | null) {
    const raw = (v ?? "").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n.toFixed(2) : "-";
}

function getParcelCode(x: { parcel_tracking?: string | null; parcel_no?: string | null; id: number }) {
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

function formatStatusLabel(status?: string | null) {
    const raw = (status || "").toString().trim();
    if (!raw) return "-";
    // ready_to_pickup -> READY TO PICKUP
    return raw.replace(/[_-]+/g, " ").toUpperCase();
}

export default function ViewCompletedScreen() {
    const { t } = useLanguage();

    const params = useLocalSearchParams<{
        backTo?: string;
        manifestId?: string;
        manifestTitle?: string;
    }>();

    const backTo = params.backTo as string | undefined;
    const manifestId = params.manifestId ? String(params.manifestId) : "";
    const manifestTitle = params.manifestTitle ? String(params.manifestTitle) : "";

    const headerTitle = manifestId ? `Manifest ${manifestId}` : (t("header_scan") as any);

    const [loading, setLoading] = useState(false);
    const [locLoading, setLocLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [manifest, setManifest] = useState<ApiViewManifestResponse | null>(null);
    const [warehouseLocs, setWarehouseLocs] = useState<WarehouseLoc[]>([]);

    // ✅ search + debounce
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
        return () => clearTimeout(timer);
    }, [q]);

    const locCodeById = useMemo(() => {
        const map = new Map<string, string>();
        warehouseLocs.forEach((l) => map.set(String(l.id), l.code));
        return map;
    }, [warehouseLocs]);

    const getLocLabel = useCallback(
        (locKey: string) => {
            if (!locKey || locKey === UNKNOWN_LOC_KEY) {
                return (((t("scan_unassigned") as any) ?? "UNASSIGNED") as string) || "UNASSIGNED";
            }
            return locCodeById.get(locKey) || locKey;
        },
        [locCodeById, t]
    );

    const fetchWarehouseLocs = useCallback(async () => {
        try {
            setLocLoading(true);

            const res = await authedFetch(`${API_BASE_URL}/api/presets/loc/get_warehouse_loc_list`, {
                method: "POST",
                body: JSON.stringify({ status: "ACTIVE" }),
            });

            const text = await res.text().catch(() => "");
            const data = safeJsonParse(text);

            if (!res.ok) {
                console.log("get_warehouse_loc_list error:", res.status, text || data);
                setWarehouseLocs([]);
                return;
            }

            const list: WarehouseLoc[] = Array.isArray(data) ? data : [];
            list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
            setWarehouseLocs(list);
        } catch (e) {
            console.log("get_warehouse_loc_list exception:", e);
            setWarehouseLocs([]);
        } finally {
            setLocLoading(false);
        }
    }, []);

    const hydrate = useCallback(async () => {
        if (!manifestId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await authedFetch(`${API_BASE_URL}/api/stock_in/view_stockin`, {
                method: "POST",
                body: JSON.stringify({ manifest_id: String(manifestId) }),
            });

            const text = await res.text().catch(() => "");
            const data = safeJsonParse(text);

            if (!res.ok || !data) {
                console.log("view_stockin error:", res.status, text || data);
                setError(((((t("stock_list_error") as any) ?? "Failed to load") as string) || "Failed to load"));
                setManifest(null);
                return;
            }

            setManifest(data as ApiViewManifestResponse);
        } catch (e) {
            console.log("view_stockin exception:", e);
            setError(((((t("stock_list_error") as any) ?? "Failed to load") as string) || "Failed to load"));
            setManifest(null);
        } finally {
            setLoading(false);
        }
    }, [manifestId, t]);

    useEffect(() => {
        fetchWarehouseLocs();
    }, [fetchWarehouseLocs]);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    // ✅ view mode
    const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

    useEffect(() => {
        setSelectedLocId(null);
        setQ("");
        setDebouncedQ("");
    }, [manifestId]);

    // ✅ pagination for items inside selected location
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [selectedLocId, debouncedQ]);

    const items = useMemo<ApiStockinItem[]>(() => {
        return Array.isArray(manifest?.items) ? (manifest!.items as ApiStockinItem[]) : [];
    }, [manifest]);

    // group by location
    const groupedByLoc = useMemo(() => {
        const map = new Map<string, ApiStockinItem[]>();

        items.forEach((it) => {
            const loc = it.stockin_location ?? it.loc_id ?? null;
            const key = locKeyFromItem(loc);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(it);
        });

        const arr = Array.from(map.entries()).map(([locKey, list]) => ({
            locKey,
            locLabel: getLocLabel(locKey),
            list: list.sort((a, b) => getParcelCode(a).localeCompare(getParcelCode(b))),
            total: list.length,
        }));

        arr.sort((a, b) => (a.locLabel || "").localeCompare(b.locLabel || ""));
        return arr;
    }, [items, getLocLabel]);

    const matchItem = useCallback((it: ApiStockinItem, query: string) => {
        const s = (query || "").toLowerCase();
        if (!s) return true;

        const code = getParcelCode(it).toLowerCase();
        const parcelNo = (it.parcel_no || "").toLowerCase();
        const tracking = (it.parcel_tracking || "").toLowerCase();
        const status = (it.status || "").toLowerCase();
        const cust = (it.cust_code || "").toLowerCase();
        const desc = String(it.items?.[0]?.parcel_description ?? "").toLowerCase();
        const whDate = String(it.items?.[0]?.warehouse_date ?? "").toLowerCase();
        const m3 = String(it.box_m3 ?? "").toLowerCase();
        const weight = String(it.total_weight ?? it.gross_weight ?? "").toLowerCase();

        return (
            code.includes(s) ||
            parcelNo.includes(s) ||
            tracking.includes(s) ||
            status.includes(s) ||
            cust.includes(s) ||
            desc.includes(s) ||
            whDate.includes(s) ||
            m3.includes(s) ||
            weight.includes(s) ||
            String(it.id).includes(s)
        );
    }, []);

    const locRows = useMemo(() => {
        const query = (debouncedQ || "").trim().toLowerCase();

        const rows = groupedByLoc.map((g) => {
            if (!query) return { ...g, matched: g.total };

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
        if (!items.length) return (((t("scan_no_parcels_yet") as any) ?? "No parcels yet.") as string) || "No parcels yet.";

        const byLoc = items.reduce<Record<string, number>>((acc, it) => {
            const loc = it.stockin_location ?? it.loc_id ?? null;
            const key = locKeyFromItem(loc);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const breakdown = Object.keys(byLoc)
            .map((locKey) => `${getLocLabel(locKey)}:${byLoc[locKey]}`)
            .sort()
            .join("  •  ");

        const tpl = ((t("stock_view_summary_format") as any) as string) || "Total: {count}  •  {breakdown}";
        return tpl.replaceAll("{count}", String(items.length)).replaceAll("{breakdown}", breakdown || "-");
    }, [items, t, getLocLabel]);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <AppHeader title={headerTitle as any} showBack backTo={backTo} />

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="small" color={ORANGE} />
                    </View>
                ) : error ? (
                    <TouchableOpacity style={styles.center} onPress={hydrate} activeOpacity={0.9}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text style={styles.retryText}>
                            {(((t("stock_list_retry") as any) ?? "Tap to retry") as string)}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                        {/* SUMMARY */}
                        <BasicCard style={{ marginBottom: 12 }}>
                            <View style={styles.cardHeader}>
                                <Info size={16} color="#111827" />
                                <Text style={styles.cardHeaderTitle}>
                                    {(((t("scan_summary_title") as any) ?? "SUMMARY") as string)}
                                </Text>

                                {(locLoading || loading) && (
                                    <View style={{ marginLeft: 10 }}>
                                        <ActivityIndicator size="small" color={ORANGE} />
                                    </View>
                                )}
                            </View>

                            {/* <Text style={styles.summaryText}>{summaryText}</Text> */}

                            <Text style={styles.summaryMeta} numberOfLines={3}>
                                {(manifest?.manifest_details || manifestTitle || "-").toString()}
                            </Text>
                            <View style={styles.summaryMetaRow}>

                                <Text style={styles.summaryMeta}>
                                    {(((t("common_updated") as any) ?? "Updated") as string)}: {formatDateTime(manifest?.created_date)}
                                </Text>

                                {/* ✅ manifest status badge (optional)
                                    {!!manifest?.status && (
                                    <View style={styles.statusPill}>
                                        <Text style={styles.statusText}>{formatStatusLabel(manifest.status)}</Text>
                                    </View>
                                    )} */}
                            </View>

                        </BasicCard>

                        {/* SEARCH */}
                        <BasicCard style={{ marginBottom: 16 }}>
                            <SearchInput
                                label={(((t("stock_search_label") as any) ?? "SEARCH") as string)}
                                placeholder={(((t("stock_search_placeholder") as any) ?? "Search") as string)}
                                value={q}
                                onChangeText={setQ}
                                onClear={() => setQ("")}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />

                            {selectedLocId ? (
                                <Text style={styles.searchHint}>
                                    {(((t("stock_view_search_hint_inside") as any) ?? "Searching inside") as string)}{" "}
                                    <Text style={styles.searchHintBold}>{selectedLoc?.locLabel || getLocLabel(UNKNOWN_LOC_KEY)}</Text>
                                </Text>
                            ) : (
                                <Text style={styles.searchHint}>
                                    {(((t("stock_view_search_hint_locations") as any) ?? "Search by location or parcel info.") as string)}
                                </Text>
                            )}
                        </BasicCard>

                        {/* MAIN */}
                        <BasicCard>
                            {selectedLocId === null ? (
                                <>
                                    <Text style={styles.sectionTitle}>
                                        {(((t("stock_view_locations_title") as any) ?? "LOCATIONS") as string)}
                                    </Text>

                                    {!locRows.length ? (
                                        <Text style={styles.emptyText}>
                                            {debouncedQ
                                                ? ((((t("common_no_results") as any) ?? "No results.") as string) || "No results.")
                                                : ((((t("stock_list_empty") as any) ?? "No data found.") as string) || "No data found.")}
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
                                                    <MapPin size={14} color="#2e2f31" />
                                                </View>

                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.locRowTitle}>{g.locLabel}</Text>
                                                    <Text style={styles.locRowSub}>
                                                        {debouncedQ
                                                            ? `${(((t("common_results") as any) ?? "Results") as string)}: ${g.matched}`
                                                            : `${(((t("stock_parcels") as any) ?? "Parcels") as string)}: ${g.total}`}
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
                                            <Text style={styles.sectionTitle}>{selectedLoc?.locLabel || getLocLabel(UNKNOWN_LOC_KEY)}</Text>
                                            <Text style={styles.locItemsSub}>
                                                {selectedFiltered.length <= PAGE_SIZE
                                                    ? `${(((t("stock_view_items_count") as any) ?? "Items") as string)}: ${selectedFiltered.length}`
                                                    : `${(((t("stock_view_items_showing") as any) ?? "Showing") as string)} ${Math.min(
                                                        itemsToShow.length,
                                                        selectedFiltered.length
                                                    )} / ${selectedFiltered.length}`}
                                            </Text>
                                        </View>

                                        <TouchableOpacity onPress={() => setSelectedLocId(null)} activeOpacity={0.9} style={styles.backBtn}>
                                            <Text style={styles.backText}>{(((t("stock_view_back") as any) ?? "Back") as string)}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {!selectedFiltered.length ? (
                                        <Text style={styles.emptyText}>
                                            {(((t("common_no_results") as any) ?? "No results.") as string) || "No results."}
                                        </Text>
                                    ) : (
                                        <>
                                            {itemsToShow.map((it) => {
                                                const code = (getParcelCode(it) || "-").toString().trim().toUpperCase();
                                                const desc = getDescription(it);
                                                const w = getWeightKg(it);

                                                return (
                                                    <View key={String(it.id)} style={styles.itemRow}>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={styles.itemTopRow}>
                                                                <Text style={styles.itemCode}>{code}</Text>

                                                                {/* ✅ STATUS BADGE */}
                                                                <View style={styles.statusPill}>
                                                                    <Text style={styles.statusText}>{formatStatusLabel(it.status)}</Text>
                                                                </View>
                                                            </View>

                                                            <Text style={styles.itemDesc}>{desc}</Text>

                                                            <Text style={styles.itemMeta}>
                                                                {(((t("scan_weight") as any) ?? "Weight") as string)}: {w.toFixed(2)} kg{"  •  "}
                                                                {(((t("scan_volume") as any) ?? "Volume") as string)}: {formatM3(it.box_m3)} m³
                                                            </Text>

                                                            <Text style={styles.itemMeta}>
                                                                {(((t("scan_customer") as any) ?? "Customer") as string)}: {(it.cust_code || "-").toString()}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                            {itemsToShow.length < selectedFiltered.length && (
                                                <TouchableOpacity activeOpacity={0.9} onPress={() => setPage((p) => p + 1)} style={styles.loadMoreBtn}>
                                                    <Text style={styles.loadMoreText}>
                                                        {(((t("stock_view_load_more") as any) ?? "Load more") as string)}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </BasicCard>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#ffffff" },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },

    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#b91c1c", marginBottom: 4 },
    retryText: { fontSize: 13, fontFamily: "Karla-Bold", color: ORANGE },

    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    cardHeaderTitle: {
        marginLeft: 8,
        fontFamily: "Karla-ExtraBold",
        fontSize: 15,
        letterSpacing: 1,
        color: "#111827",
    },
    summaryText: { fontFamily: "Karla-Regular", fontSize: 14, color: "#2e2f31" },

    summaryMetaRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    summaryMeta: { 
        fontFamily: "Karla-Regular", 
        fontSize: 14, 
        color: "#444649", 
        flex: 1 
    },

    searchHint: { marginTop: 8, fontFamily: "Karla-Regular", fontSize: 13, color: "#444649" },
    searchHintBold: { fontFamily: "Karla-Bold", color: "#2e2f31" },

    sectionTitle: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 13,
        letterSpacing: 1,
        color: "#111827",
        marginBottom: 10,
    },

    emptyText: { fontFamily: "Karla-Regular", fontSize: 13, color: "#444649" },

    // LOCATION ROWS
    locRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    locIcon: { width: 26, alignItems: "center", justifyContent: "center", marginRight: 6 },
    locRowTitle: { 
        fontFamily: "Karla-ExtraBold", 
        fontSize: 14, 
        color: "#111827" },
    locRowSub: { marginTop: 2, fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },
    locRowChevron: { fontFamily: "Karla-ExtraBold", fontSize: 20, color: "#444649" },

    // ITEMS HEADER
    locItemsHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
    },
    locItemsSub: { marginTop: 2, fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },
    backBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
    },
    backText: { fontFamily: "Karla-Bold", fontSize: 13, color: ORANGE },

    // ITEM ROW
    itemRow: {
        borderWidth: 1,
        borderColor: "#918b7f31",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        backgroundColor: "#ffffff",
    },

    itemTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },

    itemCode: {
        fontFamily: "Karla-ExtraBold",
        fontSize: 14,
        color: ORANGE,
    },
    itemDesc: { marginTop: 6, fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },
    itemMeta: { marginTop: 6, fontFamily: "Karla-Regular", fontSize: 13, color: "#444649" },

    // ✅ STATUS BADGE
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#fed7aa",
        backgroundColor: "#fff7ed",
        alignSelf: "flex-start",
    },
    statusText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#9a3412" },

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
