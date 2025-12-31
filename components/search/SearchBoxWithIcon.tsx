// components/input/SearchBoxWithIcon.tsx (React Native)

import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Search } from "lucide-react-native";

interface SearchBoxWithIconProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function SearchBoxWithIcon({
  placeholder = "Search...",
  value,
  onChangeText,
  containerStyle,
  inputStyle,
}: SearchBoxWithIconProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Search Icon */}
      <Search size={18} color="#9ca3af" style={styles.icon} />

      {/* Input Box */}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, inputStyle]}
        placeholderTextColor="#9ca3af"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    paddingVertical: 0,
  },
});
