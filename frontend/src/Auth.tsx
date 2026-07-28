import { useEffect, useRef, useState } from "react";
import { api, type User } from "./api";
import { LanguageTabs } from "./LanguageTabs";
import { useLocale } from "./i18n";

type Mode = "register" | "login";
type GoogleCredentialResponse = { credential?: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            context: "signin";
            ux_mode: "popup";
          }): void;
          renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
        };
      };
    };
  }
}

const COPY = {
  uk: {
    badge: "Твій акаунт Kova", title: "Твоя робота. Твій простір.",
    intro: "Реєструйся через email або продовжуй через Google.",
    benefits: ["Захищене зберігання паролів", "Підтвердження email кодом", "Ізоляція даних користувачів", "Сесія до 30 днів"],
    register: "Реєстрація", login: "Вхід", create: "Створи акаунт", welcome: "З поверненням",
    createText: "Збережемо твої проєкти в особистому просторі.", loginText: "Увійди за допомогою email і пароля.",
    name: "Ім’я", password: "Пароль", minPassword: "Мінімум 10 символів", yourPassword: "Твій пароль",
    show: "Показати", hide: "Сховати", createButton: "Створити акаунт", loginButton: "Увійти",
    wait: "Зачекай…", or: "або", google: "Продовжити через Google", terms: "Реєструючись, ти погоджуєшся з безпечним зберіганням даних.",
    check: "Перевір пошту", sent: "Ми надіслали шестизначний код на", valid: "Код діє 10 хвилин.",
    code: "Код підтвердження", verify: "Підтвердити email", checking: "Перевіряємо…", change: "Змінити дані", back: "Повернутися на головну",
  },
  sk: {
    badge: "Tvoj účet Kova", title: "Tvoja práca. Tvoj priestor.",
    intro: "Zaregistruj sa e-mailom alebo pokračuj cez Google.",
    benefits: ["Bezpečné ukladanie hesiel", "Overenie e-mailu kódom", "Oddelené používateľské údaje", "Relácia až 30 dní"],
    register: "Registrácia", login: "Prihlásenie", create: "Vytvor si účet", welcome: "Vitaj späť",
    createText: "Tvoje projekty uložíme v osobnom priestore.", loginText: "Prihlás sa e-mailom a heslom.",
    name: "Meno", password: "Heslo", minPassword: "Minimálne 10 znakov", yourPassword: "Tvoje heslo",
    show: "Zobraziť", hide: "Skryť", createButton: "Vytvoriť účet", loginButton: "Prihlásiť sa",
    wait: "Počkaj…", or: "alebo", google: "Pokračovať cez Google", terms: "Registráciou súhlasíš s bezpečným uložením údajov.",
    check: "Skontroluj e-mail", sent: "Šesťmiestny kód sme poslali na", valid: "Kód platí 10 minút.",
    code: "Overovací kód", verify: "Overiť e-mail", checking: "Overujem…", change: "Zmeniť údaje", back: "Späť na domovskú stránku",
  },
  en: {
    badge: "Your Kova account", title: "Your work. Your space.",
    intro: "Register with email or continue with Google.",
    benefits: ["Secure password storage", "Email verification code", "Isolated user data", "Sessions up to 30 days"],
    register: "Register", login: "Sign in", create: "Create your account", welcome: "Welcome back",
    createText: "We’ll keep your projects in your personal workspace.", loginText: "Sign in with your email and password.",
    name: "Name", password: "Password", minPassword: "At least 10 characters", yourPassword: "Your password",
    show: "Show", hide: "Hide", createButton: "Create account", loginButton: "Sign in",
    wait: "Please wait…", or: "or", google: "Continue with Google", terms: "By registering, you agree to secure storage of your data.",
    check: "Check your email", sent: "We sent a six-digit code to", valid: "The code is valid for 10 minutes.",
    code: "Verification code", verify: "Verify email", checking: "Checking…", change: "Change details", back: "Back to the home page",
  },
} as const;

