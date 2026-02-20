// app/(tabs)/orders/detail.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SquarePen } from "lucide-react-native";
import { AppHeader } from "../../../components/AppHeader";
import BasicCard from "../../../components/card/BasicCard"; // ✅ use BasicCard
import CustomButton from "@/components/button/CustomButton";
import { useLanguage } from "@/contexts/LanguageContext";
const ORANGE = "#EE9328";

type StopStatus = "out_for_delivery" | "delivered";

type DoStopRow = {
  id: number;
  doCode: string; // DO-000001
  status: StopStatus;
  customerName: string;
  addressLine: string;
  parcels: string[]; // ["Parcel 1", "Parcel 2", ...]
};

const HARD_CODED_BY_PL: Record<string, DoStopRow[]> = {
  "PL-2025-01-11": [
    {
      id: 1,
      doCode: "DO-000001",
      status: "out_for_delivery",
      customerName: "Mary Customer",
      addressLine: "Jalan Test, Kuching, 93100 Sarawak",
      parcels: ["Parcel 1", "Parcel 2", "Parcel 3"],
    },
    {
      id: 2,
      doCode: "DO-000002",
      status: "delivered",
      customerName: "Customer 2",
      addressLine: "Jalan Test, Kuching, 93100 Sarawak",
      parcels: ["Parcel 1", "Parcel 2"],
    },
    {
      id: 3,
      doCode: "DO-000003",
      status: "delivered",
      customerName: "Customer 3",
      addressLine: "Jalan Test, Kuching, 93100 Sarawak",
      parcels: ["Parcel 1", "Parcel 2"],
    },
  ],
};

function statusLabel(s: StopStatus) {
  return s === "delivered" ? "Delivered" : "Out for Delivery";
}

export default function OrdersDetailScreen() {
  const {t} = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ backTo?: string; doNo?: string }>();

  const backTo = params.backTo as string | undefined;
  const plNo = (params.doNo as string) || "PL-2025-01-11";

  const stops: DoStopRow[] =
    HARD_CODED_BY_PL[plNo] ?? HARD_CODED_BY_PL["PL-2025-01-11"] ?? [];

  const progress = useMemo(() => {
    const total = stops.length || 1;
    const delivered = stops.filter((x) => x.status === "delivered").length;
    const pct = Math.max(0, Math.min(1, delivered / total));
    return { delivered, total, pct };
  }, [stops]);

  const onOpenStop = (row: DoStopRow) => {
    router.push({
      pathname: "/orders/view_detail",
      params: {
        doNo: row.doCode,
        backTo: `/orders/detail?doNo=${encodeURIComponent(plNo)}`,
      },
    });
  };

  const renderItem: ListRenderItem<DoStopRow> = ({ item }) => {
    const isDelivered = item.status === "delivered";
    const showParcels = item.parcels.slice(0, 2);
    const hasMore = item.parcels.length > showParcels.length;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onOpenStop(item)}
        style={styles.cardPressWrap}
      >
        {/* ✅ BasicCard replaces manual card View */}
        <BasicCard style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.doCode}>{item.doCode}</Text>

            <View
              style={[
                styles.statusPill,
                isDelivered ? styles.pillDelivered : styles.pillOutForDelivery,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isDelivered
                    ? styles.pillDeliveredText
                    : styles.pillOutForDeliveryText,
                ]}
              >
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.addressLine}>{item.addressLine}</Text>

          <View style={styles.parcelRow}>
            <View style={{ flex: 1 }}>
              {showParcels.map((p, idx) => (
                <Text key={`${item.id}-${idx}`} style={styles.parcelBullet}>
                  • {p}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={(e: any) => {
                e?.stopPropagation?.();
                // TODO: show parcels list/modal when ready
              }}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>{hasMore ? "See All" : " "}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBottomRow}>
            <View
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e: any) => e?.stopPropagation?.()}
            >
              <CustomButton
                preset="print"
                // icon={SquarePen}
                iconPosition="left"
                iconSize={14}
                onPress={() => onOpenStop(item)}
              >
                {t("do_open_btn")}
              </CustomButton>
            </View>
          </View>
        </BasicCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey={plNo as any} showBack backTo={backTo ?? "/orders"} />

      <View style={styles.content}>
        {/* Progress section */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>{t("do_progress")}</Text>
            <Text style={styles.progressValue}>
              {progress.delivered}/{progress.total} {t("do_delivered")}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress.pct * 100}%` },
              ]}
            />
          </View>
        </View>

        <FlatList
          data={stops}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            stops.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={<Text style={styles.emptyText}>{t("do_no_data")}</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },

  // progress
  progressWrap: { marginTop: 4, marginBottom: 10 },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    letterSpacing: 1,
    color: "#111827",
    textTransform: "uppercase"
  },
  progressValue: { fontFamily: "Karla-Bold", fontSize: 13, color: "#2e2f31" },
  progressBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },

  // list
  listContent: { paddingTop: 6, paddingBottom: 10 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, fontFamily: "Karla-Regular", color: "#9ca3af" },

  cardPressWrap: { marginBottom: 12 },

  // ✅ BasicCard already provides border/bg/radius/shadow; keep spacing only
  card: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  doCode: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    letterSpacing: 0.2,
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPillText: { fontSize: 12, fontFamily: "Karla-Bold" },

  pillOutForDelivery: { backgroundColor: "#E0F2FE", borderColor: "#BAE6FD" },
  pillOutForDeliveryText: { color: "#075985" },

  pillDelivered: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  pillDeliveredText: { color: "#166534" },

  customerName: {
    marginTop: 2,
    fontFamily: "Karla-Bold",
    fontSize: 13,
    color: "#111827",
  },
  addressLine: {
    marginTop: 2,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#2e2f31",
  },

  parcelRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  parcelBullet: {
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#111827",
    marginTop: 2,
  },

  seeAllBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  seeAllText: { fontFamily: "Karla-Bold", fontSize: 12, color: "#9ca3af" },

  cardBottomRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end" },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  openBtnText: { fontFamily: "Karla-Bold", fontSize: 14, color: "#ffffff" },
});
