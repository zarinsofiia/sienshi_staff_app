// app/(tabs)/_layout.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE_URL } from "../../config/api";
import { authedFetch } from "../../config/mobileApiClient";
import { useLanguage } from "../../contexts/LanguageContext";

const ORANGE = "#f59e0b";

type MobileModule = {
  icon: string | null; // e.g. "home-outline"
  label: string; // e.g. "home" | "menu" | "scan" | "stock" | "profile"
  href: string; // e.g. "/dashboard"
};

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** If API gives "xxx-outline", show "xxx" when focused */
function resolveIconName(icon: string, focused: boolean): IoniconName {
  const name = (icon || "").trim();
  if (!name) return "ellipse-outline";
  if (focused && name.endsWith("-outline")) {
    return name.replace("-outline", "") as IoniconName;
  }
  return name as IoniconName;
}

function CircleIcon({
  icon,
  color,
  size,
  focused,
}: {
  icon: string;
  color: string;
  size: number;
  focused: boolean;
}) {
  if (!focused) {
    return (
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        color={color}
        size={size}
      />
    );
  }

  return (
    <View style={styles.activeCircle}>
      <Ionicons
        name={resolveIconName(icon, true) as any}
        color={ORANGE}
        size={size}
      />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [modules, setModules] = useState<MobileModule[]>([]);

  const BASE_TAB_HEIGHT = 56;

  // --- Fetch modules from API ---
  useEffect(() => {
    let isMounted = true;

    const loadModules = async () => {
      try {
        const res = await authedFetch(`${API_BASE_URL}/api/users/mobilemodulelist`, {
          method: "GET",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.log("mobilemodulelist error:", res.status, text);
          if (isMounted) setModules([]);
          return;
        }

        const json = await res.json().catch(() => []);
        if (!isMounted) return;

        const list = Array.isArray(json) ? json : [];
        setModules(list as MobileModule[]);
      } catch (err) {
        console.log("mobilemodulelist exception:", err);
        if (isMounted) setModules([]);
      }
    };

    loadModules();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Map API modules to each known tab (by href) ---
  const { homeModule, menuModule, scanModule, stockModule, ordersModule, meModule } =
    useMemo(() => {
      const findByHref = (href: string) => modules.find((m) => m.href === href) ?? null;

      return {
        homeModule: findByHref("/dashboard"),
        menuModule: findByHref("/menu"),
        scanModule: findByHref("/scan"),
        stockModule: findByHref("/stock"),
        ordersModule: findByHref("/orders"),
        meModule: findByHref("/me"),
      };
    }, [modules]);

  const showHome = !!homeModule;
  const showMenu = !!menuModule;
  const showScan = !!scanModule;
  const showStock = !!stockModule;
  const showOrders = !!ordersModule;
  const showMe = !!meModule;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: "#33302e9c",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 13 },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
          borderRadius: 15,
          height: BASE_TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom || 4,
          paddingTop: 4,
          marginBottom: 10
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: homeModule ? t(homeModule.label as any) : "",
          href: showHome ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            homeModule?.icon ? (
              <CircleIcon
                icon={homeModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
      />

      {/* MENU */}
      <Tabs.Screen
        name="menu"
        options={{
          title: menuModule ? t(menuModule.label as any) : "",
          href: showMenu ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            menuModule?.icon ? (
              <CircleIcon
                icon={menuModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/menu");
          },
        }}
      />

      {/* SCAN */}
      <Tabs.Screen
        name="scan"
        options={{
          title: scanModule ? t(scanModule.label as any) : "",
          href: showScan ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            scanModule?.icon ? (
              <CircleIcon
                icon={scanModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
      />

      {/* STOCK */}
      <Tabs.Screen
        name="stock"
        options={{
          title: stockModule ? t(stockModule.label as any) : "",
          href: showStock ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            stockModule?.icon ? (
              <CircleIcon
                icon={stockModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/stock");
          },
        }}
      />

      {/* ORDERS */}
      <Tabs.Screen
        name="orders"
        options={{
          title: ordersModule ? t(ordersModule.label as any) : "",
          href: showOrders ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            ordersModule?.icon ? (
              <CircleIcon
                icon={ordersModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
      />

      {/* ME */}
      <Tabs.Screen
        name="me"
        options={{
          title: meModule ? t(meModule.label as any) : "",
          href: showMe ? undefined : null,
          tabBarIcon: ({ color, size, focused }) =>
            meModule?.icon ? (
              <CircleIcon
                icon={meModule.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ) : null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/me");
          },
        }}
      />

      {/* HIDDEN */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: "Notifications",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    justifyContent: "center",
  },
});
