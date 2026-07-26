import { redirect } from "next/navigation";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getChatGPTUser();
  if (user) redirect("/dashboard");

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/">
        kova<span>.</span>
      </a>
      <section className="auth-card" data-reveal>
        <div className="auth-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            Захищена реєстрація
          </div>
          <h1>Твоя робота. Твій простір.</h1>
          <p>
            Створи профіль за хвилину. На наступному кроці можна продовжити
            через Google або увійти звичайним email.
          </p>
          <ul>
            <li>
              <span>✓</span> Не зберігаємо твої паролі
            </li>
            <li>
              <span>✓</span> Дані кожного користувача ізольовані
            </li>
            <li>
              <span>✓</span> Перший вхід автоматично створює профіль
            </li>
          </ul>
        </div>
        <div className="auth-action">
          <div className="auth-orbit" aria-hidden="true">
            <span className="orbit-dot orbit-one" />
            <span className="orbit-dot orbit-two" />
            <b>k.</b>
          </div>
          <h2>Почнемо?</h2>
          <p>Обери Google або email на захищеному екрані входу.</p>
          <a className="button auth-button" href={chatGPTSignInPath("/dashboard")}>
            Створити акаунт / увійти <span>→</span>
          </a>
          <small>
            Продовжуючи, ти погоджуєшся використовувати Kova для власних
            робочих даних.
          </small>
        </div>
      </section>
      <a className="auth-back" href="/">
        ← Повернутися на головну
      </a>
    </main>
  );
}
