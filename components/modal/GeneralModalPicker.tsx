import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import SearchInput from "../input/SearchInput";
import CustomButton from "../button/CustomButton";

export type PickerOption =
  | string
  | {
      label: string;
      value: string;
    };

type Props = {
  open: boolean;
  title?: string;

options: readonly PickerOption[];
  value?: string | null;

  onChange: (value: string, option: PickerOption) => void;
  onClose: () => void;

  // search
  searchable?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;

  // text
  emptyText?: string;
  cancelText?: string;

  // behavior
  closeOnSelect?: boolean;

  // layout
  maxHeight?: number;
};

const getOptLabel = (o: PickerOption) => (typeof o === "string" ? o : o.label);
const getOptValue = (o: PickerOption) => (typeof o === "string" ? o : o.value);

export default function GeneralPickerModal({
  open,
  title = "Select",
  options,
  value,
  onChange,
  onClose,

  searchable = true,
  searchLabel = "Search",
  searchPlaceholder = "Type to search...",

  emptyText = "No results",
  cancelText = "Cancel",

  closeOnSelect = true,
  maxHeight = 360,
}: Props) {
  const [q, setQ] = useState("");

  // reset search each time open
  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;

    return options.filter((o) => {
      const label = getOptLabel(o).toLowerCase();
      const val = getOptValue(o).toLowerCase();
      return label.includes(qq) || val.includes(qq);
    });
  }, [options, q]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          {searchable ? (
            <View style={{ marginTop: 10 }}>
              <SearchInput
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={q}
                onChangeText={setQ}
                onClear={() => setQ("")}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <ScrollView
            style={{ maxHeight, marginTop: 10 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>{emptyText}</Text>
            ) : (
              filtered.map((opt) => {
                const v = getOptValue(opt);
                const label = getOptLabel(opt);
                const active = (value ?? "") === v;

                return (
                  <TouchableOpacity
                    key={v}
                    activeOpacity={0.9}
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => {
                      onChange(v, opt);
                      if (closeOnSelect) onClose();
                    }}
                  >
                    <Text style={[styles.itemText, active && styles.itemTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={{ marginTop: 12 }}>
            <CustomButton preset="danger" onPress={onClose}>
              {cancelText}
            </CustomButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: {
    fontFamily: "Karla-ExtraBold",
    fontSize: 14,
    color: "#111827",
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  itemActive: {
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  itemText: {
    fontFamily: "Karla-Bold",
    fontSize: 13,
    color: "#111827",
  },
  itemTextActive: {
    color: "#9a3412",
  },
  emptyText: {
    paddingVertical: 10,
    fontFamily: "Karla-Regular",
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
