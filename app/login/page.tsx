import { redirect } from "next/navigation";
import {
  chatGPTSignInPath,
  getCurrentUser,
  safeRelativePath,
} from "../auth";
import { AuthForm } from "./AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const query = await searchParams;
  const returnTo = safeRelativePath(query.returnTo ?? "/dashboard");

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/">
        kova<span>.</span>
      </a>
      <section className="auth-card" data-reveal>
        <div className="auth-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            Твій акаунт Kova
          </div>
          <h1>Твоя робота. Твій простір.</h1>
          <p>
            Реєструйся звичайним email або продовжуй через ChatGPT — тепер вибір
            за тобою.
          </p>
          <ul>
            <li>
              <span>✓</span> Паролі зберігаються тільки у захищеному вигляді
            </li>
            <li>
              <span>✓</span> Дані кожного користувача ізольовані
            </li>
            <li>
              <span>✓</span> Одна сесія працює до 30 днів
            </li>
          </ul>
        </div>
        <AuthForm
          returnTo={returnTo}
          chatGPTHref={chatGPTSignInPath(returnTo)}
        />
      </section>
      <a className="auth-back" href="/">
        ← Повернутися на головну
      </a>
    </main>
  );
}
