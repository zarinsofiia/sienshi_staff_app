// app/(tabs)/scan/list.tsx
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Picker } from "@react-native-picker/picker";
import GeneralPickerModal, { PickerOption } from "../../../components/modal/GeneralModalPicker";

import { useColorScheme } from "react-native";
import { AppHeader } from "../../../components/AppHeader";
import CustomButton from "../../../components/button/CustomButton";
import BasicCard from "../../../components/card/BasicCard";
import SearchInput from "../../../components/input/SearchInput";

import {
  Barcode,
  Camera as CameraIcon,
  ChevronDown,
  ChevronRight,
  Info,
  Keyboard,
  MapPin,
  Plus,
  Save as SaveIcon,
  Search as SearchIcon,
  Trash2,
  X,
} from "lucide-react-native";

import type { MobileDialogState } from "../../../components/hooks/useMobileCustomerApprovalFlow";
import MobileAlertDialog from "../../../components/modal/MobileAlertDialog";
import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
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
  box_m3?: string | null;
  pallet: string; // loc_id string (optional / local)
  status?: string | null; // arranging
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
  display_status?: string | null;
  manifest_id?: number | null;

  stockin_id?: number | null;
  stockin_item_id?: number | null;

  loc_id?: number | null;
  stockin_location?: number | null;
  parcel_location?: number | null;

  items?: ApiParcelItem[];
};

// ✅ UPDATED: view_stockin now returns manifest fields + items
type ApiViewStockinResponse = {
  id: number;
  manifest_details?: string | null;
  pod?: any;
  shipper?: any;
  eta?: any;
  declaration_date?: any;
  discharge_port?: any;
  loading_port?: any;
  date_in?: any;
  created_date?: string | null;
  status?: string | null;
  date_pack?: string | null;
  items?: ApiStockinItem[];
};

type SearchResultState =
  | null
  | { found: false; customerCode: string; message?: string }
  | { found: true; customerCode: string; parcels: ApiStockinItem[] };

// ✅ fix TS union issue: always return a single shape
type FetchParcelsResult = { items: ApiStockinItem[]; message?: string };
const EMPTY_FETCH: FetchParcelsResult = { items: [] };

const PICKER_MIN_H = Platform.select({
  android: 48,
  ios: 40,
  default: 44,
});

type ParcelSection = {
  key: string; // locId or "__UNASSIGNED__"
  title: string; // loc code
  count: number;
  data: ScannedParcel[];
};

