// app/(tabs)/menu/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../../components/AppHeader";
import { useLanguage } from "../../../contexts/LanguageContext";
import { router } from "expo-router";
import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";
import MenuTile from "../../../components/menu/MenuTile";

type RawMenuItem = {
  icon: string | null;
  label: string; // translation key, e.g. "scan", "stock_list"
  href: string;  // e.g. "/menu/customer/customer-list"
};

type RawMenuResponse = {
  [sectionKey: string]: RawMenuItem[];
};

type MenuItemConfig = {
  key: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type MenuSectionConfig = {
  key: string; // section key from API, e.g. "inventory"
  items: MenuItemConfig[];
};

const MenuSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <View style={styles.sectionBlock}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function MenuScreen() {
  const { t, lang } = useLanguage();
  const [sections, setSections] = useState<MenuSectionConfig[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      try {
        const res = await authedFetch(
          `${API_BASE_URL}/api/users/mobilemenulist`,
          { method: "GET" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.log("mobilemenulist error:", res.status, text);
          if (isMounted) setSections([]);
          return;
        }

        const json = (await res.json().catch(() => ({}))) as RawMenuResponse;
        if (!isMounted || !json || typeof json !== "object") return;

        const builtSections: MenuSectionConfig[] = Object.entries(json)
          .map(([sectionKey, items]) => {
            const safeItems = Array.isArray(items) ? items : [];

            const mappedItems: MenuItemConfig[] = safeItems.map((item, index) => {
              const href = item.href;
              const icon = item.icon as keyof typeof Ionicons.glyphMap;

              // anything opened FROM the Menu should usually go back TO Menu
              // e.g. /scan, /stock, /menu/packing/list, /menu/pickup, /me/settings, etc.
              const needsBackToMenu =
                href === "/scan" ||
                href === "/stock" ||
                href?.startsWith("/menu/") ||
                href?.startsWith("/me/");

              return {
                key: `${sectionKey}-${item.label}-${index}`,
                labelKey: item.label,
                icon,
                onPress: href
                  ? () => {
                      if (needsBackToMenu) {
                        // 👇 this will give that screen backTo="/menu"
                        router.replace({
                          pathname: href as any,
                          params: { backTo: "/menu" },
                        });
                      } else {
                        router.replace(href as any);
                      }
                    }
                  : undefined,
              };
            });

            return {
              key: sectionKey,
              items: mappedItems,
            };
          })
          .filter((s) => s.items.length > 0);

        setSections(builtSections);
      } catch (err) {
        console.log("mobilemenulist exception:", err);
        if (isMounted) setSections([]);
      }
    };

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatLabel = (key: string) => {
    const translated = (t(key as any) as string) || key;
    if (lang === "zh") return translated;
    return translated.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_menu"  />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {sections.map((section) => (
            <MenuSection
              key={section.key}
              title={formatLabel(section.key)}
            >
              <View style={styles.grid}>
                {section.items.map((item) => (
                  <MenuTile
                    key={item.key}
                    icon={item.icon}
                    label={formatLabel(item.labelKey)}
                    onPress={item.onPress}
                    style={styles.tile}
                  />
                ))}
              </View>
            </MenuSection>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  sectionBlock: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    letterSpacing: 1,
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
  },
});
