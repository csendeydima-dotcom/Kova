import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("landing page contains the Kova product message", async () => {
  const page = await readFile(new URL("app/HomeClient.tsx", root), "utf8");
  assert.match(page, /kova/);
  assert.match(page, /Менше рутини/);
  assert.match(page, /Почати безкоштовно/);
  assert.match(page, /Menej rutiny/);
  assert.match(page, /Less busywork/);
  assert.match(page, /LanguageTabs/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});

test("protected data flows verify identity and ownership", async () => {
  const dashboard = await readFile(
    new URL("app/dashboard/page.tsx", root),
    "utf8",
  );
  const projectRoute = await readFile(
    new URL("app/api/projects/route.ts", root),
    "utf8",
  );
  const taskRoute = await readFile(
    new URL("app/api/tasks/[id]/route.ts", root),
    "utf8",
  );
  const projectEditRoute = await readFile(
    new URL("app/api/projects/[id]/route.ts", root),
    "utf8",
  );

  assert.match(dashboard, /requireCurrentUser/);
  assert.match(projectRoute, /getCurrentUser/);
  assert.match(projectRoute, /same-origin/);
  assert.match(taskRoute, /eq\(tasks\.userEmail, user\.email\)/);
  assert.match(projectEditRoute, /export async function PATCH/);
  assert.match(projectEditRoute, /export async function DELETE/);
  assert.match(
    projectEditRoute,
    /eq\(projects\.userEmail, auth\.user\.email\)/,
  );
});

test("registration supports email credentials and keeps ChatGPT optional", async () => {
  const login = await readFile(new URL("app/login/LoginClient.tsx", root), "utf8");
  assert.match(login, /email/);
  assert.match(login, /chatGPTHref/);
  assert.match(login, /Tvoj účet Kova/);
  assert.match(login, /Your Kova account/);
  const registerRoute = await readFile(
    new URL("app/api/auth/register/route.ts", root),
    "utf8",
  );
  const loginRoute = await readFile(
    new URL("app/api/auth/login/route.ts", root),
    "utf8",
  );
  const passwordSecurity = await readFile(
    new URL("app/auth-password.ts", root),
    "utf8",
  );
  const verificationRoute = await readFile(
    new URL("app/api/auth/verify-email/route.ts", root),
    "utf8",
  );
  const emailDelivery = await readFile(
    new URL("app/email-verification.ts", root),
    "utf8",
  );
  assert.match(registerRoute, /hashPassword/);
  assert.match(registerRoute, /sendVerificationCode/);
  assert.match(loginRoute, /checkLoginRateLimit/);
  assert.match(passwordSecurity, /PBKDF2/);
  assert.match(passwordSecurity, /100_000/);
  assert.match(verificationRoute, /verificationHashesMatch/);
  assert.match(verificationRoute, /attempts >= 5/);
  assert.match(emailDelivery, /api\.resend\.com\/emails/);
  assert.doesNotMatch(emailDelivery, /re_[A-Za-z0-9]/);
});

test("Google sign-in verifies the credential on the server", async () => {
  const authForm = await readFile(
    new URL("app/login/AuthForm.tsx", root),
    "utf8",
  );
  const googleRoute = await readFile(
    new URL("app/api/auth/google/route.ts", root),
    "utf8",
  );
  assert.match(authForm, /accounts\.google\.com\/gsi\/client/);
  assert.match(googleRoute, /crypto\.subtle\.verify/);
  assert.match(googleRoute, /email_verified/);
  assert.match(googleRoute, /claims\.aud/);
});

test("dashboard has real views, languages, and no automatic demo data", async () => {
  const dashboard = await readFile(
    new URL("app/dashboard/DashboardClient.tsx", root),
    "utf8",
  );
  const workspace = await readFile(new URL("db/workspace.ts", root), "utf8");
  const taskRoute = await readFile(
    new URL("app/api/tasks/route.ts", root),
    "utf8",
  );
  assert.match(dashboard, /type View = "overview" \| "projects" \| "tasks"/);
  assert.match(dashboard, /Slovenčina/);
  assert.match(dashboard, /English/);
  assert.match(dashboard, /localStorage\.setItem\("kova-locale"/);
  assert.match(taskRoute, /export async function POST/);
  assert.doesNotMatch(workspace, /Nord Studio/);
  assert.doesNotMatch(workspace, /Arka App/);
});

test("worker applies browser security headers", async () => {
  const worker = await readFile(new URL("worker/index.ts", root), "utf8");
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /Permissions-Policy/);
});
