// app/login.tsx  (Staff Login) — NO TOAST, NO SUCCESS ALERT (direct in), ERROR uses MobileAlertDialog
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import Input from "@/components/input/Input";
import AsyncButton from "@/components/button/AsnycButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";
import MobileAlertDialog from "@/components/modal/MobileAlertDialog";

type DialogType = "success" | "error";

const ORANGE = "#f59e0b";
const WHITE = "#ffffffff";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { t, lang, setLang } = useLanguage();

  const [dialog, setDialog] = useState<{
    open: boolean;
    type: DialogType;
    title: string;
    message: string;
  } | null>(null);

  const closeDialog = () => setDialog(null);

  const showError = (message: string) => {
    setDialog({
      open: true,
      type: "error",
      title: t("settings_error_title") || "Error",
      message,
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showError(t("login_missing_fields") || "Please enter username and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/staffLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          language: lang, // send current UI lang to backend
        }),
      });

      const data = await res.json().catch(() => null);

      console.log("staff login status:", res.status, "body:", data);

      if (!res.ok) {
        const msg = data?.message || t("login_error") || "Login failed.";
        showError(msg);
        return;
      }

      // 🔐 Save tokens (access + refresh)
      const accessToken = data?.token || data?.accessToken;
      const refreshTokenFromApi = data?.refreshToken;

      if (accessToken) {
        try {
          await AsyncStorage.setItem("authToken", accessToken);
          console.log("Saved authToken:", accessToken);
        } catch (storageErr) {
          console.log("Failed to save authToken:", storageErr);
        }
      } else {
        console.log(
          "No accessToken field found in login response – check backend response shape"
        );
      }

      // 🔁 Save refreshToken (if backend has one, otherwise fall back to accessToken)
      const tokenForRefresh = refreshTokenFromApi || accessToken;
      if (tokenForRefresh) {
        try {
          await AsyncStorage.setItem("refreshToken", tokenForRefresh);
          console.log("Saved refreshToken:", tokenForRefresh);
        } catch (storageErr) {
          console.log("Failed to save refreshToken:", storageErr);
        }
      } else {
        console.log("[login] no refreshToken or accessToken in response");
      }

      // ⭐ Save minimal logged-in user info for dashboard greeting
      try {
        const user = { username: username.trim() };
        await AsyncStorage.setItem("currentUser", JSON.stringify(user));
        console.log("Saved currentUser:", user);
      } catch (e) {
        console.log("Failed to save currentUser:", e);
      }

      // 🔹 Apply backend preferred language if provided
      const backendLang = data?.users?.pref_lang;
      if (backendLang === "en" || backendLang === "zh") {
        setLang(backendLang);
      }

      // ✅ SUCCESS: no dialog, no toast — direct in
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.log("Staff login request error:", error);
      showError(t("login_error") || "Login failed.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.headerText}>{t("login_hello")}</Text>
              <Text style={styles.headerText}>{t("login_welcome_back")}</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelContent}>
                <View style={styles.logoWrapper}>
                  <Image
                    source={require("../assets/images/sienshi_logo.jpg")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Input
                    label={t("login_username_label")}
                    labelStyle={styles.label}
                    placeholder={t("login_username_placeholder")}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                    returnKeyType="next"
                    uiSize="md"
                    leftIcon={
                      <Ionicons name="person-outline" size={16} color="#9ca3af" />
                    }
                    containerStyle={styles.inputWrapper}
                    inputStyle={styles.input}
                    trimEnd
                  />
                </View>

                <View style={[styles.fieldGroup, { marginTop: 18 }]}>
                  <Input
                    label={t("login_password_label")}
                    labelStyle={styles.label}
                    placeholder={t("login_password_placeholder")}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    uiSize="md"
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color="#9ca3af"
                      />
                    }
                    containerStyle={styles.inputWrapper}
                    inputStyle={styles.input}
                  />
                </View>

                <TouchableOpacity style={styles.forgotWrapper}>
                  <Text style={styles.forgotText}>{t("login_forgot")}</Text>
                </TouchableOpacity>

                <AsyncButton
                  onPress={handleLogin}
                  style={styles.loginButton}
                  textStyle={styles.loginButtonText}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  {t("login_button")}
                </AsyncButton>

                <View style={styles.langRow}>
                  <TouchableOpacity onPress={() => setLang("en")}>
                    <Text
                      style={[
                        styles.langText,
                        lang === "en" && styles.langActive,
                      ]}
                    >
                      EN
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.langSeparator}> | </Text>

                  <TouchableOpacity onPress={() => setLang("zh")}>
                    <Text
                      style={[
                        styles.langText,
                        lang === "zh" && styles.langActive,
                      ]}
                    >
                      中
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ✅ Error dialog only */}
      <MobileAlertDialog dialog={dialog as any} onClose={closeDialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, backgroundColor: ORANGE },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24 },
  headerText: {
    fontSize: 28,
    fontFamily: "Karla-ExtraBold",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
    marginTop: 15,
  },
  panel: {
    flex: 1,
    marginTop: 40,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
  },
  panelContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  logoWrapper: { alignItems: "center", marginBottom: 0 },
  logoImage: { width: 250, height: 180 },
  fieldGroup: { marginTop: 0 },
  label: {
    fontSize: 14,
    fontFamily: "Karla-ExtraBold",
    fontWeight: "800",
    color: "#f59e0b",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 12,
    color: "#111827",
    marginLeft: 8,
  },
  forgotWrapper: { marginTop: 8, alignItems: "flex-end" },
  forgotText: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    fontWeight: "700",
    color: "#f59e0b",
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  langRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  langText: { fontSize: 12, color: "#9ca3af", fontFamily: "Karla-ExtraBold" },
  langActive: { color: ORANGE, fontFamily: "Karla-ExtraBold" },
  langSeparator: { fontSize: 12, color: "#9ca3af", marginHorizontal: 6 },
});
