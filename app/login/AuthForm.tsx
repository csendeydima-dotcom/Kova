"use client";

import { useEffect, useRef, useState } from "react";

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

export function AuthForm({
  returnTo,
  chatGPTHref,
  googleClientId,
}: {
  returnTo: string;
  chatGPTHref: string;
  googleClientId: string;
}) {
  const [mode, setMode] = useState<Mode>("register");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);

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
            setError("Google не повернув дані для входу.");
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
              throw new Error(result.error ?? "Не вдалося увійти через Google");
            }
            window.location.assign(returnTo);
          } catch (requestError) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Не вдалося увійти через Google",
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
        locale: "uk",
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
  }, [googleClientId, returnTo]);

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
        throw new Error(result.error ?? "Не вдалося продовжити");
      }
      if (result.verificationRequired && result.email) {
        setVerificationEmail(result.email);
        setSubmitting(false);
        return;
      }
      window.location.assign(returnTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Сталася помилка",
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
        throw new Error(result.error ?? "Не вдалося підтвердити email");
      }
      window.location.assign(returnTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Сталася помилка",
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
        <h2>Перевір пошту</h2>
        <p>
          Ми надіслали шестизначний код на <strong>{verificationEmail}</strong>.
          Код діє 10 хвилин.
        </p>
        <form className="auth-form" onSubmit={verifyEmail}>
          <div className="auth-field">
            <label htmlFor="verification-code">Код підтвердження</label>
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
            {submitting ? "Перевіряємо…" : "Підтвердити email"}
          </button>
          <button
            className="verification-back"
            type="button"
            onClick={() => {
              setVerificationEmail("");
              setError("");
            }}
          >
            ← Змінити дані
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-action">
      <div className="auth-tabs" role="tablist" aria-label="Вхід або реєстрація">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "active" : ""}
          onClick={() => switchMode("register")}
        >
          Реєстрація
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : ""}
          onClick={() => switchMode("login")}
        >
          Вхід
        </button>
      </div>

      <h2>{mode === "register" ? "Створи акаунт" : "З поверненням"}</h2>
      <p>
        {mode === "register"
          ? "Збережемо твої проєкти в особистому просторі."
          : "Увійди за допомогою email і пароля."}
      </p>

      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && (
          <div className="auth-field">
            <label htmlFor="auth-name">Ім’я</label>
            <input
              id="auth-name"
              name="name"
              minLength={2}
              maxLength={60}
              autoComplete="name"
              required
              placeholder="Діма"
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
          <label htmlFor="auth-password">Пароль</label>
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
                mode === "register" ? "Мінімум 10 символів" : "Твій пароль"
              }
            />
            <button
              type="button"
              aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Сховати" : "Показати"}
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
            ? "Зачекай…"
            : mode === "register"
              ? "Створити акаунт"
              : "Увійти"}
        </button>
      </form>

      <div className="auth-divider">
        <span>або</span>
      </div>
      {googleClientId && (
        <div
          className="google-button"
          ref={googleButton}
          aria-label="Продовжити через Google"
        />
      )}
      <a className="chatgpt-button" href={chatGPTHref}>
        <b aria-hidden="true">◉</b>
        Продовжити через ChatGPT
      </a>
      <small>
        Реєструючись, ти погоджуєшся з безпечним зберіганням робочих даних.
      </small>
    </div>
  );
}
