// app/(tabs)/me/settings.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../../components/AppHeader";
import { DetailSectionCard } from "../../../components/card/DetailSectionCard";
import { useLanguage } from "../../../contexts/LanguageContext";
import MobileAlertDialog from "../../../components/modal/MobileAlertDialog";

type DialogType = "success" | "error";

const ORANGE = "#f59e0b";

export default function SettingsScreen() {
  const router = useRouter();
  const { backTo } = useLocalSearchParams<{ backTo?: string }>();
  const { lang, changeLang, t } = useLanguage();

  // dummy toggles for layout only
  const dummyValue = false;

  const [changingLang, setChangingLang] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    type: DialogType;
    title: string;
    message: string;
  } | null>(null);

  const closeDialog = () => setDialog(null);

  const handleBack = () => {
    if (backTo) {
      router.replace(backTo as any);
    } else {
      router.back();
    }
  };

  const showDialog = (type: DialogType, title: string, message: string) => {
    setDialog({ open: true, type, title, message });
  };

  const onSelectLang = async (newLang: "en" | "zh") => {
    if (newLang === lang) return;
    if (changingLang) return;

    setChangingLang(true);
    const ok = await changeLang(newLang);
    setChangingLang(false);

    if (!ok) {
      showDialog(
        "error",
        t("settings_error_title"),
        t("settings_lang_change_failed")
      );
    } else {
      showDialog(
        "success",
        t("settings_success_title"),
        newLang === "en"
          ? t("settings_lang_set_en")
          : t("settings_lang_set_zh")
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader titleKey="me_settings" showBack onBack={handleBack} />

      <View style={styles.content}>
        <DetailSectionCard title={t("settings_title")}>
          {/* Notifications */}
          <View style={[styles.row, styles.rowWithBorder]}>
            <View style={styles.leftBlock}>
              <Text style={styles.rowTitle}>
                {t("settings_notifications")}
              </Text>
              <Text style={styles.rowSubtitle}>
                {t("settings_notifications_desc")}
              </Text>
            </View>
            <Switch value={dummyValue} onValueChange={() => {}} />
          </View>

          {/* Dark mode */}
          {/* <View style={[styles.row, styles.rowWithBorder]}>
            <View style={styles.leftBlock}>
              <Text style={styles.rowTitle}>
                {t("settings_dark_mode")}
              </Text>
              <Text style={styles.rowSubtitle}>
                {t("settings_dark_mode_desc")}
              </Text>
            </View>
            <Switch value={dummyValue} onValueChange={() => {}} />
          </View> */}

          {/* Language */}
          <View style={styles.row}>
            <View style={styles.leftBlock}>
              <Text style={styles.rowTitle}>
                {t("settings_language")}
              </Text>
              <Text style={styles.rowSubtitle}>
                {t("settings_language_desc")}
              </Text>
            </View>

            <View style={styles.langRight}>
              {changingLang ? (
                <ActivityIndicator size="small" color={ORANGE} />
              ) : (
                <View style={styles.langPills}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onSelectLang("en")}
                    style={[
                      styles.langPill,
                      lang === "en" && styles.langPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langPillText,
                        lang === "en" && styles.langPillTextActive,
                      ]}
                    >
                      EN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onSelectLang("zh")}
                    style={[
                      styles.langPill,
                      lang === "zh" && styles.langPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langPillText,
                        lang === "zh" && styles.langPillTextActive,
                      ]}
                    >
                      中
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </DetailSectionCard>
      </View>

      <MobileAlertDialog dialog={dialog as any} onClose={closeDialog} />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  leftBlock: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#111827",
  },
  rowSubtitle: {
    fontSize: 11,
    fontFamily: "Karla-Regular",
    color: "#6b7280",
    marginTop: 2,
  },

  langRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  langPills: {
    flexDirection: "row",
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  langPillActive: {
    borderColor: ORANGE,
    backgroundColor: "#fff7ed",
  },
  langPillText: {
    fontSize: 12,
    fontFamily: "Karla-Bold",
    color: "#6b7280",
  },
  langPillTextActive: {
    color: ORANGE,
  },
});
