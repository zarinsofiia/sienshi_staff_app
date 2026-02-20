// app/(tabs)/menu/pickup/index.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../../../components/AppHeader";
import CustomButton from "../../../../components/button/CustomButton";
import BasicCard from "../../../../components/card/BasicCard";
import SearchInput from "../../../../components/input/SearchInput";

import type { MobileDialogState } from "../../../../components/hooks/useMobileCustomerApprovalFlow";
import MobileAlertDialog from "../../../../components/modal/MobileAlertDialog";

import { useLanguage } from "../../../../contexts/LanguageContext";
import GeneralModal from "@/components/modal/GeneralModal";

// ✅ use your existing API helpers
import { authedFetch } from "../../../../config/mobileApiClient";
import { API_BASE_URL } from "../../../../config/api";

import {
  Barcode,
  Camera as CameraIcon,
  CheckSquare,
  Keyboard,
  MapPin,
  Package as PackageIcon,
  Search as SearchIcon,
  Square,
} from "lucide-react-native";

// ✅ Expo camera
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";

const ORANGE = "#EE9328";

type Mode = "scan" | "manual";

type ApiStockinItem = {
  id: number;
  cust_code?: string | null;
  parcel_no?: string | null;
  parcel_tracking?: string | null;

  gross_weight?: string | null;
  total_weight?: string | null;
  box_m3?: string | null;

  status?: string | null;
  delivery_type?: string | null;
  display_status?: string | null;

  loc_id?: number | null;
  loc_name?: string | null;
};

type SearchResultState =
  | null
  | { found: false; keyword: string }
  | { found: true; keyword: string; parcels: ApiStockinItem[] };

