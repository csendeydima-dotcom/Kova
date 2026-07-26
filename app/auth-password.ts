import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { authAttempts } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";

// Cloudflare Workers currently caps Web Crypto PBKDF2 at 100,000 iterations.
const PASSWORD_ITERATIONS = 100_000;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS = 5;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  const saltBuffer = salt.slice().buffer as ArrayBuffer;
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations,
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(first: Uint8Array, second: Uint8Array) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }
  return difference === 0;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return [
    "pbkdf2_sha256",
    PASSWORD_ITERATIONS,
    toBase64Url(salt),
    toBase64Url(hash),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, rawIterations, rawSalt, rawHash] = storedHash.split("$");
  const iterations = Number(rawIterations);
  if (
    algorithm !== "pbkdf2_sha256" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    iterations > PASSWORD_ITERATIONS ||
    !rawSalt ||
    !rawHash
  ) {
    return false;
  }

  try {
    const actual = await derivePassword(
      password,
      fromBase64Url(rawSalt),
      iterations,
    );
    return constantTimeEqual(actual, fromBase64Url(rawHash));
  } catch {
    return false;
  }
}

export async function runDummyPasswordCheck(password: string) {
  const salt = new TextEncoder().encode("kova-auth-padding");
  await derivePassword(password, salt, PASSWORD_ITERATIONS);
}

export function validatePassword(password: string) {
  if (password.length < 10) return "Пароль має містити щонайменше 10 символів";
  if (password.length > 128) return "Пароль занадто довгий";
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    return "Додай до пароля хоча б одну літеру та одну цифру";
  }
  return null;
}

export function trustedMutationRequest(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function attemptKey(request: Request, email: string) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const input = new TextEncoder().encode(`${ip}|${email.toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return toBase64Url(new Uint8Array(digest));
}

export async function checkLoginRateLimit(request: Request, email: string) {
  await ensureSchema();
  const key = await attemptKey(request, email);
  const now = Math.floor(Date.now() / 1000);
  const db = getDb();
  const [record] = await db
    .select()
    .from(authAttempts)
    .where(
      and(eq(authAttempts.key, key), gt(authAttempts.lockedUntil, now)),
    )
    .limit(1);
  return { allowed: !record, key, retryAfter: record?.lockedUntil ?? 0 };
}

export async function recordFailedLogin(key: string) {
  const now = Math.floor(Date.now() / 1000);
  const db = getDb();
  const [record] = await db
    .select()
    .from(authAttempts)
    .where(eq(authAttempts.key, key))
    .limit(1);

  const sameWindow =
    record && now - record.windowStartedAt < LOGIN_WINDOW_SECONDS;
  const attempts = sameWindow ? record.attempts + 1 : 1;
  const lockedUntil =
    attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_WINDOW_SECONDS : 0;

  await db
    .insert(authAttempts)
    .values({
      key,
      attempts,
      windowStartedAt: sameWindow ? record.windowStartedAt : now,
      lockedUntil,
    })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        attempts,
        windowStartedAt: sameWindow ? record.windowStartedAt : now,
        lockedUntil,
      },
    });
}

export async function clearLoginAttempts(key: string) {
  const db = getDb();
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}
