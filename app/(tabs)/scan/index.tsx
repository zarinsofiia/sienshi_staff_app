// app/(tabs)/scan/index.tsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";
import CustomButton from "../../../components/button/CustomButton";
import { Picker } from "@react-native-picker/picker";
import {
  Barcode,
  Keyboard,
  Trash2,
  MapPin,
  Save as SaveIcon,
  Info,
  Search as SearchIcon,
  Plus,
  X,
  Camera as CameraIcon,
} from "lucide-react-native";

import { authedFetch } from "../../../config/mobileApiClient";
import { API_BASE_URL } from "../../../config/api";
import MobileAlertDialog from "../../../components/modal/MobileAlertDialog";
import type { MobileDialogState } from "../../../components/hooks/useMobileCustomerApprovalFlow";
import { useLanguage } from "../../../contexts/LanguageContext";

// ✅ Expo camera
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

const ORANGE = "#EE9328";

type ScanMode = "scan" | "manual";

type WarehouseLoc = {
  id: number;
  parent_id?: number | null;
  code: string;
  name?: string | null;
  display_status?: string | null;
};

type ScannedParcel = {
  id: string; // local id
  apiItemId: number; // parcel id from backend (item_id)
  stockinItemId?: number | null; // stockin_item_id from view_stockin (optional)
  code: string; // normalized uppercase
  description: string;
  weightKg: number;
  pallet: string; // loc_id string (optional / local)
  status?: string | null; // ✅ arranging
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
  status?: string | null;
  stockin_id?: number | null;
  stockin_item_id?: number | null;
  items?: ApiParcelItem[];
};

type ApiViewStockinResponse = {
  id: number;
  stockin_code?: string | null;
  status?: string | null;
  items?: ApiStockinItem[];
};

type SearchResultState =
  | null
  | { found: false; customerCode: string }
  | { found: true; customerCode: string; parcels: ApiStockinItem[] };

const PICKER_MIN_H = Platform.select({
  android: 48,
  ios: 40,
  default: 44,
});