export default function ScanScreen() {
  const { t } = useLanguage();

  const params = useLocalSearchParams<{
    backTo?: string;
    manifestId?: string;
    manifestTitle?: string;
  }>();

  const backTo = params.backTo as string | undefined;

  const manifestId = params.manifestId ? String(params.manifestId) : "";
  const manifestTitle = params.manifestTitle ? String(params.manifestTitle) : "";

  const headerTitle = manifestId
    ? `${((t("common_manifest") as any) ?? "Manifest") as string} ${manifestId}`
    : t("header_scan");

  const [mode, setMode] = useState<ScanMode>("scan");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ✅ top bar display (now show manifest_details)
  const [stockinCode, setStockinCode] = useState<string>("");

  const [pallet, setPallet] = useState<string>("");
  const [warehouseLocs, setWarehouseLocs] = useState<WarehouseLoc[]>([]);
  // ✅ searchable location picker modal
  const [locPickerOpen, setLocPickerOpen] = useState(false);
  const [locPickerValue, setLocPickerValue] = useState<string | null>(null);

  const [locPickerTarget, setLocPickerTarget] = useState<
    | { type: "global" }
    | { type: "parcel"; parcelLocalId: string; apiItemId: number; prevLocId: string }
  >({ type: "global" });

  const [manifestStatus, setManifestStatus] = useState<string | null>(null);

  // ✅ NEW: search scanned parcels
  const [scanSearch, setScanSearch] = useState<string>("");

  const palletRef = useRef<string>("");
  useEffect(() => {
    palletRef.current = pallet;
  }, [pallet]);

  const warehouseLocsRef = useRef<WarehouseLoc[]>([]);
  useEffect(() => {
    warehouseLocsRef.current = warehouseLocs;
  }, [warehouseLocs]);

  const getEffectiveLocId = () => {
    const p = String(palletRef.current || "").trim();
    if (p) return p;

    const list = warehouseLocsRef.current;
    if (Array.isArray(list) && list.length > 0) return String(list[0].id);

    return "";
  };

  const [locLoading, setLocLoading] = useState(false);

  const [manualValue, setManualValue] = useState("");

  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultState>(null);

  const [selectedParcels, setSelectedParcels] = useState<ScannedParcel[]>([]);
  const [hydrating, setHydrating] = useState(false);

  const selectedParcelsRef = useRef<ScannedParcel[]>([]);
  useEffect(() => {
    selectedParcelsRef.current = selectedParcels;
  }, [selectedParcels]);

  const [adding, setAdding] = useState(false);
  const [addingItemIds, setAddingItemIds] = useState<Record<string, boolean>>(
    {}
  );
  const [removingItemIds, setRemovingItemIds] = useState<
    Record<string, boolean>
  >({});
  const [clearing, setClearing] = useState(false);

  const [dialog, setDialog] = useState<MobileDialogState | null>(null);
  const [afterClose, setAfterClose] = useState<(() => void) | null>(null);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [saving, setSaving] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);

  // ✅ NEW: collapse/expand locations
  const [collapsedLocs, setCollapsedLocs] = useState<Record<string, boolean>>(
    {}
  );

  // ✅ when manifest changes, clear old state
  useEffect(() => {
    setSelectedParcels([]);
    setSearchResult(null);
    setManualValue("");
    setStockinCode("");
    setScanSearch("");
    setCollapsedLocs({});
  }, [manifestId]);

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
  const locationOptions = useMemo<PickerOption[]>(() => {
    return warehouseLocs.map((l) => ({
      label: l.name ? `${l.code} — ${l.name}` : l.code,
      value: String(l.id),
    }));
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

  const formatM3 = (v?: string | null) => {
    const raw = (v ?? "").toString().trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n.toFixed(2) : "-";
  };

  // ✅ shared fetch helper
  const fetchParcels = useCallback(
    async (url: string, body: any): Promise<FetchParcelsResult> => {
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
          console.log("[fetchParcels] non-ok:", url, res.status, text);
          return {
            items: [],
            message: data?.message || text || `HTTP ${res.status}`,
          };
        }

        if (Array.isArray(data)) return { items: data as ApiStockinItem[] };

        if (data && typeof data === "object" && typeof data.message === "string") {
          return { items: [], message: data.message };
        }

        return { items: [] };
      } catch (e) {
        console.log("[fetchParcels] exception:", url, e);
        return { items: [], message: "Network error" };
      }
    },
    []
  );

  const editItemLocation = async (
    parcelId: number,
    locationId: string
  ): Promise<boolean> => {
    try {
      const payload = {
        parcel_id: String(parcelId),
        location_id: String(locationId),
      };

      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/edit_item_location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        console.log("edit_item_location error:", res.status, text);
        return false;
      }

      return true;
    } catch (e) {
      console.log("edit_item_location exception:", e);
      return false;
    }
  };

  // ✅ UPDATED: view_stockin body is now { manifest_id }
  const hydrateFromServer = useCallback(async () => {
    if (!manifestId) return;

    setHydrating(true);
    try {
      const res = await authedFetch(`${API_BASE_URL}/api/stock_in/view_stockin`, {
        method: "POST",
        body: JSON.stringify({ manifest_id: String(manifestId) }),
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

      const manifest: ApiViewStockinResponse = data;
      setManifestStatus((manifest as any)?.status ?? null);

      // ✅ show manifest_details on top bar
      setStockinCode((manifest.manifest_details || "").toString());

      const items = Array.isArray(manifest.items) ? manifest.items : [];

      const next: ScannedParcel[] = items.map((it) => {
        const code = normalizeUpper(getParcelCode(it));
        return {
          id: `srv_${it.id}`,
          apiItemId: it.id,
          stockinItemId: it.stockin_item_id ?? null,
          code,
          description: getDescription(it),
          weightKg: getWeightKg(it),
          box_m3: it.box_m3 ?? null,
          pallet:
            it.stockin_location !== null && it.stockin_location !== undefined
              ? String(it.stockin_location)
              : "",
          status: it.status ?? null,
        };
      });

      setSelectedParcels(next);
    } catch (e) {
      console.log("view_stockin exception:", e);
    } finally {
      setHydrating(false);
    }
  }, [manifestId]);

  useEffect(() => {
    hydrateFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestId]);

  useFocusEffect(
    useCallback(() => {
      hydrateFromServer();
    }, [hydrateFromServer])
  );

  const scannedCount = selectedParcels.length;

  const summaryText = useMemo(() => {
    if (scannedCount === 0)
      return `${t("scan_no_parcels_yet") || "No parcels yet"} (${t("scan_location_title") || "Location"
        } ${selectedLocCode})`;

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

  const selectedIdSet = useMemo(() => {
    return new Set(selectedParcels.map((p) => p.apiItemId));
  }, [selectedParcels]);

  const addParcelToListLocalOnly = (payload: {
    apiItemId: number;
    stockinItemId?: number | null;
    code: string;
    description: string;
    weightKg: number;
    box_m3?: string | null;
    pallet: string;
    status?: string | null;
  }) => {
    const code = normalizeUpper(payload.code);

    setSelectedParcels((prev) => {
      if (prev.some((p) => p.apiItemId === payload.apiItemId)) {
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
        box_m3: payload.box_m3 ?? null,
        pallet: payload.pallet,
        status: payload.status ?? "arranging",
      };

      return [next, ...prev];
    });
  };

  // ✅ insert_item_stockin uses manifest_id + item_id + loc_id
  const insertItemToStockIn = async (
    itemId: number
  ): Promise<{ ok: boolean; inserted?: any | null }> => {
    if (!manifestId) {
      showError(
        (t("scan_missing_stockin_title") as string) || "Missing manifest",
        "manifest_id is missing."
      );
      return { ok: false };
    }

    const locId = getEffectiveLocId();

    const payload = {
      manifest_id: String(manifestId),
      item_id: String(itemId),
      location_id: String(locId || ""),
    };

    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/insert_item_stockin`,
        {
          method: "POST",
          body: JSON.stringify(payload),
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
          data?.message ||
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

  // ✅ remove_item_stockin uses manifest_id + item_id
  const removeItemFromStockIn = async (itemId: number): Promise<boolean> => {
    if (!manifestId) {
      showError(
        (t("scan_missing_stockin_title") as string) || "Missing manifest",
        "manifest_id is missing."
      );
      return false;
    }

    const payload = {
      manifest_id: String(manifestId),
      item_id: String(itemId),
    };

    try {
      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/remove_item_stockin`,
        {
          method: "POST",
          body: JSON.stringify(payload),
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
          data?.message ||
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

  // NOTE: leaving complete_stockin as-is (you did not specify it changed)
  const completeStockIn = async (): Promise<boolean> => {
    if (!manifestId) {
      showError(
        (t("scan_missing_stockin_title") as string) || "Missing manifest",
        "manifest_id is missing."
      );
      return false;
    }

    try {
      const payload = { manifest_id: Number(manifestId) };

      const res = await authedFetch(
        `${API_BASE_URL}/api/stock_in/complete_stockin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        showError(
          (t("scan_complete_failed_title") as string) || "Complete failed",
          data?.message ||
          (t("scan_complete_failed_message") as string) ||
          "Unable to complete stock-in. Please try again."
        );
        return false;
      }

      return true;
    } catch (e) {
      console.log("complete_stockin exception:", e);
      showError(
        (t("scan_complete_failed_title") as string) || "Complete failed",
        (t("scan_complete_failed_message") as string) ||
        "Unable to complete stock-in. Please try again."
      );
      return false;
    }
  };

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
      box_m3: x.box_m3 ?? null,
      pallet: getEffectiveLocId(),
      status,
    });
  };

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

    if (!manifestId) {
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
  const openGlobalLocPicker = () => {
    setLocPickerTarget({ type: "global" });
    setLocPickerValue(pallet || null);
    setLocPickerOpen(true);
  };

  const openParcelLocPicker = (parcel: ScannedParcel) => {
    setLocPickerTarget({
      type: "parcel",
      parcelLocalId: parcel.id,
      apiItemId: parcel.apiItemId,
      prevLocId: parcel.pallet,
    });
    setLocPickerValue(parcel.pallet || null);
    setLocPickerOpen(true);
  };

  const onLocationPicked = async (value: string) => {
    if (locPickerTarget.type === "global") {
      setPallet(String(value));
      return;
    }

    const { parcelLocalId, apiItemId, prevLocId } = locPickerTarget;

    // optimistic UI
    updateParcelPallet(parcelLocalId, String(value));

    const ok = await editItemLocation(apiItemId, String(value));
    if (!ok) {
      updateParcelPallet(parcelLocalId, prevLocId);
      showError(
        (t("scan_update_location_failed_title") as string) || "Update failed",
        (t("scan_update_location_failed_message") as string) ||
        "Unable to update location. Please try again."
      );
    }
  };

  // customer code: K/XXXX
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
      trackingNumber: trimmed, // exact
    };
  };

  const doSearch = useCallback(
    async (rawValue: string) => {
      const raw = rawValue.trim();
      if (!raw) {
        setSearchResult({ found: false, customerCode: "" });
        return;
      }

      if (!manifestId) {
        setSearchResult({
          found: false,
          customerCode: raw,
          message: "Missing manifest id.",
        });
        return;
      }

      const { runCust, runTrack, customerCode, trackingNumber } =
        pickSearchTargets(raw);

      setSearching(true);
      setSearchResult(null);

      try {
        const [custRes, trackRes] = await Promise.all([
          runCust
            ? fetchParcels(`${API_BASE_URL}/api/stock_in/get_parcels_cust_code`, {
              customer_code: customerCode,
              manifest_id: manifestId,
            })
            : Promise.resolve(EMPTY_FETCH),

          runTrack
            ? fetchParcels(
              `${API_BASE_URL}/api/stock_in/get_parcels_tracking_no`,
              {
                tracking_number: trackingNumber,
                manifest_id: manifestId,
              }
            )
            : Promise.resolve(EMPTY_FETCH),
        ]);

        const map = new Map<number, ApiStockinItem>();
        [...custRes.items, ...trackRes.items].forEach((p) => map.set(p.id, p));
        const merged = Array.from(map.values());

        if (merged.length === 0) {
          setSearchResult({
            found: false,
            customerCode: raw,
            message: trackRes.message,
          });
          return;
        }

        setSearchResult({ found: true, customerCode: raw, parcels: merged });
      } finally {
        setSearching(false);
      }
    },
    [fetchParcels, manifestId]
  );

  const doScanAutoInsert = useCallback(
    async (rawValue: string) => {
      const raw = rawValue.trim();
      if (!raw) return;

      if (!manifestId) {
        showError("No result", "Missing manifest id.");
        return;
      }

      const { runCust, runTrack, customerCode, trackingNumber } =
        pickSearchTargets(raw);

      const [custRes, trackRes] = await Promise.all([
        runCust
          ? fetchParcels(`${API_BASE_URL}/api/stock_in/get_parcels_cust_code`, {
            customer_code: customerCode,
            manifest_id: manifestId,
          })
          : Promise.resolve(EMPTY_FETCH),

        runTrack
          ? fetchParcels(`${API_BASE_URL}/api/stock_in/get_parcels_tracking_no`, {
            tracking_number: trackingNumber,
            manifest_id: manifestId,
          })
          : Promise.resolve(EMPTY_FETCH),
      ]);

      const map = new Map<number, ApiStockinItem>();
      [...custRes.items, ...trackRes.items].forEach((p) => map.set(p.id, p));
      const merged = Array.from(map.values());

      if (merged.length === 0) {
        showError(
          (t("scan_no_result_title") as string) || "No result",
          trackRes.message ||
          `${(t("scan_no_result_sub") as string) || "No parcels found for:"
          } ${raw}`
        );
        return;
      }

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
    },
    [fetchParcels, manifestId, t]
  );

  const onPressSearchManual = async () => {
    await doSearch(manualValue);
  };

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

    setManualValue(raw);
    setSearchResult(null);

    try {
      await doScanAutoInsert(raw);
    } finally {
      setTimeout(() => setScanBusy(false), 700);
    }
  };

  const onSave = async () => {
    if (saving) return;

    if (selectedParcels.length === 0) {
      showError(
        (t("scan_missing_title") as string) || "Missing items",
        (t("scan_missing_message") as string) ||
        "Please add at least one parcel."
      );
      return;
    }

    setSaving(true);
    try {
      const ok = await completeStockIn();
      if (!ok) return;

      showSuccess(
        (t("scan_saved_title") as string) || "Saved",
        (t("scan_saved_message") as string) || "Stock-in updated.",
        () => {
          if (backTo) router.replace(backTo as any);
          else router.replace("/stock");
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const onPressComplete = () => {
    if (saving) return;

    if (selectedParcels.length === 0) {
      showError(
        (t("scan_missing_title") as string) || "Missing items",
        (t("scan_missing_message") as string) ||
        "Please add at least one parcel."
      );
      return;
    }

    setConfirmCompleteOpen(true);
  };

  // ---------------------------
  // ✅ NEW: Group + Search + Collapse
  // ---------------------------
  const filteredParcels = useMemo(() => {
    const q = (scanSearch || "").trim().toUpperCase();
    if (!q) return selectedParcels;

    return selectedParcels.filter((p) => {
      const code = (p.code || "").toUpperCase();
      const desc = (p.description || "").toUpperCase();
      return code.includes(q) || desc.includes(q);
    });
  }, [selectedParcels, scanSearch]);

  const sections: ParcelSection[] = useMemo(() => {
    const buckets: Record<string, ScannedParcel[]> = {};
    for (const p of filteredParcels) {
      const key = (p.pallet || "").trim() ? String(p.pallet) : "__UNASSIGNED__";
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(p);
    }

    const list: ParcelSection[] = Object.keys(buckets).map((key) => {
      const title =
        key === "__UNASSIGNED__"
          ? (t("scan_unassigned") as string) || "UNASSIGNED"
          : locCodeById.get(String(key)) || String(key);

      return {
        key,
        title,
        count: buckets[key].length,
        data: buckets[key].slice().sort((a, b) => a.code.localeCompare(b.code)),
      };
    });

    list.sort((a, b) => {
      if (a.key === "__UNASSIGNED__") return -1;
      if (b.key === "__UNASSIGNED__") return 1;
      return a.title.localeCompare(b.title);
    });

    // Apply collapse: if collapsed, show empty data
    return list.map((s) => {
      const isCollapsed = !!collapsedLocs[s.key];
      return { ...s, data: isCollapsed ? [] : s.data };
    });
  }, [filteredParcels, locCodeById, collapsedLocs, t]);

  // Initialize collapsed state (optional):
  // - Expand all by default
  // - But keep user toggles if already exists
  useEffect(() => {
    setCollapsedLocs((prev) => {
      // If prev already has some keys, do nothing
      if (Object.keys(prev).length > 0) return prev;

      // Default: expand all (collapsed=false)
      const next: Record<string, boolean> = {};
      for (const s of sections) next[s.key] = false;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestId]);

  const toggleSection = (key: string) => {
    setCollapsedLocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------
  // UI blocks in ListHeader
  // ---------------------------
  const HeaderContent = (
    <View style={styles.content}>
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
            style={[styles.modePill, mode === "scan" && styles.modePillActive]}
          >
            <Barcode size={14} color={mode === "scan" ? ORANGE : "#2e2f31"} />
            <Text
              style={[styles.modeText, mode === "scan" && styles.modeTextActive]}
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
            <Keyboard size={14} color={mode === "manual" ? ORANGE : "#2e2f31"} />
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <CameraIcon size={16} color="#ffffff" />
                <Text style={styles.primaryBtnText}>
                  {(t("scan_scan_barcode") as string) || "Scan Barcode"}
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
                  placeholder={
                    (t("scan_search_placeholder") as string) ||
                    "Enter customer code or tracking no"
                  }
                  value={manualValue}
                  onChangeText={(v) => {
                    setManualValue(v);
                    if (searchResult) setSearchResult(null);
                  }}
                  onClear={() => {
                    setManualValue("");
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
                  {searchResult.message
                    ? searchResult.message
                    : `${(t("scan_no_result_sub") as string) ||
                    "No parcels found for:"
                    } ${searchResult.customerCode}`}
                </Text>
              </View>
            ) : searchResult?.found === true ? (
              (() => {
                const remainingParcels = searchResult.parcels.filter(
                  (p) => !selectedIdSet.has(p.id)
                );

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
                            <View key={String(p.id)} style={styles.resultItemRow}>
                              <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.resultItemCode}>{code}</Text>
                                <Text style={styles.resultItemDesc}>{desc}</Text>
                                <Text style={styles.resultItemMeta}>
                                  {(t("scan_weight") as string) || "Weight"}:{" "}
                                  {w.toFixed(2)} kg
                                  {"  •  "}
                                  {(t("scan_volume") as string) || "Volume"}:{" "}
                                  {formatM3(p.box_m3)} m³
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
                                  <ActivityIndicator size="small" color="#ffffff" />
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

        <View style={styles.dropdown}>
          {locLoading ? (
            <View style={{ paddingVertical: 10, alignItems: "center" }}>
              <ActivityIndicator size="small" color={ORANGE} />
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openGlobalLocPicker}
              style={styles.locSelectRow}
              disabled={warehouseLocs.length === 0}
            >
              <Text style={styles.locSelectText}>
                {warehouseLocs.length === 0 ? "-" : (selectedLocCode || "-")}
              </Text>
              <ChevronDown size={18} color="#111827" />
            </TouchableOpacity>
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
      </BasicCard>

      {/* PARCELS HEADER + SEARCH */}
      <BasicCard style={styles.card}>
        <View style={styles.cardHeaderNoMargin}>
          <Text style={styles.cardHeaderTitle}>
            {(t("scan_scanned_title") as string) || "PARCELS"}
          </Text>

          {/* <TouchableOpacity
            onPress={hydrateFromServer}
            activeOpacity={0.9}
            style={[styles.refreshPill, hydrating && { opacity: 0.6 }]}
            disabled={hydrating}
          >
            {hydrating ? (
              <ActivityIndicator size="small" color={ORANGE} />
            ) : (
              <Text style={styles.refreshPillText}>
                {(t("scan_refresh") as string) || "Refresh"}
              </Text>
            )}
          </TouchableOpacity> */}
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.scanSearchRow}>
            <SearchInput
              label={(t("scan_search_scanned_label") as string) || "SEARCH SCANNED"}
              placeholder={
                (t("scan_search_scanned_placeholder") as string) ||
                "Search code or description"
              }
              value={scanSearch}
              onChangeText={(v) => setScanSearch(v)}
              onClear={() => setScanSearch("")}
              containerStyle={{ flex: 1 }}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.scanSearchMeta}>
            {(t("scan_showing") as string) || "Showing"} {filteredParcels.length}{" "}
            {(t("scan_of") as string) || "of"} {selectedParcels.length}
          </Text>

          {selectedParcels.length === 0 ? (
            <Text style={styles.emptyText}>
              {(t("scan_empty_scanned") as string) || "No parcels added yet."}
            </Text>
          ) : filteredParcels.length === 0 ? (
            <Text style={styles.emptyText}>
              {(t("scan_no_match") as string) || "No matching parcels."}
            </Text>
          )
            : null
          }
        </View>
      </BasicCard>
    </View>
  );

  // Render one parcel item (reused in SectionList)
  const renderParcelItem = ({ item: parcel }: { item: ScannedParcel }) => {
    const isRemovingThis = !!removingItemIds[String(parcel.apiItemId)];

    return (
      <View style={styles.itemRow}>
        <View style={styles.parcelInfo}>
          <View style={styles.parcelTextBlock}>
            <View style={styles.parcelTopLine}>
              <Text style={styles.parcelCode}>{parcel.code}</Text>
            </View>

            <Text style={styles.parcelDesc}>{parcel.description}</Text>

            <Text style={styles.parcelMeta}>
              {(t("scan_weight") as string) || "Weight"}:{" "}
              {parcel.weightKg.toFixed(2)} kg
              {"  •  "}
              {(t("scan_volume") as string) || "Volume"}:{" "}
              {formatM3(parcel.box_m3)} m³
            </Text>

            <View style={styles.statusPillRow}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {(() => {
                    const raw = (parcel.status || "").toString().trim();
                    if (!raw) return "-";
                    return raw.replace(/_/g, " ").toUpperCase();
                  })()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inlinePalletRow}>
            <View style={styles.locationPill}>
              <MapPin size={16} color="#2e2f31" fill="#dde1e7ff" />
              <View style={styles.locationPickerWrap}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openParcelLocPicker(parcel)}
                  style={styles.inlineLocBtn}
                  disabled={warehouseLocs.length === 0}
                >
                  <Text style={styles.inlineLocBtnText}>
                    {parcel.pallet
                      ? locCodeById.get(String(parcel.pallet)) || parcel.pallet
                      : "-"}
                  </Text>
                  <ChevronDown size={16} color="#111827" />
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </View>

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
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: ParcelSection;
  }) => {
    const isCollapsed = !!collapsedLocs[section.key];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleSection(section.key)}
        style={styles.sectionHeader}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {isCollapsed ? (
            <ChevronRight size={20} color="#111827" />
          ) : (
            <ChevronDown size={20} color="#111827" />
          )}
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <View style={styles.sectionCountPill}>
            <Text style={styles.sectionCountText}>{section.count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey={headerTitle} showBack backTo={backTo} />

      {/* ✅ MAIN LIST (virtualized) */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderParcelItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={HeaderContent}
        ListFooterComponent={<View style={{ height: 120 }} />}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />

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
          onPress={onPressComplete}
          disabled={saving}
        >
          {saving
            ? (t("scan_completing") as string) || "Completing..."
            : (t("scan_save") as string) || "Save"}
        </CustomButton>
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

      {/* ✅ Confirm complete dialog */}
      <Modal
        visible={confirmCompleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCompleteOpen(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {(t("scan_confirm_complete_title") as string) || "Confirm"}
            </Text>

            <Text style={styles.confirmMsg}>
              {(t("scan_confirm_complete_message") as string) ||
                "Once saved, you can't edit anymore."}
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                activeOpacity={0.9}
                onPress={() => setConfirmCompleteOpen(false)}
                disabled={saving}
              >
                <Text style={styles.confirmCancelText}>
                  {(t("scan_cancel") as string) || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmOkBtn, saving && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={async () => {
                  setConfirmCompleteOpen(false);
                  await onSave();
                }}
                disabled={saving}
              >
                <Text style={styles.confirmOkText}>
                  {(t("scan_confirm") as string) || "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MobileAlertDialog dialog={dialog} onClose={closeDialog} />
      <GeneralPickerModal
        open={locPickerOpen}
        title={(t("scan_location_title") as string) || "Select Location"}
        options={locationOptions}
        value={locPickerValue}
        onClose={() => setLocPickerOpen(false)}
        onChange={(val) => {
          setLocPickerValue(val);
          onLocationPicked(val);
        }}
        searchable
        searchLabel={(t("search") as string) || "Search"}
        searchPlaceholder={
          ((t("scan_search_location") as any) || "Search location code/name") as string
        }
        emptyText={(t("scan_no_locations") as string) || "No results"}
        cancelText={(t("scan_close") as string) || "Close"}
        closeOnSelect
        maxHeight={360}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffffff" },

  content: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 8 },
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
    fontSize: 15,
    letterSpacing: 1,
    color: "#000000ff",
  },

  refreshPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  refreshPillText: {
    fontFamily: "Karla-Bold",
    fontSize: 13,
    color: "#374151",
  },

  modeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  modePillActive: { borderColor: ORANGE, backgroundColor: "#fff7ed" },
  modeText: {
    fontFamily: "Karla-Bold",
    fontSize: 14,
    color: "#2e2f31"
  },
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
  primaryBtnText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#ffffff" },

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
    fontSize: 13,
    color: "#111827",
    marginBottom: 2,
  },
  resultSub: { fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },

  noResultBox: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  noResultTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    color: "#111827",
    marginBottom: 4,
  },
  noResultSub: { fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },

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
  addMiniBtnText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#ffffff" },

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
    fontSize: 13,
    color: ORANGE,
    marginBottom: 2,
  },
  resultItemDesc: { fontFamily: "Karla-Regular", fontSize: 13, color: "#2e2f31" },
  resultItemMeta: {
    marginTop: 6,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#444649",
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
  addOneBtnText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#ffffff" },

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

  summaryBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  summaryText: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
    marginTop: 4,
  },

  emptyText: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#444649",
    marginTop: 10,
  },

  // ✅ Scanned search area
  scanSearchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scanSearchMeta: {
    marginTop: 8,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#444649",
  },
  groupHint: {
    marginTop: 8,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
  },

  // ✅ Section headers (Location)
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  sectionTitle: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 16,
    color: "#111827",
  },
  sectionCountPill: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  sectionCountText: { 
    fontFamily: "Karla-Bold", 
    fontSize: 15, 
    color: "#9a3412" },

  itemRow: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#918b7f31",
    marginBottom: 8,
    position: "relative",
  },

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

  parcelTextBlock: { paddingRight: 44 },

  parcelDesc: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
    flexShrink: 1,
  },

  parcelMeta: {
    marginTop: 6,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
  },

  statusPillRow: { marginTop: 8, flexDirection: "row", alignItems: "center" },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignSelf: "flex-start",
  },
  statusPillText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#9a3412" },

  inlinePalletRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },

  locationPill: {
    flex: 1,
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

  locationPickerWrap: { flex: 1, justifyContent: "center" },
  locationPicker: { width: "100%" },

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
  trashButtonAbs: { position: "absolute", right: 10, top: 10 },

  footerRow: {
    position: "absolute",
    right: 16,
    bottom: 8,
    flexDirection: "row",
    gap: 10,
  },
  clearAllBtn: { borderRadius: 999 },
  saveBtn: { borderRadius: 999, minWidth: 110 },

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
  },
  cameraHint: {
    marginTop: 18,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#ffffff",
    opacity: 0.9,
  },

  pickerDark: { color: "#111827" },
  pickerItemDark: { color: "#111827", fontFamily: "Karla-Bold", fontSize: 13 },
  pickerItemLight: { color: "#111827", fontFamily: "Karla-Bold", fontSize: 13 },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },
  confirmTitle: { fontFamily: "Karla-ExtraBold", fontSize: 14, color: "#111827" },
  confirmMsg: {
    marginTop: 8,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
    lineHeight: 18,
  },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  confirmCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  confirmCancelText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#374151" },
  confirmOkBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
  },
  confirmOkText: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: "#ffffff" },
  locSelectRow: {
    minHeight: PICKER_MIN_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  locSelectText: {
    fontFamily: "Karla-Bold",
    fontSize: 14,
    color: "#111827",
  },
  inlineLocBtn: {
    width: "100%",
    minHeight: PICKER_MIN_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  inlineLocBtnText: {
    fontFamily: "Karla-Bold",
    fontSize: 14,
    color: "#111827",
  },

});
