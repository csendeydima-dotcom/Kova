"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../useLocale";

type Mode = "login" | "register";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize(options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      context: "signin";
      ux_mode: "popup";
    }): void;
    renderButton(
      parent: HTMLElement,
      options: {
        type: "standard";
        shape: "pill";
        theme: "outline";
        text: "continue_with";
        size: "large";
        width: number;
        locale: string;
      },
    ): void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const COPY = {
  uk: {
    googleMissing: "Google не повернув дані для входу.",
    googleError: "Не вдалося увійти через Google",
    continueError: "Не вдалося продовжити",
    genericError: "Сталася помилка",
    verifyError: "Не вдалося підтвердити email",
    checkMail: "Перевір пошту",
    codeSent: "Ми надіслали шестизначний код на",
    codeValid: "Код діє 10 хвилин.",
    verificationCode: "Код підтвердження",
    checking: "Перевіряємо…",
    verifyEmail: "Підтвердити email",
    changeData: "Змінити дані",
    tabsLabel: "Вхід або реєстрація",
    register: "Реєстрація",
    login: "Вхід",
    createTitle: "Створи акаунт",
    welcome: "З поверненням",
    createIntro: "Збережемо твої проєкти в особистому просторі.",
    loginIntro: "Увійди за допомогою email і пароля.",
    name: "Ім’я",
    namePlaceholder: "Діма",
    password: "Пароль",
    newPassword: "Мінімум 10 символів",
    yourPassword: "Твій пароль",
    hidePassword: "Сховати пароль",
    showPassword: "Показати пароль",
    wait: "Зачекай…",
    createAccount: "Створити акаунт",
    signIn: "Увійти",
    or: "або",
    google: "Продовжити через Google",
    chatgpt: "Продовжити через ChatGPT",
    agreement: "Реєструючись, ти погоджуєшся з безпечним зберіганням робочих даних.",
  },
  sk: {
    googleMissing: "Google neposkytol prihlasovacie údaje.",
    googleError: "Prihlásenie cez Google sa nepodarilo",
    continueError: "Nepodarilo sa pokračovať",
    genericError: "Vyskytla sa chyba",
    verifyError: "E-mail sa nepodarilo overiť",
    checkMail: "Skontroluj si e-mail",
    codeSent: "Šesťmiestny kód sme poslali na",
    codeValid: "Kód platí 10 minút.",
    verificationCode: "Overovací kód",
    checking: "Overujem…",
    verifyEmail: "Overiť e-mail",
    changeData: "Zmeniť údaje",
    tabsLabel: "Prihlásenie alebo registrácia",
    register: "Registrácia",
    login: "Prihlásenie",
    createTitle: "Vytvor si účet",
    welcome: "Vitaj späť",
    createIntro: "Tvoje projekty uložíme v osobnom pracovnom priestore.",
    loginIntro: "Prihlás sa pomocou e-mailu a hesla.",
    name: "Meno",
    namePlaceholder: "Dima",
    password: "Heslo",
    newPassword: "Minimálne 10 znakov",
    yourPassword: "Tvoje heslo",
    hidePassword: "Skryť heslo",
    showPassword: "Zobraziť heslo",
    wait: "Počkaj…",
    createAccount: "Vytvoriť účet",
    signIn: "Prihlásiť sa",
    or: "alebo",
    google: "Pokračovať cez Google",
    chatgpt: "Pokračovať cez ChatGPT",
    agreement: "Registráciou súhlasíš s bezpečným uložením pracovných údajov.",
  },
  en: {
    googleMissing: "Google did not return sign-in details.",
    googleError: "Could not sign in with Google",
    continueError: "Could not continue",
    genericError: "Something went wrong",
    verifyError: "Could not verify your email",
    checkMail: "Check your email",
    codeSent: "We sent a six-digit code to",
    codeValid: "The code is valid for 10 minutes.",
    verificationCode: "Verification code",
    checking: "Checking…",
    verifyEmail: "Verify email",
    changeData: "Change details",
    tabsLabel: "Sign in or register",
    register: "Register",
    login: "Sign in",
    createTitle: "Create your account",
    welcome: "Welcome back",
    createIntro: "We’ll keep your projects in your personal workspace.",
    loginIntro: "Sign in with your email and password.",
    name: "Name",
    namePlaceholder: "Dima",
    password: "Password",
    newPassword: "At least 10 characters",
    yourPassword: "Your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    wait: "Please wait…",
    createAccount: "Create account",
    signIn: "Sign in",
    or: "or",
    google: "Continue with Google",
    chatgpt: "Continue with ChatGPT",
    agreement: "By registering, you agree to the secure storage of your work data.",
  },
} as const;

