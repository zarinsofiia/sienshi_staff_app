import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import CustomButton from "../button/CustomButton";
import type { EnTranslationKey } from "../../locales/en"; // 👈 adjust path if needed

type Translator = (key: EnTranslationKey) => string;

export type CustomerPackage = {
  id: number;
  package_name: string;
  size_price: number | string;
  weight_price: number | string;
  usage_status: string;
};

interface Props {
  visible: boolean;
  loading: boolean;
  customerName?: string;
  customerCode: string;
  packages: CustomerPackage[];
  selectedPackageId: number | null;
  onCustomerCodeChange: (value: string) => void;
  onPackageChange: (id: number | null) => void;
  onRandomize: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  t: Translator;
}

const CustomerPackageAssignModal: React.FC<Props> = ({
  visible,
  loading,
  customerName,
  customerCode,
  packages,
  selectedPackageId,
  onCustomerCodeChange,
  onPackageChange,
  onRandomize,
  onCancel,
  onSubmit,
  t,
}) => {
  const hasPackages = Array.isArray(packages) && packages.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {t("customer_assign_title") || "Assign customer code & package"}
          </Text>

          {customerName ? (
            <Text style={styles.subtitle}>
              {(t("customer_assign_for") || "For") + ": "}
              <Text style={styles.subtitleName}>{customerName}</Text>
            </Text>
          ) : null}

          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Customer code input + randomize button */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>
                {t("customer_assign_code_label") || "Customer code"}
              </Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={customerCode}
                  placeholder={
                    t("customer_assign_code_placeholder") ||
                    "Enter or generate code"
                  }
                  onChangeText={onCustomerCodeChange}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  disabled={loading}
                  onPress={onRandomize}
                  style={styles.randomBtn}
                >
                  <Text style={styles.randomBtnText}>
                    {t("customer_assign_random_button") || "Randomize"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Package select (Picker) */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>
                {t("customer_assign_package_label") || "Customer package"}
              </Text>

              {loading && (
                <View style={styles.pkgLoadingRow}>
                  <ActivityIndicator size="small" color="#f97316" />
                  <Text style={styles.pkgLoadingText}>
                    {t("customer_assign_loading") || "Loading packages..."}
                  </Text>
                </View>
              )}

              {/* ❌ ONLY show this when there are truly NO packages */}
              {!loading && !hasPackages && (
                <Text style={styles.emptyPkgText}>
                  {t("customer_assign_package_empty") || "No packages available."}
                </Text>
              )}

              {/* ✅ When packages exist, show picker with "Select a package" */}
              {hasPackages && (
                <View style={styles.pickerWrapper}>
                  <Picker
                    mode="dropdown"
                    enabled={!loading}
                    selectedValue={selectedPackageId ?? ""}
                    onValueChange={(value) => {
                      if (value === "" || value === null) onPackageChange(null);
                      else onPackageChange(Number(value));
                    }}
                    style={styles.picker}
                    dropdownIconColor="#4b5563"
                  >

                    <Picker.Item
                      label={
                        t("customer_assign_package_placeholder") ||
                        "Select a package"
                      }
                      value=""
                    />
                    {packages.map((pkg) => (
                      <Picker.Item
                        key={pkg.id}
                        value={pkg.id}
                        label={`${pkg.package_name} (Size: ${pkg.size_price} • Weight: ${pkg.weight_price})`}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <CustomButton
              preset="danger"
              style={styles.actionButton}
              onPress={onCancel}
              disabled={loading}
            >
              {t("customer_assign_cancel") || "Cancel"}
            </CustomButton>

            <CustomButton
              preset="approve"
              style={styles.actionButton}
              onPress={onSubmit}
              disabled={loading || !customerCode || !selectedPackageId}
              loading={loading}
            >
              {loading
                ? t("customer_assign_saving") || "Saving..."
                : t("customer_assign_save") || "Save"}
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomerPackageAssignModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#ffffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: "Karla-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    marginBottom: 12,
  },
  subtitleName: {
    fontFamily: "Karla-Bold",
    color: "#111827",
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    color: "#4b5563",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#111827",
  },
  randomBtn: {
    marginLeft: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  randomBtnText: {
    fontSize: 11,
    fontFamily: "Karla-Bold",
    color: "#111827",
    textTransform: "uppercase",
  },
  emptyPkgText: {
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#9ca3af",
  },
  // ⬇️ replace these styles in CustomerPackageAssignModal

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginTop: 4,

    // ✅ remove these:
    // overflow: "hidden",
    // height: 44,
    // justifyContent: "center",

    // ✅ better:
    backgroundColor: "#fff",
  },

  picker: {
    width: "100%",
    height: 50,          // ✅ give Picker its own proper height
    color: "#111827",    // ✅ ensure selected text is visible
  },


  pkgLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pkgLoadingText: {
    marginLeft: 8,
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionButton: {
    marginLeft: 8,
    minWidth: 90,
  },
});
