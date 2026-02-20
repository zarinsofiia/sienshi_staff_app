// app/(tabs)/me/change-password.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../../components/AppHeader";
import { DetailSectionCard } from "../../../components/card/DetailSectionCard";

const ORANGE = "#f59e0b";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { backTo } = useLocalSearchParams<{ backTo?: string }>();

  const handleBack = () => {
    if (backTo) {
      router.replace(backTo as any);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader
        titleKey="me_change_password"
        showBack
        onBack={handleBack}
      />

      <View style={styles.content}>
        <DetailSectionCard title="Change Password">
          {/* Current password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* New password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Confirm new password */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>
        </DetailSectionCard>
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
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#4b5563",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "Karla-Regular",
    backgroundColor: "#f9fafb",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontFamily: "Karla-Bold",
    color: "#ffffff",
  },
});
