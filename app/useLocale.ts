"use client";

import { useEffect, useState } from "react";

export type Locale = "uk" | "sk" | "en";

export const LANGUAGE_NAMES: Record<Locale, string> = {
  uk: "Українська",
  sk: "Slovenčina",
  en: "English",
};

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("uk");

  useEffect(() => {
    const saved = window.localStorage.getItem("kova-locale");
    if (saved === "uk" || saved === "sk" || saved === "en") {
      setLocaleState(saved);
      return;
    }

    const browserLocale = window.navigator.language.toLowerCase();
    if (browserLocale.startsWith("sk")) setLocaleState("sk");
    else if (browserLocale.startsWith("en")) setLocaleState("en");
  }, []);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem("kova-locale", nextLocale);
    document.documentElement.lang = nextLocale;
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return { locale, setLocale };
}
