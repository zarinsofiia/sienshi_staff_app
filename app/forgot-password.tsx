// app/forgot-password.tsx
import AsyncButton from "@/components/button/AsnycButton";
import Input from "@/components/input/Input";
import MobileAlertDialog from "@/components/modal/MobileAlertDialog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL } from "../config/api";
import { useLanguage } from "../contexts/LanguageContext";

type DialogType = "success" | "error";

const ORANGE = "#f59e0b";
const APP_BG = "#ffffffff";

export default function ForgotPasswordScreen() {
  const { t, lang } = useLanguage();

  const [identifier, setIdentifier] = useState(""); // username or email
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

  const showSuccess = (message: string) => {
    setDialog({
      open: true,
      type: "success",
      title: t("common_success") || "Success",
      message,
    });
  };

  const handleSubmit = async () => {
    const val = identifier.trim();
    if (!val) {
      showError(
        t("forgot_missing_fields") || "Please enter your username or email."
      );
      return;
    }

    try {
      /**
       * ✅ Update this endpoint to match your backend.
       * Common examples:
       * - /api/auth/forgotPassword
       * - /api/auth/staffForgotPassword
       * - /api/auth/requestReset
       */
      const res = await fetch(`${API_BASE_URL}/api/auth/staffForgotPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: val,
          language: lang,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || t("forgot_error") || "Request failed.";
        showError(msg);
        return;
      }

      // backend message fallback
      const okMsg =
        data?.message ||
        t("forgot_success") ||
        "Reset instructions have been sent (if the account exists).";

      showSuccess(okMsg);
    } catch (e) {
      showError(t("forgot_error") || "Request failed.");
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
              <Text style={styles.headerText}>
                {t("forgot_title") || "Forgot Password"}
              </Text>
              <Text style={styles.headerSub}>
                {t("forgot_subtitle") ||
                  "Enter your username or email. We will send reset instructions."}
              </Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelContent}>
                <View style={styles.fieldGroup}>
                  <Input
                    label={t("forgot_username_email_label") || "Username / Email"}
                    labelStyle={styles.label}
                    placeholder={
                      t("forgot_username_email_placeholder") ||
                      "Enter username or email"
                    }
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                    returnKeyType="done"
                    uiSize="md"
                    leftIcon={
                      <Ionicons name="mail-outline" size={16} color="#9ca3af" />
                    }
                    containerStyle={styles.inputWrapper}
                    inputStyle={styles.input}
                    trimEnd
                  />
                </View>

                <AsyncButton
                  onPress={handleSubmit}
                  style={styles.primaryButton}
                  textStyle={styles.primaryButtonText}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  {t("forgot_submit_button") || "Send Reset Link"}
                </AsyncButton>

                <TouchableOpacity
                  style={styles.backWrapper}
                  activeOpacity={0.8}
                  onPress={() => router.back()}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={ORANGE}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.backText}>
                    {t("forgot_back_to_login") || "Back to Login"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <MobileAlertDialog dialog={dialog as any} onClose={closeDialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: APP_BG },

  container: { flex: 1, backgroundColor: ORANGE },
  scrollContent: { flexGrow: 1 },

  header: { paddingHorizontal: 24, paddingTop: 24 },
  headerText: {
    fontSize: 28,
    fontFamily: "Karla-ExtraBold",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 6,
    marginTop: 15,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Karla-Medium",
    color: "#fff7ed",
    lineHeight: 20,
  },

  panel: {
    flex: 1,
    marginTop: 40,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
  },
  panelContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },

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
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
  },

  primaryButton: {
    marginTop: 18,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.8,
  },

  backWrapper: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 14,
    fontFamily: "Karla-Bold",
    fontWeight: "700",
    color: ORANGE,
  },
});
