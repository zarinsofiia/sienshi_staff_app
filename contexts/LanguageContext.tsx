// contexts/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en, { EnTranslationKey } from "../locales/en";
import zh from "../locales/zh";
import { API_BASE_URL } from "../config/api";
import { authedFetch } from "../config/mobileApiClient";

type Language = "en" | "zh";

const translations = { en, zh };

type TranslationKey = EnTranslationKey;

type LanguageContextValue = {
  lang: Language;
  // local-only setter (no API)
  setLang: (lang: Language) => void;
  // use this when user explicitly changes language from Settings (calls API + persist)
  changeLang: (lang: Language) => Promise<boolean>;
  t: (key: TranslationKey) => string;
  langReady: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const LANG_STORAGE_KEY = "appLang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [langReady, setLangReady] = useState(false);

  // Load saved language on app start
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (saved === "en" || saved === "zh") {
          setLangState(saved);
        }
      } catch (e) {
        console.log("[LanguageContext] load saved lang failed:", e);
      } finally {
        setLangReady(true);
      }
    })();
  }, []);

  // local-only setter (used by login toggle etc)
  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem(LANG_STORAGE_KEY, newLang).catch((e) =>
      console.log("[LanguageContext] save lang failed:", e)
    );
  }, []);

  // Settings uses this: persist + call API
  const changeLang = useCallback(
    async (newLang: Language) => {
      // update UI immediately (optimistic)
      const prev = lang;
      setLang(newLang);

      try {
        const res = await authedFetch(
          `${API_BASE_URL}/api/settings/changeLang`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang: newLang }),
          }
        );

        if (!res.ok) {
          console.log("[changeLang] failed status:", res.status);
          // revert if backend rejects
          setLang(prev);
          return false;
        }

        return true;
      } catch (e) {
        console.log("[changeLang] error:", e);
        setLang(prev);
        return false;
      }
    },
    [lang, setLang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      changeLang,
      langReady,
      t: (key: TranslationKey) =>
        translations[lang][key] ?? translations.en[key] ?? key,
    }),
    [lang, setLang, changeLang, langReady]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
