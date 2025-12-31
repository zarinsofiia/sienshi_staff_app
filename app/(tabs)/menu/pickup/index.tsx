// app/(tabs)/menu/pickup/index.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import { AppHeader } from "../../../../components/AppHeader";
import BasicCard from "../../../../components/card/BasicCard";
import Button from "../../../../components/button/Button";

const ORANGE = "#f59e0b";

type ParcelItem = {
  id: string;
  tracking: string;
  description: string;
  qty: number;
  weightKg: number;
  pallet: string;
};

const MOCK_CUSTOMER_CODE = "CUST-MARY";

// 🔸 temp mock parcels for one customer
const MOCK_PARCELS: ParcelItem[] = [
  {
    id: "1",
    tracking: "MY551199003",
    description: "Dresses · 2 qty",
    qty: 2,
    weightKg: 2.4,
    pallet: "A",
  },
  {
    id: "2",
    tracking: "MY551189004",
    description: "Scarves · 1 qty",
    qty: 1,
    weightKg: 0.6,
    pallet: "A",
  },
];

export default function PickupScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const [customerInput, setCustomerInput] = useState("");
  const [activeCustomerCode, setActiveCustomerCode] = useState<string | null>(
    null
  );

  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const hasCustomer = !!activeCustomerCode;

  const totals = useMemo(() => {
    const totalParcels = parcels.length;
    const totalWeight = parcels.reduce((sum, p) => sum + p.weightKg, 0);
    return { totalParcels, totalWeight };
  }, [parcels]);

  const isAllSelected =
    parcels.length > 0 && selectedIds.length === parcels.length;

  const handleLoadCustomer = () => {
    const code = customerInput.trim();
    if (!code) return;

    // 🔸 later: call API with `code`
    // for now, if matches mock code, show mock parcels; else empty
    if (code.toUpperCase() === MOCK_CUSTOMER_CODE) {
      setActiveCustomerCode(MOCK_CUSTOMER_CODE);
      setParcels(MOCK_PARCELS);
      setSelectedIds(MOCK_PARCELS.map((p) => p.id)); // default select all
    } else {
      setActiveCustomerCode(code.toUpperCase());
      setParcels([]);
      setSelectedIds([]);
    }
  };

  const toggleParcel = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(parcels.map((p) => p.id));
    }
  };

  const handleConfirmPickup = () => {
    if (selectedIds.length === 0) return;

    // 🔸 later: call API to confirm pickup
    console.log("Confirm pickup for", activeCustomerCode, "parcels:", selectedIds);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="menu_pickup" showBack backTo={backTo} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== SCAN / ENTER CUSTOMER ========== */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SCAN/ENTER CUSTOMER</Text>

          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={16}
                color="#fbbf24"
                style={styles.inputIcon}
              />
              <TextInput
                value={customerInput}
                onChangeText={setCustomerInput}
                placeholder="CUST-MARY"
                placeholderTextColor="#FBBF24"
                autoCapitalize="characters"
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={handleLoadCustomer}
              />
            </View>

            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/scan",
                  params: { backTo: "/menu/pickup" },
                })
              }
            >
              <Ionicons
                name="qr-code-outline"
                size={16}
                color="#ffffff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.scanButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== CUSTOMER'S PARCELS ========== */}
        <View style={styles.card}>
          <View style={styles.parcelHeaderRow}>
            <Text style={styles.sectionLabel}>CUSTOMER'S PARCELS</Text>

            {hasCustomer && (
              <View style={styles.customerChip}>
                <Text style={styles.customerChipText}>
                  {activeCustomerCode}
                </Text>
              </View>
            )}
          </View>

          {hasCustomer ? (
            <>
              {/* Summary row */}
              <View style={styles.parcelSummaryRow}>
                <View style={styles.parcelSummaryPill}>
                  <Text style={styles.parcelSummaryText}>
                    {totals.totalParcels} parcels
                  </Text>
                </View>
                <View style={styles.parcelSummaryPill}>
                  <Text style={styles.parcelSummaryText}>
                    Total wt: {totals.totalWeight.toFixed(1)}kg
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.selectAllRow}
                  onPress={handleToggleSelectAll}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      isAllSelected ? "checkbox" : "square-outline"
                    }
                    size={16}
                    color={ORANGE}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
              </View>

              {/* Parcels list */}
              {parcels.length === 0 ? (
                <Text style={styles.emptyParcelsText}>
                  No parcels found for this customer.
                </Text>
              ) : (
                parcels.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <BasicCard
                      key={p.id}
                      style={styles.parcelCard}
                    >
                      <TouchableOpacity
                        style={styles.parcelRow}
                        activeOpacity={0.85}
                        onPress={() => toggleParcel(p.id)}
                      >
                        <View style={styles.parcelLeft}>
                          <View style={styles.checkboxCol}>
                            <Ionicons
                              name={
                                checked ? "checkbox" : "square-outline"
                              }
                              size={18}
                              color={ORANGE}
                            />
                          </View>

                          <View style={styles.parcelTextCol}>
                            <Text style={styles.parcelTracking}>
                              {p.tracking}
                            </Text>
                            <Text style={styles.parcelDesc}>
                              {p.description} · {p.weightKg}kg
                            </Text>

                            <View style={styles.palletPill}>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color="#166534"
                                style={{ marginRight: 4 }}
                              />
                              <Text style={styles.palletText}>
                                Pallet : {p.pallet}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </BasicCard>
                  );
                })
              )}

              {/* Confirm button row */}
              <View style={styles.footerRow}>
                <Button
                  size="sm"
                  rounded="full"
                  bgColor="#22c55e"
                  color="#ffffff"
                  style={styles.confirmButton}
                  onPress={handleConfirmPickup}
                  disabled={selectedIds.length === 0}
                >
                  Confirm Pickup
                </Button>
              </View>
            </>
          ) : (
            <Text style={styles.emptyParcelsText}>
              Search or scan a customer above to view parcels.
            </Text>
          )}
        </View>
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* Shared card */
  card: {
    backgroundColor: "#ffffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f2c44577",
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: "Karla-ExtraBold",
    letterSpacing: 0.7,
    color: "#111827",
    marginBottom: 10,
  },

  /* Scan / enter customer */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#000000ff",
    paddingVertical: 0,
  },
  scanButton: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EE9328",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  scanButtonText: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    color: "#ffffff",
  },

  /* Customer parcels header */
  parcelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  customerChip: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    backgroundColor: "#f3f4f6",
  },
  customerChipText: {
    fontSize: 11,
    fontFamily: "Karla-Bold",
    color: "#111827",
  },

  /* summary row */
  parcelSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  parcelSummaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  parcelSummaryText: {
    fontSize: 11,
    fontFamily: "Karla-Medium",
    color: "#4b5563",
  },
  selectAllRow: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    fontSize: 11,
    fontFamily: "Karla-Medium",
    color: "#f97316",
  },

  emptyParcelsText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "Karla-Regular",
    color: "#9ca3af",
  },

  /* parcel list */
  parcelCard: {
    marginTop: 8,
    marginBottom: 4,
  },
  parcelRow: {
    flexDirection: "row",
  },
  parcelLeft: {
    flexDirection: "row",
    flex: 1,
  },
  checkboxCol: {
    justifyContent: "flex-start",
    paddingTop: 4,
    marginRight: 8,
  },
  parcelTextCol: {
    flex: 1,
  },
  parcelTracking: {
    fontSize: 12,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    marginBottom: 2,
  },
  parcelDesc: {
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    marginBottom: 6,
  },
  palletPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
  },
  palletText: {
    fontSize: 10,
    fontFamily: "Karla-Bold",
    color: "#166534",
  },

  /* footer */
  footerRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  confirmButton: {
    minWidth: 150,
  },
});

