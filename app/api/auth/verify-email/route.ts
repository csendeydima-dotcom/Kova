import { eq } from "drizzle-orm";
import { createEmailSession } from "@/app/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLogin,
  trustedMutationRequest,
} from "@/app/auth-password";
import {
  hashVerificationCode,
  verificationHashesMatch,
} from "@/app/email-verification";
import { getDb } from "@/db";
import { emailVerifications, users } from "@/db/schema";
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
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code =
      typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(code)
    ) {
      return Response.json(
        { error: "Введи шестизначний код із листа" },
        { status: 400 },
      );
    }

    const rateLimit = await checkLoginRateLimit(request, `verify:${email}`);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Забагато спроб. Спробуй через 15 хвилин." },
        { status: 429 },
      );
    }

    await ensureSchema();
    const db = getDb();
    const [pending] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .limit(1);
    const now = Math.floor(Date.now() / 1000);
    if (!pending || pending.expiresAt <= now || pending.attempts >= 5) {
      if (pending) {
        await db
          .delete(emailVerifications)
          .where(eq(emailVerifications.email, email));
      }
      await recordFailedLogin(rateLimit.key);
      return Response.json(
        { error: "Код прострочений. Почни реєстрацію ще раз." },
        { status: 400 },
      );
    }

    const actualHash = await hashVerificationCode(email, code);
    if (!verificationHashesMatch(actualHash, pending.codeHash)) {
      await db
        .update(emailVerifications)
        .set({ attempts: pending.attempts + 1 })
        .where(eq(emailVerifications.email, email));
      await recordFailedLogin(rateLimit.key);
      return Response.json(
        { error: "Неправильний код. Перевір лист і спробуй ще раз." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      await db
        .update(users)
        .set({ name: pending.name, passwordHash: pending.passwordHash })
        .where(eq(users.email, email));
    } else {
      await db.insert(users).values({
        email,
        name: pending.name,
        passwordHash: pending.passwordHash,
      });
    }

    await ensureWorkspace(email, pending.name);
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.email, email));
    await clearLoginAttempts(rateLimit.key);
    await createEmailSession(email);
    return Response.json({ user: { email, name: pending.name } });
  } catch (error) {
    console.error(
      "Email verification failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "Не вдалося підтвердити email. Спробуй ще раз." },
      { status: 500 },
    );
  }
}
