// components/customer/CustomerStickyHeader.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../button/CustomButton";

type Translator = (key: string) => string;

interface Props {
  typeLabel: string;
  status?: string | null;
  canApprove: boolean;
  loading?: boolean;
  onApprovePress?: () => void;
  t: Translator;
}

const CustomerStickyHeader: React.FC<Props> = ({
  typeLabel,
  status,
  canApprove,
  loading = false,
  onApprovePress,
  t,
}) => {
  const backendStatus = (status || "").toUpperCase();
  const isPending = backendStatus.includes("PENDING");

  return (
    <View style={styles.stickyBar}>
      <View style={styles.stickyInfo}>
        <Text style={styles.stickyLabel}>
          {t("customer_view_type") || "Customer Type"}
        </Text>
        <Text style={styles.stickyValue}>
          {String(typeLabel || "-").toUpperCase()}
        </Text>

        {!!status && (
          <Text style={styles.stickyStatus}>{backendStatus}</Text>
        )}
      </View>

      {isPending && canApprove && onApprovePress && (
        <CustomButton
          preset="approve"
          icon={(props) => (
            <Ionicons name="checkmark-outline" {...props} />
          )}
          onPress={onApprovePress}
          loading={loading}
          disabled={loading}
        >
          {t("customer_card_approve") || "Approve"}
        </CustomButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stickyBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickyInfo: {
    flexShrink: 1,
  },
  stickyLabel: {
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  stickyValue: {
    fontSize: 14,
    fontFamily: "Karla-Bold",
    color: "#111827",
  },
  stickyStatus: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Karla-Bold",
    color: "#92400e",
    textTransform: "uppercase",
  },
});

export default CustomerStickyHeader;
