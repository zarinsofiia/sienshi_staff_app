// config/mobileApiClient.ts
import { API_BASE_URL } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mobileLogout } from "./mobileLogout";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// 🔁 Call backend to get a new access token using refreshToken
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.log("[mobileRefresh] no refreshToken saved → logout");
    await mobileLogout();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/getnewaccesstoken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const text = await res.text().catch(() => "");
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.log(
        "[mobileRefresh] refresh failed:",
        res.status,
        text || data
      );

      // 🔻 if refresh token itself is invalid/expired, force logout
      if (res.status === 401 || res.status === 403) {
        console.log(
          "[mobileRefresh] invalid/expired refreshToken → mobileLogout"
        );
        await mobileLogout();
      }

      return null;
    }

    const newToken: string | undefined =
      data?.accessToken || data?.token;

    if (!newToken) {
      console.log(
        "[mobileRefresh] no accessToken in refresh response:",
        data
      );
      await mobileLogout();
      return null;
    }

    await AsyncStorage.setItem("authToken", newToken);
    console.log("[mobileRefresh] stored new authToken");

    return newToken;
  } catch (e) {
    console.log("[mobileRefresh] exception while refreshing:", e);
    // network/other error during refresh → safest is to logout
    await mobileLogout();
    return null;
  }
}

/**
 * authedFetch
 * - automatically attaches Authorization: Bearer <authToken>
 * - on 401/403 → tries refresh → retries once with new token
 * - returns a normal fetch Response
 */
export async function authedFetch(
  input: string,
  init: any = {}
): Promise<Response> {
  const url = input.startsWith("http")
    ? input
    : `${API_BASE_URL}${input}`;

  const token = await AsyncStorage.getItem("authToken");

  const originalHeaders: Record<string, string> = {
    ...(init.headers || {}),
  };

  // default Content-Type if not provided
  if (!originalHeaders["Content-Type"]) {
    originalHeaders["Content-Type"] = "application/json";
  }

  // attach access token if we have one
  if (token && !originalHeaders["Authorization"]) {
    originalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // 🔹 First try
  const firstResponse = await fetch(url, {
    ...init,
    headers: originalHeaders,
  });

  if (firstResponse.status !== 401 && firstResponse.status !== 403) {
    return firstResponse;
  }

  console.log(
    "[authedFetch] got",
    firstResponse.status,
    "→ trying refresh..."
  );

  // 🔁 Make sure only one refresh call happens at a time
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
    });
  }

  const newToken = await refreshPromise!;
  if (!newToken) {
    console.log("[authedFetch] refresh failed, returning original response");
    // refreshAccessToken may already have called mobileLogout()
    return firstResponse;
  }

  const retryHeaders: Record<string, string> = {
    ...originalHeaders,
    Authorization: `Bearer ${newToken}`,
  };

  console.log("[authedFetch] retrying request with new token");

  // 🔁 Retry once with new token
  return fetch(url, {
    ...init,
    headers: retryHeaders,
  });
}