export default function ScanScreen() {
  const { t } = useLanguage();

  const params = useLocalSearchParams<{ backTo?: string; stockinId?: string }>();
  const backTo = params.backTo as string | undefined;
  const stockinId = params.stockinId ? String(params.stockinId) : "";

  const [mode, setMode] = useState<ScanMode>("scan");

  // ✅ show stockin_code at top
  const [stockinCode, setStockinCode] = useState<string>("");

  // location selector stores location_id string (optional)
  const [pallet, setPallet] = useState<string>("");

  // locations list
  const [warehouseLocs, setWarehouseLocs] = useState<WarehouseLoc[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  // manual input
  const [manualValue, setManualValue] = useState("");

  // search state
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultState>(null);

  // ✅ persisted scanned list from server + local updates
  const [selectedParcels, setSelectedParcels] = useState<ScannedParcel[]>([]);
  const [hydrating, setHydrating] = useState(false);

  // keep latest selectedParcels for scan auto insert (avoid stale closure)
  const selectedParcelsRef = useRef<ScannedParcel[]>([]);
  useEffect(() => {
    selectedParcelsRef.current = selectedParcels;
  }, [selectedParcels]);

  // add/remove loading states
  const [adding, setAdding] = useState(false);
  const [addingItemIds, setAddingItemIds] = useState<Record<string, boolean>>(
    {}
  );
  const [removingItemIds, setRemovingItemIds] = useState<
    Record<string, boolean>
  >({});
  const [clearing, setClearing] = useState(false);

  // MobileAlertDialog state
  const [dialog, setDialog] = useState<MobileDialogState | null>(null);
  const [afterClose, setAfterClose] = useState<(() => void) | null>(null);

  // ✅ camera scan modal state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // ✅ IMPORTANT FIX: when stockin changes on mobile tab screen, clear old state
  useEffect(() => {
    setSelectedParcels([]);
    setSearchResult(null);
    setManualValue("");
    setStockinCode("");
  }, [stockinId]);

  const closeDialog = () => {
    setDialog(null);
    if (afterClose) {
      const fn = afterClose;
      setAfterClose(null);
      fn();
    }
  };

  const showError = (title: string, message: string) => {
    setAfterClose(null);
    setDialog({
      open: true,
      type: "error",
      title,
      message,
    } as any);
  };

  const showSuccess = (title: string, message: string, onOk?: () => void) => {
    setAfterClose(() => onOk ?? null);
    setDialog({
      open: true,
      type: "success",
      title,
      message,
    } as any);
  };

  const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const normalizeUpper = (v: string) => v.trim().toUpperCase();

  // ✅ fetch warehouse locations
  const fetchWarehouseLocs = useCallback(async () => {
    try {
      setLocLoading(true);

      const res = await authedFetch(
        `${API_BASE_URL}/api/presets/loc/get_warehouse_loc_list`,
        {
          method: "POST",
          body: JSON.stringify({ status: "ACTIVE" }),
        }
      );

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.log("get_warehouse_loc_list error:", res.status, text);
        setWarehouseLocs([]);
        return;
      }

      const list: WarehouseLoc[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));

      setWarehouseLocs(list);

      // default selected location if empty
      if (!pallet && list.length > 0) {
        setPallet(String(list[0].id));
      }
    } catch (e) {
      console.log("get_warehouse_loc_list exception:", e);
      setWarehouseLocs([]);
    } finally {
      setLocLoading(false);
    }
  }, [pallet]);

  useEffect(() => {
    fetchWarehouseLocs();
  }, [fetchWarehouseLocs]);

  const locCodeById = useMemo(() => {
    const map = new Map<string, string>();
    warehouseLocs.forEach((l) => map.set(String(l.id), l.code));
    return map;
  }, [warehouseLocs]);

  const selectedLocCode = useMemo(() => {
    return pallet ? locCodeById.get(String(pallet)) || "-" : "-";
  }, [locCodeById, pallet]);

  const getParcelCode = (x: {
    parcel_tracking?: string | null;
    parcel_no?: string | null;
    id: number;
  }) => {
    const a = (x.parcel_tracking || "").trim();
    const b = (x.parcel_no || "").trim();
    return a || b || String(x.id);
  };

  const getWeightKg = (x: {
    total_weight?: string | null;
    gross_weight?: string | null;
  }) => {
    const raw = (x.total_weight || x.gross_weight || "0").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const getDescription = (x: {
    parcel_no?: string | null;
    items?: ApiParcelItem[];
  }) => {
    const parcelNo = (x.parcel_no || "Parcel").toString().trim();
    const firstDesc = (x.items?.[0]?.parcel_description || "").toString().trim();
    return firstDesc ? `${parcelNo} • ${firstDesc}` : parcelNo;
  };

  // ✅ shared fetch helper
  const fetchSafeArray = useCallback(
    async (url: string, body: any): Promise<ApiStockinItem[]> => {
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
          console.log("[fetchSafeArray] non-ok:", url, res.status, text);
          return [];
        }

        return Array.isArray(data) ? (data as ApiStockinItem[]) : [];
      } catch (e) {
        console.log("[fetchSafeArray] exception:", url, e);
        return [];
      }
    },
    []
  );

  // ✅ hydrate scanned list from server (arranging only) + stockin_code
  const hydrateFromServer = useCallback(async () => {
    if (!stockinId) return;

    setHydrating(true);
    try {
      const res = await authedFetch(`${API_BASE_URL}/api/stock_in/view_stockin`, {
        method: "POST",
        body: JSON.stringify({ stockin_id: stockinId }),
      });

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data) {
        console.log("view_stockin error:", res.status, text);
        return;
      }

      const stockin: ApiViewStockinResponse = data;

      // ✅ set stockin_code for display at top
      setStockinCode((stockin.stockin_code || "").toString());

      const items = Array.isArray(stockin.items) ? stockin.items : [];

      // ✅ keep only arranging
      const arranging = items.filter(
        (it) => String(it.status || "").toLowerCase() === "arranging"
      );

      const next: ScannedParcel[] = arranging.map((it) => {
        const code = normalizeUpper(getParcelCode(it));
        return {
          id: `srv_${it.id}`,
          apiItemId: it.id,
          stockinItemId: it.stockin_item_id ?? null,
          code,
          description: getDescription(it),
          weightKg: getWeightKg(it),
          pallet: pallet || "",
          status: it.status ?? null,
        };
      });

      // ✅ IMPORTANT FIX: replace list (don’t merge old stockin items)
      setSelectedParcels(next);
    } catch (e) {
      console.log("view_stockin exception:", e);
    } finally {
      setHydrating(false);
    }
  }, [stockinId, pallet]);

  useEffect(() => {
    hydrateFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockinId]);

  const scannedCount = selectedParcels.length;

  const summaryText = useMemo(() => {
    if (scannedCount === 0)
      return `${t("scan_no_parcels_yet") || "No parcels yet"
        } (${t("scan_location_title") || "Location"} ${selectedLocCode})`;

    const byLoc = selectedParcels.reduce<Record<string, number>>((acc, p) => {
      const key = p.pallet || "";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const breakdown = Object.keys(byLoc)
      .map((locId) => {
        const code = locId ? locCodeById.get(String(locId)) || locId : "-";
        return `${code}:${byLoc[locId]}`;
      })
      .sort()
      .join("  •  ");

    const scannedLabel =
      scannedCount === 1
        ? t("scan_parcel_singular") || "parcel"
        : t("scan_parcel_plural") || "parcels";

    return `${scannedCount} ${scannedLabel} ${t("scan_scanned_suffix") || "scanned"
      }  •  ${breakdown}`;
  }, [scannedCount, selectedParcels, selectedLocCode, locCodeById, t]);

  // remove already-added parcels from search results area
  const selectedCodeSet = useMemo(() => {
    return new Set(selectedParcels.map((p) => p.code.trim().toUpperCase()));
  }, [selectedParcels]);

  const addParcelToListLocalOnly = (payload: {
    apiItemId: number;
    stockinItemId?: number | null;
    code: string;
    description: string;
    weightKg: number;
    pallet: string;
    status?: string | null;
  }) => {
    const code = normalizeUpper(payload.code);
    if (!code) return;

    setSelectedParcels((prev) => {
      if (prev.some((p) => p.code.trim().toUpperCase() === code)) {
        showError(
          (t("scan_duplicate_title") as string) || "Duplicate",
          (t("scan_duplicate_message") as string) ||
          "This parcel is already in the list."
        );
        return prev;
      }

      const next: ScannedParcel = {
        id: makeId(),
        apiItemId: payload.apiItemId,
        stockinItemId: payload.stockinItemId ?? null,
        code,
        description: payload.description,
        weightKg: payload.weightKg,
        pallet: payload.pallet,
        status: payload.status ?? "arranging",
      };

      return [next, ...prev];
    });
  };

  // insert item to stockin API
  const insertItemToStockIn = async (
    itemId: number
  ): Promise<{ ok: boolean; inserted?: any | null }> => {
    if (!stockinId) {
      showError(
        (t("scan_missing_stockin_title") as string) || "Missing stock-in",
        (t("scan_missing_stockin_message") as string) ||
        "stockin_id is missing. Please create Stock In first."
      );
      return { ok: false };
    }

    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/insert_item_stockin`,
        {
          method: "POST",
          body: JSON.stringify({
            stockin_id: stockinId,
            item_id: String(itemId),
          }),
        }
      );

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.log("insert_item_stockin error:", res.status, text || data);
        showError(
          (t("scan_add_failed_title") as string) || "Add failed",
          (t("scan_add_failed_message") as string) ||
          "Unable to add this parcel. Please try again."
        );
        return { ok: false };
      }

      const inserted = Array.isArray(data?.data) ? data.data[0] : null;
      return { ok: true, inserted };
    } catch (e) {
      console.log("insert_item_stockin exception:", e);
      showError(
        (t("scan_add_failed_title") as string) || "Add failed",
        (t("scan_add_failed_message") as string) ||
        "Unable to add this parcel. Please try again."
      );
      return { ok: false };
    }
  };

  // remove item from stockin API
  const removeItemFromStockIn = async (itemId: number): Promise<boolean> => {
    if (!stockinId) {
      showError(
        (t("scan_missing_stockin_title") as string) || "Missing stock-in",
        (t("scan_missing_stockin_message") as string) ||
        "stockin_id is missing. Please create Stock In first."
      );
      return false;
    }

    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/remove_item_stockin`,
        {
          method: "POST",
          body: JSON.stringify({
            stockin_id: stockinId,
            item_id: String(itemId),
          }),
        }
      );

      const text = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.log("remove_item_stockin error:", res.status, text || data);
        showError(
          (t("scan_remove_failed_title") as string) || "Remove failed",
          (t("scan_remove_failed_message") as string) ||
          "Unable to remove this parcel. Please try again."
        );
        return false;
      }

      return true;
    } catch (e) {
      console.log("remove_item_stockin exception:", e);
      showError(
        (t("scan_remove_failed_title") as string) || "Remove failed",
        (t("scan_remove_failed_message") as string) ||
        "Unable to remove this parcel. Please try again."
      );
      return false;
    }
  };

  // add single api parcel -> insert_item_stockin then add to UI
  const addApiParcel = async (x: ApiStockinItem) => {
    const key = String(x.id);
    if (addingItemIds[key] || adding) return;

    setAddingItemIds((prev) => ({ ...prev, [key]: true }));

    const r = await insertItemToStockIn(x.id);

    setAddingItemIds((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (!r.ok) return;

    const status = r.inserted?.status ?? "arranging";
    const stockinItemId =
      r.inserted?.stockin_item_id ?? x.stockin_item_id ?? null;

    addParcelToListLocalOnly({
      apiItemId: x.id,
      stockinItemId,
      code: getParcelCode(x),
      description: getDescription(x),
      weightKg: getWeightKg(x),
      pallet: pallet || "",
      status,
    });
  };

  // add all (sequential)
  const addAllApiParcels = async (parcels: ApiStockinItem[]) => {
    if (adding) return;
    setAdding(true);
    try {
      for (const p of parcels) {
        // eslint-disable-next-line no-await-in-loop
        await addApiParcel(p);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveParcel = async (parcel: ScannedParcel) => {
    const key = String(parcel.apiItemId);
    if (removingItemIds[key] || clearing) return;

    setRemovingItemIds((prev) => ({ ...prev, [key]: true }));

    const ok = await removeItemFromStockIn(parcel.apiItemId);

    setRemovingItemIds((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (!ok) return;

    setSelectedParcels((prev) =>
      prev.filter((p) => p.apiItemId !== parcel.apiItemId)
    );
  };

  const handleClearAll = async () => {
    if (clearing) return;

    if (!stockinId) {
      setSelectedParcels([]);
      return;
    }

    setClearing(true);
    try {
      const snapshot = [...selectedParcels];
      for (const p of snapshot) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await removeItemFromStockIn(p.apiItemId);
        if (ok) {
          setSelectedParcels((prev) =>
            prev.filter((x) => x.apiItemId !== p.apiItemId)
          );
        }
      }
    } finally {
      setClearing(false);
    }
  };

  const updateParcelPallet = (id: string, nextLocId: string) => {
    setSelectedParcels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pallet: nextLocId } : p))
    );
  };

  // ✅ Customer code is always like: K/ALP, K/SOMETHING
  const pickSearchTargets = (raw: string) => {
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();

    // customer code: exactly K/XXXX (no spaces)
    const isCustomerCode = /^K\/[A-Z0-9_-]+$/i.test(upper);

    if (isCustomerCode) {
      return {
        runCust: true,
        runTrack: false,
        customerCode: upper,
        trackingNumber: trimmed, // not used for customer search
      };
    }

    // ✅ Everything else treat as tracking number (must be exact string)
    return {
      runCust: false,
      runTrack: true,
      customerCode: upper, // not used for tracking search
      trackingNumber: trimmed, // ✅ exact, do NOT uppercase, do NOT split
    };
  };

  // ✅ shared search logic (manual)
  const doSearch = useCallback(
    async (rawValue: string) => {
      const raw = rawValue.trim();
      if (!raw) {
        setSearchResult({ found: false, customerCode: "" });
        return;
      }

      const { runCust, runTrack, customerCode, trackingNumber } =
        pickSearchTargets(raw);

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
              tracking_number: trackingNumber,
            })
            : Promise.resolve([]),
        ]);

        const map = new Map<number, ApiStockinItem>();
        [...custParcels, ...trackParcels].forEach((p) => map.set(p.id, p));
        const merged = Array.from(map.values());

        if (merged.length === 0) {
          setSearchResult({ found: false, customerCode: raw });
          return;
        }

        setSearchResult({ found: true, customerCode: raw, parcels: merged });
      } finally {
        setSearching(false);
      }
    },
    [fetchSafeArray]
  );

  // ✅ Scan-only behavior: auto insert into selectedParcels (no “Add” step)
  const doScanAutoInsert = useCallback(
    async (rawValue: string) => {
      const raw = rawValue.trim();
      if (!raw) return;

      const { runCust, runTrack, customerCode, trackingNumber } =
        pickSearchTargets(raw);

      const [custParcels, trackParcels] = await Promise.all([
        runCust
          ? fetchSafeArray(`${API_BASE_URL}/api/stock_in/get_parcels_cust_code`, {
            customer_code: customerCode,
          })
          : Promise.resolve([]),

        runTrack
          ? fetchSafeArray(`${API_BASE_URL}/api/stock_in/get_parcels_tracking_no`, {
            tracking_number: trackingNumber, // ✅ exact string
          })
          : Promise.resolve([]),
      ]);

      const map = new Map<number, ApiStockinItem>();
      [...custParcels, ...trackParcels].forEach((p) => map.set(p.id, p));
      const merged = Array.from(map.values());

      if (merged.length === 0) {
        showError(
          (t("scan_no_result_title") as string) || "No result",
          `${(t("scan_no_result_sub") as string) || "No parcels found for:"} ${raw}`
        );
        return;
      }

      // ✅ Use latest selectedParcels (tab screens keep mounted)
      const selectedIds = new Set(
        selectedParcelsRef.current.map((p) => p.apiItemId)
      );
      const remaining = merged.filter((p) => !selectedIds.has(p.id));

      if (remaining.length === 0) {
        showError(
          (t("scan_duplicate_title") as string) || "Duplicate",
          (t("scan_all_added") as string) || "All parcels already added."
        );
        return;
      }

      await addAllApiParcels(remaining);
      // optional: await hydrateFromServer();
    },
    [fetchSafeArray, t]
  );

  const onPressSearchManual = async () => {
    await doSearch(manualValue);
  };

  // ✅ Scan mode: open camera + scan
  const onPressScanBarcode = async () => {
    try {
      if (!permission?.granted) {
        const r = await requestPermission();
        if (!r.granted) {
          showError(
            (t("scan_camera_denied_title") as string) || "Camera permission",
            (t("scan_camera_denied_message") as string) ||
            "Please allow camera access to scan barcodes."
          );
          return;
        }
      }

      setScanBusy(false);
      setScanOpen(true);
    } catch (e) {
      console.log("camera permission exception:", e);
      showError("Scan", "Unable to open camera.");
    }
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanBusy) return;

    const raw = (result?.data || "").toString().trim();
    if (!raw) return;

    setScanBusy(true);
    setScanOpen(false);

    // keep scan mode (no need switch to manual)
    setManualValue(raw);
    setSearchResult(null);

    try {
      await doScanAutoInsert(raw);
    } finally {
      setTimeout(() => setScanBusy(false), 700);
    }
  };

  const onSave = () => {
    if (selectedParcels.length === 0) {
      showError(
        (t("scan_missing_title") as string) || "Missing items",
        (t("scan_missing_message") as string) ||
        "Please add at least one parcel."
      );
      return;
    }

    showSuccess(
      (t("scan_saved_title") as string) || "Saved",
      (t("scan_saved_message") as string) || "Stock-in updated.",
      () => {
        if (backTo) router.replace(backTo as any);
        else router.replace("/stock");
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_scan" showBack backTo={backTo} />

      {/* ✅ TOP: Stockin Code */}
      <View style={styles.stockinBar}>
        {/* <Text style={styles.stockinBarLabel}>
          {(t("scan_stockin_code_label") as string) || "Stock In"}
        </Text> */}
        <Text style={styles.stockinBarValue}>
          {stockinCode || (stockinId ? `#${stockinId}` : "-")}
        </Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={hydrateFromServer}
          activeOpacity={0.9}
          style={[styles.stockinBarRefresh, hydrating && { opacity: 0.6 }]}
          disabled={hydrating}
        >
          {hydrating ? (
            <ActivityIndicator size="small" color={ORANGE} />
          ) : (
            <Text style={styles.stockinBarRefreshText}>
              {(t("scan_refresh") as string) || "Refresh"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ADD PARCEL */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Barcode size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>
                {(t("scan_add_parcel") as string) || "ADD PARCEL"}
              </Text>
            </View>

            {/* Mode toggle */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMode("scan")}
                style={[
                  styles.modePill,
                  mode === "scan" && styles.modePillActive,
                ]}
              >
                <Barcode
                  size={14}
                  color={mode === "scan" ? ORANGE : "#6b7280"}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === "scan" && styles.modeTextActive,
                  ]}
                >
                  {(t("scan_mode_scan") as string) || "Scan"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMode("manual")}
                style={[
                  styles.modePill,
                  mode === "manual" && styles.modePillActive,
                ]}
              >
                <Keyboard
                  size={14}
                  color={mode === "manual" ? ORANGE : "#6b7280"}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === "manual" && styles.modeTextActive,
                  ]}
                >
                  {(t("scan_mode_manual") as string) || "Manual"}
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "scan" ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primaryBtnFull}
                  activeOpacity={0.9}
                  onPress={onPressScanBarcode}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <CameraIcon size={16} color="#ffffff" />
                    <Text style={styles.primaryBtnText}>
                      {(t("scan_scan_barcode") as string) || "Scan Barcode"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* <Text style={styles.hintText}>
                  {(t("scan_scan_hint") as string) ||
                    "Point the camera at the barcode. It will search automatically."}
                </Text> */}
              </View>
            ) : (
              <View style={styles.actionRow}>
                {/* SEARCH row */}
                <View style={styles.searchSection}>
                  <View style={styles.searchRow}>
                    <SearchInput
                      label={(t("scan_search_label") as string) || "SEARCH"}
                      placeholder={
                        (t("scan_search_placeholder") as string) ||
                        "Enter customer code or tracking no"
                      }
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
                      onPress={onPressSearchManual}
                      disabled={searching}
                      style={[
                        styles.searchIconButton,
                        searching && styles.searchIconButtonDisabled,
                      ]}
                    >
                      {searching ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <SearchIcon size={16} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Result */}
                {searchResult?.found === false ? (
                  <View style={[styles.resultBox, styles.noResultBox]}>
                    <Text style={styles.noResultTitle}>
                      {(t("scan_no_result_title") as string) || "No result"}
                    </Text>
                    <Text style={styles.noResultSub}>
                      {(t("scan_no_result_sub") as string) ||
                        "No parcels found for:"}{" "}
                      <Text style={styles.boldInline}>
                        {searchResult.customerCode}
                      </Text>
                    </Text>
                  </View>
                ) : searchResult?.found === true ? (
                  (() => {
                    const remainingParcels = searchResult.parcels.filter((p) => {
                      const code = normalizeUpper(getParcelCode(p));
                      return !selectedCodeSet.has(code);
                    });

                    return (
                      <View style={styles.resultBox}>
                        <View style={styles.resultTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultTitle}>
                              {searchResult.customerCode}
                            </Text>
                            <Text style={styles.resultSub}>
                              {(t("scan_found_prefix") as string) || "Found"}{" "}
                              {remainingParcels.length}{" "}
                              {(t("scan_found_suffix") as string) || "parcels"}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.addMiniBtn,
                              (remainingParcels.length === 0 || adding) && {
                                opacity: 0.6,
                              },
                            ]}
                            activeOpacity={0.9}
                            disabled={remainingParcels.length === 0 || adding}
                            onPress={() => addAllApiParcels(remainingParcels)}
                          >
                            {adding ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <>
                                <Plus size={14} color="#ffffff" />
                                <Text style={styles.addMiniBtnText}>
                                  {(t("scan_add_all") as string) || "Add All"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>

                        {remainingParcels.length === 0 ? (
                          <Text style={styles.resultSub}>
                            {(t("scan_all_added") as string) ||
                              "All parcels already added."}
                          </Text>
                        ) : (
                          <View style={styles.resultList}>
                            {remainingParcels.map((p) => {
                              const code = normalizeUpper(getParcelCode(p));
                              const desc = getDescription(p);
                              const w = getWeightKg(p);
                              const isAddingThis = !!addingItemIds[String(p.id)];

                              return (
                                <View
                                  key={String(p.id)}
                                  style={styles.resultItemRow}
                                >
                                  <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={styles.resultItemCode}>
                                      {code}
                                    </Text>
                                    <Text style={styles.resultItemDesc}>
                                      {desc}
                                    </Text>
                                    <Text style={styles.resultItemMeta}>
                                      {(t("scan_weight") as string) || "Weight"}:{" "}
                                      {w.toFixed(2)} kg
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    style={[
                                      styles.addOneBtn,
                                      (isAddingThis || adding) && { opacity: 0.6 },
                                    ]}
                                    activeOpacity={0.9}
                                    disabled={isAddingThis || adding}
                                    onPress={() => addApiParcel(p)}
                                  >
                                    {isAddingThis ? (
                                      <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                      />
                                    ) : (
                                      <>
                                        <Plus size={14} color="#ffffff" />
                                        <Text style={styles.addOneBtnText}>
                                          {(t("scan_add_one") as string) || "Add"}
                                        </Text>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })()
                ) : null}
              </View>
            )}
          </BasicCard>

          {/* LOCATION + SUMMARY */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>
                {(t("scan_location_title") as string) || "LOCATION"}
              </Text>

              {hydrating && (
                <View style={{ marginLeft: 10 }}>
                  <ActivityIndicator size="small" color={ORANGE} />
                </View>
              )}
            </View>

            {/* <Text style={styles.label}>
              {(t("scan_location_selected") as string) || "Selected location"}
            </Text> */}

            <View style={styles.dropdown}>
              {locLoading ? (
                <View style={{ paddingVertical: 10, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={ORANGE} />
                </View>
              ) : (
                <Picker
                  selectedValue={pallet}
                  onValueChange={(value) => setPallet(String(value))}
                  style={styles.picker}
                  dropdownIconColor="#9ca3af"
                  enabled={warehouseLocs.length > 0}
                >
                  {warehouseLocs.length === 0 ? (
                    <Picker.Item
                      label={(t("scan_no_locations") as string) || "No locations"}
                      value=""
                    />
                  ) : (
                    warehouseLocs.map((loc) => (
                      <Picker.Item
                        key={loc.id}
                        label={loc.code}
                        value={String(loc.id)}
                      />
                    ))
                  )}
                </Picker>
              )}
            </View>

            <View style={styles.summaryBlock}>
              <View style={styles.cardHeader}>
                <Info size={16} color="#111827" />
                <Text style={styles.cardHeaderTitle}>
                  {(t("scan_summary_title") as string) || "SUMMARY"}
                </Text>
              </View>
              <Text style={styles.summaryText}>{summaryText}</Text>
            </View>

            {/* <Text style={styles.locationHintText}>
              {(t("scan_location_hint") as string) ||
                "You can change location later for each parcel in the list."}
            </Text> */}
          </BasicCard>

          {/* SCANNED PARCELS */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeaderNoMargin}>
              <Text style={styles.cardHeaderTitle}>
                {(t("scan_scanned_title") as string) || "PARCELS"}
              </Text>

              {/* <TouchableOpacity
                onPress={hydrateFromServer}
                activeOpacity={0.9}
                style={styles.refreshBtn}
                disabled={hydrating}
              >
                {hydrating ? (
                  <ActivityIndicator size="small" color={ORANGE} />
                ) : (
                  <Text style={styles.refreshBtnText}>
                    {(t("scan_refresh") as string) || "Refresh"}
                  </Text>
                )}
              </TouchableOpacity> */}
            </View>

            {selectedParcels.length === 0 ? (
              <Text style={styles.emptyText}>
                {(t("scan_empty_scanned") as string) || "No parcels added yet."}
              </Text>
            ) : (
              selectedParcels.map((parcel) => {
                const isRemovingThis = !!removingItemIds[String(parcel.apiItemId)];
                const locCode = parcel.pallet
                  ? locCodeById.get(String(parcel.pallet)) || parcel.pallet
                  : "-";

                return (
                  <View key={parcel.id} style={styles.itemRow}>
                    <View style={styles.parcelInfo}>
                      <View style={styles.parcelTopLine}>
                        <Text style={styles.parcelCode}>{parcel.code}</Text>

                        {/* <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>
                            {(parcel.status || "arranging").toString()}
                          </Text>
                        </View> */}
                      </View>

                      <Text style={styles.parcelDesc}>{parcel.description}</Text>
                      <Text style={styles.parcelMeta}>
                        {(t("scan_weight") as string) || "Weight"}:{" "}
                        {parcel.weightKg.toFixed(2)} kg
                      </Text>

                      <View style={styles.inlinePalletRow}>
                        <View style={styles.locationPill}>
                          <MapPin size={16} color="#6b7280" fill="#dde1e7ff" />

                          <View style={styles.locationPickerWrap}>
                            <Picker
                              selectedValue={parcel.pallet}
                              onValueChange={(value) => updateParcelPallet(parcel.id, String(value))}
                              style={styles.locationPicker}
                              dropdownIconColor="#6b7280"
                              enabled={warehouseLocs.length > 0}
                            >
                              {warehouseLocs.length === 0 ? (
                                <Picker.Item
                                  label={(t("scan_no_locations") as string) || "No locations"}
                                  value=""
                                />
                              ) : (
                                warehouseLocs.map((loc) => (
                                  <Picker.Item key={loc.id} label={loc.code} value={String(loc.id)} />
                                ))
                              )}
                            </Picker>
                          </View>
                        </View>
                      </View>

                    </View>

                    {/* ✅ ABSOLUTE trash button so picker can stretch full width */}
                    <TouchableOpacity
                      style={[
                        styles.trashButton,
                        styles.trashButtonAbs,
                        (isRemovingThis || clearing) && { opacity: 0.6 },
                      ]}
                      onPress={() => handleRemoveParcel(parcel)}
                      activeOpacity={0.9}
                      disabled={isRemovingThis || clearing}
                    >
                      {isRemovingThis ? (
                        <ActivityIndicator size="small" color={ORANGE} />
                      ) : (
                        <Trash2 size={18} color={ORANGE} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </BasicCard>

        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.footerRow}>
          <CustomButton
            preset="danger"
            style={styles.clearAllBtn}
            icon={Trash2}
            iconPosition="left"
            iconSize={16}
            onPress={handleClearAll}
            disabled={clearing || selectedParcels.length === 0}
          >
            {clearing
              ? (t("scan_clearing") as string) || "Clearing..."
              : (t("scan_clear_all") as string) || "Clear All"}
          </CustomButton>

          <CustomButton
            preset="approve"
            style={styles.saveBtn}
            icon={SaveIcon}
            iconPosition="left"
            iconSize={16}
            onPress={onSave}
          >
            {(t("scan_save") as string) || "Save"}
          </CustomButton>
        </View>
      </View>

      {/* ✅ Camera Scan Modal */}
      <Modal
        visible={scanOpen}
        animationType="slide"
        onRequestClose={() => setScanOpen(false)}
      >
        <SafeAreaView style={styles.scanSafe}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>
              {(t("scan_camera_title") as string) || "Scan Barcode"}
            </Text>

            <TouchableOpacity
              onPress={() => setScanOpen(false)}
              activeOpacity={0.9}
              style={styles.scanCloseBtn}
            >
              <X size={18} color="#111827" />
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
                    "datamatrix",
                    "aztec",
                  ],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.focusBox} />
                <Text style={styles.cameraHint}>
                  {(t("scan_camera_hint") as string) ||
                    "Align the barcode within the box"}
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

  // ✅ top stockin bar
  stockinBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  stockinBarLabel: {
    fontFamily: "Karla-Bold",
    fontSize: 12,
    color: "#374151",
  },
  stockinBarValue: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: "#111827",
  },
  stockinBarRefresh: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  stockinBarRefreshText: {
    fontFamily: "Karla-Bold",
    fontSize: 11,
    color: "#374151",
  },

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
    marginLeft: 8,
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    color: "#000000ff",
  },

  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  refreshBtnText: {
    fontFamily: "Karla-Bold",
    fontSize: 11,
    color: "#374151",
  },

  /* Mode pills */
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

  /* Action area */
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
  hintText: { fontFamily: "Karla-Regular", fontSize: 11, color: "#9ca3af" },

  /* Search row */
  searchSection: { marginTop: 8, marginBottom: 2 },
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

  /* Result box */
  resultBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  resultTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    color: "#111827",
    marginBottom: 2,
  },
  resultSub: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  boldInline: { fontFamily: "Karla-Bold", color: "#111827" },

  noResultBox: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  noResultTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    color: "#111827",
    marginBottom: 4,
  },
  noResultSub: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },

  addMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
    minWidth: 92,
    justifyContent: "center",
  },
  addMiniBtnText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#ffffff" },

  resultList: { gap: 10 },
  resultItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  resultItemCode: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    color: ORANGE,
    marginBottom: 2,
  },
  resultItemDesc: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280" },
  resultItemMeta: {
    marginTop: 6,
    fontFamily: "Karla-Regular",
    fontSize: 11,
    color: "#9ca3af",
  },
  addOneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
    minWidth: 74,
    justifyContent: "center",
  },
  addOneBtnText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#ffffff" },

  /* LOCATION */
  label: { fontFamily: "Karla-Regular", fontSize: 11, color: "#6b7280", marginBottom: 6 },
  dropdown: {
    minHeight: PICKER_MIN_H,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: { width: "100%" },

  summaryBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  summaryText: {
    fontFamily: "Karla-Regular",
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4
  },

  locationHintText: {
    marginTop: 10,
    fontFamily: "Karla-Regular",
    fontSize: 11,
    color: "#9ca3af"
  },

  emptyText: { fontFamily: "Karla-Regular", fontSize: 12, color: "#9ca3af", marginTop: 4 },

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#918b7f31",
    marginBottom: 8,
    position: "relative", // ✅ required for absolute trash button
  },

  // ✅ full width now (no right padding reserve)
  parcelInfo: { flex: 1, paddingRight: 0 },

  parcelTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  parcelCode: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: ORANGE,
    marginBottom: 2,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  statusPillText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#9a3412" },

  parcelDesc: { 
    fontFamily: "Karla-Regular", 
    fontSize: 12, 
    color: "#6b7280" 
  },
  parcelMeta: { 
    marginTop: 6, 
    fontFamily: "Karla-Regular", 
    fontSize: 12, 
    color: "#9ca3af" },

  inlinePalletRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "nowrap",
    width: "100%",          // ✅ ensure row stretches full width
  },

  inlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minHeight: PICKER_MIN_H,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inlinePillLabel: {
    fontFamily: "Karla-Medium",
    fontSize: 11,
    color: "#6b7280"
  },

  inlineDropdown: {
    flex: 1,
    flexGrow: 1,            // ✅ force fill remaining space
    flexShrink: 1,          // ✅ allow shrink in row
    // minWidth: 0,            // ✅ IMPORTANT in flex row (prevents “reserved space”)
    // minHeight: PICKER_MIN_H,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    overflow: "hidden",
  },

  inlinePicker: {
    flex: 1,                // ✅ THIS is the key (Android Picker needs flex)
    width: "100%",
  },
  locationPill: {
    flex: 1,                    // ✅ fill horizontally
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    minHeight: PICKER_MIN_H,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  locationPickerWrap: {
    flex: 1,                    // ✅ dropdown takes remaining space
    // height: PICKER_MIN_H,
    justifyContent: "center",
  },

  locationPicker: {
    width: "100%",
    // height: PICKER_MIN_H,
  },

  locPreviewPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    minHeight: PICKER_MIN_H,
    alignItems: "center",
    justifyContent: "center",
  },
  locPreviewText: { fontFamily: "Karla-Bold", fontSize: 11, color: "#374151" },

  trashButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7ed",
  },

  // ✅ absolute position so it doesn't "steal" width from parcelInfo
  trashButtonAbs: {
    position: "absolute",
    right: 10,
    top: 10,
  },

  footerRow: {
    position: "absolute",
    right: 16,
    bottom: 8,
    flexDirection: "row",
    gap: 10,
  },
  clearAllBtn: { borderRadius: 10 },
  saveBtn: { borderRadius: 10, minWidth: 110 },

  // ✅ scan modal styles
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
  scanBody: { flex: 1, backgroundColor: "#000", padding: 14 },
  cameraFrame: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  focusBox: {
    width: "78%",
    height: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "transparent",
  },
  cameraHint: {
    marginTop: 18,
    fontFamily: "Karla-Regular",
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.9,
  },
});
