"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  isLocale,
  LANG_COOKIE,
  type Locale,
  type MessageKey,
} from "./dictionaries";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  tError: (message?: string | null, fallback?: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? "" : String(vars[name])
  );
}

function persistLocale(locale: Locale) {
  localStorage.setItem(LANG_COOKIE, locale);
  document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_COOKIE);
    if (isLocale(stored)) {
      if (stored !== locale) setLocaleState(stored);
      return;
    }
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("ka") && locale !== "ka") setLocaleState("ka");
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback<Translate>(
    (key, vars) =>
      interpolate(dictionaries[locale][key] ?? dictionaries.en[key] ?? key, vars),
    [locale]
  );

  const tError = useCallback(
    (message?: string | null, fallback?: MessageKey) => {
      if (message) {
        const key = `error.${message}` as MessageKey;
        if (key in dictionaries.en) return t(key);
      }
      if (fallback) return t(fallback);
      return message || "";
    },
    [t]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tError }),
    [locale, setLocale, t, tError]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
