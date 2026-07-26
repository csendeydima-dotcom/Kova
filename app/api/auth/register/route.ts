import { eq } from "drizzle-orm";
import {
  checkLoginRateLimit,
  hashPassword,
  recordFailedLogin,
  trustedMutationRequest,
  validatePassword,
} from "@/app/auth-password";
import {
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
} from "@/app/email-verification";
import { getDb } from "@/db";
import { emailVerifications, users } from "@/db/schema";
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
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing?.passwordHash) {
      await recordFailedLogin(rateLimit.key);
      return Response.json(
        { error: "Акаунт із таким email уже існує" },
        { status: 409 },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const [pending] = await db
      .select({ lastSentAt: emailVerifications.lastSentAt })
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .limit(1);
    if (pending && now - pending.lastSentAt < 60) {
      return Response.json(
        { error: "Новий код можна надіслати через хвилину" },
        { status: 429 },
      );
    }

    const passwordHash = await hashPassword(password);
    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(email, code);
    await db
      .insert(emailVerifications)
      .values({
        email,
        name,
        passwordHash,
        codeHash,
        expiresAt: now + 10 * 60,
        attempts: 0,
        lastSentAt: now,
      })
      .onConflictDoUpdate({
        target: emailVerifications.email,
        set: {
          name,
          passwordHash,
          codeHash,
          expiresAt: now + 10 * 60,
          attempts: 0,
          lastSentAt: now,
        },
      });

    try {
      await sendVerificationCode(email, code);
    } catch (emailError) {
      await db
        .delete(emailVerifications)
        .where(eq(emailVerifications.email, email));
      throw emailError;
    }

    return Response.json(
      { verificationRequired: true, email },
      { status: 202 },
    );
  } catch (error) {
    console.error(
      "Registration failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "Не вдалося створити акаунт. Спробуй ще раз." },
      { status: 500 },
    );
  }
}
