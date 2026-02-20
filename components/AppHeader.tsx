// components/AppHeader.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../contexts/LanguageContext";

type AppHeaderProps = {
  title?: string;
  titleKey?: string;
  showBack?: boolean;

  // ✅ optional left logo (shown when showBack = false)
  leftLogo?: ImageSourcePropType;
  onLogoPress?: () => void;

  // notification
  showNotification?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;

  backTo?: string;
  onBack?: () => void;
};

export function AppHeader({
  title,
  titleKey,
  showBack = false,

  leftLogo,
  onLogoPress,

  showNotification = false,
  notificationCount = 0,
  onNotificationPress,

  backTo,
  onBack,
}: AppHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const rawTitle = titleKey ? (t(titleKey as any) as string) : title ?? "";
  const upperTitle = rawTitle.toUpperCase();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backTo) router.replace(backTo as any);
    else router.replace("/dashboard");
  };

  const handleNotification = () => {
    if (onNotificationPress) onNotificationPress();
    else router.push("/notifications" as any);
  };

  const count = Number.isFinite(notificationCount) ? notificationCount : 0;
  const showBadge = showNotification && count > 0;
  const badgeText = count > 99 ? "99+" : String(count);

  return (
    <View style={styles.container}>
      {/* LEFT */}
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back-sharp" size={22} color="#E89923" />
          </TouchableOpacity>
        ) : leftLogo ? (
          <TouchableOpacity
            onPress={onLogoPress}
            activeOpacity={onLogoPress ? 0.8 : 1}
            disabled={!onLogoPress}
            style={styles.logoBtn}
          >
            <Image source={leftLogo} style={styles.logo} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        <Text style={styles.title}>{upperTitle}</Text>
      </View>

      {/* RIGHT */}
      <View style={[styles.side, styles.rightSide]}>
        {showNotification ? (
          <TouchableOpacity onPress={handleNotification} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#E89923" />
            {showBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {badgeText}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const SIDE_W = 72;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    width: SIDE_W, // ✅ keep left/right same width so title stays centered
    justifyContent: "center",
    alignItems: "flex-start",
  },
  rightSide: {
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 4,
    position: "relative",
  },

  logoBtn: {
    paddingVertical: 2,
    paddingRight: 6,
  },
  logo: {
    height: 50,
    width: 80,
    resizeMode: "contain",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Karla-ExtraBold",
    color: "#E89923",
    textAlign: "center",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: "Karla-ExtraBold",
    color: "#ffffff",
  },
});

export default AppHeader;