export function Auth({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const { locale, setLocale } = useLocale();
  const t = COPY[locale];
  const [mode, setMode] = useState<Mode>("register");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ googleClientId: string }>("/api/auth/config")
      .then((value) => setGoogleClientId(value.googleClientId))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !googleButton.current || !window.google) return;
      googleButton.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        context: "signin",
        ux_mode: "popup",
        callback: async ({ credential }) => {
          if (!credential) return setError("Google did not return a credential.");
          setSubmitting(true);
          try {
            const result = await api<{ user: User }>("/api/auth/google", {
              method: "POST", body: JSON.stringify({ credential }),
            });
            onSignedIn(result.user);
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Google sign-in failed");
            setSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard", shape: "pill", theme: "outline", text: "continue_with",
        size: "large", width: Math.min(320, googleButton.current.clientWidth), locale,
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) window.google ? render() : existing.addEventListener("load", render, { once: true });
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [googleClientId, locale, onSignedIn]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ user?: User; verificationRequired?: boolean; email?: string }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      if (result.verificationRequired && result.email) setVerificationEmail(result.email);
      else if (result.user) onSignedIn(result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong");
    } finally { setSubmitting(false); }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: User }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: verificationEmail, code: String(data.get("code") || "") }),
      });
      onSignedIn(result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/">kova<span>.</span></a>
      <LanguageTabs locale={locale} onChange={setLocale} className="auth-locale-tabs" />
      <section className="auth-card">
        <div className="auth-copy">
          <div className="eyebrow"><span className="status-dot" />{t.badge}</div>
          <h1>{t.title}</h1><p>{t.intro}</p>
          <ul>{t.benefits.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
        </div>
        {verificationEmail ? (
          <div className="auth-action verification-action">
            <div className="verification-mark" aria-hidden="true">✦</div>
            <h2>{t.check}</h2><p>{t.sent} <strong>{verificationEmail}</strong>. {t.valid}</p>
            <form className="auth-form" onSubmit={verify}>
              <div className="auth-field"><label htmlFor="verification-code">{t.code}</label>
                <input className="verification-code" id="verification-code" name="code" inputMode="numeric"
                  pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" autoFocus required placeholder="000000" />
              </div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button auth-submit" disabled={submitting}>{submitting ? t.checking : t.verify}</button>
              <button className="verification-back" type="button" onClick={() => setVerificationEmail("")}>← {t.change}</button>
            </form>
          </div>
        ) : (
          <div className="auth-action">
            <div className="auth-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{t.register}</button>
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{t.login}</button>
            </div>
            <h2>{mode === "register" ? t.create : t.welcome}</h2>
            <p>{mode === "register" ? t.createText : t.loginText}</p>
            <form className="auth-form" onSubmit={submit}>
              {mode === "register" && <div className="auth-field"><label htmlFor="auth-name">{t.name}</label><input id="auth-name" name="name" minLength={2} maxLength={60} autoComplete="name" required placeholder="Dima" /></div>}
              <div className="auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" maxLength={254} autoComplete="email" required placeholder="you@example.com" /></div>
              <div className="auth-field"><label htmlFor="auth-password">{t.password}</label><div className="password-field">
                <input id="auth-password" name="password" type={showPassword ? "text" : "password"} minLength={mode === "register" ? 10 : 1} maxLength={128}
                  autoComplete={mode === "register" ? "new-password" : "current-password"} required placeholder={mode === "register" ? t.minPassword : t.yourPassword} />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? t.hide : t.show}</button>
              </div></div>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button auth-submit" disabled={submitting}>{submitting ? t.wait : mode === "register" ? t.createButton : t.loginButton}</button>
            </form>
            <div className="auth-divider"><span>{t.or}</span></div>
            {googleClientId && <div className="google-button" ref={googleButton} aria-label={t.google} />}
            <small>{t.terms}</small>
          </div>
        )}
      </section>
      <a className="auth-back" href="/">← {t.back}</a>
    </main>
  );
}
