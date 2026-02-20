// app/(tabs)/dashboard/DriverDashboard.tsx
import { Pencil } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CustomButton from "../../../components/button/CustomButton";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DriverDashboardProps {
  displayName: string;
}

type DeliveryStatus = "out_for_delivery" | "delivered";

interface DeliveryItem {
  id: string;
  code: string;
  status: DeliveryStatus;
}

const ORANGE = "#EE9328";

const MOCK_SUMMARY = {
  ordersToday: 18,
  outForDelivery: 3,
  delivered: 4,
};

const MOCK_WEEKLY = [2, 3, 4, 5, 6, 7, 8];

const MOCK_DELIVERIES: DeliveryItem[] = [
  { id: "1", code: "DO-000001", status: "out_for_delivery" },
  { id: "2", code: "DO-000003", status: "delivered" },
  { id: "3", code: "DO-000002", status: "delivered" },
];

const DriverDashboard: React.FC<DriverDashboardProps> = ({ displayName }) => {
  const { t } = useLanguage();

  const welcomeTitle = (t("staff_dashboard_welcome") || "Welcome, {name}!")
    .replace("{name}", displayName || (t("staff_dashboard_default_driver") || "Driver"));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>{welcomeTitle}</Text>

      <View style={styles.summaryRow}>
        <SummaryCard
          title={t("staff_driver_orders_today") || "Orders Today"}
          value={MOCK_SUMMARY.ordersToday}
          subtitle={t("staff_driver_delivery_orders") || "Delivery Orders"}
        />
        <SummaryCard
          title={t("staff_driver_out_for_delivery") || "Out for Delivery"}
          value={MOCK_SUMMARY.outForDelivery}
          subtitle={t("staff_driver_in_progress") || "In progress"}
        />
        <SummaryCard
          title={t("staff_driver_delivered") || "Delivered"}
          value={MOCK_SUMMARY.delivered}
          subtitle={t("staff_driver_completed") || "Completed"}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {t("staff_driver_weekly_deliveries_done") || "WEEKLY DELIVERIES DONE"}
        </Text>

        <View style={styles.chartContainer}>
          <View style={styles.chartBarsRow}>
            {MOCK_WEEKLY.map((value, idx) => (
              <View key={idx} style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { height: 18 + value * 6 }]} />
              </View>
            ))}
          </View>

          <View style={styles.chartLabelsRow}>
            {["01 Nov", "02 Nov", "03 Nov", "04 Nov", "05 Nov", "06 Nov", "07 Nov"].map(
              (label) => (
                <Text key={label} style={styles.chartLabel}>
                  {label}
                </Text>
              )
            )}
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {t("staff_driver_todays_delivery") || "TODAY'S DELIVERY"}
        </Text>

        {MOCK_DELIVERIES.map((item) => (
          <DeliveryCard key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
};

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </View>
  );
}

function DeliveryCard({ item }: { item: DeliveryItem }) {
  const { t } = useLanguage();

  const statusLabel =
    item.status === "out_for_delivery"
      ? (t("staff_status_out_for_delivery") || "Out for Delivery")
      : (t("staff_status_delivered") || "Delivered");

  const statusStyles =
    item.status === "out_for_delivery"
      ? styles.statusChipOut
      : styles.statusChipDelivered;

  return (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryLeft}>
        <Text style={styles.deliveryCode}>{item.code}</Text>
        <View style={[styles.statusChip, statusStyles]}>
          <Text style={styles.statusChipText}>{statusLabel}</Text>
        </View>
      </View>

      <CustomButton
        preset="print"
        icon={Pencil}
        iconPosition="left"
        iconSize={14}
        style={styles.openButton}
        onPress={() => {}}
      >
        {t("staff_common_open") || "Open"}
      </CustomButton>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcome: {
    fontSize: 18,
    fontFamily: "Karla-ExtraBold",
    color: "#111827",
    marginBottom: 14,
    textTransform: "uppercase",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Karla-ExtraBold",
    color: "#000000",
  },
  summarySubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
  },

  sectionCard: {
    backgroundColor: "#ffffffff",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    color: "#673800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  chartContainer: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#f3f4f680",
  },
  chartBarsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: "center",
  },
  chartBar: {
    width: 14,
    borderRadius: 7,
    backgroundColor: ORANGE,
  },
  chartLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 9,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
  },

  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  deliveryLeft: {
    flex: 1,
    marginRight: 12,
  },
  deliveryCode: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
  },
  statusChipOut: {
    borderColor: "#38bdf8",
    backgroundColor: "#e0f2fe",
  },
  statusChipDelivered: {
    borderColor: "#22c55e",
    backgroundColor: "#dcfce7",
  },

  openButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
});

export default DriverDashboard;
