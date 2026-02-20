// app/(tabs)/me/index.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../components/AppHeader";
import { DetailSectionCard } from "../../../components/card/DetailSectionCard";
import { API_BASE_URL } from "../../../config/api";
import { authedFetch } from "../../../config/mobileApiClient";
import { useLanguage } from "../../../contexts/LanguageContext";

const ORANGE = "#f59e0b";

const MOCK_USER = {
  name: "ADMIN",
  email: "admin@gmail.com",
  phone: "0123456789",
};

export default function MeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const user = MOCK_USER; // later: replace with real API data

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // ✅ Call logout using Bearer token (authedFetch attaches it)
      const res = await authedFetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ❌ remove body (no hardcoded username/password)
      });

      // Optional: log/debug response
      const text = await res.text().catch(() => "");
      console.log("Logout status:", res.status, "body:", text);
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      try {
        await AsyncStorage.multiRemove(["authToken", "refreshToken", "currentUser"]);
      } catch (e) {
        console.log("Failed clearing storage on logout:", e);
      }

      setLoggingOut(false);
      router.replace("/login" as any);
    }
  };


  const goProfile = () => {
    router.replace({
      pathname: "/me/profile",
      params: { backTo: "/me" },
    } as any);
  };

  const goChangePassword = () => {
    router.replace({
      pathname: "/me/change-password",
      params: { backTo: "/me" },
    } as any);
  };

  const goSettings = () => {
    router.replace({
      pathname: "/me/settings",
      params: { backTo: "/me" },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Root of the Me tab – no back button here */}
      <AppHeader titleKey="header_me" />

      <View style={styles.content}>
        {/* avatar + name + meta */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={30} color={ORANGE} />
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileMeta}>
            {user.email} · {user.phone}
          </Text>
        </View>

        {/* main section card using DetailSectionCard */}
        <DetailSectionCard
          title={t("me_account_section") || "Account Settings"}
        >
          {/* Edit profile */}
          <TouchableOpacity
            style={[styles.row, styles.rowWithBorder]}
            activeOpacity={0.8}
            onPress={goProfile}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Ionicons name="pencil" size={16} color={ORANGE} />
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowTitle}>
                  {t("me_profile") || "Edit Profile Information"}
                </Text>
                <Text style={styles.rowSubtitle}>
                  Name · Email · Phone and more
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editPill}
              activeOpacity={0.8}
              onPress={goProfile}
            >
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Change password */}
          <TouchableOpacity
            style={[styles.row, styles.rowWithBorder]}
            activeOpacity={0.8}
            onPress={goChangePassword}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={ORANGE}
                />
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowTitle}>
                  {t("me_change_password") || "Change Password"}
                </Text>
                <Text style={styles.rowSubtitle}>
                  Click to change password
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.8}
            onPress={goSettings}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Ionicons name="settings-outline" size={16} color={ORANGE} />
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowTitle}>
                  {t("me_settings") || "Settings"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </DetailSectionCard>

        {/* bottom logout button */}
        <View style={styles.bottomIconWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={loggingOut}
            style={styles.logoutButton}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={ORANGE} />
            ) : (
              <Ionicons
                name="power-outline"
                size={22}
                color={ORANGE}
                style={{ marginRight: 6 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  profileBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ORANGE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  profileName: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    color: ORANGE,
    textTransform: "uppercase",
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#2e2f31",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fee2b3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rowTextBlock: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#111827",
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: "Karla-Regular",
    color: "#2e2f31",
    marginTop: 2,
  },
  editPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ORANGE,
  },
  editPillText: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#ffffff",
  },
  bottomIconWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: ORANGE,
  },
});
