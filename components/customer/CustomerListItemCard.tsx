// components/customer/CustomerListItemCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import CustomButton from "../button/CustomButton";
import { BaseListCard } from "../card/BaseListCard";

export type TabKey = "all" | "active" | "pending";

export interface CustomerListItem {
  id?: number;
  user_id?: number;
  brn_new: string | null;
  brn_old: string | null;
  tin_number: string | null;
  nric: string | null;
  passport: string | null;
  sst_number: string | null;
  pic: string | null;
  contact: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  postcode: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  msic: string | null;
  msic_desc: string | null;
  einv_start_date: string | null;

  status: string | null;
  cust_type: string | null;
  date_approved: string | null;
  approved_by: string | null;
  full_name: string | null;
  email: string | null;
  username: string | null;
  created_at: string | null;
  user_type: number;
  acc_status: string | null;

  cust_code?: string | null;
  [key: string]: any;
}

type Translator = (key: string) => string;

// Prefer real cust_code if exists, otherwise fallback to old format
const buildCustomerCode = (item: CustomerListItem): string => {
  const rawCustCode =
    (item.cust_code ?? (item as any).custCode ?? "").toString().trim();

  if (rawCustCode) {
    return rawCustCode;
  }

  const rawId = item.id ?? item.user_id;

  if (typeof rawId === "number") {
    return `CUS-${String(rawId).padStart(6, "0")}`;
  }

  return item.username ? String(item.username) : "CUS-000000";
};

interface Props {
  item: CustomerListItem;
  activeTab: TabKey;
  t: Translator;
  approvingUserId: number | null;
  onView: (userId: number) => void;
  onApprove: (userId: number, displayName: string) => void;
}

const CustomerListItemCard: React.FC<Props> = ({
  item,
  activeTab,
  t,
  approvingUserId,
  onView,
  onApprove,
}) => {
  const userId = item.user_id;

  const code = buildCustomerCode(item);
  const custType = item.cust_type
    ? String(item.cust_type).toUpperCase()
    : "";

  const titleText = code;
  const displayName = item.full_name || item.username || "";

  const addressParts = [item.postcode, item.city, item.state].filter(Boolean);
  const addressLine = addressParts.join(", ");

  const backendStatus = (item.status || "").toUpperCase();
  const isPendingBackend = backendStatus.includes("PENDING");
  const isPendingTab = activeTab === "pending";
  const isPending = isPendingBackend || isPendingTab;

  const statusTone = isPending ? "pending" : "active";
  const statusLabel =
    item.status ||
    (isPending ? t("customer_status_pending") : t("customer_status_active"));

  const isApprovingThis =
    !!userId && approvingUserId === userId;

  const addrLines = [
    item.address1,
    item.address2,
    item.address3,
  ].filter(Boolean) as string[];

  return (
    <BaseListCard
      title={titleText}
      statusLabel={statusLabel}
      statusTone={statusTone}
      onPress={() => {
        if (!userId) return;
        onView(userId); // ✅ same as view
      }}
      disabled={!userId}
      footer={
        <View style={styles.actionsRow}>
          <CustomButton
            preset="view"
            onPress={(e: any) => {
              e?.stopPropagation?.(); // ✅ prevent triggering card press
              if (!userId) return;
              onView(userId);
            }}
            icon={(props) => <Ionicons name="eye-outline" {...props} />}
          >
            {t("customer_card_view")}
          </CustomButton>

          {isPending && (
            <CustomButton
              preset="approve"
              style={{ marginLeft: 8 }}
              icon={(props) => <Ionicons name="checkmark-outline" {...props} />}
              onPress={(e: any) => {
                e?.stopPropagation?.(); // ✅ prevent triggering card press
                if (!userId) return;
                onApprove(userId, displayName);
              }}
              disabled={!userId || isApprovingThis}
              loading={isApprovingThis}
            >
              {t("customer_card_approve")}
            </CustomButton>
          )}
        </View>
      }
    >
      {(displayName || custType) ? (
        <Text style={styles.nameText} numberOfLines={1}>
          {displayName || "-"}
          {custType ? (
            <Text style={styles.custTypeInline}>{`  •  ${custType}`}</Text>
          ) : null}
        </Text>
      ) : null}

      {addrLines.map((line, idx) => (
        <Text
          style={[styles.metaText, styles.metaTextUpper]}
          numberOfLines={1}
          key={idx}
        >
          {line}
        </Text>
      ))}

      {addressLine ? (
        <Text
          style={[styles.metaText, styles.metaTextUpper]}
          numberOfLines={1}
        >
          {addressLine}
        </Text>
      ) : null}

      {item.contact || item.email ? (
        <Text style={styles.metaText} numberOfLines={1}>
          {[item.contact, item.email].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </BaseListCard>
  );
};

const styles = StyleSheet.create({
  nameText: {
    fontSize: 13,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: "Karla-ExtraBold",
    color: "#111827",
    marginBottom: 8,
  },
  custTypeInline: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#92400e",
    textTransform: "uppercase",
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#473124ff",
    marginBottom: 8,
  },
  metaTextUpper: {
    textTransform: "uppercase",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "stretch",
    width: "100%",
    marginTop: 8,
  },
});

export default CustomerListItemCard;
