"use client";

import { LanguageTabs } from "../LanguageTabs";
import { useLocale } from "../useLocale";
import { AuthForm } from "./AuthForm";

const COPY = {
  uk: {
    eyebrow: "Твій акаунт Kova",
    title: "Твоя робота. Твій простір.",
    intro: "Реєструйся через email або продовжуй через Google чи ChatGPT — вибір за тобою.",
    benefits: [
      "Паролі зберігаються тільки у захищеному вигляді",
      "Email підтверджується одноразовим кодом",
      "Дані кожного користувача ізольовані",
      "Одна сесія працює до 30 днів",
    ],
    back: "Повернутися на головну",
  },
  sk: {
    eyebrow: "Tvoj účet Kova",
    title: "Tvoja práca. Tvoj priestor.",
    intro: "Zaregistruj sa e-mailom alebo pokračuj cez Google či ChatGPT — voľba je na tebe.",
    benefits: [
      "Heslá sa ukladajú iba v zabezpečenej podobe",
      "E-mail sa overuje jednorazovým kódom",
      "Údaje každého používateľa sú oddelené",
      "Jedna relácia funguje až 30 dní",
    ],
    back: "Späť na domovskú stránku",
  },
  en: {
    eyebrow: "Your Kova account",
    title: "Your work. Your space.",
    intro: "Register with email or continue with Google or ChatGPT — the choice is yours.",
    benefits: [
      "Passwords are stored only in a protected form",
      "Email is verified with a one-time code",
      "Every user’s data is isolated",
      "A session stays active for up to 30 days",
    ],
    back: "Back to the home page",
  },
} as const;

export function LoginClient({
  returnTo,
  chatGPTHref,
  googleClientId,
}: {
  returnTo: string;
  chatGPTHref: string;
  googleClientId: string;
}) {
  const { locale, setLocale } = useLocale();
  const t = COPY[locale];

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/">kova<span>.</span></a>
      <LanguageTabs locale={locale} onChange={setLocale} className="auth-locale-tabs" />
      <section className="auth-card" data-reveal>
        <div className="auth-copy">
          <div className="eyebrow"><span className="status-dot" />{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <ul>
            {t.benefits.map((benefit) => (
              <li key={benefit}><span>✓</span>{benefit}</li>
            ))}
          </ul>
        </div>
        <AuthForm
          returnTo={returnTo}
          chatGPTHref={chatGPTHref}
          googleClientId={googleClientId}
          locale={locale}
        />
      </section>
      <a className="auth-back" href="/">← {t.back}</a>
    </main>
  );
}