export function AuthForm({
  returnTo,
  chatGPTHref,
  googleClientId,
  locale,
}: {
  returnTo: string;
  chatGPTHref: string;
  googleClientId: string;
  locale: Locale;
}) {
  const [mode, setMode] = useState<Mode>("register");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);
  const t = COPY[locale];

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !googleButton.current || !window.google) return;
      googleButton.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        context: "signin",
        ux_mode: "popup",
        callback: async ({ credential }) => {
          if (!credential) {
            setError(t.googleMissing);
            return;
          }
          setSubmitting(true);
          setError("");
          try {
            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const result = (await response.json()) as { error?: string };
            if (!response.ok) {
              throw new Error(result.error ?? t.googleError);
            }
            window.location.assign(returnTo);
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : t.googleError,
            );
            setSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        text: "continue_with",
        size: "large",
        width: Math.min(320, googleButton.current.clientWidth),
        locale: locale === "uk" ? "uk" : locale,
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      if (window.google) renderGoogleButton();
      else existing.addEventListener("load", renderGoogleButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.addEventListener("load", renderGoogleButton, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [googleClientId, returnTo, locale, t.googleError, t.googleMissing]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setVerificationEmail("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        error?: string;
        email?: string;
        verificationRequired?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.error ?? t.continueError);
      }
      if (result.verificationRequired && result.email) {
        setVerificationEmail(result.email);
        setSubmitting(false);
        return;
      }
      window.location.assign(returnTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t.genericError,
      );
      setSubmitting(false);
    }
  }

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail,
          code: String(data.get("code") ?? ""),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? t.verifyError);
      }
      window.location.assign(returnTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t.genericError,
      );
      setSubmitting(false);
    }
  }

  if (verificationEmail) {
    return (
      <div className="auth-action verification-action">
        <div className="verification-mark" aria-hidden="true">
          ✦
        </div>
        <h2>{t.checkMail}</h2>
        <p>
          {t.codeSent} <strong>{verificationEmail}</strong>. {t.codeValid}
        </p>
        <form className="auth-form" onSubmit={verifyEmail}>
          <div className="auth-field">
            <label htmlFor="verification-code">{t.verificationCode}</label>
            <input
              className="verification-code"
              id="verification-code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder="000000"
            />
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button auth-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? t.checking : t.verifyEmail}
          </button>
          <button
            className="verification-back"
            type="button"
            onClick={() => {
              setVerificationEmail("");
              setError("");
            }}
          >
            ← {t.changeData}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-action">
      <div className="auth-tabs" role="tablist" aria-label={t.tabsLabel}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "active" : ""}
          onClick={() => switchMode("register")}
        >
          {t.register}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : ""}
          onClick={() => switchMode("login")}
        >
          {t.login}
        </button>
      </div>

      <h2>{mode === "register" ? t.createTitle : t.welcome}</h2>
      <p>
        {mode === "register" ? t.createIntro : t.loginIntro}
      </p>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && (
          <div className="auth-field">
            <label htmlFor="auth-name">{t.name}</label>
            <input
              id="auth-name"
              name="name"
              minLength={2}
              maxLength={60}
              autoComplete="name"
              required
              placeholder={t.namePlaceholder}
            />
          </div>
        )}
        <div className="auth-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="auth-password">{t.password}</label>
          <div className="password-field">
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              minLength={mode === "register" ? 10 : 1}
              maxLength={128}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              placeholder={
                mode === "register" ? t.newPassword : t.yourPassword
              }
            />
            <button
              type="button"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? t.hidePassword : t.showPassword}
            </button>
          </div>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? t.wait
            : mode === "register"
              ? t.createAccount
              : t.signIn}
        </button>
      </form>

      <div className="auth-divider">
        <span>{t.or}</span>
      </div>
      {googleClientId && (
        <div
          className="google-button"
          ref={googleButton}
          aria-label={t.google}
        />
      )}
      <a className="chatgpt-button" href={chatGPTHref}>
        <b aria-hidden="true">◉</b>
        {t.chatgpt}
      </a>
      <small>
        {t.agreement}
      </small>
    </div>
  );
}
