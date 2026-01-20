// app/(tabs)/menu/pickup/index.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import { AppHeader } from "../../../../components/AppHeader";
import BasicCard from "../../../../components/card/BasicCard";
import SearchInput from "../../../../components/input/SearchInput";
import CustomButton from "../../../../components/button/CustomButton";

import MobileAlertDialog from "../../../../components/modal/MobileAlertDialog";
import type { MobileDialogState } from "../../../../components/hooks/useMobileCustomerApprovalFlow";

import { authedFetch } from "../../../../config/mobileApiClient";
import { API_BASE_URL } from "../../../../config/api";
import { useLanguage } from "../../../../contexts/LanguageContext";

import {
  Barcode,
  Keyboard,
  Search as SearchIcon,
  Camera as CameraIcon,
  CheckSquare,
  Square,
  Package as PackageIcon,
  MapPin,
  Building2
} from "lucide-react-native";

// ✅ Expo camera
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

const ORANGE = "#EE9328";

type Mode = "scan" | "manual";

type ApiParcelItem = {
  id?: number;
  parcel_description?: string | null;
  material?: string | null;
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

  // sometimes present depending backend
  loc_id?: number | null;
  stockin_location?: number | null;

  items?: ApiParcelItem[];
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

  const showError = (title: string, message: string) =>
    setDialog({ open: true, type: "error", title, message } as any);

  const showSuccess = (title: string, message: string) =>
    setDialog({ open: true, type: "success", title, message } as any);

  // ---------- helpers (same idea as Scan page) ----------
  const normalizeUpper = (v: string) => v.trim().toUpperCase();

  const getParcelCode = (x: {
    parcel_tracking?: string | null;
    parcel_no?: string | null;
    id: number;
  }) => {
    const a = (x.parcel_tracking || "").trim();
    const b = (x.parcel_no || "").trim();
    return a || b || String(x.id);
  };

  const getWeightKg = (x: { total_weight?: string | null; gross_weight?: string | null }) => {
    const raw = (x.total_weight || x.gross_weight || "0").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const getDescription = (x: { parcel_no?: string | null; items?: ApiParcelItem[] }) => {
    const parcelNo = (x.parcel_no || "Parcel").toString().trim();
    const firstDesc = (x.items?.[0]?.parcel_description || "").toString().trim();
    return firstDesc ? `${parcelNo} • ${firstDesc}` : parcelNo;
  };

  const formatM3 = (v?: string | null) => {
    const raw = (v ?? "").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n.toFixed(2) : "-";
  };

  // ✅ Customer code rule from Scan:
  // - if matches K/XXXX => use get_parcels_cust_code
  // - else treat as tracking => use get_parcels_tracking_no
  const pickSearchTargets = (raw: string) => {
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();

    const isCustomerCode = /^K\/[A-Z0-9_-]+$/i.test(upper);

    if (isCustomerCode) {
      return {
        runCust: true,
        runTrack: false,
        customerCode: upper,
        trackingNumber: trimmed,
      };
    }

    return {
      runCust: false,
      runTrack: true,
      customerCode: upper,
      trackingNumber: trimmed, // ✅ exact
    };
  };

  const fetchSafeArray = useCallback(async (url: string, body: any): Promise<ApiStockinItem[]> => {
    try {
      const res = await authedFetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.log("[pickup fetchSafeArray] non-ok:", url, res.status, text);
        return [];
      }

      return Array.isArray(data) ? (data as ApiStockinItem[]) : [];
    } catch (e) {
      console.log("[pickup fetchSafeArray] exception:", url, e);
      return [];
    }
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

      const { runCust, runTrack, customerCode, trackingNumber } = pickSearchTargets(raw);

      setSearching(true);
      setSearchResult(null);

      try {
        const [custParcels, trackParcels] = await Promise.all([
          runCust
            ? fetchSafeArray(`${API_BASE_URL}/api/stock_in/get_parcels_cust_code`, {
              customer_code: customerCode,
            })
            : Promise.resolve([]),

          runTrack
            ? fetchSafeArray(`${API_BASE_URL}/api/stock_in/get_parcels_tracking_no`, {
              tracking_number: trackingNumber, // ✅ exact
            })
            : Promise.resolve([]),
        ]);

        const map = new Map<number, ApiStockinItem>();
        [...custParcels, ...trackParcels].forEach((p) => map.set(p.id, p));
        const merged = Array.from(map.values());

        if (merged.length === 0) {
          setSearchResult({ found: false, keyword: raw });
          setParcels([]);
          setSelectedIds([]);
          return;
        }

        // ✅ set list + default select all
        setSearchResult({ found: true, keyword: raw, parcels: merged });
        setParcels(merged);
        setSelectedIds(merged.map((p) => p.id));
      } finally {
        setSearching(false);
      }
    },
    [fetchSafeArray]
  );

  // ---------- selection ----------
  const isAllSelected = parcels.length > 0 && selectedIds.length === parcels.length;

  const toggleParcel = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
            (t("scan_camera_denied_title") as string) || "Camera permission",
            (t("scan_camera_denied_message") as string) || "Please allow camera access to scan barcodes."
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

  // ---------- confirm (placeholder) ----------
  const confirmingRef = useRef(false);

  const handleConfirmPickup = async () => {
    if (confirmingRef.current) return;
    if (selectedIds.length === 0) return;

    confirmingRef.current = true;
    try {
      // TODO: replace with your real pickup confirm API
      console.log("Confirm pickup:", { selectedIds });

      showSuccess(
        (t("pickup_confirm") as string) || "Confirm Pickup",
        `Selected ${selectedIds.length} parcel(s).`
      );
    } catch (e) {
      console.log("confirm pickup exception:", e);
      showError("Pickup", "Unable to confirm pickup.");
    } finally {
      confirmingRef.current = false;
    }
  };

  const totals = useMemo(() => {
    const totalParcels = parcels.length;
    const totalWeight = parcels.reduce((sum, p) => sum + getWeightKg(p), 0);
    return { totalParcels, totalWeight };
  }, [parcels]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="menu_pickup" showBack backTo={backTo} />

      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SEARCH / SCAN (like Scan page) */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <PackageIcon size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>
                {(t("menu_pickup") as string) || "PICKUP"}
              </Text>
            </View>

            {/* Mode pills */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMode("scan")}
                style={[styles.modePill, mode === "scan" && styles.modePillActive]}
              >
                <Barcode size={14} color={mode === "scan" ? ORANGE : "#6b7280"} />
                <Text style={[styles.modeText, mode === "scan" && styles.modeTextActive]}>
                  {(t("scan_mode_scan") as string) || "Scan"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMode("manual")}
                style={[styles.modePill, mode === "manual" && styles.modePillActive]}
              >
                <Keyboard size={14} color={mode === "manual" ? ORANGE : "#6b7280"} />
                <Text style={[styles.modeText, mode === "manual" && styles.modeTextActive]}>
                  {(t("scan_mode_manual") as string) || "Manual"}
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "scan" ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryBtnFull} activeOpacity={0.9} onPress={onPressScan}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <CameraIcon size={16} color="#ffffff" />
                    <Text style={styles.primaryBtnText}>
                      {(t("pickup_scan_customer") as string) || "Scan Customer Code"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <View style={styles.searchSection}>
                  <View style={styles.searchRow}>
                    <SearchInput
                      label={(t("scan_search_label") as string) || "SEARCH"}
                      placeholder={(t("pickup_customer_placeholder") as string) || "Enter customer code"}
                      value={manualValue}
                      onChangeText={(v) => {
                        setManualValue(v);
                        if (searchResult) setSearchResult(null);
                      }}
                      containerStyle={styles.searchBoxWrapper}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => doSearch(manualValue)}
                      disabled={searching}
                      style={[styles.searchIconButton, searching && styles.searchIconButtonDisabled]}
                    >
                      {searching ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <SearchIcon size={16} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {searchResult?.found === false ? (
                  <View style={[styles.resultBox, styles.noResultBox]}>
                    <Text style={styles.noResultTitle}>
                      {(t("scan_no_result_title") as string) || "No result"}
                    </Text>
                    <Text style={styles.noResultSub}>
                      {(t("scan_no_result_sub") as string) || "No parcels found for:"}{" "}
                      <Text style={styles.boldInline}>{searchResult.keyword}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </BasicCard>

          {/* PARCELS */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeaderNoMargin}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.cardHeaderTitle}>
                  {(t("pickup_parcels_title") as string) || "PARCELS"}
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
                <TouchableOpacity onPress={handleToggleSelectAll} activeOpacity={0.85} style={styles.selectAllBtn}>
                  {isAllSelected ? <CheckSquare size={16} color={ORANGE} /> : <Square size={16} color={ORANGE} />}
                  <Text style={styles.selectAllText}>
                    {(t("pickup_select_all") as string) || "Select All"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {parcels.length === 0 ? (
              <Text style={styles.emptyText}>
                {(t("pickup_empty_hint") as string) || "Scan or search a customer above to view parcels."}
              </Text>
            ) : (
              <>
                {/* summary */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{totals.totalParcels} {(t("stock_parcels") as string) || "Parcels"}</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>
                      {(t("pickup_total_weight") as string) || "Total wt"}: {totals.totalWeight.toFixed(2)} kg
                    </Text>
                  </View>
                </View>

                {parcels.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  const code = normalizeUpper(getParcelCode(p));
                  const desc = getDescription(p);
                  const w = getWeightKg(p);

                  const loc =
                    p.stockin_location !== null && p.stockin_location !== undefined
                      ? String(p.stockin_location)
                      : p.loc_id !== null && p.loc_id !== undefined
                        ? String(p.loc_id)
                        : "-";

                  return (
                    <TouchableOpacity
                      key={String(p.id)}
                      activeOpacity={0.9}
                      onPress={() => toggleParcel(p.id)}
                      style={[styles.itemRow, checked && styles.itemRowActive]}
                    >
                      <View style={styles.checkboxCol}>
                        {checked ? <CheckSquare size={18} color={ORANGE} /> : <Square size={18} color="#9ca3af" />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.parcelCode}>{code}</Text>
                        <Text style={styles.parcelDesc}>{desc}</Text>

                        <Text style={styles.parcelMeta}>
                          {(t("scan_weight") as string) || "Weight"}: {w.toFixed(2)} kg {"  •  "}
                          {(t("scan_volume") as string) || "Volume"}: {formatM3(p.box_m3)} m³
                        </Text>

                        <View style={styles.locPill}>
                          <MapPin size={12} color="#166534" />
                          <Text style={styles.locPillText}>
                            {(t("pickup_pallet") as string) || "Pallet"}: {loc}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </BasicCard>
        </ScrollView>

        {/* Bottom confirm (like Scan page) */}
        <View style={styles.footerRow}>
          <CustomButton
            preset="approve"
            style={styles.confirmBtn}
            onPress={handleConfirmPickup}
            disabled={selectedIds.length === 0}
          >
            {(t("pickup_confirm") as string) || "Confirm Pickup"}
          </CustomButton>
        </View>
      </View>

      {/* ✅ Camera Scan Modal */}
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <SafeAreaView style={styles.scanSafe}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>
              {(t("pickup_scan_title") as string) || "Scan Customer Code"}
            </Text>

            <TouchableOpacity onPress={() => setScanOpen(false)} activeOpacity={0.9} style={styles.scanCloseBtn}>
              <Text style={styles.scanCloseText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scanBody}>
            <View style={styles.cameraFrame}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "code128", "code39", "code93", "ean13", "ean8", "upc_a", "upc_e", "pdf417"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.focusBox} />
                <Text style={styles.cameraHint}>
                  {(t("scan_camera_hint") as string) || "Align the barcode within the box"}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <MobileAlertDialog dialog={dialog} onClose={closeDialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffffff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  scrollContent: { paddingBottom: 90 },

  card: { marginBottom: 16 },

  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardHeaderNoMargin: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  cardHeaderTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    color: "#000000ff",
  },

  // mode pills (same as Scan)
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  modePillActive: { borderColor: ORANGE, backgroundColor: "#fff7ed" },
  modeText: { fontFamily: "Karla-Bold", fontSize: 12, color: "#6b7280" },
  modeTextActive: { color: ORANGE },

  actionRow: { gap: 8 },

  primaryBtnFull: {
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontFamily: "Karla-Bold", fontSize: 12, color: "#ffffff" },

  // manual search row
  searchSection: { marginTop: 2, marginBottom: 2 },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchBoxWrapper: { flex: 1, marginRight: 8 },
  searchIconButton: {
    height: 40,
    width: 40,
    borderRadius: 10,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconButtonDisabled: { opacity: 0.85 },

  // result box
  resultBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noResultBox: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  noResultTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    color: "#111827",
    marginBottom: 4,
  },
  noResultSub: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  boldInline: { fontFamily: "Karla-Bold", color: "#111827" },

  // parcels header chip + select all
  keywordChip: {
    maxWidth: 180,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  keywordChipText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#111827" },

  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  selectAllText: { fontFamily: "Karla-Bold", fontSize: 11, color: ORANGE },

  emptyText: { fontFamily: "Karla-Regular", fontSize: 12, color: "#9ca3af", marginTop: 4 },

  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  summaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  summaryPillText: { fontFamily: "Karla-Medium", fontSize: 11, color: "#4b5563" },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 8,
  },
  itemRowActive: {
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  checkboxCol: { paddingTop: 2 },

  parcelCode: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: ORANGE, marginBottom: 2 },
  parcelDesc: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  parcelMeta: { marginTop: 6, fontFamily: "Karla-Regular", fontSize: 11, color: "#9ca3af" },

  locPill: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
  },
  locPillText: { fontFamily: "Karla-Bold", fontSize: 10, color: "#166534" },

  // bottom
  footerRow: {
    position: "absolute",
    right: 16,
    bottom: 8,
    flexDirection: "row",
  },
  confirmBtn: { borderRadius: 10, minWidth: 150 },

  // camera modal
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
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  focusBox: { width: "78%", height: 180, borderRadius: 14, borderWidth: 2, borderColor: "#ffffff" },
  cameraHint: { marginTop: 18, fontFamily: "Karla-Regular", fontSize: 12, color: "#ffffff", opacity: 0.9 },
});
