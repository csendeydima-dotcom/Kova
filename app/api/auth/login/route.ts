import { eq } from "drizzle-orm";
import { createEmailSession } from "@/app/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLogin,
  runDummyPasswordCheck,
  trustedMutationRequest,
  verifyPassword,
} from "@/app/auth-password";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";

export async function POST(request: Request) {
  if (!trustedMutationRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length > 128) {
      return Response.json(
        { error: "Неправильний email або пароль" },
        { status: 400 },
      );
    }

    const rateLimit = await checkLoginRateLimit(request, email);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Забагато спроб. Спробуй через 15 хвилин." },
        { status: 429 },
      );
    }

    await ensureSchema();
    const [user] = await getDb()
      .select({
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const valid =
      user?.passwordHash &&
      (await verifyPassword(password, user.passwordHash));
    if (!user?.passwordHash) await runDummyPasswordCheck(password);
    if (!valid || !user) {
      await recordFailedLogin(rateLimit.key);
      return Response.json(
        { error: "Неправильний email або пароль" },
        { status: 401 },
      );
    }

    await clearLoginAttempts(rateLimit.key);
    await createEmailSession(user.email);
    return Response.json({ user: { email: user.email, name: user.name } });
  } catch {
    return Response.json(
      { error: "Не вдалося увійти. Спробуй ще раз." },
      { status: 500 },
    );
  }
}
