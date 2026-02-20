// components/input/SearchInput.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export interface SearchInputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;

  /** optional: show X and handle clear */
  onClear?: () => void;
  showClearButton?: boolean;
}

const ORANGE = "#f59e0b";

const SearchInput: React.FC<SearchInputProps> = ({
  label = "SEARCH",
  containerStyle,
  onClear,
  showClearButton = true,
  value,
  ...textInputProps
}) => {
  const hasText =
    typeof value === "string" ? value.trim().length > 0 : false;

  return (
    <View style={containerStyle}>
      {/* LABEL */}
      <Text style={styles.label}>{label}</Text>

      {/* INPUT SHELL */}
      <View style={styles.inputWrapper}>
        <Ionicons
          name="search-outline"
          size={16}
          color="#fbbf24"
          style={styles.icon}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor={ORANGE}
          value={value}
          {...textInputProps}
        />

        {/* ✅ Clear (X) */}
        {showClearButton && hasText && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={20} color="#fbbf24" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    letterSpacing: 1,
    color: "#000000ff",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Karla-Regular",
    color: "#000000ff",
    paddingVertical: 8,
  },
  clearBtn: {
    marginLeft: 8,
  },
});

export default SearchInput;
