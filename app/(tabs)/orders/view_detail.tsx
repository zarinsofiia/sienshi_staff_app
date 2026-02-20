import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileText,
  ListChecks,
  MapPin,
  Package as PackageIcon,
  Save,
  User,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as DocumentPicker from "expo-document-picker";
import BasicCard from "../../../components/card/BasicCard";
import CustomButton from "@/components/button/CustomButton";
import GeneralPickerModal from "@/components/modal/GeneralModalPicker";
const ORANGE = "#EE9328";

type ParcelRow = { code: string; desc: string };

type DoDetail = {
  doNo: string;
  status: string;
  customerName: string;
  phone: string;
  address: string;
  parcelsCount: number;
  notes: string;
  parcels: ParcelRow[];
};

const STATUS_OPTIONS = ["Out for Delivery", "Delivered", "Attempt", "POD"] as const;

type PodFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

/**
 * Draggable + expandable bottom sheet (no libraries)
 * - Drag handle up/down
 * - Snaps between: expanded / collapsed
 * - Drag down far enough (or fast) to close
 */
function DraggableBottomSheet(props: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialMode?: "collapsed" | "expanded";
}) {
  const { visible, title, onClose, children, initialMode = "collapsed" } = props;
  const insets = useSafeAreaInsets();

  const winH = Dimensions.get("window").height;

  // you can tune these
  const COLLAPSED_HEIGHT = Math.round(winH * 0.55);
  const EXPANDED_HEIGHT = Math.round(winH * 0.88);

  // translateY is the sheet's top position (0 = top of screen)
  const CLOSED_TOP = winH; // fully hidden
  const COLLAPSED_TOP = Math.max(0, winH - COLLAPSED_HEIGHT);
  const EXPANDED_TOP = Math.max(0, winH - EXPANDED_HEIGHT);

  const translateY = useRef(new Animated.Value(CLOSED_TOP)).current;
  const lastTopRef = useRef(CLOSED_TOP);

  const animateTo = (top: number) => {
    lastTopRef.current = top;
    Animated.timing(translateY, {
      toValue: top,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  // Open animation when visible toggles true
  useEffect(() => {
    if (visible) {
      const openTop = initialMode === "expanded" ? EXPANDED_TOP : COLLAPSED_TOP;
      // set immediately first to avoid flicker
      translateY.setValue(CLOSED_TOP);
      lastTopRef.current = CLOSED_TOP;
      requestAnimationFrame(() => animateTo(openTop));
    } else {
      // ensure closed
      translateY.setValue(CLOSED_TOP);
      lastTopRef.current = CLOSED_TOP;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        // only start pan if user drags vertically a little
        return Math.abs(gesture.dy) > 6;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation((val: number) => {
          lastTopRef.current = val;
        });
      },
      onPanResponderMove: (_evt, gesture) => {
        const nextTop = clamp(lastTopRef.current + gesture.dy, EXPANDED_TOP, CLOSED_TOP);
        translateY.setValue(nextTop);
      },
      onPanResponderRelease: (_evt, gesture) => {
        const vy = gesture.vy;
        // get current top after drag
        translateY.stopAnimation((currentTop: number) => {
          const draggedDownFar = currentTop > COLLAPSED_TOP + 120;
          const flingDown = vy > 1.2;

          if (draggedDownFar || flingDown) {
            // close
            Animated.timing(translateY, {
              toValue: CLOSED_TOP,
              duration: 180,
              useNativeDriver: false,
            }).start(() => onClose());
            return;
          }

          // snap to nearest between expanded and collapsed
          const distToExpanded = Math.abs(currentTop - EXPANDED_TOP);
          const distToCollapsed = Math.abs(currentTop - COLLAPSED_TOP);

          const target =
            distToExpanded < distToCollapsed ? EXPANDED_TOP : COLLAPSED_TOP;

          animateTo(target);
        });
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay: press outside to close */}
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        {/* Stop overlay press when interacting with sheet */}
        <Pressable style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(16, insets.bottom + 10),
                top: translateY,
              },
            ]}
          >
            {/* Drag handle area */}
            <View {...panResponder.panHandlers} style={styles.sheetDragArea}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Camera size={14} color={ORANGE} />
                <Text style={styles.sheetTitle}>{title}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity activeOpacity={0.9} onPress={onClose} style={styles.sheetCloseBtn}>
                  <X size={16} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content can scroll if large */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function OrderViewDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doNo?: string; backTo?: string }>();

  const backTo = params.backTo ? String(params.backTo) : undefined;
  const doNoParam = params.doNo ? String(params.doNo) : "DO-000001";

  const detail: DoDetail = useMemo(
    () => ({
      doNo: doNoParam,
      status: "Out for Delivery",
      customerName: "Mary Customer",
      phone: "+6012 345 6789",
      address: "Jalan Ban Hock, Kuching, 93100 Sarawak",
      parcelsCount: 3,
      notes: "Customer Notes Here",
      parcels: [
        { code: "ABC-12345", desc: "Ceramic Mug • 1 qty" },
        { code: "ABC-45678", desc: "Item 2 • 1 qty" },
        { code: "ABC-90123", desc: "Item 3 • 1 qty" },
      ],
    }),
    [doNoParam]
  );

  const [status, setStatus] = useState<string>(detail.status);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // POD bottom sheet state
  const [podOpen, setPodOpen] = useState(false);
  const [podReceiver, setPodReceiver] = useState(detail.customerName || "");
  const [podFiles, setPodFiles] = useState<PodFile[]>([]);

  const goBack = () => {
    if (backTo) {
      router.replace(backTo as any);
      return;
    }
    if (router.canGoBack?.()) router.back();
    else router.replace("/orders" as any);
  };

  const openDirectionsToAddress = async (address: string) => {
    const trimmed = (address || "").trim();
    if (!trimmed) {
      Alert.alert("No address", "Address is empty.");
      return;
    }

    const encoded = encodeURIComponent(trimmed);
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;

    try {
      if (Platform.OS !== "web") {
        const appUrl = `comgooglemaps://?daddr=${encoded}&directionsmode=driving`;
        const canOpenApp = await Linking.canOpenURL(appUrl);
        if (canOpenApp) {
          await Linking.openURL(appUrl);
          return;
        }
      }

      const canOpenWeb = await Linking.canOpenURL(webUrl);
      if (!canOpenWeb) {
        Alert.alert("Cannot open Maps", "No browser available.");
        return;
      }

      await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Cannot open Maps", "Failed to open directions.");
    }
  };

  const pickPodProof = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["image/*", "application/pdf"],
      });

      if (res.canceled) return;
      const a = res.assets?.[0];
      if (!a?.uri) return;

      const name = a.name || "proof";
      const mimeType = (a as any).mimeType as string | undefined;

      setPodFiles((prev) => [{ uri: a.uri, name, mimeType }, ...prev]);
    } catch {
      Alert.alert("Upload failed", "Cannot pick file.");
    }
  };

  const removePodFile = (uri: string) => {
    setPodFiles((prev) => prev.filter((x) => x.uri !== uri));
  };

  const onAttempt = () => setStatus("Attempt");
  const onDelivered = () => setStatus("Delivered");

  const onPOD = () => {
    setStatus("POD");
    setPodReceiver((r) => (r ? r : detail.customerName || ""));
    setPodOpen(true);
  };

  const onSavePod = () => {
    // TODO: submit to API (receiver + files)
    setPodOpen(false);
  };

  const isImage = (f: PodFile) =>
    (f.mimeType || "").startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(f.name);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.9} onPress={goBack} style={styles.headerBtn}>
          <ArrowLeft size={20} color={ORANGE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail.doNo}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* CUSTOMER */}
        <BasicCard style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <User size={14} color="#111827" />
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
          </View>

          <View style={styles.kvRow}>
            <Text style={styles.kLabel}>Name</Text>
            <Text style={styles.kValue}>{detail.customerName}</Text>
          </View>

          <View style={styles.kvRow}>
            <Text style={styles.kLabel}>Phone</Text>
            <Text style={styles.kValue}>{detail.phone}</Text>
          </View>

          <View style={[styles.kvRow, { alignItems: "flex-start" }]}>
            <Text style={styles.kLabel}>Address</Text>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <Text style={styles.kValue}>{detail.address}</Text>

              <CustomButton
                style={styles.navigatePill}
                preset="info"
                icon={MapPin}
                iconPosition="left"
                iconSize={14}
                onPress={() => openDirectionsToAddress(detail.address)}

              >
                <Text style={styles.navigateText}>Navigate</Text>

              </CustomButton>
            </View>
          </View>

          <View style={styles.kvRow}>
            <Text style={styles.kLabel}>Parcel(s)</Text>
            <Text style={styles.kValue}>{detail.parcelsCount}</Text>
          </View>

          <View style={styles.kvRow}>
            <Text style={styles.kLabel}>Notes</Text>
            <Text style={styles.kValue}>{detail.notes || "-"}</Text>
          </View>
        </BasicCard>

        {/* PARCEL(S) */}
        <BasicCard style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <PackageIcon size={14} color="#111827" />
            <Text style={styles.sectionTitle}>PARCEL(S)</Text>
          </View>

          {detail.parcels.map((p) => (
            <View key={p.code} style={styles.parcelRow}>
              <Text style={styles.parcelCode}>{p.code}</Text>
              <Text style={styles.parcelDesc}>{p.desc}</Text>
            </View>
          ))}
        </BasicCard>

        {/* STATUS */}
        <BasicCard style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <ListChecks size={14} color="#111827" />
            <Text style={styles.sectionTitle}>STATUS</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.statusSelect}
            onPress={() => setStatusPickerOpen(true)}
          >
            <Text style={styles.statusSelectText}>{status}</Text>
            <ChevronDown size={16} color="#6b7280" />
          </TouchableOpacity>
        </BasicCard>

        {/* Bottom buttons */}
        <View style={styles.bottomActions}>
          <CustomButton
            preset="danger"
            icon={XCircle}
            iconPosition="left"
            iconSize={14}
            onPress={onAttempt}
          >
            Attempt
          </CustomButton>

          <CustomButton
            preset="success"
            icon={CheckCircle2}
            iconPosition="left"
            iconSize={14}
            onPress={onDelivered}
          >
            Delivered
          </CustomButton>

          <CustomButton
            preset="print"
            icon={FileText}
            iconPosition="left"
            iconSize={14}
            onPress={onPOD}
          >
            POD
          </CustomButton>
        </View>

      </ScrollView>
      <GeneralPickerModal
        open={statusPickerOpen}
        title="Select Status"
        options={STATUS_OPTIONS}
        value={status}
        onClose={() => setStatusPickerOpen(false)}
        onChange={(next) => setStatus(next)}
        searchable
        searchLabel="Search"
        searchPlaceholder="Search status..."
        emptyText="No results"
        cancelText="Close"
      />


      {/* Draggable + expandable POD sheet */}
      <DraggableBottomSheet
        visible={podOpen}
        title="CAPTURE POD"
        onClose={() => setPodOpen(false)}
        initialMode="collapsed"
      >
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>RECEIVER</Text>
            <TextInput
              value={podReceiver}
              onChangeText={setPodReceiver}
              placeholder="Receiver name"
              style={styles.input}
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>UPLOAD PROOF</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.uploadBtn} onPress={pickPodProof}>
              <Text style={styles.uploadBtnText}>Choose File</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.fieldLabel}>POD UPLOADED</Text>

        <View style={styles.podGrid}>
          {podFiles.slice(0, 12).map((f) => (
            <View key={f.uri} style={styles.podThumb}>
              {isImage(f) ? (
                <Image source={{ uri: f.uri }} style={styles.podImg} resizeMode="cover" />
              ) : (
                <View style={styles.podPlaceholder}>
                  <FileText size={22} color="#9ca3af" />
                  <Text style={styles.podPlaceholderText} numberOfLines={1}>
                    {f.name}
                  </Text>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.9} onPress={() => removePodFile(f.uri)} style={styles.podRemove}>
                <X size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.sheetFooter}>
          <TouchableOpacity activeOpacity={0.9} style={styles.saveBtn} onPress={onSavePod}>
            <Save size={14} color="#ffffff" />
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </DraggableBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    height: 48,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  headerBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", paddingLeft: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Karla-ExtraBold",
    fontSize: 16,
    color: ORANGE,
    letterSpacing: 0.5,
  },

  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },

  sectionCard: { paddingVertical: 12, paddingHorizontal: 12, marginBottom: 12 },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontFamily: "Karla-ExtraBold", fontSize: 15, color: "#111827", letterSpacing: 1 },

  kvRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  kLabel: { width: 70, fontFamily: "Karla-Bold", fontSize: 14, color: "#000000" },
  kValue: { flex: 1, fontFamily: "Karla-Regular", fontSize: 14, color: "#2e2f31" },

  navigatePill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  navigateText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#000000" },

  parcelRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  parcelCode: { fontFamily: "Karla-ExtraBold", fontSize: 14, color: ORANGE },
  parcelDesc: { marginTop: 2, fontFamily: "Karla-Regular", fontSize: 14, color: "#2e2f31" },

  statusSelect: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  statusSelectText: { fontFamily: "Karla-Regular", fontSize: 14, color: "#111827" },

  bottomActions: { marginTop: 2, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  actionBtnText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#ffffff" },
  actionBtnRed: { backgroundColor: "#ef4444" },
  actionBtnGreen: { backgroundColor: "#22c55e" },
  actionBtnOrange: { backgroundColor: ORANGE },

  // status picker modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 16, justifyContent: "center" },
  modalCard: { borderRadius: 14, backgroundColor: "#ffffff", padding: 12, borderWidth: 1, borderColor: "#f3f4f6" },
  modalTitle: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: "#111827", marginBottom: 10 },
  modalItem: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  modalItemActive: { borderColor: ORANGE, backgroundColor: "#fff7ed" },
  modalItemText: { fontFamily: "Karla-Regular", fontSize: 13, color: "#111827" },
  modalItemTextActive: { fontFamily: "Karla-Bold", color: ORANGE },
  modalCancel: { paddingVertical: 10, alignItems: "center" },
  modalCancelText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#6b7280" },

  // bottom sheet (draggable)
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    // height is controlled by translateY (top). Give it full height.
    height: Dimensions.get("window").height,
  },
  sheetDragArea: {
    paddingBottom: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
    marginBottom: 10,
  },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetTitle: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: ORANGE, letterSpacing: 1 },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  twoCol: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 12 },
  col: { flex: 1 },

  fieldLabel: { fontFamily: "Karla-ExtraBold", fontSize: 13, color: "#111827", letterSpacing: 1, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 10 }),
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 10 }),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#111827" },

  podGrid: { flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" },
  podThumb: {
    width: 92,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  podImg: { width: "100%", height: "100%" },
  podPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", padding: 8, gap: 6 },
  podPlaceholderText: { fontFamily: "Karla-Regular", fontSize: 13, color: "#6b7280" },

  podRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
  },

  sheetFooter: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },
  saveText: { fontFamily: "Karla-Bold", fontSize: 13, color: "#ffffff" },
});
