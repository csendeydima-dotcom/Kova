import { env } from "cloudflare:workers";

const CODE_LENGTH = 6;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function generateVerificationCode() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return String(random % 10 ** CODE_LENGTH).padStart(CODE_LENGTH, "0");
}

export async function hashVerificationCode(email: string, code: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`kova:${email.toLowerCase()}:${code}`),
  );
  return toHex(new Uint8Array(digest));
}

export function verificationHashesMatch(first: string, second: string) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }
  return difference === 0;
}

export async function sendVerificationCode(email: string, code: string) {
  const runtime = env as unknown as {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  };
  if (!runtime.RESEND_API_KEY || !runtime.EMAIL_FROM) {
    throw new Error("Email delivery is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${runtime.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: runtime.EMAIL_FROM,
      to: [email],
      subject: `${code} — код підтвердження Kova`,
      text: `Твій код підтвердження Kova: ${code}. Він діє 10 хвилин. Якщо ти не створював акаунт, просто проігноруй цей лист.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#151713;color:#f7f7f2;border-radius:18px"><p style="color:#cfff3d;font-weight:700">kova.</p><h1 style="font-size:24px">Підтверди свою пошту</h1><p style="color:#b8bbb2">Введи цей код на сторінці реєстрації:</p><p style="font-size:34px;font-weight:800;letter-spacing:8px;margin:28px 0">${code}</p><p style="color:#8f9388;font-size:13px">Код діє 10 хвилин. Якщо ти не створював акаунт, просто проігноруй лист.</p></div>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the request (${response.status})`);
  }
}
