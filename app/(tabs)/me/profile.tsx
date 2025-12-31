// app/(tabs)/me/profile.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppHeader } from "../../../components/AppHeader";
import { DetailSectionCard } from "../../../components/card/DetailSectionCard";

const ORANGE = "#f59e0b";

export default function ProfileScreen() {
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
      <AppHeader titleKey="me_profile" showBack onBack={handleBack} />

      <View style={styles.content}>
        <DetailSectionCard title="Profile Information">
          {/* Full name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              placeholder="Enter email"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="Enter phone"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
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
    fontSize: 11,
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
