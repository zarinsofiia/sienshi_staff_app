// app/(tabs)/dashboard/index.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeader } from "../../../components/AppHeader";
import AdminDashboard from "./AdminDashboard";
import DriverDashboard from "./DriverDashboard";

const ORANGE = "#EE9328";

interface CurrentUser {
  role_id?: number; // 👈 later you can map 1,2,3... to roles
  full_name?: string;
  name?: string;
  username?: string;
  // ...other fields if you want
}

export default function DashboardScreen() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const json = await AsyncStorage.getItem("currentUser");
        console.log("Dashboard currentUser raw:", json);
        if (json) {
          const parsed = JSON.parse(json);
          console.log("Dashboard parsed user:", parsed);
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.log("Failed to load currentUser:", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const displayName =
    user?.full_name || user?.name || user?.username || "User";

  // 👉 for now: hardcode / default to 1 (admin)
  const roleId =
    typeof user?.role_id === "number" && !Number.isNaN(user.role_id)
      ? user.role_id
      : 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="header_dashboard" showNotification />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={ORANGE} />
        </View>
      ) : roleId === 1
       ? (
        // role_id 1 → admin dashboard
        <AdminDashboard displayName={displayName} />
      ) : (
        // anything else → driver dashboard (for now)
        <DriverDashboard displayName={displayName} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
