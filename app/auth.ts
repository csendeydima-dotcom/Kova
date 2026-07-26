import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";

export type KovaUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  provider: "email" | "chatgpt";
};

const SESSION_COOKIE = "kova_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";

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

async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toBase64Url(new Uint8Array(digest));
}

async function getEmailSessionUser(): Promise<KovaUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureSchema();
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await hashSessionToken(token);
  const db = getDb();
  const [match] = await db
    .select({ email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(sessions.userEmail, users.email))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)),
    )
    .limit(1);

  if (!match) return null;
  return {
    displayName: match.name,
    email: match.email,
    fullName: match.name,
    provider: "email",
  };
}

async function getChatGPTHeaderUser(): Promise<KovaUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!email) return null;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  return {
    displayName: fullName ?? email,
    email,
    fullName,
    provider: "chatgpt",
  };
}

export async function getCurrentUser() {
  return (await getEmailSessionUser()) ?? (await getChatGPTHeaderUser());
}

export async function requireCurrentUser(returnTo: string) {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(`/login?returnTo=${encodeURIComponent(safeRelativePath(returnTo))}`);
}

export async function createEmailSession(email: string) {
  await ensureSchema();
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hashSessionToken(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_SECONDS;
  const db = getDb();

  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  await db.insert(sessions).values({ tokenHash, userEmail: email, expiresAt });

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !host.startsWith("localhost"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroyEmailSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureSchema();
    const tokenHash = await hashSessionToken(token);
    await getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function chatGPTSignInPath(returnTo = "/dashboard") {
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(
    safeRelativePath(returnTo),
  )}`;
}

export function signOutPath(returnTo = "/") {
  return `/api/auth/logout?returnTo=${encodeURIComponent(
    safeRelativePath(returnTo),
  )}`;
}

export function chatGPTSignOutPath(returnTo = "/") {
  return `/signout-with-chatgpt?return_to=${encodeURIComponent(
    safeRelativePath(returnTo),
  )}`;
}

export function safeRelativePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
