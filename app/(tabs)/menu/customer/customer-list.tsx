// app/(tabs)/menu/customer/customer-list.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../../components/AppHeader";
import { useLanguage } from "../../../../contexts/LanguageContext";
import { SegmentedTabs } from "../../../../components/tab/SegmentedTabs";
import { API_BASE_URL } from "../../../../config/api";
import { authedFetch } from "../../../../config/mobileApiClient";
import SearchInput from "../../../../components/input/SearchInput";
import ConfirmModal from "../../../../components/modal/ConfirmModal";
import RejectReasonModal from "../../../../components/modal/RejectReasonModal";
import CustomerPackageAssignModal from "../../../../components/modal/CustomerPackageAssignModal";
import { router } from "expo-router";
import { useMobileCustomerApprovalFlow } from "../../../../components/hooks/useMobileCustomerApprovalFlow";
import MobileAlertDialog from "../../../../components/modal/MobileAlertDialog";
import CustomerListItemCard, {
  CustomerListItem,
  TabKey,
} from "../../../../components/customer/CustomerListItemCard";
import { useLocalSearchParams } from "expo-router";

const PAGE_SIZE = 10;

export default function CustomerListScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;
  const { t } = useLanguage();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<{
    all: number;
    active: number;
    pending: number;
  }>({
    all: 0,
    active: 0,
    pending: 0,
  });

  const [page, setPage] = useState(1);

  const getEndpointForTab = (tab: TabKey) => {
    if (tab === "pending") {
      return `${API_BASE_URL}/api/customers/getpendingcustomers`;
    }
    if (tab === "active") {
      return `${API_BASE_URL}/api/customers/getactivecustomers`;
    }
    return `${API_BASE_URL}/api/customers/getallcustomers`;
  };

  const fetchFromApi = useCallback(
    async (tab: TabKey): Promise<CustomerListItem[]> => {
      const url = getEndpointForTab(tab);

      const body = {
        fields: [
          "users.user_id",
          "users.username",
          "full_name",
          "email",
          "users.acc_status",
          "contact",
          "address1",
          "address2",
          "address3",
          "postcode",
          "state",
          "city",
          "status",
          "cust_type",
          "cust_code",
        ],
      };

      const res = await authedFetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("Customer API error:", res.status, text);
        throw new Error("Network error");
      }

      const data = await res.json();

      const list: CustomerListItem[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.customers)
          ? (data as any).customers
          : [];

      return list;
    },
    []
  );

  const fetchCustomers = useCallback(
    async (tab: TabKey) => {
      try {
        setLoading(true);
        setError(null);

        const list = await fetchFromApi(tab);

        setCustomers(list);
        setPage(1);

        setCounts((prev) => ({
          ...prev,
          [tab]: list.length,
        }));
      } catch (err) {
        console.log("fetchCustomers error:", err);
        setError(t("customer_list_error"));
      } finally {
        setLoading(false);
      }
    },
    [fetchFromApi, t]
  );

  const fetchCountsForAllTabs = useCallback(async () => {
    try {
      const tabs: TabKey[] = ["all", "active", "pending"];

      const results = await Promise.all(
        tabs.map((tab) =>
          fetchFromApi(tab).catch((err) => {
            console.log("fetchCountsForAllTabs error for", tab, err);
            return null;
          })
        )
      );

      setCounts((prev) => {
        const next = { ...prev };
        tabs.forEach((tab, idx) => {
          const list = results[idx];
          if (Array.isArray(list)) {
            (next as any)[tab] = list.length;
          }
        });
        return next;
      });
    } catch (err) {
      console.log("fetchCountsForAllTabs outer error:", err);
    }
  }, [fetchFromApi]);

  // 🔹 Shared approve / reject / assign flow (hook)
  const approval = useMobileCustomerApprovalFlow({
    onAfterApprove: async () => {
      await fetchCustomers(activeTab);
      await fetchCountsForAllTabs();
    },
    onAfterReject: async () => {
      await fetchCustomers(activeTab);
      await fetchCountsForAllTabs();
    },
  });

  useEffect(() => {
    fetchCustomers(activeTab);
  }, [activeTab, fetchCustomers]);

  useEffect(() => {
    fetchCountsForAllTabs();
  }, [fetchCountsForAllTabs]);

  const onChangeTab = (key: string) => {
    setActiveTab(key as TabKey);
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  const searchQuery = search.trim().toLowerCase();
  const filteredCustomers = !searchQuery
    ? customers
    : customers.filter((item) => {
      const parts = [
        item.full_name,
        item.username,
        item.email,
        item.contact,
        item.address1,
        item.address2,
        item.address3,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return parts.includes(searchQuery);
    });

  const customersToShow = filteredCustomers.slice(0, page * PAGE_SIZE);

  const handleLoadMore = () => {
    if (loading) return;
    if (customersToShow.length >= filteredCustomers.length) return;
    setPage((prev) => prev + 1);
  };

  const renderItem = ({ item }: { item: CustomerListItem }) => (
    <CustomerListItemCard
      item={item}
      activeTab={activeTab}
      t={t as any}
      approvingUserId={approval.approvingUserId}
      onView={(userId) => {
        router.push({
          pathname: "/menu/customer/customer-view",
          params: {
            userId: String(userId),
            backTo: "/menu/customer/customer-list",
          },
        });
      }}
      onApprove={(userId, displayName) => {
        approval.openForUser(userId, displayName);
      }}
    />
  );



  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="menu_customer_list" showBack backTo={backTo} />

      <View style={styles.content}>
        <SegmentedTabs
          activeKey={activeTab}
          onChange={onChangeTab}
          tabs={[
            { key: "all", label: t("customer_tab_all"), count: counts.all },
            { key: "active", label: t("customer_tab_active"), count: counts.active },
            { key: "pending", label: t("customer_tab_pending"), count: counts.pending },
          ]}
        />

        <SearchInput
          label={t("customer_search_label") ?? "SEARCH"}
          placeholder={t("customer_search_placeholder") ?? "Search"}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#f59e0b" />
          </View>
        ) : error ? (
          <TouchableOpacity
            style={styles.center}
            onPress={() => fetchCustomers(activeTab)}
          >
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>{t("customer_list_retry")}</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={customersToShow}
            keyExtractor={(item, index) =>
              String(item.id ?? item.user_id ?? item.username ?? index)
            }
            renderItem={renderItem}
            contentContainerStyle={
              filteredCustomers.length === 0 ? styles.emptyContainer : undefined
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {t("customer_list_empty")}
              </Text>
            }
            onEndReachedThreshold={0.5}
            onEndReached={handleLoadMore}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              customersToShow.length < filteredCustomers.length ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#f59e0b" />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* FIRST modal: confirm approve / reject */}
      <ConfirmModal
        visible={approval.confirmVisible}
        title={t("customer_approve_confirm_title") || "Approve / Reject customer"}
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
        confirmLabel={t("customer_reject_confirm_label") || "Submit"}
        cancelLabel={t("customer_reject_cancel_label") || "Cancel"}
        onReasonChange={approval.setRejectReason}
        onConfirm={approval.handleRejectSubmit}
        onCancel={approval.handleRejectCancel}
      />

      {/* SECOND modal: assign code + package */}
      <CustomerPackageAssignModal
        visible={approval.assignVisible}
        loading={approval.assignLoading}
        customerName={
          approval.selectedCustomerName ||
          t("customer_view_title") ||
          "Customer"
        }
        customerCode={approval.assignCustomerCode}
        packages={approval.assignPackages}
        selectedPackageId={approval.assignPackageId}
        onCustomerCodeChange={approval.setAssignCustomerCode}
        onPackageChange={approval.setAssignPackageId}
        onRandomize={approval.handleAssignRandomize}
        onCancel={approval.handleAssignCancel}
        onSubmit={approval.handleAssignSubmit}
        t={t}
      />

      {/* SweetAlert-style dialog */}
      <MobileAlertDialog
        dialog={approval.dialog}
        onClose={() => approval.setDialog(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 16,
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
    marginBottom: 4,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    color: "#f97316",
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#9ca3af",
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
