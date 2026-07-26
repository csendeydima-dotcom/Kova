"use client";

import { LANGUAGE_NAMES, type Locale } from "./useLocale";

export function LanguageTabs({
  locale,
  onChange,
  className = "",
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  className?: string;
}) {
  return (
    <div
      className={`locale-tabs ${className}`.trim()}
      role="group"
      aria-label={locale === "sk" ? "Výber jazyka" : locale === "en" ? "Language selection" : "Вибір мови"}
    >
      {(["uk", "sk", "en"] as const).map((code) => (
        <button
          type="button"
          className={locale === code ? "active" : ""}
          aria-pressed={locale === code}
          aria-label={LANGUAGE_NAMES[code]}
          title={LANGUAGE_NAMES[code]}
          onClick={() => onChange(code)}
          key={code}
        >
          {code === "uk" ? "UA" : code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
