// hooks/registerPush.ts
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function registerPushTokens() {
  if (!Device.isDevice) {
    console.log("[push] Must use a physical device");
    return null;
  }

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  // Permissions
  const p = await Notifications.getPermissionsAsync();
  let status = p.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    console.log("[push] Permission not granted");
    return null;
  }

  // ✅ 1) DEVICE TOKEN FIRST (Android = FCM token) — what Firebase Console needs
  let devicePushTokenType: string | undefined;
  let devicePushToken: string | undefined;

  try {
    const dt = await Notifications.getDevicePushTokenAsync();
    devicePushToken = dt.data;
    devicePushTokenType = Platform.OS === "android" ? "fcm" : dt.type; // normalize
  } catch (e) {
    console.log("[push] Failed to get device token:", e);
  }

  // ✅ 2) EXPO TOKEN OPTIONAL (can fail due to network, don’t crash)
  // let expoPushToken: string | undefined;
  // try {
  //   const projectId =
  //     Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  //   if (projectId) {
  //     expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  //   } else {
  //     console.log("[push] Missing EAS projectId, skip expo token");
  //   }
  // } catch (e) {
  //   console.log("[push] Expo token fetch failed (safe to ignore):", e);
  // }

  return {
    // expoPushToken,
    devicePushTokenType,
    devicePushToken,
    platform: Platform.OS,
  };
}
