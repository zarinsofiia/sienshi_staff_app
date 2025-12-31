// app/(tabs)/menu/packing/create.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../../../components/AppHeader";
import BasicCard from "../../../../components/card/BasicCard";
import CustomButton from "../../../../components/button/CustomButton";
import SearchInput from "../../../../components/input/SearchInput";
import { Picker } from '@react-native-picker/picker';
import {
  Search,
  FileText,
  Truck as TruckIcon,
  Trash2,
  Plus,
  ChevronDown,
  Save as SaveIcon,
} from "lucide-react-native";

const ORANGE = "#EE9328";

type ParcelCandidate = {
  id: string;
  code: string;
  description: string;
  weightKg: number;
};

// 🔸 Mock parcels for search (replace with API later)
const MOCK_PARCELS: ParcelCandidate[] = [
  {
    id: "1",
    code: "ABC-12345-S-BL",
    description: "Lemon & Co. - SKU LMN-TEE-XS",
    weightKg: 1.8,
  },
  {
    id: "2",
    code: "ABC-99999-M-GN",
    description: "Lemon & Co. - SKU LMN-TEE-M",
    weightKg: 2.4,
  },
];

export default function PackingCreateScreen() {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const backTo = params.backTo as string | undefined;

  const [searchValue, setSearchValue] = useState("");
  const [selectedParcels, setSelectedParcels] = useState<ParcelCandidate[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // 🔹 Filter mock parcels by search term
  const searchResults = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return MOCK_PARCELS.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchValue]);

  const handleAddParcel = (parcel: ParcelCandidate) => {
    setSelectedParcels((prev) => {
      // avoid duplicates by code
      if (prev.some((p) => p.code === parcel.code)) return prev;
      return [...prev, parcel];
    });
  };

  const handleRemoveParcel = (code: string) => {
    setSelectedParcels((prev) => prev.filter((p) => p.code !== code));
  };

  const handleClearAll = () => {
    setSelectedParcels([]);
  };

  const totalWeight = useMemo(
    () => selectedParcels.reduce((sum, p) => sum + p.weightKg, 0),
    [selectedParcels]
  );

  const handleSelectVehicle = () => {
    // simple placeholder: toggle example value (replace with real picker later)
    setSelectedVehicle((prev) => (prev ? null : "TRK-01"));
  };

  const handleSelectDriver = () => {
    setSelectedDriver((prev) => (prev ? null : "Driver A"));
  };

  const handleSave = () => {
    if (selectedParcels.length === 0) {
      Alert.alert("Missing items", "Please add at least one parcel.");
      return;
    }
    if (!selectedVehicle || !selectedDriver) {
      Alert.alert("Missing truck info", "Please select vehicle and driver.");
      return;
    }

    // TODO: hook to your API
    console.log("Saving packing list:", {
      parcels: selectedParcels,
      vehicle: selectedVehicle,
      driver: selectedDriver,
    });

    Alert.alert("Saved", "Packing list has been saved (mock).");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Create packing list" showBack backTo={backTo} />

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SEARCH PARCELS CARD */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Search size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>SEARCH PARCELS</Text>
            </View>

            <SearchInput
              label="" // header already has the label
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="ABC-12345-S-BL"
              containerStyle={styles.searchInputContainer}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {/* Search results (tap to add) */}
            {searchResults.map((parcel) => (
              <TouchableOpacity
                key={parcel.id}
                style={styles.parcelRow}
                onPress={() => handleAddParcel(parcel)}
                activeOpacity={0.9}
              >
                <View style={styles.parcelInfo}>
                  <Text style={styles.parcelCode}>{parcel.code}</Text>
                  <Text style={styles.parcelDesc}>{parcel.description}</Text>
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddParcel(parcel)}
                  activeOpacity={0.9}
                >
                  <Plus size={14} color="#ffffff" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </BasicCard>

          {/* ITEM LIST CARD */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <FileText size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>ITEM LIST</Text>
            </View>

            {selectedParcels.length === 0 ? (
              <Text style={styles.emptyText}>
                No parcels added yet. Search and tap a parcel above to add it.
              </Text>
            ) : (
              <>
                {selectedParcels.map((parcel) => (
                  <View key={parcel.code} style={styles.itemRow}>
                    <View style={styles.parcelInfo}>
                      <Text style={styles.parcelCode}>{parcel.code}</Text>
                      <Text style={styles.parcelDesc}>
                        {parcel.description}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.trashButton}
                      onPress={() => handleRemoveParcel(parcel.code)}
                    >
                      <Trash2 size={16} color={ORANGE} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Summary row */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>
                    Total Weight (kg) : {totalWeight.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryText}>
                    Total Parcel : {selectedParcels.length}
                  </Text>
                </View>

                {/* Clear all row */}
                <View style={styles.clearAllRow}>
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={handleClearAll}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </BasicCard>

          {/* ASSIGN TRUCK CARD */}
          <BasicCard style={styles.card}>
            <View style={styles.cardHeader}>
              <TruckIcon size={16} color="#111827" />
              <Text style={styles.cardHeaderTitle}>ASSIGN TRUCK</Text>
            </View>

            <View style={styles.assignRow}>
              {/* Vehicle picker */}
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={selectedVehicle ?? ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      setSelectedVehicle(null);
                    } else {
                      setSelectedVehicle(String(value));
                    }
                  }}
                  style={styles.picker}
                  dropdownIconColor="#9ca3af"
                >
                  <Picker.Item label="Select Vehicle" value="" />
                  <Picker.Item label="TRK-01" value="TRK-01" />
                  <Picker.Item label="TRK-02" value="TRK-02" />
                  {/* later: map real vehicles from API */}
                </Picker>
              </View>

              {/* Driver picker */}
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={selectedDriver ?? ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      setSelectedDriver(null);
                    } else {
                      setSelectedDriver(String(value));
                    }
                  }}
                  style={styles.picker}
                  dropdownIconColor="#9ca3af"
                >
                  <Picker.Item label="Select Driver" value="" />
                  <Picker.Item label="Driver A" value="Driver A" />
                  <Picker.Item label="Driver B" value="Driver B" />
                  {/* later: real drivers here */}
                </Picker>
              </View>
            </View>

          </BasicCard>
        </ScrollView>

        {/* Bottom Save button */}
        <View style={styles.footer}>
          <CustomButton
            preset="approve"
            style={styles.saveButton}
            icon={SaveIcon}
            iconPosition="left"
            iconSize={16}
            onPress={handleSave}
          >
            Save
          </CustomButton>
        </View>
      </View>
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingBottom: 80, // leave space for Save button
  },

  card: {
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardHeaderTitle: {
    marginLeft: 8,
    fontFamily: "Karla-ExtraBold",
    fontSize: 12,
    letterSpacing: 1,
    color: "#000000ff",
  },

  searchInputContainer: {
    marginBottom: 8,
  },

  parcelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fefce8",
    marginTop: 4,
  },

  parcelInfo: {
    flex: 1,
  },
  parcelCode: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 13,
    color: ORANGE,
    marginBottom: 2,
  },
  parcelDesc: {
    fontFamily: "Karla-Regular",
    fontSize: 11,
    color: "#6b7280",
  },

  addButton: {
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  addButtonText: {
    marginLeft: 6,
    fontFamily: "Karla-Bold",
    fontSize: 11,
    color: "#ffffff",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 8,
  },
  trashButton: {
    marginLeft: 10,
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7ed",
  },

  emptyText: {
    fontFamily: "Karla-Regular",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryText: {
    fontFamily: "Karla-Regular",
    fontSize: 11,
    color: "#6b7280",
  },

  clearAllRow: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ef4444",
  },
  clearAllText: {
    fontFamily: "Karla-Bold",
    fontSize: 11,
    color: "#ffffff",
  },

  assignRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  dropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#ffffff",
    marginRight: 8,
  },
  dropdownText: {
    fontFamily: "Karla-Regular",
    fontSize: 12,
    color: "#6b7280",
  },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
    alignItems: "flex-end",
  },
  saveButton: {
    minWidth: 110,
    borderRadius: 999,
  },
  picker: {
    flex: 1,        // let it fill the dropdown row
    width: "100%",  // safe for Android
    // no fixed height here
  },

});
