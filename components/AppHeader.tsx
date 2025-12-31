// components/AppHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../contexts/LanguageContext";

type AppHeaderProps = {
  // either pass a raw title OR a translation key
  title?: string;
  titleKey?: string;          // e.g. "header_dashboard"
  showBack?: boolean;         // show back button on left
  showNotification?: boolean; // show notification icon on right

  /**
   * Optional: route path to go back to.
   * If provided, header will do:
   *   router.replace(backTo)
   * If not provided, it falls back to router.back().
   */
  backTo?: string;

  /**
   * Optional custom back handler.
   * If this exists, it will be used instead of backTo / router.back().
   */
  onBack?: () => void;
};

export function AppHeader({
  title,
  titleKey,
  showBack = false,
  showNotification = false,
  backTo,
  onBack,
}: AppHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const rawTitle = titleKey ? (t(titleKey as any) as string) : title ?? "";
  const upperTitle = rawTitle.toUpperCase();

  const handleBack = () => {
    if (onBack) {
      // highest priority: custom handler
      onBack();
    } else if (backTo) {
      // dynamic target => REPLACE (clean stack)
      router.replace(backTo as any);
    } else {
      // fallback if there's truly nothing to go back to
      router.replace("/dashboard"); // change this to your home screen
    }
  };

  return (
    <View style={styles.container}>
      {/* LEFT SIDE (back button) */}
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#E89923" />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTER TITLE */}
      <View style={styles.center}>
        <Text style={styles.title}>{upperTitle}</Text>
      </View>

      {/* RIGHT SIDE (notification) */}
      <View style={[styles.side, styles.rightSide]}>
        {showNotification && (
          <TouchableOpacity
            onPress={() => {
              console.log("Notification pressed");
            }}
            style={styles.iconButton}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#E89923"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSide: {
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Karla-ExtraBold",
    color: "#E89923",
    textAlign: "center",
  },
});

export default AppHeader;
