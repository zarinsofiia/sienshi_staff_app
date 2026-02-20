// components/card/DetailSectionCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type DetailRowProps = {
  label: string;
  value?: string | null;
  /**
   * If true, value will be shown in UPPERCASE.
   * Default: true
   */
  uppercase?: boolean;
};

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  uppercase = true,
}) => {
  const raw = value ?? "-";
  const display = uppercase ? String(raw).toUpperCase() : String(raw);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{display}</Text>
    </View>
  );
};

type DetailSectionCardProps = {
  title: string;
  children?: React.ReactNode;
};

export const DetailSectionCard: React.FC<DetailSectionCardProps> = ({
  title,
  children,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ffffffff",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#E89923",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    flex: 0.5,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#111827",
    textAlign: "right",
    flex: 0.5,
  },
});
