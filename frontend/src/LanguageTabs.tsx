import { LANGUAGE_NAMES, type Locale } from "./i18n";

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
    <div className={`locale-tabs ${className}`.trim()} role="group" aria-label="Language">
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
