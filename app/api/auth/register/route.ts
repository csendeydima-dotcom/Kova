import { eq } from "drizzle-orm";
import { createEmailSession } from "@/app/auth";
import {
  checkLoginRateLimit,
  hashPassword,
  recordFailedLogin,
  trustedMutationRequest,
  validatePassword,
} from "@/app/auth-password";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureSchema, ensureWorkspace } from "@/db/workspace";

export async function POST(request: Request) {
  if (!trustedMutationRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 60) {
      return Response.json(
        { error: "Вкажи ім’я від 2 до 60 символів" },
        { status: 400 },
      );
    }
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json({ error: "Перевір email" }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    const rateLimit = await checkLoginRateLimit(request, `register:${email}`);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Забагато спроб. Спробуй через 15 хвилин." },
        { status: 429 },
      );
    }

    await ensureSchema();
    const db = getDb();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      await recordFailedLogin(rateLimit.key);
      return Response.json(
        { error: "Акаунт із таким email уже існує" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ email, name, passwordHash });
    await ensureWorkspace(email, name);
    await createEmailSession(email);
    return Response.json({ user: { email, name } }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Не вдалося створити акаунт. Спробуй ще раз." },
      { status: 500 },
    );
  }
}
