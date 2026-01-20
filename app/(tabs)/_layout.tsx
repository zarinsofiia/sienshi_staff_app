// app/(tabs)/_layout.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { API_BASE_URL } from "../../config/api";
import { authedFetch } from "../../config/mobileApiClient";
import { useLanguage } from "../../contexts/LanguageContext";

type MobileModule = {
  icon: string | null; // e.g. "home-outline"
  label: string;       // e.g. "home" | "menu" | "scan" | "stock" | "profile"
  href: string;        // e.g. "/dashboard"
};

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
        const res = await authedFetch(
          `${API_BASE_URL}/api/users/mobilemodulelist`,
          { method: "GET" }
        );

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
  const {
    homeModule,
    menuModule,
    scanModule,
    stockModule,
    ordersModule,
    meModule,
  } = useMemo(() => {
    const findByHref = (href: string) =>
      modules.find((m) => m.href === href) ?? null;

    return {
      homeModule: findByHref("/dashboard"),
      menuModule: findByHref("/menu"),
      scanModule: findByHref("/scan"),
      stockModule: findByHref("/stock"),
      ordersModule: findByHref("/orders"), // later if backend adds it
      meModule: findByHref("/me"),
    };
  }, [modules]);

  // show/hide purely based on API
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
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
          height: BASE_TAB_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom || 4,
          paddingTop: 4,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: homeModule ? t(homeModule.label as any) : "",
          href: showHome ? undefined : null,
          tabBarIcon: ({ color, size }) =>
            homeModule && homeModule.icon ? (
              <Ionicons
                name={homeModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
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
          tabBarIcon: ({ color, size }) =>
            menuModule && menuModule.icon ? (
              <Ionicons
                name={menuModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
              />
            ) : null,
        }}
        listeners={{
          tabPress: (e) => {
            // stop default "restore last screen in stack"
            e.preventDefault();
            // always go to Menu root (index) and kill previous Me state
            router.replace("/menu");
          },
        }}
      />

      {/* SCAN */}
      <Tabs.Screen
        name="scan/index"
        options={{
          title: scanModule ? t(scanModule.label as any) : "",
          href: showScan ? undefined : null,
          tabBarIcon: ({ color, size }) =>
            scanModule && scanModule.icon ? (
              <Ionicons
                name={scanModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
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
          tabBarIcon: ({ color, size }) =>
            stockModule && stockModule.icon ? (
              <Ionicons
                name={stockModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
              />
            ) : null,
        }}
          listeners={{
    tabPress: (e) => {
      e.preventDefault();
      router.replace("/stock"); // ✅ always go stock root
    },
  }}
      />

      {/* ORDERS – only if backend returns { href: "/orders", ... } */}
      <Tabs.Screen
        name="orders/index"
        options={{
          title: ordersModule ? t(ordersModule.label as any) : "",
          href: showOrders ? undefined : null,
          tabBarIcon: ({ color, size }) =>
            ordersModule && ordersModule.icon ? (
              <Ionicons
                name={ordersModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
              />
            ) : null,
        }}
      />

      {/* ME */}
      {/* <Tabs.Screen
        name="me"
        options={{
          title: meModule ? t(meModule.label as any) : "",
          href: showMe ? undefined : null,
          tabBarIcon: ({ color, size }) =>
            meModule && meModule.icon ? (
              <Ionicons
                name={meModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
              />
            ) : null,
        }}
      /> */}
      {/* ME */}
      <Tabs.Screen
        name="me"
        options={{
          title: meModule ? t(meModule.label as any) : "",
          href: showMe ? undefined : null,
          tabBarIcon: ({ color, size }) =>
            meModule && meModule.icon ? (
              <Ionicons
                name={meModule.icon as keyof typeof Ionicons.glyphMap}
                color={color}
                size={size}
              />
            ) : null,
        }}
        listeners={{
          tabPress: (e) => {
            // stop default "restore last screen in stack"
            e.preventDefault();
            // always go to Me root (index) and kill previous Me state
            router.replace("/me");
          },
        }}
      />

    </Tabs>
  );
}
