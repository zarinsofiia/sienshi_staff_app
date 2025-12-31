// app/(tabs)/menu/customer/customer-view.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import { AppHeader } from "../../../../components/AppHeader";
import { API_BASE_URL } from "../../../../config/api";
import { useLanguage } from "../../../../contexts/LanguageContext";
import ConfirmModal from "../../../../components/modal/ConfirmModal";
import RejectReasonModal from "../../../../components/modal/RejectReasonModal";
import { authedFetch } from "../../../../config/mobileApiClient";

import CustomerPackageAssignModal from "../../../../components/modal/CustomerPackageAssignModal";
import { useMobileCustomerApprovalFlow } from "../../../../components/hooks/useMobileCustomerApprovalFlow";
import MobileAlertDialog from "../../../../components/modal/MobileAlertDialog";
import CustomerStickyHeader from "../../../../components/customer/CustomerStickyHeader";
import { CustomerDetailSections } from "../../../../components/customer/CustomerDetailSections";
import type { CustomerDetail } from "../../../../components/customer/CustomerDetailTypes";

export default function CustomerViewScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { t } = useLanguage();

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) {
      setError(t("customer_view_error") || "Missing customer id");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await authedFetch(
        `${API_BASE_URL}/api/customers/viewcustomer/${userId}`,
        {
          method: "POST",
          body: JSON.stringify({ userId: String(userId) }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("viewcustomer error:", res.status, text);
        throw new Error(text || "Failed to load customer");
      }

      const json = await res.json();
      const customer: CustomerDetail = Array.isArray(json)
        ? json[0]
        : (json && (json.customer || json)) || null;

      setData(customer);
    } catch (err) {
      console.log("fetchDetail error:", err);
      setError(t("customer_view_error") || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // shared approve / reject / assign flow
  const approval = useMobileCustomerApprovalFlow({
    onAfterApprove: fetchDetail,
    // after reject from view → go back to listing (which will reload)
    onAfterReject: () => {
      router.replace("/menu/customer/customer-list");
    },
  });

  const customerTypeLabel = (() => {
    const rawCustType = (data?.cust_type || "").trim().toLowerCase();
    const isPersonal = rawCustType === "personal";
    const isCompany = rawCustType === "company";

    if (isPersonal) {
      return (t("customer_view_type_personal") as string) || "Personal";
    }
    if (isCompany) {
      return (t("customer_view_type_company") as string) || "Company";
    }
    return data?.cust_type || "-";
  })();

  const headerTitle =
    (data?.cust_code && String(data.cust_code).trim()) ||
    data?.full_name ||
    data?.username ||
    (t("customer_view_title") as string) ||
    "Customer Detail";


  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={headerTitle} showBack backTo={backTo} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#f59e0b" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {t("customer_view_not_found") || "Customer not found"}
          </Text>
        </View>
      ) : (
        <>
          {/* Sticky header extracted */}
          <CustomerStickyHeader
            typeLabel={customerTypeLabel}
            status={data.status}
            canApprove={!!data.user_id}
            loading={
              !!data.user_id &&
              approval.approvingUserId === data.user_id
            }
            onApprovePress={
              data.user_id
                ? () =>
                  approval.openForUser(
                    data.user_id!,
                    data.full_name || data.username || undefined
                  )
                : undefined
            }
            t={t as any}
          />

          {/* All detail sections extracted */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <CustomerDetailSections data={data} t={t as any} />
          </ScrollView>

          {/* FIRST modal: approve / reject confirm */}
          <ConfirmModal
            visible={approval.confirmVisible}
            title={
              t("customer_approve_confirm_title") ||
              "Approve / Reject customer"
            }
            message={
              t("customer_approve_confirm_message") ||
              "Do you want to approve or reject this customer?"
            }
            cancelLabel={t("common_cancel") || "Cancel"}
            confirmLabel={t("customer_card_approve") || "Approve"}
            rejectLabel={t("customer_card_reject") || "Reject"}
            onCancel={approval.handleConfirmClose}
            onConfirm={approval.handleConfirmApprove}
            onReject={approval.handleRejectClick}
          />

          {/* Reject reason modal */}
          <RejectReasonModal
            visible={approval.rejectVisible}
            loading={approval.rejectLoading}
            title={t("customer_reject_title") || "Reject customer"}
            reason={approval.rejectReason}
            confirmLabel={
              t("customer_reject_confirm_label") || "Submit"
            }
            cancelLabel={t("customer_reject_cancel_label") || "Cancel"}
            onReasonChange={approval.setRejectReason}
            onConfirm={approval.handleRejectSubmit}
            onCancel={approval.handleRejectCancel}
          />

          {/* SECOND modal: assign code + package */}
          <CustomerPackageAssignModal
            visible={approval.assignVisible}
            loading={approval.assignLoading}
            customerName={headerTitle}
            customerCode={approval.assignCustomerCode}
            packages={approval.assignPackages}
            selectedPackageId={approval.assignPackageId}
            onCustomerCodeChange={approval.setAssignCustomerCode}
            onPackageChange={approval.setAssignPackageId}
            onRandomize={approval.handleAssignRandomize}
            onCancel={approval.handleAssignCancel}
            onSubmit={approval.handleAssignSubmit}
            t={t as any}
          />

          {/* SweetAlert-style dialog */}
          <MobileAlertDialog
            dialog={approval.dialog}
            onClose={() => approval.setDialog(null)}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#b91c1c",
  },
});
