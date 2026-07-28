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
    const saved = localStorage.getItem("kova-locale");
    if (saved === "uk" || saved === "sk" || saved === "en") setLocaleState(saved);
    else if (navigator.language.toLowerCase().startsWith("sk")) setLocaleState("sk");
    else if (navigator.language.toLowerCase().startsWith("en")) setLocaleState("en");
  }, []);
  function setLocale(value: Locale) {
    setLocaleState(value);
    localStorage.setItem("kova-locale", value);
    document.documentElement.lang = value;
  }
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return { locale, setLocale };
}
