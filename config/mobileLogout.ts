// config/mobileLogout.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

/**
 * Clear all auth info and navigate back to login.
 */
export async function mobileLogout() {
  try {
    await AsyncStorage.multiRemove([
      "authToken",
      "refreshToken",
      "currentUser",
    ]);
    console.log("[mobileLogout] cleared authToken, refreshToken, currentUser");
  } catch (e) {
    console.log("[mobileLogout] failed to clear storage", e);
  }

  try {
    // expo-router: your login screen is app/login.tsx → path "/login"
    router.replace("/login");
  } catch (e) {
    console.log("[mobileLogout] navigation failed", e);
  }
}
