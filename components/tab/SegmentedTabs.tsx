// components/tab/SegmentedTabs.tsx
import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
} from "react-native";
import { useLanguage } from "../../contexts/LanguageContext";  // 👈 NEW

export type SegmentedTabKey = string;

export interface SegmentedTabItem {
  key: SegmentedTabKey;
  label: string;
  count?: number; // total number
}

interface SegmentedTabsProps {
  tabs: SegmentedTabItem[];
  activeKey: SegmentedTabKey;
  onChange: (key: SegmentedTabKey) => void;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const ORANGE = "#f59e0b";

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  style,
  tabStyle,
  labelStyle,
}) => {
  const { lang } = useLanguage();   // 👈 get current language

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          const label =
            typeof tab.count === "number"
              ? `${tab.label} (${tab.count})`
              : tab.label;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.9}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                tabStyle,
              ]}
              onPress={() => onChange(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  lang === "zh" && styles.tabTextZh,     // 👈 extra bold style for zh
                  isActive && styles.tabTextActive,
                  labelStyle,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // outer wrapper – lets it sit “inside” the header area nicely
  wrapper: {
    marginBottom: 12,
  },
  scrollContent: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: ORANGE,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Karla-ExtraBold",
    textTransform: "uppercase",
    color: "#E89923",        // inactive text colour
    textAlign: "center",
  },
  // 👇 extra emphasis when language is zh
  tabTextZh: {
    fontWeight: "900",       // bolder
    textTransform: "none",   // Chinese does not need UPPERCASE
  },
  tabTextActive: {
    color: "#ffffff",
  },
});
