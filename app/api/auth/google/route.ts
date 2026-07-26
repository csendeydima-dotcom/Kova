import { env } from "cloudflare:workers";
import { createEmailSession } from "@/app/auth";
import { trustedMutationRequest } from "@/app/auth-password";
import { ensureWorkspace } from "@/db/workspace";

type GoogleClaims = {
  aud?: string | string[];
  email?: string;
  email_verified?: boolean;
  exp?: number;
  iat?: number;
  iss?: string;
  name?: string;
  sub?: string;
};

type GoogleKey = JsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseJsonPart<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function verifyGoogleCredential(
  credential: string,
  clientId: string,
): Promise<GoogleClaims> {
  const parts = credential.split(".");
  if (parts.length !== 3) throw new Error("Malformed Google credential");

  const header = parseJsonPart<{ alg?: string; kid?: string }>(parts[0]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Google credential");
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Google keys are unavailable");
  const { keys } = (await response.json()) as { keys?: GoogleKey[] };
  const matchingKey = keys?.find(
    (key) =>
      key.kid === header.kid && key.alg === "RS256" && key.use === "sig",
  );
  if (!matchingKey) throw new Error("Google signing key was not found");

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    matchingKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!validSignature) throw new Error("Invalid Google signature");

  const claims = parseJsonPart<GoogleClaims>(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  const audienceMatches = Array.isArray(claims.aud)
    ? claims.aud.includes(clientId)
    : claims.aud === clientId;
  const issuerMatches =
    claims.iss === "accounts.google.com" ||
    claims.iss === "https://accounts.google.com";

  if (
    !audienceMatches ||
    !issuerMatches ||
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true ||
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    (typeof claims.iat === "number" && claims.iat > now + 300)
  ) {
    throw new Error("Invalid Google claims");
  }

  return claims;
}

export async function POST(request: Request) {
  if (!trustedMutationRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const clientId = (
      env as unknown as { GOOGLE_CLIENT_ID?: string }
    ).GOOGLE_CLIENT_ID;
    if (!clientId) {
      return Response.json(
        { error: "Вхід через Google ще не налаштований" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { credential?: unknown };
    if (
      typeof body.credential !== "string" ||
      body.credential.length > 10_000
    ) {
      return Response.json(
        { error: "Google не повернув дані для входу" },
        { status: 400 },
      );
    }

    const claims = await verifyGoogleCredential(body.credential, clientId);
    const email = claims.email!.trim().toLowerCase();
    const name = claims.name?.trim().slice(0, 60) || email.split("@")[0];

    await ensureWorkspace(email, name);
    await createEmailSession(email);
    return Response.json({ user: { email, name } });
  } catch (error) {
    console.error(
      "Google sign-in failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "Не вдалося увійти через Google. Спробуй ще раз." },
      { status: 401 },
    );
  }
}
