"use client";

import { useState } from "react";

type Mode = "login" | "register";

export function AuthForm({
  returnTo,
  chatGPTHref,
}: {
  returnTo: string;
  chatGPTHref: string;
}) {
  const [mode, setMode] = useState<Mode>("register");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
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
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Не вдалося продовжити");
      }
      window.location.assign(returnTo);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Сталася помилка",
      );
      setSubmitting(false);
    }
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
