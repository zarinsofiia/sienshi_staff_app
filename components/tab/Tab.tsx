// components/customer/CustomerTabs.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";

type CustomerTabKey = "active" | "pending";

interface Props {
  activeTab: CustomerTabKey;
  onChange: (tab: CustomerTabKey) => void;
  activeCount?: number;
  pendingCount?: number;
}

export const CustomerTabs: React.FC<Props> = ({
  activeTab,
  onChange,
  activeCount,
  pendingCount,
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.tab,
          activeTab === "active" && styles.tabActive,
        ]}
        onPress={() => onChange("active")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "active" && styles.tabTextActive,
          ]}
        >
          {t("customer_tab_active")}
          {typeof activeCount === "number" ? ` (${activeCount})` : ""}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.tab,
          activeTab === "pending" && styles.tabActive,
        ]}
        onPress={() => onChange("pending")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "pending" && styles.tabTextActive,
          ]}
        >
          {t("customer_tab_pending")}
          {typeof pendingCount === "number" ? ` (${pendingCount})` : ""}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const ORANGE = "#f59e0b";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  tabActive: {
    backgroundColor: ORANGE,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#ffffff",
  },
});
