// components/card/BasicCard.tsx

import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

export interface BasicCardProps {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * BasicCard – simple white card with soft yellow border + light shadow.
 * Use as a generic container for content.
 */
const BasicCard: React.FC<BasicCardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a", // very light yellow
    paddingHorizontal: 12,
    paddingVertical: 10,
  
  },
});

export default BasicCard;
