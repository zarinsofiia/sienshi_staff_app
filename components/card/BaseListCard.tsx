// components/card/BaseListCard.tsx
import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
  Platform,
} from "react-native";

type StatusTone = "active" | "pending" | "danger" | "default";

interface BaseListCardProps {
  title: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  children?: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle;

  // ✅ NEW
  onPress?: () => void;
  disabled?: boolean;
}

const ORANGE = "#E89923";

export const BaseListCard: React.FC<BaseListCardProps> = ({
  title,
  statusLabel,
  statusTone = "default",
  children,
  footer,
  style,
  onPress,
  disabled,
}) => {
  const pressable = !!onPress;

  const statusStyle =
    statusTone === "pending"
      ? styles.badgePending
      : statusTone === "active"
      ? styles.badgeActive
      : statusTone === "danger"
      ? styles.badgeDanger
      : styles.badgeDefault;

  const statusTextStyle =
    statusTone === "pending"
      ? styles.badgeTextPending
      : statusTone === "active"
      ? styles.badgeTextActive
      : statusTone === "danger"
      ? styles.badgeTextDanger
      : styles.badgeTextDefault;

  return (
    <View style={[styles.cardOuter, style]}>
      <Pressable
        disabled={!pressable || !!disabled}
        onPress={onPress}
        android_ripple={
          pressable && Platform.OS === "android"
            ? { color: "rgba(0,0,0,0.06)" }
            : undefined
        }
        style={({ pressed }) => [
          styles.cardInner,
          pressable && !disabled && pressed ? styles.pressed : null,
          disabled ? styles.disabled : null,
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>

          {statusLabel ? (
            <View style={[styles.badgeBase, statusStyle]}>
              <Text
                style={[styles.badgeTextBase, statusTextStyle]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Body */}
        <View style={styles.body}>{children}</View>

        {/* Footer (buttons) */}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 24,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: "transparent",
  },

  cardInner: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // ✅ pressed feedback (iOS + non-ripple)
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  titleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
  },
  body: {
    marginTop: 2,
  },
  footer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
  },

  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextBase: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
  },
  badgeActive: { backgroundColor: "#dcfce7" },
  badgeTextActive: { color: "#166534" },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeTextPending: { color: "#92400e" },
  badgeDanger: { backgroundColor: "#fee2e2" },
  badgeTextDanger: { color: "#b91c1c" },
  badgeDefault: { backgroundColor: "#e5e7eb" },
  badgeTextDefault: { color: "#374151" },
});
