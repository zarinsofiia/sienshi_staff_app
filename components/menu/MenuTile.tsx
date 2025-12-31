// components/menu/MenuTile.tsx
import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type MenuTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>; // extra style from parent (for width/margins)
};

const MenuTile: React.FC<MenuTileProps> = ({
  icon,
  label,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.tile, style]}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={22} color="#4b5563" />
      </View>
      <Text style={styles.tileText} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default MenuTile;

const styles = StyleSheet.create({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#e2ed9e1f",
    borderWidth: 1,
    borderColor: "#e2ed9e71",
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 11,
    fontFamily: "Karla-ExtraBold", // 👈 Karla + uppercase comes from parent text
    color: "#374151",
  },
});