export default function PickupScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>("scan");

  const [manualValue, setManualValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultState>(null);

  const [parcels, setParcels] = useState<ApiStockinItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // dialog
  const [dialog, setDialog] = useState<MobileDialogState | null>(null);
  const closeDialog = () => setDialog(null);

  // scan modal
  const [scanOpen, setScanOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmingRef = useRef(false);

  const showError = (title: string, message: string) =>
    setDialog({ open: true, type: "error", title, message } as any);

  const showSuccess = (title: string, message: string) =>
    setDialog({ open: true, type: "success", title, message } as any);

  // ---------- helpers ----------
  const normalizeUpper = (v: string) => v.trim().toUpperCase();

  const isCustomerCode = (raw: string) => {
    const upper = raw.trim().toUpperCase();
    return /^K\/[A-Z0-9_-]+$/i.test(upper);
  };

  const getParcelCode = (x: {
    parcel_tracking?: string | null;
    parcel_no?: string | null;
    id: number;
  }) => {
    const a = (x.parcel_tracking || "").toString().trim();
    const b = (x.parcel_no || "").toString().trim();
    return b || a || String(x.id);
  };

  const getDescription = (x: {
    parcel_no?: string | null;
    parcel_tracking?: string | null;
  }) => {
    const parcelNo = (x.parcel_no || "Parcel").toString().trim();
    const track = (x.parcel_tracking || "").toString().trim();
    return track ? `${parcelNo} • ${track}` : parcelNo;
  };

  const getWeightKg = (x: {
    total_weight?: string | null;
    gross_weight?: string | null;
  }) => {
    const raw = (x.total_weight || x.gross_weight || "0").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const formatM3 = (v?: string | null) => {
    const raw = (v ?? "").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n.toFixed(2) : "-";
  };

  const getLocKey = (p: ApiStockinItem) => {
    const name = (p.loc_name || "").toString().trim();
    if (name) return name;
    if (p.loc_id !== null && p.loc_id !== undefined) return String(p.loc_id);
    return "-";
  };

  // ---------- API search ----------
  const fetchParcelsByCustomerCode = useCallback(async (custCode: string) => {
    const url = `${API_BASE_URL}/api/pickup/get_parcel_by_cust_code`;

    const res = await authedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custCode }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${txt}`);
    }

    const data = await res.json().catch(() => null);
    return Array.isArray(data) ? (data as ApiStockinItem[]) : [];
  }, []);

  const doSearch = useCallback(
    async (rawValue: string) => {
      const raw = rawValue.trim();
      if (!raw) {
        setSearchResult({ found: false, keyword: "" });
        setParcels([]);
        setSelectedIds([]);
        return;
      }

      // now only support customer code
      if (!isCustomerCode(raw)) {
        showError(
          (((t("pickup_failed_title") as any) ?? "Pickup failed") as string),
          (((t("pickup_invalid_customer_code") as any) ??
            "Invalid customer code") as string)
        );
        setSearchResult({ found: false, keyword: raw });
        setParcels([]);
        setSelectedIds([]);
        return;
      }

      const custCode = normalizeUpper(raw);

      setSearching(true);
      setSearchResult(null);

      try {
        const results = await fetchParcelsByCustomerCode(custCode);

        if (results.length === 0) {
          setSearchResult({ found: false, keyword: custCode });
          setParcels([]);
          setSelectedIds([]);
          return;
        }

        setSearchResult({ found: true, keyword: custCode, parcels: results });
        setParcels(results);
        setSelectedIds([]); // do not auto-select
      } catch (e: any) {
        console.log("pickup doSearch error:", e);
        showError("Search", e?.message ?? "Unable to load parcels.");
        setSearchResult({ found: false, keyword: custCode });
        setParcels([]);
        setSelectedIds([]);
      } finally {
        setSearching(false);
      }
    },
    [fetchParcelsByCustomerCode, t]
  );

  // ---------- selection ----------
  const isAllSelected =
    parcels.length > 0 && selectedIds.length === parcels.length;

  const toggleParcel = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(parcels.map((p) => p.id));
  };

  // ---------- scan ----------
  const onPressScan = async () => {
    try {
      if (!permission?.granted) {
        const r = await requestPermission();
        if (!r.granted) {
          showError(
            (((t("scan_camera_denied_title") as any) ??
              "Camera permission") as string),
            (((t("scan_camera_denied_message") as any) ??
              "Please allow camera access to scan barcodes.") as string)
          );
          return;
        }
      }
      setScanBusy(false);
      setScanOpen(true);
    } catch (e) {
      console.log("pickup camera permission exception:", e);
      showError("Scan", "Unable to open camera.");
    }
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanBusy) return;

    const raw = (result?.data || "").toString().trim();
    if (!raw) return;

    setScanBusy(true);
    setScanOpen(false);

    setManualValue(raw);
    setSearchResult(null);

    try {
      await doSearch(raw);
    } finally {
      setTimeout(() => setScanBusy(false), 700);
    }
  };

  // ---------- confirm pickup ----------
  const handleConfirmPickup = () => {
    if (selectedIds.length === 0) {
      showError(
        (((t("pickup_no_selection_title") as any) ?? "No Selection") as string),
        (((t("pickup_no_selection_message") as any) ??
          "Please select at least one parcel") as string)
      );
      return;
    }
    setConfirmOpen(true);
  };

  const completePickupApi = useCallback(async (parcelIds: number[]) => {
    const url = `${API_BASE_URL}/api/pickup/complete_pickup`;

    const res = await authedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelIds }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${txt}`);
    }

    // keep json parsing (safe even if backend returns json)
    const data = await res.json().catch(() => null);
    return data;
  }, []);

  const doConfirmPickup = async () => {
    if (confirmingRef.current) return;

    const selectedIdSnapshot = [...selectedIds];
    if (selectedIdSnapshot.length === 0) return;

    const payload = { parcelIds: selectedIdSnapshot };
    console.log("[pickup_complete_payload]", payload);

    confirmingRef.current = true;
    setConfirming(true);

    try {
      await completePickupApi(selectedIdSnapshot);

      const selectedCount = selectedIdSnapshot.length;

      // ✅ remove from UI after success
      setParcels((prev) => prev.filter((p) => !selectedIdSnapshot.includes(p.id)));
      setSelectedIds([]);

      showSuccess(
        ((t("pickup_confirm") as any) ?? "Confirm Pickup") as string,
        ((t("pickup_completed_message") as any) ??
          `Pickup completed for ${selectedCount} parcel(s).`) as string
      );

      setSearchResult((prev) => {
        if (!prev || prev.found !== true) return prev;
        const remaining = (prev.parcels || []).filter(
          (p) => !selectedIdSnapshot.includes(p.id)
        );
        return remaining.length === 0
          ? { found: true, keyword: prev.keyword, parcels: [] }
          : { found: true, keyword: prev.keyword, parcels: remaining };
      });
    } catch (e: any) {
      console.log("complete pickup exception:", e);
      showError("Pickup", e?.message ?? "Unable to complete pickup.");
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  };

  // ---------- totals + grouping ----------
  const totals = useMemo(() => {
    const totalParcels = parcels.length;
    const totalWeight = parcels.reduce((sum, p) => sum + getWeightKg(p), 0);
    return { totalParcels, totalWeight };
  }, [parcels]);

  // ✅ ScrollView-style grouping (like old)
  const groupedByLoc = useMemo(() => {
    const map = new Map<string, ApiStockinItem[]>();
    for (const p of parcels) {
      const loc = getLocKey(p);
      const arr = map.get(loc) || [];
      arr.push(p);
      map.set(loc, arr);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [parcels]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="menu_pickup" showBack backTo={backTo} />

      <View style={styles.content}>

        {/* SEARCH / SCAN */}
        <BasicCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.headerIconBubble}>
                <PackageIcon size={16} color="#111827" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>
                  {(((t("menu_pickup") as any) ?? "PICKUP") as string).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Mode pills */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setMode("scan")}
              style={[styles.modePill, mode === "scan" && styles.modePillActive]}
            >
              <Barcode size={14} color={mode === "scan" ? ORANGE : "#2e2f31"} />
              <Text style={[styles.modeText, mode === "scan" && styles.modeTextActive]}>
                {(t("scan_mode_scan") as any) ?? "Scan"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setMode("manual")}
              style={[styles.modePill, mode === "manual" && styles.modePillActive]}
            >
              <Keyboard size={14} color={mode === "manual" ? ORANGE : "#2e2f31"} />
              <Text style={[styles.modeText, mode === "manual" && styles.modeTextActive]}>
                {(t("scan_mode_manual") as any) ?? "Manual"}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "scan" ? (
            <TouchableOpacity
              style={styles.primaryBtnFull}
              activeOpacity={0.9}
              onPress={onPressScan}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <CameraIcon size={18} color="#ffffff" />
                <Text style={styles.primaryBtnText}>
                  {(t("pickup_scan_customer") as any) ?? "Scan Customer Code"}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.searchRow}>
                <SearchInput
                  label={(((t("scan_search_label") as any) ?? "SEARCH") as string)}
                  placeholder={
                    (((t("pickup_customer_placeholder") as any) ??
                      "Enter customer code (e.g. K/XXXX)") as string)
                  }
                  value={manualValue}
                  onChangeText={(v) => {
                    setManualValue(v);
                    if (searchResult) setSearchResult(null);
                  }}
                  onClear={() => {
                    setManualValue("");
                    setSearchResult(null);
                    setParcels([]);
                    setSelectedIds([]);
                  }}
                  containerStyle={styles.searchBoxWrapper}
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => doSearch(manualValue)}
                  disabled={searching}
                  style={[
                    styles.searchIconButton,
                    searching && styles.searchIconButtonDisabled,
                  ]}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <SearchIcon size={18} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>

              {searchResult?.found === false ? (
                <View style={[styles.resultBox, styles.noResultBox]}>
                  <Text style={styles.noResultTitle}>
                    {(((t("scan_no_result_title") as any) ?? "No result") as string)}
                  </Text>
                  <Text style={styles.noResultSub}>
                    {(((t("scan_no_result_sub") as any) ?? "No parcels found for:") as string)}{" "}
                    <Text style={styles.boldInline}>{searchResult.keyword}</Text>
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </BasicCard>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PARCELS (ScrollView style like old) */}
          <BasicCard style={styles.card}>
            <View style={styles.parcelsHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={styles.parcelsTitle}>
                  {(((t("pickup_parcels_title") as any) ?? "PARCELS") as string).toUpperCase()}
                </Text>

                {searchResult?.found === true ? (
                  <View style={styles.keywordChip}>
                    <Text style={styles.keywordChipText} numberOfLines={1}>
                      {searchResult.keyword}
                    </Text>
                  </View>
                ) : null}
              </View>

              {parcels.length > 0 ? (
                <TouchableOpacity
                  onPress={handleToggleSelectAll}
                  activeOpacity={0.85}
                  style={styles.selectAllBtn}
                >
                  {isAllSelected ? (
                    <CheckSquare size={16} color={ORANGE} />
                  ) : (
                    <Square size={16} color={ORANGE} />
                  )}
                  <Text style={styles.selectAllText}>
                    {(t("pickup_select_all") as any) ?? "Select All"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {parcels.length === 0 ? (
              <Text style={styles.emptyText}>
                {(((t("pickup_empty_hint") as any) ??
                  "Scan or search a customer above to view parcels.") as string)}
              </Text>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>
                      {totals.totalParcels}{" "}
                      {(((t("stock_parcels") as any) ?? "Parcels") as string)}
                    </Text>
                  </View>

                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>
                      {(((t("pickup_total_weight") as any) ?? "Total wt") as string)}:{" "}
                      {totals.totalWeight.toFixed(2)} kg
                    </Text>
                  </View>

                  <View style={[styles.summaryPill, styles.selectedPill]}>
                    <Text style={[styles.summaryPillText, styles.selectedPillText]}>
                      {(((t("stock_selected") as any) ?? "Selected") as string)}: {selectedIds.length}
                    </Text>
                  </View>
                </View>

                {groupedByLoc.map(([loc, list]) => (
                  <View key={`loc-${loc}`} style={{ marginBottom: 12 }}>
                    <View style={styles.groupHeader}>
                      <View style={styles.groupHeaderLeft}>
                        <View style={styles.groupPin}>
                          <MapPin size={14} color="#166534" />
                        </View>
                        <Text style={styles.groupHeaderText}>
                          {/* {(((t("pickup_location") as any) ?? "Pallet") as string)} {loc} */}
                          {loc}
                        </Text>
                      </View>

                      <View style={styles.groupCountPill}>
                        <Text style={styles.groupCountText}>
                          {list.length}{" "}
                          {(((t("stock_parcels") as any) ?? "parcels") as string)}
                        </Text>
                      </View>
                    </View>

                    {list.map((item) => {
                      const checked = selectedIds.includes(item.id);
                      const code = normalizeUpper(getParcelCode(item));
                      const desc = getDescription(item);
                      const w = getWeightKg(item);

                      return (
                        <TouchableOpacity
                          key={String(item.id)}
                          activeOpacity={0.9}
                          onPress={() => toggleParcel(item.id)}
                          style={[styles.itemRow, checked && styles.itemRowActive]}
                        >
                          <View style={styles.checkboxCol}>
                            {checked ? (
                              <CheckSquare size={18} color={ORANGE} />
                            ) : (
                              <Square size={18} color="#9ca3af" />
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.parcelCode}>{code}</Text>
                            <Text style={styles.parcelDesc}>{desc}</Text>

                            <View style={styles.metaRow}>
                              <Text style={styles.parcelMeta}>
                                {(((t("scan_weight") as any) ?? "Weight") as string)}:{" "}
                                {w.toFixed(2)} kg
                              </Text>
                              <View style={styles.metaDot} />
                              <Text style={styles.parcelMeta}>
                                {(((t("scan_volume") as any) ?? "Volume") as string)}:{" "}
                                {formatM3(item.box_m3)} m³
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </>
            )}
          </BasicCard>
        </ScrollView>

        <View style={styles.footerRow}>
          <CustomButton
            preset="approve"
            style={styles.confirmBtn}
            onPress={handleConfirmPickup}
            disabled={selectedIds.length === 0}
          >
            {(t("pickup_confirm") as any) ?? "Confirm Pickup"}
          </CustomButton>
        </View>
      </View>

      {/* Camera Scan Modal */}
      <Modal
        visible={scanOpen}
        animationType="slide"
        onRequestClose={() => setScanOpen(false)}
      >
        <SafeAreaView style={styles.scanSafe}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>
              {(((t("pickup_scan_title") as any) ?? "Scan Customer Code") as string)}
            </Text>

            <TouchableOpacity
              onPress={() => setScanOpen(false)}
              activeOpacity={0.9}
              style={styles.scanCloseBtn}
            >
              <Text style={styles.scanCloseText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scanBody}>
            <View style={styles.cameraFrame}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "qr",
                    "code128",
                    "code39",
                    "code93",
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "pdf417",
                  ],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.focusBox} />
                <Text style={styles.cameraHint}>
                  {(((t("scan_camera_hint") as any) ??
                    "Align the barcode within the box") as string)}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Confirm modal */}
      <GeneralModal
        open={confirmOpen}
        title={(t("pickup_confirm") as any) ?? "Confirm Pickup"}
        message={`Confirm pickup for ${selectedIds.length} parcel(s)?`}
        cancelLabel={(t("scan_cancel") as any) ?? "Cancel"}
        confirmLabel={(t("scan_confirm") as any) ?? "Confirm"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await doConfirmPickup();
        }}
        confirmLoading={confirming}
      />

      <MobileAlertDialog dialog={dialog} onClose={closeDialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  scrollContent: { paddingBottom: 120 },

  card: { marginBottom: 14 },

  // ---- Header card ----
  cardHeader: { marginBottom: 12 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 15,
    letterSpacing: 1,
    color: "#111827",
  },

  // ---- Mode pills ----
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  modePillActive: { borderColor: ORANGE, backgroundColor: "#fff7ed" },
  modeText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#2e2f31" },
  modeTextActive: { color: ORANGE },

  // ---- Primary action ----
  primaryBtnFull: {
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontFamily: "Karla-ExtraBold", fontSize: 14, color: "#ffffff" },

  // ---- Manual search row ----
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchBoxWrapper: { flex: 1, marginRight: 10 },
  searchIconButton: {
    height: 52,
    width: 52,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconButtonDisabled: { opacity: 0.85 },

  // ---- No result ----
  resultBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noResultBox: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  noResultTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    color: "#111827",
    marginBottom: 4,
  },
  noResultSub: { fontFamily: "Karla-Regular", fontSize: 12, color: "#2e2f31" },
  boldInline: { fontFamily: "Karla-Bold", color: "#111827" },

  // ---- Parcels header ----
  parcelsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  parcelsTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 15,
    letterSpacing: 1,
    color: "#111827",
  },
  keywordChip: {
    maxWidth: 170,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  keywordChipText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#111827" },

  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  selectAllText: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: "#9a3412" },

  emptyText: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },

  // ---- Summary ----
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryPillText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#374151" },
  selectedPill: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  selectedPillText: { color: "#9a3412" },

  // ---- Group header ----
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 8,
  },
  groupHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupPin: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },
  groupHeaderText: { fontFamily: "Karla-ExtraBold", fontSize: 14, color: "#166534" },
  groupCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  groupCountText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#166534" },

  // ---- Parcel item ----
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 10,
  },
  itemRowActive: {
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  checkboxCol: { paddingTop: 2 },

  parcelCode: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: ORANGE,
    marginBottom: 2,
  },
  parcelDesc: { fontFamily: "Karla-Regular", fontSize: 13, color: "#111827" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  parcelMeta: { fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#9ca3af",
    marginHorizontal: 8,
    marginTop: 1,
  },

  footerRow: {
    position: "absolute",
    // left: 16,
    right: 16,
    bottom: 2,
    flexDirection: "row",
  },
  confirmBtn: {
    // borderRadius: 20,
    // paddingVertical: 16,
    minWidth: "50%"
  },

  // ---- Camera modal ----
  scanSafe: { flex: 1, backgroundColor: "#000" },
  scanHeader: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scanTitle: { fontFamily: "Karla-ExtraBold", fontSize: 14, color: "#111827" },
  scanCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  scanCloseText: { fontFamily: "Karla-Bold", color: "#111827" },
  scanBody: { flex: 1, backgroundColor: "#000", padding: 14 },
  cameraFrame: { flex: 1, borderRadius: 18, overflow: "hidden", backgroundColor: "#000" },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  focusBox: { width: "78%", height: 180, borderRadius: 14, borderWidth: 2, borderColor: "#ffffff" },
  cameraHint: {
    marginTop: 18,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#ffffff",
    opacity: 0.9,
  },
});
